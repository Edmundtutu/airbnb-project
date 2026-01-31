import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthUser, AuthState, RegisterData } from '@/types/auth';
import { INFLUENCER_THRESHOLD } from '@/utils/constants';
import { authService } from '@/services/authService';
import api from '@/services/api';
import { initializeFirebaseAuth } from '@/services/firebaseAuthService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'LOGOUT' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth-token');

      if (token) {
        try {
          // Set the Authorization header for the stored token
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Validate the token by fetching user data
          const user = await authService.me();

          // Calculate influencer status
          const authUser: AuthUser = {
            ...user,
            isInfluencer: (user.followers || 0) >= INFLUENCER_THRESHOLD,
            can_access_host_dashboard: (user as any).can_access_host_dashboard,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date()
          };

          // Update stored user data
          localStorage.setItem('auth-user', JSON.stringify(authUser));
          dispatch({ type: 'SET_USER', payload: authUser });
        } catch (error) {
          // Token is invalid, clear everything
          localStorage.removeItem('auth-user');
          localStorage.removeItem('auth-token');
          delete api.defaults.headers.common['Authorization'];
          dispatch({ type: 'SET_USER', payload: null });
        }
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.login(email, password);
      const { user, access_token } = response;

      // Store token and user data
      localStorage.setItem('auth-token', access_token);
      localStorage.setItem('auth-user', JSON.stringify(user));

      // Set Authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Calculate influencer status
      const authUser: AuthUser = {
        ...user,
        isInfluencer: user.followers >= INFLUENCER_THRESHOLD,
        can_access_host_dashboard: (response as any).can_access_host_dashboard,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date()
      };

      dispatch({ type: 'SET_USER', payload: authUser });
      
      // try to initialize firebase auth
      try {
        await initializeFirebaseAuth();
      } catch (error) {
        console.warn('Firebase auth failed, but user is logged in');
      }

    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.register(data);
      const { user, access_token } = response;

      // Store token and user data
      localStorage.setItem('auth-token', access_token);
      localStorage.setItem('auth-user', JSON.stringify(user));

      // Set Authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Calculate influencer status
      const authUser: AuthUser = {
        ...user,
        isInfluencer: user.followers >= INFLUENCER_THRESHOLD,
        can_access_host_dashboard: (response as any).can_access_host_dashboard,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date()
      };

      dispatch({ type: 'SET_USER', payload: authUser });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage and logout regardless of API call result
      localStorage.removeItem('auth-user');
      localStorage.removeItem('auth-token');
      delete api.defaults.headers.common['Authorization'];
      dispatch({ type: 'LOGOUT' });
    }
  };



  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};