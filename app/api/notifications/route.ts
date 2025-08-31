import { NextRequest, NextResponse } from "next/server"
import { withAuth, createErrorResponse, validateOrigin } from "@/lib/auth-middleware"
import { getUserNotifications, markAllNotificationsAsRead, getUnreadNotificationCount } from "@/lib/notifications"

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'count') {
      // 未読通知数を取得
      const unreadCount = await getUnreadNotificationCount(user.uid)
      return NextResponse.json({ unreadCount })
    } else {
      // 通知一覧を取得
      const limit = parseInt(searchParams.get('limit') || '20')
      const notifications = await getUserNotifications(user.uid, limit)
      return NextResponse.json({ notifications })
    }

  } catch (error) {
    console.error('Error fetching notifications:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications'
    return createErrorResponse(message, 500)
  }
})

export const PATCH = withAuth(async (request: NextRequest, user) => {
  try {
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const body = await request.json()
    const { action } = body
    
    if (action === 'mark_all_read') {
      await markAllNotificationsAsRead(user.uid)
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }
    
    return createErrorResponse('Invalid action', 400)

  } catch (error) {
    console.error('Error updating notifications:', error)
    const message = error instanceof Error ? error.message : 'Failed to update notifications'
    return createErrorResponse(message, 500)
  }
})