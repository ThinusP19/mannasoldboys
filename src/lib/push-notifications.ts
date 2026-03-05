/**
 * Push Notifications Utility
 * Handles browser push notification subscription and management
 */

import { pushApi } from './api';

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Check current notification permission
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

// Register the service worker
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    // Register the push service worker
    const registration = await navigator.serviceWorker.register('/sw-push.js', {
      scope: '/',
    });
    console.log('Service worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

// Get the current push subscription
async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Error getting current subscription:', error);
    return null;
  }
}

// Convert URL-safe base64 to Uint8Array (needed for VAPID key)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<boolean> {
  console.log('[PUSH] Starting push subscription...');
  console.log('[PUSH] User Agent:', navigator.userAgent);

  if (!isPushSupported()) {
    console.warn('[PUSH] Push notifications not supported');
    return false;
  }

  // Check if notification permission is granted
  console.log('[PUSH] Current permission:', Notification.permission);
  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    console.log('[PUSH] Permission after request:', permission);
    if (permission !== 'granted') {
      console.warn('[PUSH] Notification permission not granted');
      return false;
    }
  }

  try {
    // Register service worker
    console.log('[PUSH] Registering service worker...');
    await registerServiceWorker();
    const registration = await navigator.serviceWorker.ready;
    console.log('[PUSH] Service worker ready:', registration.scope);

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    console.log('[PUSH] Existing subscription:', subscription ? 'yes' : 'no');

    if (!subscription) {
      // Get VAPID public key from server
      console.log('[PUSH] Getting VAPID key from server...');
      const { publicKey } = await pushApi.getVapidPublicKey();
      console.log('[PUSH] VAPID key received:', publicKey ? publicKey.substring(0, 20) + '...' : 'null');

      if (!publicKey) {
        console.warn('[PUSH] VAPID public key not available');
        return false;
      }

      // Subscribe to push notifications
      console.log('[PUSH] Subscribing to push manager...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      console.log('[PUSH] Subscription created!');
    }

    console.log('[PUSH] Subscription endpoint:', subscription.endpoint);

    // Get keys from subscription
    const p256dh = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!p256dh || !auth) {
      console.error('[PUSH] Failed to get subscription keys');
      return false;
    }

    // Convert keys to base64
    const p256dhBase64 = btoa(String.fromCharCode(...new Uint8Array(p256dh)));
    const authBase64 = btoa(String.fromCharCode(...new Uint8Array(auth)));

    // Send subscription to server
    console.log('[PUSH] Sending subscription to server...');
    await pushApi.subscribe({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: p256dhBase64,
        auth: authBase64,
      },
    });

    console.log('[PUSH] ✅ Successfully subscribed to push notifications');
    console.log('[PUSH] Endpoint type:', subscription.endpoint.includes('fcm.googleapis.com') ? 'Chrome/Firefox (FCM)' :
                                         subscription.endpoint.includes('push.apple.com') ? 'Safari (APNs)' : 'Unknown');
    return true;
  } catch (error) {
    console.error('[PUSH] ❌ Error subscribing to push notifications:', error);
    return false;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription();

    if (!subscription) {
      console.log('No push subscription to unsubscribe');
      return true;
    }

    // Unsubscribe from browser
    await subscription.unsubscribe();

    // Notify server
    try {
      await pushApi.unsubscribe(subscription.endpoint);
    } catch (error) {
      // Server might not have this subscription, that's okay
      console.warn('Server unsubscribe failed (subscription might not exist):', error);
    }

    console.log('Successfully unsubscribed from push notifications');
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

// Check if currently subscribed to push
export async function isSubscribedToPush(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  return subscription !== null;
}

// Initialize push notifications (call on app load after user is authenticated)
export async function initializePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    console.log('Push notifications not supported, skipping initialization');
    return;
  }

  // Check if push is enabled on server
  try {
    const status = await pushApi.getStatus();
    if (!status.enabled) {
      console.log('Push notifications not enabled on server');
      return;
    }
  } catch (error) {
    console.warn('Could not check push status:', error);
    return;
  }

  // If permission is already granted, try to subscribe
  if (Notification.permission === 'granted') {
    await subscribeToPush();
  }
}

export default {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
  initializePushNotifications,
};
