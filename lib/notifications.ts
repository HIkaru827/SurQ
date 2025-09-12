import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

const db = getFirestore(app)

export interface Notification {
  id?: string
  user_id: string
  type: 'survey_response' | 'survey_created' | 'points_awarded' | 'system' | 'admin_broadcast'
  title: string
  message: string
  survey_id?: string
  survey_title?: string
  respondent_name?: string
  respondent_email?: string
  points_awarded?: number
  admin_sender?: string
  is_read: boolean
  created_at: any
}

export async function createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
  try {
    const notificationData = {
      ...notification,
      is_read: false,
      created_at: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'notifications'), notificationData)
    console.log('Notification created:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export async function createSurveyResponseNotification(
  surveyCreatorId: string,
  surveyId: string,
  surveyTitle: string,
  respondentName: string,
  respondentEmail: string,
  pointsAwarded: number = 0
) {
  return await createNotification({
    user_id: surveyCreatorId,
    type: 'survey_response',
    title: '新しい回答が届きました！',
    message: `${respondentName || 'Anonymous'}さんがアンケート「${surveyTitle}」に回答しました`,
    survey_id: surveyId,
    survey_title: surveyTitle,
    respondent_name: respondentName,
    respondent_email: respondentEmail,
    points_awarded: pointsAwarded
  })
}

export async function getUserNotifications(userId: string, limit: number = 20) {
  try {
    console.log('=== getUserNotifications Debug ===')
    console.log('Searching notifications for userId:', userId)
    console.log('Limit:', limit)
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId)
    )
    
    const snapshot = await getDocs(notificationsQuery)
    console.log('Total notifications found in Firestore:', snapshot.docs.length)
    
    const allNotifications = snapshot.docs.map(doc => {
      const data = doc.data()
      console.log('Notification document:', { id: doc.id, ...data })
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
      }
    })
    
    const notifications = allNotifications
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
    
    console.log('Processed notifications to return:', notifications.length)
    console.log('Notifications data:', notifications)
    
    return notifications
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      is_read: true
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('is_read', '==', false)
    )
    
    const snapshot = await getDocs(notificationsQuery)
    
    const updatePromises = snapshot.docs.map(docSnapshot => 
      updateDoc(doc(db, 'notifications', docSnapshot.id), { is_read: true })
    )
    
    await Promise.all(updatePromises)
    console.log(`Marked ${snapshot.docs.length} notifications as read`)
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    console.log('=== getUnreadNotificationCount Debug ===')
    console.log('Searching unread notifications for userId:', userId)
    
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('is_read', '==', false)
    )
    
    const snapshot = await getDocs(unreadQuery)
    console.log('Unread notifications found:', snapshot.docs.length)
    
    if (snapshot.docs.length > 0) {
      console.log('Unread notification documents:')
      snapshot.docs.forEach(doc => {
        console.log('Unread notification:', { id: doc.id, ...doc.data() })
      })
    }
    
    return snapshot.docs.length
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}