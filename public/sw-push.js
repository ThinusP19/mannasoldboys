/**
 * Push Notification Service Worker
 * Handles incoming push notifications and click events
 */

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[SW Push] Push notification received');

  let data = {
    title: 'Potch Gim Alumni',
    body: 'You have a new notification',
    icon: '/cropped-skool-wapen.png',
    badge: '/cropped-skool-wapen.png',
    tag: 'default',
    data: {},
  };

  // Try to parse the push data
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || {},
      };
    } catch (error) {
      console.error('[SW Push] Error parsing push data:', error);
      // Try as text
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: data.data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification clicked:', event.notification.tag);

  event.notification.close();

  // Get the URL to open from notification data
  const urlToOpen = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate existing window to the notification URL
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW Push] Notification closed:', event.notification.tag);
});

// Service worker install
self.addEventListener('install', (event) => {
  console.log('[SW Push] Service worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Service worker activate
self.addEventListener('activate', (event) => {
  console.log('[SW Push] Service worker activated');
  // Claim all clients immediately
  event.waitUntil(clients.claim());
});

// Handle push subscription change (e.g., when subscription expires)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW Push] Push subscription changed');

  event.waitUntil(
    // Re-subscribe with the same options
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('[SW Push] Re-subscribed successfully');
        // You would typically send the new subscription to your server here
        // But since we're in a service worker, we'd need to use fetch
        // The main app will handle re-subscription on next load
      })
      .catch((error) => {
        console.error('[SW Push] Re-subscription failed:', error);
      })
  );
});

console.log('[SW Push] Service worker loaded');
