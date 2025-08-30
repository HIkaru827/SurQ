import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore"

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params
    const decodedEmail = decodeURIComponent(email)

    if (!decodedEmail) {
      return NextResponse.json({ 
        error: "メールアドレスが必要です" 
      }, { status: 400 })
    }

    // 回答済みアンケートを取得
    const responsesQuery = query(
      collection(db, 'survey_responses'),
      where('respondent_email', '==', decodedEmail)
    )
    const responsesSnapshot = await getDocs(responsesQuery)
    
    const answeredSurveys = responsesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        survey_id: doc.data().survey_id,
        survey_title: doc.data().survey_title,
        points_earned: doc.data().points_earned || 0,
        submitted_at: doc.data().submitted_at?.toDate?.()?.toISOString() || doc.data().submitted_at,
        responses: doc.data().responses
      }))
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()) // 新しい順にソート

    return NextResponse.json({ 
      surveys: answeredSurveys,
      total: answeredSurveys.length
    })

  } catch (error) {
    console.error('Error fetching answered surveys:', error)
    return NextResponse.json({ 
      error: "回答済みアンケートの取得に失敗しました",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}