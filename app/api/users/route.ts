import { NextRequest, NextResponse } from "next/server"
import { serverFirestoreService } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    // 既存ユーザーをチェック
    const existingUser = await serverFirestoreService.users.getByEmail(email)
    
    if (existingUser) {
      // 既存ユーザーのログイン時刻を更新
      await serverFirestoreService.users.updateLastLogin(existingUser.id)
      
      // 更新されたユーザー情報を取得
      const updatedUser = await serverFirestoreService.users.getByEmail(email)
      return NextResponse.json({ user: updatedUser })
    }

    // 新しいユーザーを作成
    const newUserId = await serverFirestoreService.users.create({
      email,
      name,
      avatar_url: null,
      points: 0,
      level: 1,
      badges: [],
      surveys_created: 0,
      surveys_answered: 0,
      total_responses_received: 0
    })

    // 作成されたユーザーを取得
    const newUser = await serverFirestoreService.users.getByEmail(email)

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Error managing user:', error)
    return NextResponse.json({ 
      error: "Failed to manage user",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (email) {
      const user = await serverFirestoreService.users.getByEmail(email)
      if (user) {
        return NextResponse.json({ user })
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    }
    
    // For now, we'll not implement listing all users for security reasons
    return NextResponse.json({ 
      error: "Listing all users not supported" 
    }, { status: 400 })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ 
      error: "Failed to fetch users",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}