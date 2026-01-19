/**
 * Push Notification Hook
 * 
 * Handles FCM token registration, permission requests, and foreground message handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestFCMToken, onFCMMessage } from '@/lib/firebase';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { toast } from '@/hooks/use-toast';
import type { DeviceType } from '@/types/notifications';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  unregister: () => Promise<void>;
}

// Detect device type
const getDeviceType = (): DeviceType => {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'web';
};

// Get device name
const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  // Try to extract browser name
  if (ua.includes('Chrome')) return 'Chrome Browser';
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Safari')) return 'Safari Browser';
  if (ua.includes('Edge')) return 'Edge Browser';
  return 'Web Browser';
};

export function usePushNotifications(): UsePushNotificationsReturn {
  const { isAuthenticated } = useAuth();
  const { addNotification, fetchNotifications } = useNotifications();
  
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const currentTokenRef = useRef<string | null>(null);

  // Check if push notifications are supported
  const isSupported = typeof window !== 'undefined' && 
    'Notification' in window && 
    'serviceWorker' in navigator &&
    'PushManager' in window;

  // Update permission state
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  // Handle foreground messages
  const setupForegroundHandler = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = onFCMMessage((payload: unknown) => {
      const data = payload as {
        notification?: { title?: string; body?: string };
        data?: {
          type?: string;
          title?: string;
          message?: string;
          booking_id?: string;
          action_url?: string;
          notification_id?: string;
        };
      };

      // Show toast for foreground notifications
      const title = data.notification?.title || data.data?.title || 'New Notification';
      const body = data.notification?.body || data.data?.message || '';

      toast({
        title,
        description: body,
        duration: 5000,
      });

      // Refresh notifications list
      fetchNotifications(1);

      // Add to local state if we have the data
      if (data.data?.notification_id) {
        addNotification({
          id: data.data.notification_id,
          type: 'App\\Notifications\\BookingNotification',
          notifiable_type: 'App\\Models\\User',
          notifiable_id: 0,
          data: {
            type: (data.data.type as 'booking_new_request' | 'booking_confirmed' | 'booking_rejected' | 'booking_cancelled') || 'booking_new_request',
            title,
            message: body,
            booking_id: data.data.booking_id,
            action_url: data.data.action_url,
          },
          read_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });
  }, [addNotification, fetchNotifications]);

  // Request permission and register token
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    if (!isAuthenticated) {
      setError('You must be logged in to enable push notifications');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get FCM token (this also requests permission)
      const token = await requestFCMToken();
      
      if (!token) {
        setError('Could not get push notification token');
        setIsLoading(false);
        return false;
      }

      // Update permission state
      setPermission(Notification.permission);

      // Register token with backend
      await notificationService.registerDeviceToken({
        token,
        device_type: getDeviceType(),
        device_name: getDeviceName(),
      });

      currentTokenRef.current = token;
      setIsRegistered(true);
      setIsLoading(false);

      // Setup foreground message handler
      setupForegroundHandler();

      console.log('✅ Push notifications enabled');
      
      toast({
        title: 'Push Notifications Enabled',
        description: 'You will now receive push notifications for important updates.',
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable push notifications';
      setError(message);
      setIsLoading(false);
      console.error('❌ Push notification registration failed:', err);
      return false;
    }
  }, [isSupported, isAuthenticated, setupForegroundHandler]);

  // Unregister from push notifications
  const unregister = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove all device tokens from backend
      await notificationService.removeAllDeviceTokens();

      // Cleanup foreground handler
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      currentTokenRef.current = null;
      setIsRegistered(false);
      setIsLoading(false);

      toast({
        title: 'Push Notifications Disabled',
        description: 'You will no longer receive push notifications.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable push notifications';
      setError(message);
      setIsLoading(false);
    }
  }, []);

  // Auto-setup foreground handler if already registered
  useEffect(() => {
    if (isAuthenticated && permission === 'granted' && isSupported) {
      // Check if we have existing tokens
      notificationService.getDeviceTokens()
        .then((response) => {
          if (response.data.length > 0) {
            setIsRegistered(true);
            setupForegroundHandler();
          }
        })
        .catch((err) => {
          console.warn('Could not check device tokens:', err);
        });
    }
  }, [isAuthenticated, permission, isSupported, setupForegroundHandler]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    isSupported,
    permission,
    isRegistered,
    isLoading,
    error,
    requestPermission,
    unregister,
  };
}

export default usePushNotifications;
