import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { withAuth, createErrorResponse } from "@/lib/auth-middleware"
import { isDeveloperAccount } from "@/lib/developer"

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

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // 開発者アカウントのみアクセス可能
    if (!isDeveloperAccount(user.email!)) {
      return createErrorResponse('Unauthorized: Developer access required', 403)
    }

    // お問い合わせ一覧を取得（最新50件）
    const contactsQuery = query(
      collection(db, 'contacts'),
      orderBy('created_at', 'desc'),
      limit(50)
    )

    const snapshot = await getDocs(contactsQuery)

    const contacts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
      updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || doc.data().updated_at
    }))

    return NextResponse.json({
      success: true,
      contacts,
      total: contacts.length
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch contacts'
    return createErrorResponse(message, 500)
  }
})