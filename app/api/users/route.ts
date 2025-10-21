import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { isDeveloperAccount, DEVELOPER_CONFIG } from "@/lib/developer"
import { withAuth, createErrorResponse, validateOrigin } from "@/lib/auth-middleware"
import { validateInput, UserSchema, EmailSchema } from "@/lib/validation"

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

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const body = await request.json()
    const validatedData = validateInput(UserSchema.pick({ email: true, name: true }), body)
    const { email, name } = validatedData

    // Verify the authenticated user matches the email being processed
    if (user.email !== email) {
      return createErrorResponse('Unauthorized: Email mismatch', 403)
    }

    // 既存ユーザーをチェック
    const usersQuery = query(collection(db, 'users'), where('email', '==', email))
    const snapshot = await getDocs(usersQuery)
    
    if (!snapshot.empty) {
      // 既存ユーザーのログイン時刻を更新
      const existingDoc = snapshot.docs[0]
      await updateDoc(doc(db, 'users', existingDoc.id), {
        last_login: serverTimestamp(),
        updated_at: serverTimestamp()
      })
      
      const userData = {
        id: existingDoc.id,
        ...existingDoc.data(),
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return NextResponse.json({ user: userData })
    }

    // 新しいユーザーを作成
    const isDevAccount = isDeveloperAccount(email)
    const newUserData = {
      email,
      name,
      avatar_url: null,
      points: isDevAccount ? DEVELOPER_CONFIG.UNLIMITED_POINTS : 50,
      level: isDevAccount ? 999 : 1,
      badges: [],
      surveys_created: 0,
      surveys_answered: 0,
      total_responses_received: 0,
      is_developer: isDevAccount,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      last_login: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, 'users'), newUserData)
    
    const newUser = {
      id: docRef.id,
      ...newUserData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    }

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Error managing user:', error)
    const message = error instanceof Error ? error.message : 'Failed to manage user'
    return createErrorResponse(message, 500)
  }
})

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    // Validate email parameter
    if (email) {
      validateInput(EmailSchema, { email })
      
      // Users can only access their own profile
      if (user.email !== email) {
        return createErrorResponse('Unauthorized: Can only access own profile', 403)
      }
    }
    
    if (email) {
      const usersQuery = query(collection(db, 'users'), where('email', '==', email))
      const snapshot = await getDocs(usersQuery)
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0]
        const userData = {
          id: userDoc.id,
          ...userDoc.data(),
          created_at: userDoc.data().created_at?.toDate?.()?.toISOString() || userDoc.data().created_at,
          updated_at: userDoc.data().updated_at?.toDate?.()?.toISOString() || userDoc.data().updated_at,
          last_login: userDoc.data().last_login?.toDate?.()?.toISOString() || userDoc.data().last_login
        }
        return NextResponse.json({ user: userData })
      } else {
        return createErrorResponse('User not found', 404)
      }
    }
    
    // Listing all users not supported for security reasons
    return createErrorResponse('Listing all users not supported', 400)
  } catch (error) {
    console.error('Error fetching users:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch users'
    return createErrorResponse(message, 500)
  }
})