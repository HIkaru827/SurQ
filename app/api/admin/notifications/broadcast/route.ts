import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, createErrorResponse, validateOrigin } from '@/lib/auth-middleware'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, serverTimestamp } from 'firebase/firestore'
import { validateInput } from '@/lib/validation'
import { z } from 'zod'

// Firebase client config for server-side usage
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase for server-side API routes
let app
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

const db = getFirestore(app)

// Validation schema for broadcast notification
const BroadcastNotificationSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100, 'タイトルは100文字以内で入力してください'),
  content: z.string().min(1, '内容は必須です').max(500, '内容は500文字以内で入力してください'),
})

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const body = await request.json()
    console.log('Broadcast notification request body:', JSON.stringify(body, null, 2))
    
    // Validate input data
    const validatedData = validateInput(BroadcastNotificationSchema, body)
    console.log('Validated notification data:', JSON.stringify(validatedData, null, 2))
    
    // Get all users to send notifications
    const usersQuery = query(collection(db, 'users'))
    const usersSnapshot = await getDocs(usersQuery)
    
    if (usersSnapshot.empty) {
      console.log('No users found in database')
      return NextResponse.json({ 
        message: 'No users found to send notifications to',
        sent_count: 0 
      })
    }

    const notifications = []
    const currentTime = serverTimestamp()

    // Create notification for each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      
      notifications.push({
        user_id: userDoc.id,
        user_email: userData.email,
        title: validatedData.title,
        content: validatedData.content,
        type: 'admin_broadcast',
        is_read: false,
        admin_sender: user.email,
        created_at: currentTime,
        updated_at: currentTime
      })
    }

    // Batch add all notifications to Firestore
    const notificationPromises = notifications.map(notification => 
      addDoc(collection(db, 'notifications'), notification)
    )
    
    await Promise.all(notificationPromises)

    console.log(`Successfully sent ${notifications.length} notifications`)

    return NextResponse.json({ 
      message: '全ユーザーに通知を送信しました',
      sent_count: notifications.length,
      recipients: notifications.map(n => n.user_email)
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error sending broadcast notification:', error)
    const message = error instanceof Error ? error.message : 'Failed to send broadcast notification'
    return createErrorResponse(message, 500)
  }
})