import { type NextRequest, NextResponse } from "next/server"
import { calculateSurveyPoints } from "@/lib/points"
import { isDeveloperAccount } from "@/lib/developer"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc, doc } from "firebase/firestore"

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
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
        updated_at: doc.data().updated_at?.toDate?.()?.toISOString() || doc.data().updated_at
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // ポイント計算
    const points = calculateSurveyPoints(body.questions || [])

    const surveyData = {
      title: body.title,
      description: body.description || null,
      creator_id: body.creator_id || 'anonymous-user',
      questions: body.questions || [],
      is_published: body.is_published || false,
      respondent_points: points.respondentPoints,
      creator_points: points.creatorPoints,
      response_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    }

    // 公開時はユーザーのポイントをチェック・消費（開発者アカウントはスキップ）
    if (body.is_published && body.creator_id !== 'anonymous-user' && body.creator_email) {
      const isDevAccount = isDeveloperAccount(body.creator_email)
      
      if (!isDevAccount) {
        const usersQuery = query(collection(db, 'users'), where('email', '==', body.creator_email))
        const userSnapshot = await getDocs(usersQuery)
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0]
          const currentPoints = userDoc.data().points || 0
          
          if (currentPoints < points.creatorPoints) {
            return NextResponse.json({ 
              error: "Insufficient points",
              required: points.creatorPoints,
              current: currentPoints
            }, { status: 400 })
          }
          
          // ポイント消費
          await updateDoc(doc(db, 'users', userDoc.id), {
            points: currentPoints - points.creatorPoints,
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
    return NextResponse.json({ 
      error: "Failed to create survey",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
