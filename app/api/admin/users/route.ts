import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs, query, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore"
import { withAdminAuth, createErrorResponse, validateOrigin } from "@/lib/auth-middleware"

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

// 全ユーザー取得
export const GET = withAdminAuth(async (request: NextRequest, user) => {
  try {
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const usersQuery = query(collection(db, 'users'))
    const snapshot = await getDocs(usersQuery)
    
    const users = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email || '',
        name: data.name || '不明',
        points: data.points || 0,
        surveys_answered: data.surveys_answered || 0, // Give
        surveys_created: data.surveys_created || 0, // Take
        reportCount: data.reportCount || 0,
        isBanned: data.isBanned || false,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        last_login: data.last_login?.toDate?.()?.toISOString() || data.last_login,
      }
    })

    // 本日の新規登録者数を計算
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = users.filter(u => {
      const createdDate = new Date(u.created_at)
      return createdDate >= today
    }).length

    // 要注意ユーザー数（reportCount >= 1）
    const warningCount = users.filter(u => u.reportCount >= 1).length

    return NextResponse.json({
      users,
      summary: {
        totalUsers: users.length,
        todayRegistrations: todayCount,
        warningUsers: warningCount
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch users'
    return createErrorResponse(message, 500)
  }
})

// ユーザー更新（ポイント変更、凍結/解除）
export const PUT = withAdminAuth(async (request: NextRequest, user) => {
  try {
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const body = await request.json()
    const { userId, points, pointsOperation, isBanned } = body

    if (!userId) {
      return createErrorResponse('User ID is required', 400)
    }

    const userRef = doc(db, 'users', userId)
    const updates: any = {
      updated_at: serverTimestamp()
    }

    // ポイント操作
    if (points !== undefined && pointsOperation) {
      const userDocRef = doc(db, 'users', userId)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        const currentPoints = userDocSnap.data().points || 0
        let newPoints = currentPoints

        switch (pointsOperation) {
          case 'add':
            newPoints = currentPoints + (points || 0)
            break
          case 'subtract':
            newPoints = Math.max(0, currentPoints - (points || 0))
            break
          case 'set':
            newPoints = points || 0
            break
          default:
            return createErrorResponse('Invalid points operation', 400)
        }

        updates.points = newPoints
      } else {
        return createErrorResponse('User not found', 404)
      }
    } else if (points !== undefined && pointsOperation === undefined) {
      // pointsOperationが指定されていない場合は直接設定
      updates.points = points
    }

    // 凍結/解除
    if (isBanned !== undefined) {
      updates.isBanned = isBanned
    }

    await updateDoc(userRef, updates)

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    const message = error instanceof Error ? error.message : 'Failed to update user'
    return createErrorResponse(message, 500)
  }
})

