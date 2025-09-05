import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, createErrorResponse, validateOrigin } from '@/lib/auth-middleware'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { validateInput } from '@/lib/validation'
import { z } from 'zod'
import webpush from 'web-push'

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

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:hikarujin167@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

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

    // Send push notifications
    const pushResults = await sendPushNotifications(validatedData.title, validatedData.content)

    console.log(`Successfully sent ${notifications.length} notifications and ${pushResults.sent} push notifications`)

    return NextResponse.json({ 
      message: '全ユーザーに通知を送信しました',
      sent_count: notifications.length,
      push_sent: pushResults.sent,
      push_failed: pushResults.failed,
      recipients: notifications.map(n => n.user_email)
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error sending broadcast notification:', error)
    const message = error instanceof Error ? error.message : 'Failed to send broadcast notification'
    return createErrorResponse(message, 500)
  }
})

// Function to send push notifications to all subscribers
async function sendPushNotifications(title: string, content: string): Promise<{sent: number, failed: number}> {
  let sent = 0
  let failed = 0

  try {
    // Get all active push subscriptions
    const subscriptionsQuery = query(
      collection(db, 'push_subscriptions'),
      where('is_active', '==', true)
    )
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)

    if (subscriptionsSnapshot.empty) {
      console.log('No push subscriptions found')
      return { sent: 0, failed: 0 }
    }

    // Prepare push notification payload
    const payload = JSON.stringify({
      title: title,
      content: content,
      body: content,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'admin-broadcast',
      url: '/app',
      timestamp: Date.now(),
      requireInteraction: true
    })

    // Send push notifications to all subscribers
    const pushPromises = subscriptionsSnapshot.docs.map(async (subscriptionDoc) => {
      try {
        const subscriptionData = subscriptionDoc.data()
        
        const pushSubscription = {
          endpoint: subscriptionData.endpoint,
          keys: {
            p256dh: subscriptionData.p256dh_key,
            auth: subscriptionData.auth_key
          }
        }

        await webpush.sendNotification(pushSubscription, payload)
        sent++
        console.log(`Push notification sent to ${subscriptionData.user_email}`)
      } catch (pushError) {
        failed++
        console.error(`Failed to send push notification to ${subscriptionData.user_email}:`, pushError)
        
        // If subscription is invalid, mark as inactive
        if (pushError instanceof Error && (
          pushError.message.includes('410') || 
          pushError.message.includes('invalid') ||
          pushError.message.includes('expired')
        )) {
          try {
            // Mark subscription as inactive instead of deleting
            await addDoc(collection(db, 'push_subscriptions'), {
              ...subscriptionData,
              is_active: false,
              deactivated_at: serverTimestamp()
            })
            console.log(`Marked invalid subscription as inactive: ${subscriptionData.user_email}`)
          } catch (updateError) {
            console.error('Error marking subscription as inactive:', updateError)
          }
        }
      }
    })

    await Promise.all(pushPromises)
    
    console.log(`Push notification results: ${sent} sent, ${failed} failed`)
    return { sent, failed }

  } catch (error) {
    console.error('Error sending push notifications:', error)
    return { sent, failed }
  }
}