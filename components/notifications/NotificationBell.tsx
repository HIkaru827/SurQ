'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { authenticatedFetch } from '@/lib/api-client'
import { Notification } from '@/lib/notifications'

export function NotificationBell() {
  const { user, loading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchUnreadCount = async () => {
    if (!user) return
    
    try {
      console.log('=== Fetching unread notification count ===')
      console.log('User:', user?.email)
      console.log('User UID:', user?.uid)
      
      const response = await authenticatedFetch('/api/notifications?action=count')
      console.log('Count API response status:', response.status)
      console.log('Count API response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Count API response data:', data)
        setUnreadCount(data.unreadCount || 0)
      } else {
        const errorData = await response.text()
        console.error('Count API error:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const fetchNotifications = async () => {
    if (isLoading || !user) return
    
    console.log('=== Fetching notifications list ===')
    console.log('User:', user?.email)
    console.log('User UID:', user?.uid)
    
    setIsLoading(true)
    try {
      const response = await authenticatedFetch('/api/notifications?limit=10')
      console.log('Notifications API response status:', response.status)
      console.log('Notifications API response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Notifications API response data:', data)
        console.log('Notifications count:', data.notifications?.length || 0)
        setNotifications(data.notifications || [])
      } else {
        const errorData = await response.text()
        console.error('Notifications API error:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    
    try {
      const response = await authenticatedFetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'mark_all_read' })
      })
      
      if (response.ok) {
        setUnreadCount(0)
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        )
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user) return
    
    try {
      const response = await authenticatedFetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return 'たった今'
    if (diffInMinutes < 60) return `${diffInMinutes}分前`
    if (diffInHours < 24) return `${diffInHours}時間前`
    return `${diffInDays}日前`
  }

  useEffect(() => {
    if (loading || !user) return
    
    fetchUnreadCount()
    
    // 5分ごとに未読数をチェック
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user, loading])

  const handleDropdownOpen = (open: boolean) => {
    setIsOpen(open)
    if (open && user) {
      fetchNotifications()
    }
  }

  // 認証されていない場合は表示しない
  if (loading || !user) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          通知
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              全て既読
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <DropdownMenuItem disabled>
            読み込み中...
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            通知はありません
          </DropdownMenuItem>
        ) : (
          <ScrollArea className="h-80">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start space-y-1 p-3 cursor-pointer ${
                  !notification.is_read ? 'bg-blue-50 hover:bg-blue-100' : ''
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id!)
                  }
                }}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium">
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    {notification.survey_title && (
                      <p className="text-xs text-blue-600 mt-1">
                        アンケート: {notification.survey_title}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(notification.created_at)}
                </span>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}