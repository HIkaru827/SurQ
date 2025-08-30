import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, serverTimestamp, addDoc } from "firebase/firestore"

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

// Valid coupons and their point values
const VALID_COUPONS = {
  'NEW2025': { points: 200, description: 'ウェルカムボーナス' },
  'BONUS100': { points: 100, description: 'ボーナスポイント' },
  'FIRST50': { points: 50, description: '初回利用ボーナス' },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, couponCode } = body

    if (!email || !couponCode) {
      return NextResponse.json({ 
        error: "メールアドレスとクーポンコードが必要です" 
      }, { status: 400 })
    }

    // クーポンコードの検証
    const upperCouponCode = couponCode.toUpperCase()
    const couponData = VALID_COUPONS[upperCouponCode as keyof typeof VALID_COUPONS]
    
    if (!couponData) {
      return NextResponse.json({ 
        error: "このクーポンは無効です" 
      }, { status: 400 })
    }

    // 既にこのクーポンを使用したかチェック（簡略化）
    try {
      const existingCouponQuery = query(
        collection(db, 'coupon_history'),
        where('user_email', '==', email)
      )
      const existingCouponSnapshot = await getDocs(existingCouponQuery)
      
      // 手動でクーポンコードをチェック
      const alreadyUsed = existingCouponSnapshot.docs.some(doc => 
        doc.data().coupon_code === upperCouponCode
      )
      
      if (alreadyUsed) {
        return NextResponse.json({ 
          error: "このクーポンは使用済みです" 
        }, { status: 400 })
      }
    } catch (error) {
      console.warn('Coupon duplicate check failed, proceeding:', error)
      // 重複チェックに失敗した場合は続行（初回使用の場合）
    }

    // ユーザーを検索
    const usersQuery = query(collection(db, 'users'), where('email', '==', email))
    const userSnapshot = await getDocs(usersQuery)
    
    if (userSnapshot.empty) {
      return NextResponse.json({ 
        error: "ユーザーが見つかりません" 
      }, { status: 404 })
    }

    const userDoc = userSnapshot.docs[0]
    const userData = userDoc.data()
    const currentPoints = userData.points || 0

    // ポイントを更新
    await updateDoc(doc(db, 'users', userDoc.id), {
      points: currentPoints + couponData.points,
      updated_at: serverTimestamp()
    })

    // クーポン使用履歴を保存
    await addDoc(collection(db, 'coupon_history'), {
      user_id: userDoc.id,
      user_email: email,
      coupon_code: upperCouponCode,
      points_added: couponData.points,
      description: couponData.description,
      used_at: serverTimestamp(),
      created_at: serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      pointsAdded: couponData.points,
      newTotal: currentPoints + couponData.points,
      description: couponData.description
    })

  } catch (error) {
    console.error('Error applying coupon:', error)
    return NextResponse.json({ 
      error: "クーポンの適用に失敗しました",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ 
        error: "メールアドレスが必要です" 
      }, { status: 400 })
    }

    // クーポン履歴を取得（orderByを削除してIndex不要にする）
    const historyQuery = query(
      collection(db, 'coupon_history'), 
      where('user_email', '==', email)
    )
    const historySnapshot = await getDocs(historyQuery)
    
    const history = historySnapshot.docs
      .map(doc => ({
        id: doc.id,
        code: doc.data().coupon_code,
        points: doc.data().points_added,
        description: doc.data().description,
        usedAt: doc.data().used_at?.toDate?.()?.toISOString() || doc.data().used_at
      }))
      .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()) // 手動ソート

    return NextResponse.json({ history })

  } catch (error) {
    console.error('Error fetching coupon history:', error)
    return NextResponse.json({ 
      error: "クーポン履歴の取得に失敗しました",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}