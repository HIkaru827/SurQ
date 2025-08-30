import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { isDeveloperAccount, DEVELOPER_CONFIG } from "@/lib/developer"

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !isDeveloperAccount(email)) {
      return NextResponse.json({ 
        error: "開発者アカウントではありません" 
      }, { status: 403 })
    }

    // ユーザーを検索
    const usersQuery = query(collection(db, 'users'), where('email', '==', email))
    const userSnapshot = await getDocs(usersQuery)
    
    if (userSnapshot.empty) {
      return NextResponse.json({ 
        error: "ユーザーが見つかりません" 
      }, { status: 404 })
    }

    const userDoc = userSnapshot.docs[0]

    // 開発者アカウントにアップグレード
    await updateDoc(doc(db, 'users', userDoc.id), {
      points: DEVELOPER_CONFIG.UNLIMITED_POINTS,
      level: 999,
      is_developer: true,
      updated_at: serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      message: "開発者アカウントにアップグレードされました",
      points: DEVELOPER_CONFIG.UNLIMITED_POINTS
    })

  } catch (error) {
    console.error('Error upgrading developer account:', error)
    return NextResponse.json({ 
      error: "アップグレードに失敗しました",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}