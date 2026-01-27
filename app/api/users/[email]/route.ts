import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"
import { withAuth, createErrorResponse, validateOrigin } from "@/lib/auth-middleware"

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

// GET: ユーザー情報の取得
export const GET = withAuth(async (request: NextRequest, user, context) => {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const { email } = await context.params

    // URLデコード
    const decodedEmail = decodeURIComponent(email)

    // Users can only access their own profile (unless admin)
    if (user.email !== decodedEmail) {
      return createErrorResponse('Unauthorized: Can only access own profile', 403)
    }

    // Firestoreからユーザー情報を取得
    const usersQuery = query(collection(db, 'users'), where('email', '==', decodedEmail))
    const snapshot = await getDocs(usersQuery)
    
    if (snapshot.empty) {
      return createErrorResponse('User not found', 404)
    }

    const userDoc = snapshot.docs[0]
    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
      created_at: userDoc.data().created_at?.toDate?.()?.toISOString() || userDoc.data().created_at,
      updated_at: userDoc.data().updated_at?.toDate?.()?.toISOString() || userDoc.data().updated_at,
      last_login: userDoc.data().last_login?.toDate?.()?.toISOString() || userDoc.data().last_login
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch user'
    return createErrorResponse(message, 500)
  }
})



