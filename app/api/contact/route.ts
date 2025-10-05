import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore"

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
    const { subject, content, userEmail, timestamp } = await request.json()

    // 入力検証
    if (!subject || !content) {
      return NextResponse.json(
        { error: '件名と内容は必須です' },
        { status: 400 }
      )
    }

    if (subject.length > 100) {
      return NextResponse.json(
        { error: '件名は100文字以内で入力してください' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: '内容は2000文字以内で入力してください' },
        { status: 400 }
      )
    }

    // Firestoreに保存
    const contactData = {
      subject: subject.trim(),
      content: content.trim(),
      userEmail: userEmail || null,
      status: 'unread',
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, 'contacts'), contactData)

    console.log('Contact form submission saved:', {
      id: docRef.id,
      subject,
      userEmail,
      timestamp
    })

    return NextResponse.json(
      { success: true, message: 'お問い合わせを受け付けました', id: docRef.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}