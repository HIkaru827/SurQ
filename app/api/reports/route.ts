import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp 
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

// GET: 通報一覧の取得（管理者用）
export async function GET(request: NextRequest) {
  try {
    // 管理者認証は後で実装（今は全ユーザーがアクセス可能）
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let reportsQuery
    if (status && ['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      reportsQuery = query(
        collection(db, 'reports'),
        where('status', '==', status)
      )
    } else {
      reportsQuery = query(collection(db, 'reports'))
    }
    
    const snapshot = await getDocs(reportsQuery)
    const reports = snapshot.docs.map(doc => {
      const data = doc.data() as any
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
      }
    })

    // 作成日時で降順ソート
    reports.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return createErrorResponse('通報の取得に失敗しました', 500)
  }
}

// POST: 新規通報の作成
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const {
      survey_id,
      survey_title,
      reported_user_id,
      reported_user_name,
      reason,
      details,
      response_data,
    } = body

    // バリデーション
    if (!survey_id || !reported_user_id || !reason) {
      return createErrorResponse('必須項目が不足しています', 400)
    }

    // ユーザー情報の取得
    const usersQuery = query(collection(db, 'users'), where('email', '==', user.email))
    const userSnapshot = await getDocs(usersQuery)
    
    if (userSnapshot.empty) {
      return createErrorResponse('ユーザーが見つかりません', 404)
    }

    const userData = userSnapshot.docs[0].data()

    // 通報を作成
    const reportData = {
      survey_id,
      survey_title: survey_title || '',
      reporter_id: user.uid,
      reporter_name: userData.name || 'Anonymous',
      reported_user_id,
      reported_user_name: reported_user_name || 'Unknown',
      reason,
      details: details || '',
      status: 'pending',
      response_data: response_data || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, 'reports'), reportData)

    // google_form_responses の is_reported フラグを更新
    if (survey_id && reported_user_id) {
      const responseQuery = query(
        collection(db, 'google_form_responses'),
        where('survey_id', '==', survey_id),
        where('user_id', '==', reported_user_id)
      )
      const responseSnapshot = await getDocs(responseQuery)
      
      if (!responseSnapshot.empty) {
        const responseDoc = responseSnapshot.docs[0]
        await updateDoc(doc(db, 'google_form_responses', responseDoc.id), {
          is_reported: true,
        })
      }
    }

    return NextResponse.json({
      success: true,
      report_id: docRef.id,
      message: '通報を受け付けました',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    const message = error instanceof Error ? error.message : '通報の作成に失敗しました'
    return createErrorResponse(message, 500)
  }
})

