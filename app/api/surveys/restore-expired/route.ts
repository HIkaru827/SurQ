import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore"

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

/**
 * 期限切れで非公開化されたアンケートを再公開して、有効期限を現在から1か月後に設定
 */
export async function POST(request: NextRequest) {
  try {
    console.log('期限切れアンケートを復元しています...')
    
    const now = new Date()
    const newExpiry = new Date(now)
    newExpiry.setMonth(newExpiry.getMonth() + 1)
    
    // 期限切れで非公開化されたアンケートを取得
    const expiredSurveysQuery = query(
      collection(db, 'surveys'),
      where('expired_at', '!=', null)
    )
    const expiredSnapshot = await getDocs(expiredSurveysQuery)
    
    let restoredCount = 0
    const restoredSurveys: any[] = []
    
    for (const surveyDoc of expiredSnapshot.docs) {
      const surveyData = surveyDoc.data()
      
      // 再公開して、有効期限を現在から1か月後に設定
      await updateDoc(doc(db, 'surveys', surveyDoc.id), {
        is_published: true,
        expires_at: newExpiry,
        last_extended_at: now,
        expired_at: null // 期限切れフラグをクリア
      })
      
      restoredCount++
      restoredSurveys.push({
        id: surveyDoc.id,
        title: surveyData.title,
        created_at: surveyData.created_at?.toDate?.()?.toISOString() || 'unknown',
        new_expires_at: newExpiry.toISOString()
      })
      
      console.log(`✓ ${surveyData.title} - 新しい有効期限: ${newExpiry.toLocaleDateString('ja-JP')}`)
    }
    
    return NextResponse.json({
      success: true,
      message: `期限切れアンケートを復元しました`,
      restored: restoredCount,
      surveys: restoredSurveys,
      newExpiry: newExpiry.toISOString()
    })
    
  } catch (error) {
    console.error('エラーが発生しました:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 期限切れで非公開化されたアンケートの一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const expiredSurveysQuery = query(
      collection(db, 'surveys'),
      where('expired_at', '!=', null)
    )
    const expiredSnapshot = await getDocs(expiredSurveysQuery)
    
    const expiredSurveys: any[] = []
    
    for (const surveyDoc of expiredSnapshot.docs) {
      const surveyData = surveyDoc.data()
      expiredSurveys.push({
        id: surveyDoc.id,
        title: surveyData.title,
        created_at: surveyData.created_at?.toDate?.()?.toISOString() || 'unknown',
        expires_at: surveyData.expires_at?.toDate?.()?.toISOString() || 'unknown',
        expired_at: surveyData.expired_at?.toDate?.()?.toISOString() || 'unknown',
        is_published: surveyData.is_published
      })
    }
    
    return NextResponse.json({
      success: true,
      count: expiredSurveys.length,
      surveys: expiredSurveys
    })
    
  } catch (error) {
    console.error('エラーが発生しました:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


