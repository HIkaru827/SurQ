/**
 * 既存のアンケートに有効期限を追加するスクリプト
 * 
 * 使い方:
 * 1. ブラウザのコンソールで以下のコードを実行
 * 2. または、このスクリプトをNode.jsで実行
 */

import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

const db = getFirestore(app)

async function addExpiryToExistingSurveys() {
  try {
    console.log('既存アンケートに有効期限を追加しています...')
    
    const surveysSnapshot = await getDocs(collection(db, 'surveys'))
    let updatedCount = 0
    let skippedCount = 0
    
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
      console.log(`✓ ${surveyData.title} - 有効期限: ${expiryDate.toLocaleDateString('ja-JP')}`)
    }
    
    console.log(`\n完了！`)
    console.log(`更新: ${updatedCount}件`)
    console.log(`スキップ: ${skippedCount}件`)
    console.log(`合計: ${surveysSnapshot.size}件`)
    
  } catch (error) {
    console.error('エラーが発生しました:', error)
  }
}

// 実行
addExpiryToExistingSurveys()


