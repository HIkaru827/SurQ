import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore"

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
 * 既存のアンケートに有効期限を追加する初期化エンドポイント
 * 一度だけ実行すればOK
 */
export async function POST(request: NextRequest) {
  try {
    console.log('既存アンケートに有効期限を追加しています...')
    
    const surveysSnapshot = await getDocs(collection(db, 'surveys'))
    let updatedCount = 0
    let skippedCount = 0
    const updatedSurveys: any[] = []
    
    for (const surveyDoc of surveysSnapshot.docs) {
      const surveyData = surveyDoc.data()
      
      // 既に有効期限がある場合はスキップ
      if (surveyData.expires_at) {
        skippedCount++
        continue
      }
      
      // 作成日から1か月後を有効期限に設定
      const createdAt = surveyData.created_at?.toDate?.() || new Date()
      const expiryDate = new Date(createdAt)
      expiryDate.setMonth(expiryDate.getMonth() + 1)
      
      await updateDoc(doc(db, 'surveys', surveyDoc.id), {
        expires_at: expiryDate,
        last_extended_at: createdAt
      })
      
      updatedCount++
      updatedSurveys.push({
        id: surveyDoc.id,
        title: surveyData.title,
        created_at: createdAt.toISOString(),
        expires_at: expiryDate.toISOString()
      })
      
      console.log(`✓ ${surveyData.title} - 有効期限: ${expiryDate.toLocaleDateString('ja-JP')}`)
    }
    
    return NextResponse.json({
      success: true,
      message: `既存アンケートに有効期限を追加しました`,
      total: surveysSnapshot.size,
      updated: updatedCount,
      skipped: skippedCount,
      surveys: updatedSurveys
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
 * 現在の状況を確認（有効期限がないアンケートの数を取得）
 */
export async function GET(request: NextRequest) {
  try {
    const surveysSnapshot = await getDocs(collection(db, 'surveys'))
    let withExpiry = 0
    let withoutExpiry = 0
    const surveysWithoutExpiry: any[] = []
    
    for (const surveyDoc of surveysSnapshot.docs) {
      const surveyData = surveyDoc.data()
      
      if (surveyData.expires_at) {
        withExpiry++
      } else {
        withoutExpiry++
        surveysWithoutExpiry.push({
          id: surveyDoc.id,
          title: surveyData.title,
          created_at: surveyData.created_at?.toDate?.()?.toISOString() || 'unknown'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      total: surveysSnapshot.size,
      withExpiry,
      withoutExpiry,
      needsUpdate: withoutExpiry > 0,
      surveysWithoutExpiry
    })
    
  } catch (error) {
    console.error('エラーが発生しました:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


