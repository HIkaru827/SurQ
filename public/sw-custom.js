// Custom service worker for PWA and push notifications
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activating...');
  event.waitUntil(
    clients.claim()
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);

  if (!event.data) {
    console.log('[SW] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const options = {
      body: data.content || data.body || 'SurQ からの通知があります',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'surq-notification',
      data: {
        url: data.url || '/',
        notificationId: data.notificationId,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: '確認する',
          icon: '/icon-192x192.png'
        },
        {
          action: 'dismiss',
          title: '後で',
          icon: '/icon-192x192.png'
        }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'SurQ 通知', options)
    );

    // Update badge count
    updateBadgeCount();
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
    
    // Show fallback notification
    event.waitUntil(
      self.registration.showNotification('SurQ 通知', {
        body: 'SurQ からの新しい通知があります',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'surq-fallback'
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if SurQ is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  // Track notification dismissal
  if (event.notification.data?.notificationId) {
    // Could send analytics about notification dismissal
  }
});

// Update badge count based on unread notifications
async function updateBadgeCount() {
  try {
    if ('setAppBadge' in navigator) {
      // Get unread count from storage or API
      const unreadCount = await getUnreadNotificationCount();
      if (unreadCount > 0) {
        navigator.setAppBadge(unreadCount);
      } else {
        navigator.clearAppBadge();
      }
    }
  } catch (error) {
    console.error('[SW] Error updating badge:', error);
  }
}

async function getUnreadNotificationCount() {
  try {
    // This would typically fetch from your API
    // For now, return a placeholder
    return 0;
  } catch (error) {
    console.error('[SW] Error getting unread count:', error);
    return 0;
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'survey-response') {
    event.waitUntil(
      handleOfflineSurveyResponse()
    );
  }
});

async function handleOfflineSurveyResponse() {
  try {
    console.log('[SW] Handling offline survey responses...');
  } catch (error) {
    console.error('[SW] Error handling offline responses:', error);
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'UPDATE_BADGE':
        updateBadgeCount();
        break;
      case 'CLEAR_BADGE':
        if ('clearAppBadge' in navigator) {
          navigator.clearAppBadge();
        }
        break;
      default:
        console.log('[SW] Unknown message type:', event.data.type);
    }
  }
});