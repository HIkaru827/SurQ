import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, getDoc, increment } from "firebase/firestore"
import { withAuth, createErrorResponse, validateOrigin, authenticateUser } from "@/lib/auth-middleware"
import { validateInput, ResponseSchema, EmailSchema } from "@/lib/validation"
import { createSurveyResponseNotification } from "@/lib/notifications"

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
      // points_earned: 廃止
      submitted_at: serverTimestamp(),
      created_at: serverTimestamp()
    }

    await addDoc(collection(db, 'survey_responses'), responseData)

    // アンケートの回答数を増加
    await updateDoc(doc(db, 'surveys', surveyId), {
      response_count: (surveyData.response_count || 0) + 1,
      updated_at: serverTimestamp()
    })

    // 回答者の回答数をインクリメント & アンケート有効期限を延長
    if (respondent_email) {
      console.log('Incrementing surveys_answered for user:', respondent_email)
      const usersQuery = query(collection(db, 'users'), where('email', '==', respondent_email))
      const userSnapshot = await getDocs(usersQuery)
      
      if (!userSnapshot.empty) {
        // 既存ユーザーの回答数を更新
        const userDoc = userSnapshot.docs[0]
        const userData = userDoc.data()
        
        console.log('Updating existing user surveys_answered')
        
        // 最後に回答した日時を記録
        await updateDoc(doc(db, 'users', userDoc.id), {
          surveys_answered: increment(1),
          last_answered_at: serverTimestamp(),
          updated_at: serverTimestamp()
        })
        
        console.log('surveys_answered updated successfully')
        
        // 🎯 重要：回答者の全アンケートの有効期限を自動延長（回答するたびに延長）
        try {
          // ユーザーIDを取得（FirebaseのUIDを使用）
          const userUid = userData.uid || userDoc.id
          const now = new Date()
          
          console.log('Extending survey expiry dates for user:', respondent_email)
          
          // ユーザーの全公開アンケートを取得
          const userSurveysQuery = query(
            collection(db, 'surveys'),
            where('creator_id', '==', userUid),
            where('is_published', '==', true)
          )
          const userSurveysSnapshot = await getDocs(userSurveysQuery)
          
          // 各アンケートの有効期限を1か月延長
          const extendPromises = userSurveysSnapshot.docs.map(async (surveyDoc) => {
            const surveyData = surveyDoc.data()
            const currentExpiry = surveyData.expires_at?.toDate?.() || new Date()
            
            // 現在の有効期限と現在日時の遅い方から1か月延長
            const newExpiry = new Date(Math.max(currentExpiry.getTime(), now.getTime()))
            newExpiry.setMonth(newExpiry.getMonth() + 1)
            
            await updateDoc(doc(db, 'surveys', surveyDoc.id), {
              expires_at: newExpiry,
              last_extended_at: now,
              updated_at: serverTimestamp()
            })
          })
          
          await Promise.all(extendPromises)
          
          // ユーザーの延長記録を更新
          await updateDoc(doc(db, 'users', userDoc.id), {
            last_survey_extended_at: serverTimestamp()
          })
          
          console.log(`Extended ${userSurveysSnapshot.size} surveys for user`)
          console.log('Auto-extension: Surveys extended on every answer')
        } catch (extendError) {
          console.error('Failed to extend survey expiry:', extendError)
          // 延長エラーは回答送信を妨げない
        }
        
      } else {
        // ユーザーが存在しない場合、新規作成
        console.log('Creating new user')
        const newUserData = {
          name: respondent_name || 'Anonymous User',
          email: respondent_email,
          // points: 廃止
          // level: 廃止
          surveys_answered: 1,
          surveys_created: 0,
          last_answered_at: serverTimestamp(),
          badges: [],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        }
        
        await addDoc(collection(db, 'users'), newUserData)
        console.log('New user created successfully')
      }
    }

    // 通知を作成（作成者に回答通知）
    try {
      await createSurveyResponseNotification(
        surveyData.creator_id,
        surveyId,
        surveyData.title,
        respondent_name || 'Anonymous',
        respondent_email,
        surveyData.respondent_points || 0
      )
      console.log('Survey response notification created')
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError)
      // 通知作成エラーは回答送信を妨げない
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
