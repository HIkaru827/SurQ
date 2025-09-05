'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, BellOff, Shield, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { pushManager } from '@/lib/push-notifications'
import { toast } from 'sonner'

export function PushNotificationSetup() {
  const { user } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    initializePushNotifications()
  }, [user])

  const initializePushNotifications = async () => {
    setIsLoading(true)
    
    try {
      // Check if push notifications are supported
      const supported = await pushManager.initialize()
      setIsSupported(supported)

      if (supported) {
        // Check current permission
        if ('Notification' in window) {
          setPermission(Notification.permission)
        }

        // Check if already subscribed
        const subscribed = await pushManager.isSubscribed()
        setIsSubscribed(subscribed)
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error)
      setIsSupported(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableNotifications = async () => {
    if (!user) {
      toast.error('ログインが必要です')
      return
    }

    setIsLoading(true)
    
    try {
      // Request permission
      const permissionGranted = await pushManager.requestPermission()
      
      if (!permissionGranted) {
        toast.error('通知の許可が必要です。ブラウザの設定から許可してください。')
        setPermission('denied')
        return
      }

      setPermission('granted')

      // Subscribe to push notifications
      const subscription = await pushManager.subscribe(user.uid)
      
      if (subscription) {
        setIsSubscribed(true)
        toast.success('プッシュ通知が有効になりました')
        
        // Show test notification
        await pushManager.testNotification()
      } else {
        toast.error('プッシュ通知の設定に失敗しました')
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error)
      toast.error('プッシュ通知の設定中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setIsLoading(true)
    
    try {
      const unsubscribed = await pushManager.unsubscribe()
      
      if (unsubscribed) {
        setIsSubscribed(false)
        toast.success('プッシュ通知を無効にしました')
        await pushManager.clearBadge()
      } else {
        toast.error('プッシュ通知の無効化に失敗しました')
      }
    } catch (error) {
      console.error('Error disabling push notifications:', error)
      toast.error('プッシュ通知の無効化中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await pushManager.testNotification()
      toast.success('テスト通知を送信しました')
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('テスト通知の送信に失敗しました')
    }
  }

  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <AlertCircle className="w-5 h-5" />
            <span>プッシュ通知</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 mb-4">
            お使いのブラウザはプッシュ通知をサポートしていません。
          </p>
          <div className="text-xs text-orange-600 space-y-1">
            <p>• Chrome 50+ / Firefox 44+ / Safari 16+ が必要です</p>
            <p>• HTTPSでの接続が必要です</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (permission === 'denied') {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <BellOff className="w-5 h-5" />
            <span>プッシュ通知 - ブロック中</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 mb-4">
            プッシュ通知がブロックされています。有効にするには：
          </p>
          <div className="text-xs text-red-600 space-y-1">
            <p>1. ブラウザのアドレスバー左の🔒をクリック</p>
            <p>2. 「通知」を「許可」に変更</p>
            <p>3. ページを再読み込み</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          {isSubscribed ? (
            <Bell className="w-5 h-5" />
          ) : (
            <BellOff className="w-5 h-5" />
          )}
          <span>プッシュ通知</span>
          {isSubscribed && <Shield className="w-4 h-4 text-green-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-blue-700">
          {isSubscribed ? (
            <p>プッシュ通知が有効です。管理者からの重要な通知を受け取れます。</p>
          ) : (
            <p>プッシュ通知を有効にすると、管理者からの重要な通知をリアルタイムで受け取れます。</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {isSubscribed ? (
            <>
              <Button 
                onClick={handleDisableNotifications}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="bg-white"
              >
                <BellOff className="w-4 h-4 mr-2" />
                {isLoading ? '処理中...' : '無効にする'}
              </Button>
              <Button 
                onClick={handleTestNotification}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="bg-white"
              >
                <Bell className="w-4 h-4 mr-2" />
                テスト通知
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleEnableNotifications}
              disabled={isLoading || !user}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              {isLoading ? '設定中...' : '有効にする'}
            </Button>
          )}
        </div>

        {isSubscribed && (
          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded-md">
            💡 通知をオフにしたい場合は、ブラウザの設定からSurQの通知を無効にできます
          </div>
        )}
      </CardContent>
    </Card>
  )
}