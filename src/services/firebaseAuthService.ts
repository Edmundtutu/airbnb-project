/**
 * Firebase Authentication Service
 * 
 * Handles authentication with Firebase using custom tokens from the backend.
 */

import api from './api';
import { authenticateWithFirebase } from '@/lib/firebase';

const apiVersion = import.meta.env.VITE_API_VERSION;

interface FirebaseTokenResponse {
  token: string;
  uid: string;
  expires_in: number;
}

/**
 * Get custom token from backend and authenticate with Firebase
 */
export const authenticateFirebase = async (): Promise<void> => {
  try {
    console.log('🔐 Requesting Firebase custom token from backend...');
    
    // Get custom token from Laravel backend
    const response = await api.get<FirebaseTokenResponse>(`${apiVersion}/firebase/auth`);
    const { token, uid } = response.data;

    if (response.status !== 200) {
      throw new Error(`Failed to get Firebase token: ${response.statusText}`);
    }
    console.log('✅ Received Firebase custom token for user:', uid);

    // Authenticate with Firebase using the custom token
    await authenticateWithFirebase(token);

    console.log('✅ Firebase authentication successful');
  } catch (error) {
    console.error('❌ Firebase authentication failed:', error);
    throw error;
  }
};

/**
 * Revoke Firebase tokens (for logout)
 */
export const revokeFirebaseTokens = async (): Promise<void> => {
  try {
    console.log('🔐 Revoking Firebase tokens...');
    
    await api.post(`${apiVersion}/firebase/auth/revoke`);
    
    console.log('✅ Firebase tokens revoked');
  } catch (error) {
    console.error('❌ Failed to revoke Firebase tokens:', error);
    // Don't throw - this is a cleanup operation
  }
};

/**
 * Initialize Firebase auth when user logs in
 * Call this after successful login
 */
export const initializeFirebaseAuth = async (): Promise<boolean> => {
  try {
    await authenticateFirebase();
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase auth:', error);
    return false;
  }
};
