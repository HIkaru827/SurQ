import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore"

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
 * 有効期限切れのアンケートをチェックして自動終了
 * このエンドポイントは定期的に呼び出される（Cron Job / Scheduled Function）
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    
    console.log('Checking for expired surveys...')
    
    // 公開中のアンケートを全て取得
    const surveysQuery = query(
      collection(db, 'surveys'),
      where('is_published', '==', true)
    )
    const surveysSnapshot = await getDocs(surveysQuery)
    
    let expiredCount = 0
    const expiredSurveys: string[] = []
    
    // 各アンケートの有効期限をチェック
    for (const surveyDoc of surveysSnapshot.docs) {
      const surveyData = surveyDoc.data()
      const expiresAt = surveyData.expires_at?.toDate?.()
      
      // 有効期限フィールドが存在しない場合は作成日から1か月後に設定
      if (!expiresAt) {
        const createdAt = surveyData.created_at?.toDate?.() || now
        const defaultExpiry = new Date(createdAt)
        defaultExpiry.setMonth(defaultExpiry.getMonth() + 1)
        
        await updateDoc(doc(db, 'surveys', surveyDoc.id), {
          expires_at: defaultExpiry,
          last_extended_at: createdAt
        })
        
        console.log(`Set default expiry for survey ${surveyDoc.id}`)
        continue
      }
      
      // 有効期限切れの場合、非公開化
      if (now > expiresAt) {
        await updateDoc(doc(db, 'surveys', surveyDoc.id), {
          is_published: false,
          expired_at: now,
          updated_at: now
        })
        
        expiredCount++
        expiredSurveys.push(surveyDoc.id)
        console.log(`Expired survey ${surveyDoc.id}: "${surveyData.title}"`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Checked ${surveysSnapshot.size} surveys, expired ${expiredCount}`,
      expiredCount,
      expiredSurveys,
      checkedAt: now.toISOString()
    })
    
  } catch (error) {
    console.error('Error checking survey expiry:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 有効期限が近いアンケートの一覧を取得（管理用）
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const sevenDaysLater = new Date(now)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
    
    // 公開中のアンケートを全て取得
    const surveysQuery = query(
      collection(db, 'surveys'),
      where('is_published', '==', true)
    )
    const surveysSnapshot = await getDocs(surveysQuery)
    
    const expiringSoon: any[] = []
    
    for (const surveyDoc of surveysSnapshot.docs) {
      const surveyData = surveyDoc.data()
      const expiresAt = surveyData.expires_at?.toDate?.()
      
      if (expiresAt) {
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          expiringSoon.push({
            id: surveyDoc.id,
            title: surveyData.title,
            creator_id: surveyData.creator_id,
            expires_at: expiresAt.toISOString(),
            days_until_expiry: daysUntilExpiry
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      count: expiringSoon.length,
      surveys: expiringSoon
    })
    
  } catch (error) {
    console.error('Error fetching expiring surveys:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


