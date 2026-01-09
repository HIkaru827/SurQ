import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, serverTimestamp, addDoc, runTransaction } from "firebase/firestore"
import { withAuth, createErrorResponse, validateOrigin } from "@/lib/auth-middleware"
import { validateInput, CouponSchema, EmailSchema } from "@/lib/validation"

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

// Load valid coupons from environment variables for security
// Format: CODE:ANSWERS:DESCRIPTION (e.g., "WELCOME:4:Welcome bonus")
function getValidCoupons() {
  const couponsEnv = process.env.VALID_COUPONS || ''
  const coupons: Record<string, { answersToAdd: number; description: string }> = {}
  
  couponsEnv.split(',').forEach(couponStr => {
    const [code, answers, description] = couponStr.split(':')
    if (code && answers && description) {
      coupons[code.trim()] = {
        answersToAdd: parseInt(answers.trim()),
        description: description.trim()
      }
    }
  })
  
  return coupons
}

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const body = await request.json()
    const validatedData = validateInput(CouponSchema, body)
    const { email, couponCode } = validatedData

    // Verify the authenticated user matches the email
    if (user.email !== email) {
      return createErrorResponse('Unauthorized: Email mismatch', 403)
    }

    // クーポンコードの検証
    const upperCouponCode = couponCode.toUpperCase()
    const validCoupons = getValidCoupons()
    const couponData = validCoupons[upperCouponCode]
    
    if (!couponData) {
      return createErrorResponse('このクーポンは無効です', 400)
    }

    // Use transaction to prevent race conditions
    const result = await runTransaction(db, async (transaction) => {
      // Check if coupon already used
      const existingCouponQuery = query(
        collection(db, 'coupon_history'),
        where('user_email', '==', email),
        where('coupon_code', '==', upperCouponCode)
      )
      const existingCouponSnapshot = await getDocs(existingCouponQuery)
      
      if (!existingCouponSnapshot.empty) {
        throw new Error('このクーポンは使用済みです')
      }

      // Find user
      const usersQuery = query(collection(db, 'users'), where('email', '==', email))
      const userSnapshot = await getDocs(usersQuery)
      
      if (userSnapshot.empty) {
        throw new Error('ユーザーが見つかりません')
      }

      const userDoc = userSnapshot.docs[0]
      const userData = userDoc.data()
      const currentAnswers = userData.surveys_answered || 0
      const newAnswers = currentAnswers + couponData.answersToAdd

      // Update user surveys_answered
      const userRef = doc(db, 'users', userDoc.id)
      transaction.update(userRef, {
        surveys_answered: newAnswers,
        updated_at: serverTimestamp()
      })

      // Add coupon history
      const historyRef = doc(collection(db, 'coupon_history'))
      transaction.set(historyRef, {
        user_id: userDoc.id,
        user_email: email,
        coupon_code: upperCouponCode,
        answers_added: couponData.answersToAdd,
        posts_added: Math.floor(couponData.answersToAdd / 4),
        description: couponData.description,
        used_at: serverTimestamp(),
        created_at: serverTimestamp()
      })

      return {
        answersAdded: couponData.answersToAdd,
        postsAdded: Math.floor(couponData.answersToAdd / 4),
        newAnswersTotal: newAnswers,
        description: couponData.description
      }
    })

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('Error applying coupon:', error)
    const message = error instanceof Error ? error.message : 'クーポンの適用に失敗しました'
    
    // Return specific error messages for known cases
    if (message === 'このクーポンは使用済みです' || message === 'ユーザーが見つかりません') {
      return createErrorResponse(message, 400)
    }
    
    return createErrorResponse('クーポンの適用に失敗しました', 500)
  }
})

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Validate origin
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return createErrorResponse('メールアドレスが必要です', 400)
    }

    // Validate email parameter and authorization
    validateInput(EmailSchema, { email })
    
    if (user.email !== email) {
      return createErrorResponse('Unauthorized: Can only access own coupon history', 403)
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
        answersAdded: doc.data().answers_added || doc.data().points_added || 0, // backwards compatibility
        postsAdded: doc.data().posts_added || Math.floor((doc.data().answers_added || doc.data().points_added || 0) / 4),
        description: doc.data().description,
        usedAt: doc.data().used_at?.toDate?.()?.toISOString() || doc.data().used_at
      }))
      .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()) // 手動ソート

    return NextResponse.json({ history })

  } catch (error) {
    console.error('Error fetching coupon history:', error)
    const message = error instanceof Error ? error.message : 'クーポン履歴の取得に失敗しました'
    return createErrorResponse(message, 500)
  }
})