import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth, signInWithCustomToken } from 'firebase/auth';
import { getMessaging, Messaging, getToken, onMessage } from 'firebase/messaging';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Validate configuration
const validateConfig = (): boolean => {
  const required = ['apiKey', 'authDomain', 'databaseURL', 'projectId'];
  const missing = required.filter(key => !firebaseConfig[key as keyof FirebaseConfig]);
  
  if (missing.length > 0) {
    console.warn('Missing Firebase configuration:', missing);
    console.warn('Chat features will not work without proper Firebase setup');
    return false;
  }
  
  return true;
};

let app: FirebaseApp | null = null;
let database: Database | null = null;
let auth: Auth | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase
 */
export const initializeFirebase = (): { app: FirebaseApp; database: Database; auth: Auth } | null => {
  if (!validateConfig()) {
    return null;
  }

  if (app && database && auth) {
    return { app, database, auth };
  }

  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);
    
    console.log('✅ Firebase initialized successfully');
    return { app, database, auth };
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    return null;
  }
};

/**
 * Get Firebase database instance
 */
export const getFirebaseDatabase = (): Database | null => {
  if (!database) {
    const init = initializeFirebase();
    return init?.database || null;
  }
  return database;
};

/**
 * Get Firebase auth instance
 */
export const getFirebaseAuth = (): Auth | null => {
  if (!auth) {
    const init = initializeFirebase();
    return init?.auth || null;
  }
  return auth;
};

/**
 * Authenticate with Firebase using custom token from backend
 */
export const authenticateWithFirebase = async (customToken: string): Promise<void> => {
  const firebaseAuth = getFirebaseAuth();
  
  if (!firebaseAuth) {
    throw new Error('Firebase auth not initialized');
  }

  try {
    await signInWithCustomToken(firebaseAuth, customToken);
    console.log('✅ Firebase authentication successful');
  } catch (error) {
    console.error('❌ Firebase authentication failed:', error);
    throw error;
  }
};

/**
 * Get Firebase Messaging instance
 */
export const getFirebaseMessaging = (): Messaging | null => {
  // Messaging requires a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  if (!messaging) {
    const init = initializeFirebase();
    if (init?.app) {
      try {
        messaging = getMessaging(init.app);
      } catch (error) {
        console.warn('Firebase Messaging not supported:', error);
        return null;
      }
    }
  }
  return messaging;
};

/**
 * Store Firebase config in IndexedDB for service worker access
 */
const storeConfigForServiceWorker = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('firebase-config', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['config'], 'readwrite');
      const store = transaction.objectStore('config');
      
      store.put({
        key: 'firebaseConfig',
        value: firebaseConfig,
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    };
  });
};

/**
 * Request FCM permission and get token
 */
export const requestFCMToken = async (): Promise<string | null> => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Initialize Firebase if needed
    const init = initializeFirebase();
    if (!init) {
      console.warn('Firebase not initialized');
      return null;
    }

    // Store config for service worker
    await storeConfigForServiceWorker();

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    
    console.log('✅ Service worker registered:', registration.scope);

    // Get messaging instance
    const messagingInstance = getFirebaseMessaging();
    if (!messagingInstance) {
      console.warn('Firebase Messaging not available');
      return null;
    }

    // Get VAPID key from environment
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('VITE_FIREBASE_VAPID_KEY not configured');
      return null;
    }

    // Get FCM token
    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('✅ FCM token obtained');
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const onFCMMessage = (callback: (payload: unknown) => void): (() => void) | null => {
  const messagingInstance = getFirebaseMessaging();
  if (!messagingInstance) {
    return null;
  }

  const unsubscribe = onMessage(messagingInstance, (payload) => {
    console.log('📬 Foreground message received:', payload);
    callback(payload);
  });

  return unsubscribe;
};

export { app, database, auth, messaging };
