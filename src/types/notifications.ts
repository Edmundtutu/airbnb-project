/**
 * Notification types and interfaces for the Cavayo notification system.
 */

// Notification type identifiers
export type NotificationType =
  | 'booking_new_request'
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'message_received'
  | 'review_received';

// Base notification data structure (stored in `data` JSON field)
export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  action_url: string;
  booking_id?: string;
  property_id?: string;
  property_name?: string;
  check_in_date?: string;
  check_out_date?: string;
  total?: number;
  guest_count?: number;
  cancelled_by?: 'guest' | 'host';
  reason?: string;
}

// Full notification object from API
export interface Notification {
  id: string;
  type: string; // Laravel notification class name
  notifiable_type: string;
  notifiable_id: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// API response types
export interface NotificationListResponse {
  notifications: Notification[];
  unread_count: number;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface UnreadNotificationResponse {
  notifications: Notification[];
  unread_count: number;
}

export interface NotificationCountResponse {
  unread_count: number;
}

// Device token for push notifications
export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  device_type: 'web' | 'ios' | 'android';
  device_name: string | null;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceTokenRequest {
  token: string;
  device_type?: 'web' | 'ios' | 'android';
  device_name?: string;
}

// Notification preferences
export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  booking_new_request: boolean;
  booking_confirmed: boolean;
  booking_rejected: boolean;
  booking_cancelled: boolean;
  booking_reminder: boolean;
  messages_enabled: boolean;
  reviews_enabled: boolean;
  promotions_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdatePreferencesRequest {
  email_enabled?: boolean;
  push_enabled?: boolean;
  in_app_enabled?: boolean;
  booking_new_request?: boolean;
  booking_confirmed?: boolean;
  booking_rejected?: boolean;
  booking_cancelled?: boolean;
  booking_reminder?: boolean;
  messages_enabled?: boolean;
  reviews_enabled?: boolean;
  promotions_enabled?: boolean;
}
