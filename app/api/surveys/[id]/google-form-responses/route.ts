import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  serverTimestamp,
  getDoc 
} from "firebase/firestore"
import { withAuth, createErrorResponse } from "@/lib/auth-middleware"

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

// GET: 投稿者向け - 回答追跡情報の取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await context.params

    // アンケートの存在確認
    const surveyDoc = await getDoc(doc(db, 'surveys', surveyId))
    if (!surveyDoc.exists()) {
      return createErrorResponse('アンケートが見つかりません', 404)
    }

    // google_form_responses コレクションから取得
    const responsesQuery = query(
      collection(db, 'google_form_responses'),
      where('survey_id', '==', surveyId)
    )
    const snapshot = await getDocs(responsesQuery)
    
    const responses = snapshot.docs.map(doc => {
      const data = doc.data() as any
      return {
        id: doc.id,
        ...data,
        last_opened_at: data.last_opened_at?.toDate?.()?.toISOString() || data.last_opened_at,
        completed_at: data.completed_at?.toDate?.()?.toISOString() || data.completed_at,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      }
    })

    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Error fetching Google Form responses:', error)
    return createErrorResponse('回答情報の取得に失敗しました', 500)
  }
}

// POST: クリック追跡 & 回答完了報告 & アクセス権限エラー報告
export const POST = withAuth(async (request: NextRequest, user, context) => {
  try {
    const { id: surveyId } = await context.params
    const body = await request.json()
    const { action, started_at, completed_at } = body

    if (!action || !['start', 'complete', 'access_error'].includes(action)) {
      return createErrorResponse('無効なアクションです', 400)
    }

    // アンケートの存在確認
    const surveyDoc = await getDoc(doc(db, 'surveys', surveyId))
    if (!surveyDoc.exists()) {
      return createErrorResponse('アンケートが見つかりません', 404)
    }

    const surveyData = surveyDoc.data()

    // Googleフォーム形式かチェック
    if (surveyData.type !== 'google_form') {
      return createErrorResponse('このアンケートはGoogleフォーム形式ではありません', 400)
    }

    // ユーザー情報の取得
    const usersQuery = query(collection(db, 'users'), where('email', '==', user.email))
    const userSnapshot = await getDocs(usersQuery)
    
    if (userSnapshot.empty) {
      return createErrorResponse('ユーザーが見つかりません', 404)
    }

    const userDoc = userSnapshot.docs[0]
    const userData = userDoc.data()

    // 既存の回答レコードを検索
    const existingResponseQuery = query(
      collection(db, 'google_form_responses'),
      where('survey_id', '==', surveyId),
      where('user_id', '==', user.uid)
    )
    const existingSnapshot = await getDocs(existingResponseQuery)

    if (action === 'start') {
      // 「回答する」クリック時
      if (existingSnapshot.empty) {
        // 新規レコード作成
        await addDoc(collection(db, 'google_form_responses'), {
          survey_id: surveyId,
          user_id: user.uid,
          user_name: userData.name || 'Anonymous',
          user_email: user.email,
          last_opened_at: new Date(started_at),
          open_count: 1,
          is_reported: false,
          created_at: serverTimestamp(),
        })
      } else {
        // 既存レコードを更新（再度開いた）
        const responseDoc = existingSnapshot.docs[0]
        await updateDoc(doc(db, 'google_form_responses', responseDoc.id), {
          last_opened_at: new Date(started_at),
          open_count: increment(1),
        })
      }

      return NextResponse.json({ 
        success: true,
        message: '開始時刻を記録しました'
      })
    } else if (action === 'complete') {
      // 「回答しました」ボタンクリック時
      if (existingSnapshot.empty) {
        return createErrorResponse('先に「回答する」をクリックしてください', 400)
      }

      const responseDoc = existingSnapshot.docs[0]
      const responseData = responseDoc.data()

      // 既に完了済みかチェック
      if (responseData.completed_at) {
        return createErrorResponse('既に回答済みです', 400)
      }

      // 所要時間を計算
      const lastOpenedAt = responseData.last_opened_at?.toDate?.() || new Date(responseData.last_opened_at)
      const completedAtDate = new Date(completed_at)
      const durationMs = completedAtDate.getTime() - lastOpenedAt.getTime()
      const durationMinutes = Math.round(durationMs / 1000 / 60)

      // 回答レコードを更新
      await updateDoc(doc(db, 'google_form_responses', responseDoc.id), {
        completed_at: completedAtDate,
        estimated_duration_minutes: durationMinutes,
      })

      // ユーザーの surveys_answered をインクリメント
      await updateDoc(doc(db, 'users', userDoc.id), {
        surveys_answered: increment(1),
        updated_at: serverTimestamp(),
      })

      // アンケートの response_count をインクリメント
      await updateDoc(doc(db, 'surveys', surveyId), {
        response_count: increment(1),
        updated_at: serverTimestamp(),
      })

      return NextResponse.json({ 
        success: true,
        message: '回答を記録しました',
        duration_minutes: durationMinutes,
      })
    } else if (action === 'access_error') {
      // 「見れません」ボタンクリック時 - アンケート作成者に通知
      
      // アンケート作成者の情報を取得
      const creatorId = surveyData.creator_id
      
      // 通知を作成
      await addDoc(collection(db, 'notifications'), {
        user_id: creatorId,
        type: 'system',
        title: 'アンケートのアクセス権限エラー報告',
        message: `あなたのアンケート「${surveyData.title}」が見れないという報告が届いています。Googleフォームの権限設定を確認してください。`,
        survey_id: surveyId,
        survey_title: surveyData.title,
        is_read: false,
        created_at: serverTimestamp(),
      })

      console.log(`Access error notification sent to creator: ${creatorId} for survey: ${surveyId}`)

      return NextResponse.json({ 
        success: true,
        message: 'アクセス権限エラーを報告しました'
      })
    }

    return createErrorResponse('無効なリクエストです', 400)
  } catch (error) {
    console.error('Error tracking Google Form response:', error)
    const message = error instanceof Error ? error.message : '回答の記録に失敗しました'
    return createErrorResponse(message, 500)
  }
})

