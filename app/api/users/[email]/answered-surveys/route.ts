import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore"
import { withAuth, createErrorResponse, authenticateUser } from "@/lib/auth-middleware"

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

export const GET = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: Promise<{ email: string }> }
) => {
  try {
    const { email } = await params
    const decodedEmail = decodeURIComponent(email)

    if (!decodedEmail) {
      return createErrorResponse("メールアドレスが必要です", 400)
    }

    // ユーザーは自分のデータのみアクセス可能（管理者は除く）
    const isAdmin = user.email === 'hikarujin167@gmail.com'
    if (!isAdmin && user.email !== decodedEmail) {
      return createErrorResponse("自分のデータのみアクセス可能です", 403)
    }

    console.log(`Fetching answered surveys for email: ${decodedEmail}`)

    // 回答済みアンケートを取得
    const responsesQuery = query(
      collection(db, 'survey_responses'),
      where('respondent_email', '==', decodedEmail)
    )
    const responsesSnapshot = await getDocs(responsesQuery)
    
    console.log(`Found ${responsesSnapshot.docs.length} survey responses`)
    
    const answeredSurveys = responsesSnapshot.docs
      .map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          survey_id: data.survey_id,
          survey_title: data.survey_title,
          // points_earned: data.points_earned || 0, // 廃止 - 回答数ベースのシステムに移行
          submitted_at: data.submitted_at?.toDate?.()?.toISOString() || data.submitted_at,
          responses: data.responses
        }
      })
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()) // 新しい順にソート

    return NextResponse.json({ 
      surveys: answeredSurveys,
      total: answeredSurveys.length
    })

  } catch (error) {
    console.error('Error fetching answered surveys:', error)
    return createErrorResponse(
      "回答済みアンケートの取得に失敗しました", 
      500
    )
  }
})