import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createErrorResponse, validateOrigin } from '@/lib/auth-middleware'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
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

// Validation schema for push subscription
const PushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string()
    })
  }),
  userId: z.string().min(1)
})

const DeleteSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url()
  })
})

// Save push subscription
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const body = await request.json()
    console.log('Push subscription request body:', JSON.stringify(body, null, 2))
    
    // Validate input data
    const validatedData = validateInput(PushSubscriptionSchema, body)
    console.log('Validated subscription data:', JSON.stringify(validatedData, null, 2))

    // Check if user is accessing their own subscription
    if (user.uid !== validatedData.userId) {
      return createErrorResponse('Unauthorized: Can only manage own subscriptions', 403)
    }

    // Check if subscription already exists
    const existingQuery = query(
      collection(db, 'push_subscriptions'),
      where('user_id', '==', user.uid),
      where('endpoint', '==', validatedData.subscription.endpoint)
    )
    const existingSnapshot = await getDocs(existingQuery)

    if (!existingSnapshot.empty) {
      console.log('Push subscription already exists')
      return NextResponse.json({ 
        message: 'Subscription already exists',
        subscription_id: existingSnapshot.docs[0].id 
      })
    }

    // Remove any existing subscriptions for this user
    const userSubscriptionsQuery = query(
      collection(db, 'push_subscriptions'),
      where('user_id', '==', user.uid)
    )
    const userSubscriptionsSnapshot = await getDocs(userSubscriptionsQuery)
    
    const deletePromises = userSubscriptionsSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    )
    await Promise.all(deletePromises)

    // Save new subscription
    const subscriptionData = {
      user_id: user.uid,
      user_email: user.email,
      endpoint: validatedData.subscription.endpoint,
      p256dh_key: validatedData.subscription.keys.p256dh,
      auth_key: validatedData.subscription.keys.auth,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      is_active: true
    }

    const docRef = await addDoc(collection(db, 'push_subscriptions'), subscriptionData)
    
    console.log(`Push subscription saved with ID: ${docRef.id}`)

    return NextResponse.json({ 
      message: 'Push subscription saved successfully',
      subscription_id: docRef.id 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error saving push subscription:', error)
    const message = error instanceof Error ? error.message : 'Failed to save push subscription'
    return createErrorResponse(message, 500)
  }
})

// Remove push subscription
export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const body = await request.json()
    console.log('Delete subscription request body:', JSON.stringify(body, null, 2))
    
    // Validate input data
    const validatedData = validateInput(DeleteSubscriptionSchema, body)
    console.log('Validated delete data:', JSON.stringify(validatedData, null, 2))

    // Find and delete subscription
    const subscriptionQuery = query(
      collection(db, 'push_subscriptions'),
      where('user_id', '==', user.uid),
      where('endpoint', '==', validatedData.subscription.endpoint)
    )
    const subscriptionSnapshot = await getDocs(subscriptionQuery)

    if (subscriptionSnapshot.empty) {
      console.log('Subscription not found')
      return NextResponse.json({ 
        message: 'Subscription not found or already deleted' 
      })
    }

    // Delete all matching subscriptions for this user
    const deletePromises = subscriptionSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    )
    await Promise.all(deletePromises)
    
    console.log(`Deleted ${subscriptionSnapshot.docs.length} subscription(s)`)

    return NextResponse.json({ 
      message: 'Push subscription removed successfully',
      deleted_count: subscriptionSnapshot.docs.length 
    })
    
  } catch (error) {
    console.error('Error removing push subscription:', error)
    const message = error instanceof Error ? error.message : 'Failed to remove push subscription'
    return createErrorResponse(message, 500)
  }
})

// Get user's push subscriptions (for debugging)
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Only allow admin or own subscriptions
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || user.uid

    const isAdmin = user.email === 'hikarujin167@gmail.com'
    if (!isAdmin && user.uid !== userId) {
      return createErrorResponse('Unauthorized: Can only access own subscriptions', 403)
    }

    const subscriptionsQuery = query(
      collection(db, 'push_subscriptions'),
      where('user_id', '==', userId),
      where('is_active', '==', true)
    )
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
    
    const subscriptions = subscriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      endpoint: doc.data().endpoint,
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
      user_email: doc.data().user_email
    }))

    return NextResponse.json({ 
      subscriptions,
      total: subscriptions.length 
    })
    
  } catch (error) {
    console.error('Error fetching push subscriptions:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch push subscriptions'
    return createErrorResponse(message, 500)
  }
})