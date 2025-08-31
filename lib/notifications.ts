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
  type: 'survey_response' | 'survey_created' | 'points_awarded' | 'system'
  title: string
  message: string
  survey_id?: string
  survey_title?: string
  respondent_name?: string
  respondent_email?: string
  points_awarded?: number
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
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId)
    )
    
    const snapshot = await getDocs(notificationsQuery)
    const notifications = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
    
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
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('is_read', '==', false)
    )
    
    const snapshot = await getDocs(unreadQuery)
    return snapshot.docs.length
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}