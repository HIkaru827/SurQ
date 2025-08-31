import { NextRequest, NextResponse } from "next/server"
import { withAuth, createErrorResponse, validateOrigin } from "@/lib/auth-middleware"
import { markNotificationAsRead } from "@/lib/notifications"

export const PATCH = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    if (!validateOrigin(request)) {
      return createErrorResponse('Invalid origin', 403)
    }

    const { id: notificationId } = await params
    
    await markNotificationAsRead(notificationId)
    return NextResponse.json({ success: true, message: 'Notification marked as read' })

  } catch (error) {
    console.error('Error marking notification as read:', error)
    const message = error instanceof Error ? error.message : 'Failed to mark notification as read'
    return createErrorResponse(message, 500)
  }
})