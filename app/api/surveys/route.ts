import { type NextRequest, NextResponse } from "next/server"
import { Question } from "@/lib/points"
import { isDeveloperAccount } from "@/lib/developer"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc, doc, increment } from "firebase/firestore"
import { withAuth, createErrorResponse, validateOrigin, authenticateUser } from "@/lib/auth-middleware"
import { validateInput, SurveySchema, QueryParamsSchema, validateCanCreateSurvey } from "@/lib/validation"

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeUnpublished = searchParams.get('include_unpublished') === 'true'
    const creatorId = searchParams.get('creator_id')
    
    // creator_idが指定された場合は認証が必要
    if (creatorId) {
      try {
        const user = await authenticateUser(request)
        // ユーザーは自分のアンケートのみ取得可能
        if (user.uid !== creatorId) {
          return createErrorResponse('Unauthorized: Can only access own surveys', 403)
        }
      } catch (error) {
        return createErrorResponse('Authentication required for user surveys', 401)
      }
    }
    
    let surveysQuery
    
    if (creatorId) {
      // 特定のユーザーのアンケートのみ（公開・未公開問わず）
      surveysQuery = query(
        collection(db, 'surveys'),
        where('creator_id', '==', creatorId)
      )
    } else if (!includeUnpublished) {
      // 公開されたアンケートのみを返す（デフォルト）
      surveysQuery = query(
        collection(db, 'surveys'),
        where('is_published', '==', true)
      )
    } else {
      // 全てのアンケート（orderByのみ）
      surveysQuery = query(collection(db, 'surveys'))
    }
    
    const snapshot = await getDocs(surveysQuery)
    const surveys = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...(doc.data() as any),
        created_at: (doc.data() as any).created_at?.toDate?.()?.toISOString() || (doc.data() as any).created_at,
        updated_at: (doc.data() as any).updated_at?.toDate?.()?.toISOString() || (doc.data() as any).updated_at
      }))
      .sort((a, b) => {
        // 手動でcreated_atで降順ソート
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })
    
    const response = NextResponse.json({ surveys })
    
    // 公開アンケートは30秒キャッシュ
    if (!creatorId && !includeUnpublished) {
      response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    }
    
    return response
  } catch (error) {
    console.error('Error fetching surveys:', error)
    return NextResponse.json({ 
      error: "Failed to fetch surveys",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      console.error('Origin validation failed for request:', request.url, request.headers.get('origin'))
      return createErrorResponse('Invalid origin', 403)
    }

    const body = await request.json()
    console.log('Survey creation request body:', JSON.stringify(body, null, 2))
    
    // Validate input data
    const validatedData = validateInput(SurveySchema, body)
    console.log('Validated data:', JSON.stringify(validatedData, null, 2))

    const surveyData: any = {
      type: validatedData.type || 'native', // デフォルトはネイティブ形式（既存データとの互換性）
      title: validatedData.title,
      description: validatedData.description || null,
      creator_id: user.uid, // Use authenticated user's UID
      is_published: validatedData.is_published || false,
      response_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }

    // ネイティブ形式の場合
    if (validatedData.type === 'native' || !validatedData.type) {
      surveyData.questions = validatedData.questions || []
    }

    // Googleフォーム形式の場合
    if (validatedData.type === 'google_form') {
      surveyData.google_form_url = validatedData.google_form_url
      surveyData.embedded_url = validatedData.embedded_url
      surveyData.estimated_time = validatedData.estimated_time
      surveyData.category = validatedData.category
      surveyData.target_audience = validatedData.target_audience || null
    }

    // 公開時はユーザーの投稿権をチェック・消費（開発者アカウントはスキップ）
    if (validatedData.is_published) {
      const isDevAccount = isDeveloperAccount(user.email!)
      
      if (!isDevAccount) {
        const usersQuery = query(collection(db, 'users'), where('email', '==', user.email))
        const userSnapshot = await getDocs(usersQuery)
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0]
          const userData = userDoc.data()
          const surveys_answered = userData.surveys_answered || 0
          const surveys_created = userData.surveys_created || 0
          
          // 投稿権チェック（4回答 = 1投稿権）
          validateCanCreateSurvey(surveys_answered, surveys_created)
          
          // 投稿数をインクリメント
          await updateDoc(doc(db, 'users', userDoc.id), {
            surveys_created: increment(1),
            updated_at: serverTimestamp()
          })
        }
      }
    }

    // Firestoreに保存
    const docRef = await addDoc(collection(db, 'surveys'), surveyData)
    
    // 作成されたドキュメントを取得して返す
    const createdSurvey = {
      id: docRef.id,
      ...surveyData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({ survey: createdSurvey }, { status: 201 })
  } catch (error) {
    console.error('Error creating survey:', error)
    const message = error instanceof Error ? error.message : 'Failed to create survey'
    return createErrorResponse(message, 500)
  }
})
