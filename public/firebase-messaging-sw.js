/**
 * Firebase Cloud Messaging Service Worker
 * 
 * This service worker handles background push notifications from Firebase.
 * It runs independently of the main app and can receive messages even when
 * the app is closed or in the background.
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// These values will be replaced during build or fetched from IndexedDB
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
};

// Try to get config from IndexedDB (set by the main app)
const getConfigFromIDB = async () => {
  return new Promise((resolve) => {
    const request = indexedDB.open('firebase-config', 1);
    
    request.onerror = () => {
      console.log('[FCM SW] Could not open IndexedDB');
      resolve(null);
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['config'], 'readonly');
      const store = transaction.objectStore('config');
      const getRequest = store.get('firebaseConfig');
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result?.value || null);
      };
      
      getRequest.onerror = () => {
        resolve(null);
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    };
  });
};

// Initialize Firebase with config
let messaging = null;

const initializeFirebase = async () => {
  try {
    // Try to get config from IndexedDB first
    const idbConfig = await getConfigFromIDB();
    const config = idbConfig || firebaseConfig;
    
    if (!config.apiKey || !config.messagingSenderId) {
      console.warn('[FCM SW] Firebase config not available');
      return;
    }
    
    firebase.initializeApp(config);
    messaging = firebase.messaging();
    
    console.log('[FCM SW] Firebase messaging initialized');
    
    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[FCM SW] Received background message:', payload);
      
      const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.message || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: payload.data?.notification_id || 'default',
        data: {
          url: payload.data?.action_url || '/',
          notificationId: payload.data?.notification_id,
          type: payload.data?.type,
          bookingId: payload.data?.booking_id,
        },
        actions: getNotificationActions(payload.data?.type),
        requireInteraction: true,
        vibrate: [200, 100, 200],
      };
      
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.error('[FCM SW] Error initializing Firebase:', error);
  }
};

// Get notification actions based on type
const getNotificationActions = (type) => {
  switch (type) {
    case 'booking_new_request':
      return [
        { action: 'view', title: 'View Request' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'booking_confirmed':
      return [
        { action: 'view', title: 'View Booking' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'booking_rejected':
    case 'booking_cancelled':
      return [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    default:
      return [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
  }
};

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'dismiss') {
    return;
  }
  
  // Determine URL to open
  let urlToOpen = data?.url || '/';
  
  // If there's a booking ID, navigate to the appropriate page
  if (data?.bookingId) {
    const type = data?.type;
    if (type === 'booking_new_request') {
      urlToOpen = `/host/bookings?highlight=${data.bookingId}`;
    } else {
      urlToOpen = `/bookings?highlight=${data.bookingId}`;
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            payload: data,
          });
          client.focus();
          if ('navigate' in client) {
            return client.navigate(urlToOpen);
          }
          return;
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push events directly (for custom push, not FCM)
self.addEventListener('push', (event) => {
  console.log('[FCM SW] Push event received');
  
  // FCM messages are handled by onBackgroundMessage
  // This is for other push sources if needed
});

// Initialize when service worker activates
self.addEventListener('activate', (event) => {
  console.log('[FCM SW] Service worker activated');
  event.waitUntil(initializeFirebase());
});

// Also try to initialize on install
self.addEventListener('install', (event) => {
  console.log('[FCM SW] Service worker installed');
  self.skipWaiting();
});

// Initialize immediately if already active
initializeFirebase();
