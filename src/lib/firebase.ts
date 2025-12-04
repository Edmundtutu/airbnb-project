import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth, signInWithCustomToken } from 'firebase/auth';

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

export { app, database, auth };
