import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
  increment
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

// PUT: 通報の更新（管理者用）
export const PUT = withAuth(async (request: NextRequest, user, context) => {
  try {
    const { id: reportId } = await context.params
    
    // TODO: 管理者チェック（今は全ユーザーが更新可能）
    // if (!isAdmin(user.email)) {
    //   return createErrorResponse('管理者権限が必要です', 403)
    // }

    const body = await request.json()
    const { status, admin_notes, apply_penalty } = body

    // バリデーション
    if (status && !['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return createErrorResponse('無効なステータスです', 400)
    }

    // 通報の存在確認
    const reportDoc = await getDoc(doc(db, 'reports', reportId))
    if (!reportDoc.exists()) {
      return createErrorResponse('通報が見つかりません', 404)
    }

    const reportData = reportDoc.data()

    // 更新データを準備
    const updates: any = {
      updated_at: serverTimestamp(),
    }

    if (status) updates.status = status
    if (admin_notes !== undefined) updates.admin_notes = admin_notes

    // ペナルティの適用
    if (apply_penalty && status === 'resolved') {
      // 通報対象ユーザーの surveys_answered を減算
      const usersQuery = query(
        collection(db, 'users'),
        where('id', '==', reportData.reported_user_id)
      )
      const userSnapshot = await getDocs(usersQuery)
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0]
        await updateDoc(doc(db, 'users', userDoc.id), {
          surveys_answered: increment(-1), // 回答数を1減らす
          updated_at: serverTimestamp(),
        })
      }

      // google_form_responses から削除する代わりに、フラグを立てる
      const responseQuery = query(
        collection(db, 'google_form_responses'),
        where('survey_id', '==', reportData.survey_id),
        where('user_id', '==', reportData.reported_user_id)
      )
      const responseSnapshot = await getDocs(responseQuery)
      
      if (!responseSnapshot.empty) {
        const responseDoc = responseSnapshot.docs[0]
        await updateDoc(doc(db, 'google_form_responses', responseDoc.id), {
          is_reported: true,
          penalty_applied: true,
        })
      }

      updates.penalty_applied = true
    }

    // 通報を更新
    await updateDoc(doc(db, 'reports', reportId), updates)

    return NextResponse.json({
      success: true,
      message: '通報を更新しました',
    })
  } catch (error) {
    console.error('Error updating report:', error)
    const message = error instanceof Error ? error.message : '通報の更新に失敗しました'
    return createErrorResponse(message, 500)
  }
})


