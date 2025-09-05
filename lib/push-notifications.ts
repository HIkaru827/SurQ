'use client'

// Push notification subscription system
export class PushNotificationManager {
  private static instance: PushNotificationManager
  private vapidPublicKey: string
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  private constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager()
    }
    return PushNotificationManager.instance
  }

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.log('[Push] Service Worker not supported')
        return false
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.log('[Push] Push messaging not supported')
        return false
      }

      // Register service worker
      this.serviceWorkerRegistration = await this.registerServiceWorker()
      
      if (!this.serviceWorkerRegistration) {
        console.log('[Push] Service Worker registration failed')
        return false
      }

      console.log('[Push] Push notifications initialized successfully')
      return true
    } catch (error) {
      console.error('[Push] Error initializing push notifications:', error)
      return false
    }
  }

  // Register custom service worker
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      // Try to register custom service worker first
      const registration = await navigator.serviceWorker.register('/sw-custom.js', {
        scope: '/',
      })

      console.log('[Push] Custom Service Worker registered successfully')
      return registration
    } catch (error) {
      console.error('[Push] Error registering custom service worker:', error)
      
      // Fallback to default service worker
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })
        console.log('[Push] Default Service Worker registered as fallback')
        return registration
      } catch (fallbackError) {
        console.error('[Push] Error registering fallback service worker:', fallbackError)
        return null
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.log('[Push] Notifications not supported')
        return false
      }

      if (Notification.permission === 'granted') {
        console.log('[Push] Notification permission already granted')
        return true
      }

      if (Notification.permission === 'denied') {
        console.log('[Push] Notification permission denied')
        return false
      }

      // Request permission
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        console.log('[Push] Notification permission granted')
        return true
      } else {
        console.log('[Push] Notification permission denied by user')
        return false
      }
    } catch (error) {
      console.error('[Push] Error requesting notification permission:', error)
      return false
    }
  }

  // Subscribe to push notifications
  async subscribe(userId: string): Promise<PushSubscription | null> {
    try {
      if (!this.serviceWorkerRegistration) {
        console.log('[Push] Service Worker not registered')
        return null
      }

      // Check if already subscribed
      const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
      if (existingSubscription) {
        console.log('[Push] Already subscribed to push notifications')
        await this.saveSubscriptionToServer(existingSubscription, userId)
        return existingSubscription
      }

      // Create new subscription
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      })

      console.log('[Push] Successfully subscribed to push notifications')
      
      // Save subscription to server
      await this.saveSubscriptionToServer(subscription, userId)
      
      return subscription
    } catch (error) {
      console.error('[Push] Error subscribing to push notifications:', error)
      return null
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        console.log('[Push] Service Worker not registered')
        return false
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
      if (!subscription) {
        console.log('[Push] No subscription found')
        return true
      }

      const successful = await subscription.unsubscribe()
      if (successful) {
        console.log('[Push] Successfully unsubscribed from push notifications')
        await this.removeSubscriptionFromServer(subscription)
        return true
      } else {
        console.log('[Push] Failed to unsubscribe from push notifications')
        return false
      }
    } catch (error) {
      console.error('[Push] Error unsubscribing from push notifications:', error)
      return false
    }
  }

  // Check if user is subscribed
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        return false
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
      return !!subscription
    } catch (error) {
      console.error('[Push] Error checking subscription status:', error)
      return false
    }
  }

  // Get current subscription
  async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.serviceWorkerRegistration) {
        return null
      }

      return await this.serviceWorkerRegistration.pushManager.getSubscription()
    } catch (error) {
      console.error('[Push] Error getting subscription:', error)
      return null
    }
  }

  // Save subscription to server
  private async saveSubscriptionToServer(subscription: PushSubscription, userId: string): Promise<void> {
    try {
      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: userId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to save subscription: ${response.statusText}`)
      }

      console.log('[Push] Subscription saved to server')
    } catch (error) {
      console.error('[Push] Error saving subscription to server:', error)
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push-subscriptions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to remove subscription: ${response.statusText}`)
      }

      console.log('[Push] Subscription removed from server')
    } catch (error) {
      console.error('[Push] Error removing subscription from server:', error)
    }
  }

  // Get authentication token
  private async getAuthToken(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        const { auth } = await import('@/lib/firebase')
        if (auth && auth.currentUser) {
          return await auth.currentUser.getIdToken()
        }
      }
      return null
    } catch (error) {
      console.error('[Push] Error getting auth token:', error)
      return null
    }
  }

  // Update badge count
  async updateBadge(count: number): Promise<void> {
    try {
      if ('setAppBadge' in navigator) {
        if (count > 0) {
          await (navigator as any).setAppBadge(count)
        } else {
          await (navigator as any).clearAppBadge()
        }
      }

      // Also send message to service worker
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: count > 0 ? 'UPDATE_BADGE' : 'CLEAR_BADGE',
          count: count
        })
      }
    } catch (error) {
      console.error('[Push] Error updating badge:', error)
    }
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    await this.updateBadge(0)
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Test notification (for development)
  async testNotification(): Promise<void> {
    try {
      if (Notification.permission === 'granted') {
        new Notification('SurQ Test', {
          body: 'プッシュ通知のテストです',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test-notification'
        })
      }
    } catch (error) {
      console.error('[Push] Error showing test notification:', error)
    }
  }
}

// Export singleton instance
export const pushManager = PushNotificationManager.getInstance()