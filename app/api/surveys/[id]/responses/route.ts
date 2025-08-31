import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore"
import { withAuth, createErrorResponse, validateOrigin, authenticateUser } from "@/lib/auth-middleware"
import { validateInput, ResponseSchema, EmailSchema } from "@/lib/validation"

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params
    const body = await request.json()
    const { responses, respondent_email, respondent_name } = body

    if (!responses || !respondent_email) {
      return NextResponse.json({ 
        error: "回答データとメールアドレスが必要です" 
      }, { status: 400 })
    }

    // アンケートの存在確認
    const surveyDoc = await getDoc(doc(db, 'surveys', surveyId))
    if (!surveyDoc.exists()) {
      return NextResponse.json({ error: "アンケートが見つかりません" }, { status: 404 })
    }

    const surveyData = surveyDoc.data()

    // 既に回答済みかチェック
    const existingResponseQuery = query(
      collection(db, 'survey_responses'),
      where('survey_id', '==', surveyId),
      where('respondent_email', '==', respondent_email)
    )
    const existingResponseSnapshot = await getDocs(existingResponseQuery)
    
    if (!existingResponseSnapshot.empty) {
      return NextResponse.json({ 
        error: "このアンケートには既に回答済みです" 
      }, { status: 400 })
    }

    // 回答を保存
    const responseData = {
      survey_id: surveyId,
      survey_title: surveyData.title,
      survey_creator_id: surveyData.creator_id,
      respondent_email,
      respondent_name: respondent_name || 'Anonymous',
      responses,
      points_earned: surveyData.respondent_points || 0,
      submitted_at: serverTimestamp(),
      created_at: serverTimestamp()
    }

    await addDoc(collection(db, 'survey_responses'), responseData)

    // アンケートの回答数を増加
    await updateDoc(doc(db, 'surveys', surveyId), {
      response_count: (surveyData.response_count || 0) + 1,
      updated_at: serverTimestamp()
    })

    // 回答者にポイントを付与
    if (respondent_email) {
      console.log('Awarding points to user:', respondent_email, 'Points:', surveyData.respondent_points)
      const usersQuery = query(collection(db, 'users'), where('email', '==', respondent_email))
      const userSnapshot = await getDocs(usersQuery)
      
      if (!userSnapshot.empty) {
        // 既存ユーザーのポイント更新
        const userDoc = userSnapshot.docs[0]
        const currentPoints = userDoc.data().points || 0
        const newPoints = currentPoints + (surveyData.respondent_points || 0)
        
        console.log('Updating existing user points:', {
          email: respondent_email,
          currentPoints,
          pointsToAdd: surveyData.respondent_points,
          newPoints
        })
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          points: newPoints,
          surveys_answered: (userDoc.data().surveys_answered || 0) + 1,
          updated_at: serverTimestamp()
        })
        
        console.log('Points updated successfully')
      } else {
        // ユーザーが存在しない場合、新規作成
        console.log('Creating new user with points:', surveyData.respondent_points)
        const newUserData = {
          name: respondent_name || 'Anonymous User',
          email: respondent_email,
          points: surveyData.respondent_points || 0,
          surveys_answered: 1,
          surveys_created: 0,
          level: 1,
          badges: [],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        }
        
        await addDoc(collection(db, 'users'), newUserData)
        console.log('New user created successfully')
      }
    }

    return NextResponse.json({
      success: true,
      message: "回答が送信されました",
      points_earned: surveyData.respondent_points || 0
    })

  } catch (error) {
    console.error('Error submitting survey response:', error)
    const message = error instanceof Error ? error.message : '回答の送信に失敗しました'
    return createErrorResponse(message, 500)
  }
}

export const GET = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: surveyId } = await params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (email) {
      // Validate email parameter and authorization
      validateInput(EmailSchema, { email })
      
      // Users can only check their own response status
      if (user.email !== email) {
        return createErrorResponse('Unauthorized: Can only check own response status', 403)
      }
      
      // 特定ユーザーの回答をチェック
      const responseQuery = query(
        collection(db, 'survey_responses'),
        where('survey_id', '==', surveyId),
        where('respondent_email', '==', email)
      )
      const responseSnapshot = await getDocs(responseQuery)
      
      return NextResponse.json({ 
        hasResponded: !responseSnapshot.empty,
        response: responseSnapshot.empty ? null : {
          id: responseSnapshot.docs[0].id,
          ...responseSnapshot.docs[0].data()
        }
      })
    } else {
      // 全回答を取得
      const responsesQuery = query(
        collection(db, 'survey_responses'),
        where('survey_id', '==', surveyId)
      )
      const responsesSnapshot = await getDocs(responsesQuery)
      
      const responses = responsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submitted_at: doc.data().submitted_at?.toDate?.()?.toISOString() || doc.data().submitted_at
      }))

      return NextResponse.json({ responses })
    }

  } catch (error) {
    console.error('Error fetching survey responses:', error)
    const message = error instanceof Error ? error.message : '回答の取得に失敗しました'
    return createErrorResponse(message, 500)
  }
})
