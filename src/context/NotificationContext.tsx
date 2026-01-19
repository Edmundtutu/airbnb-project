import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '@/services/notificationService';
import type { Notification, NotificationPreferences } from '@/types/notifications';
import { useToast } from '@/hooks/use-toast';

// ============ Types ============

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  error: string | null;
}

interface NotificationContextType extends NotificationState {
  // Actions
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  // Preferences
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
}

type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: { notifications: Notification[]; unreadCount: number; hasMore: boolean; page: number } }
  | { type: 'APPEND_NOTIFICATIONS'; payload: { notifications: Notification[]; hasMore: boolean; page: number } }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'SET_PREFERENCES'; payload: NotificationPreferences }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// ============ Reducer ============

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  preferences: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  currentPage: 1,
  error: null,
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    
    case 'SET_LOADING_MORE':
      return { ...state, isLoadingMore: action.payload };
    
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.page,
        isLoading: false,
        error: null,
      };
    
    case 'APPEND_NOTIFICATIONS':
      return {
        ...state,
        notifications: [...state.notifications, ...action.payload.notifications],
        hasMore: action.payload.hasMore,
        currentPage: action.payload.page,
        isLoadingMore: false,
      };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      };
    
    case 'DELETE_NOTIFICATION':
      const deletedNotification = state.notifications.find((n) => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
        unreadCount: deletedNotification && !deletedNotification.read_at
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isLoadingMore: false };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// ============ Context ============

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// ============ Provider ============

const POLL_INTERVAL = 60000; // Poll every 60 seconds

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousUnreadCountRef = useRef<number>(0);

  // Fetch notifications (paginated)
  const fetchNotifications = useCallback(async (page: number = 1) => {
    if (!isAuthenticated) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await notificationService.getNotifications({ page, per_page: 20 });
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: response.notifications,
          unreadCount: response.unread_count,
          hasMore: response.pagination.current_page < response.pagination.last_page,
          page: response.pagination.current_page,
        },
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
    }
  }, [isAuthenticated]);

  // Fetch unread notifications (for dropdown)
  const fetchUnreadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationService.getUnreadNotifications(10);
      dispatch({ type: 'SET_UNREAD_COUNT', payload: response.unread_count });
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  }, [isAuthenticated]);

  // Refresh just the unread count (for badge)
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const count = await notificationService.getUnreadCount();
      
      // Show toast if new notifications arrived
      if (count > previousUnreadCountRef.current && previousUnreadCountRef.current > 0) {
        const newCount = count - previousUnreadCountRef.current;
        toast({
          title: 'New Notification',
          description: `You have ${newCount} new notification${newCount > 1 ? 's' : ''}.`,
        });
      }
      
      previousUnreadCountRef.current = count;
      dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  }, [isAuthenticated, toast]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!isAuthenticated || state.isLoadingMore || !state.hasMore) return;

    dispatch({ type: 'SET_LOADING_MORE', payload: true });

    try {
      const nextPage = state.currentPage + 1;
      const response = await notificationService.getNotifications({ page: nextPage, per_page: 20 });
      dispatch({
        type: 'APPEND_NOTIFICATIONS',
        payload: {
          notifications: response.notifications,
          hasMore: response.pagination.current_page < response.pagination.last_page,
          page: response.pagination.current_page,
        },
      });
    } catch (error) {
      console.error('Failed to load more notifications:', error);
      dispatch({ type: 'SET_LOADING_MORE', payload: false });
    }
  }, [isAuthenticated, state.isLoadingMore, state.hasMore, state.currentPage]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const preferences = await notificationService.getPreferences();
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  }, [isAuthenticated]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    try {
      const preferences = await notificationService.updatePreferences(updates);
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Initialize and poll for new notifications
  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch
      refreshUnreadCount();

      // Start polling
      pollIntervalRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    } else {
      // Reset state when logged out
      dispatch({ type: 'RESET' });
      previousUnreadCountRef.current = 0;
    }
  }, [isAuthenticated, refreshUnreadCount]);

  const value: NotificationContextType = {
    ...state,
    fetchNotifications,
    fetchUnreadNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    fetchPreferences,
    updatePreferences,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
