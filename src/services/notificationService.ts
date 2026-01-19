import api from './api';
import type {
  Notification,
  NotificationListResponse,
  UnreadNotificationResponse,
  NotificationCountResponse,
  DeviceToken,
  DeviceTokenRequest,
  NotificationPreferences,
  UpdatePreferencesRequest,
} from '@/types/notifications';

const apiVersion = import.meta.env.VITE_API_VERSION;

export const notificationService = {
  /**
   * Get paginated notifications for the authenticated user.
   */
  async getNotifications(params?: {
    page?: number;
    per_page?: number;
  }): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>(
      `${apiVersion}/notifications`,
      { params }
    );
    return response.data;
  },

  /**
   * Get unread notifications (for dropdown display).
   */
  async getUnreadNotifications(limit?: number): Promise<UnreadNotificationResponse> {
    const response = await api.get<UnreadNotificationResponse>(
      `${apiVersion}/notifications/unread`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Get unread notification count (for badge).
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<NotificationCountResponse>(
      `${apiVersion}/notifications/count`
    );
    return response.data.unread_count;
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.post<{ message: string; notification: Notification }>(
      `${apiVersion}/notifications/${notificationId}/read`
    );
    return response.data.notification;
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    await api.post(`${apiVersion}/notifications/read-all`);
  },

  /**
   * Delete a notification.
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`${apiVersion}/notifications/${notificationId}`);
  },

  /**
   * Cleanup old read notifications.
   */
  async cleanupOldNotifications(days?: number): Promise<{ deleted_count: number }> {
    const response = await api.delete<{ message: string; deleted_count: number }>(
      `${apiVersion}/notifications/cleanup`,
      { params: { days } }
    );
    return response.data;
  },

  // ============ Device Tokens (Push Notifications) ============

  /**
   * Register a device token for push notifications.
   */
  async registerDeviceToken(data: DeviceTokenRequest): Promise<DeviceToken> {
    const response = await api.post<{ message: string; device_token: DeviceToken }>(
      `${apiVersion}/device-tokens`,
      data
    );
    return response.data.device_token;
  },

  /**
   * Get all device tokens for the current user.
   */
  async getDeviceTokens(): Promise<DeviceToken[]> {
    const response = await api.get<{ device_tokens: DeviceToken[] }>(
      `${apiVersion}/device-tokens`
    );
    return response.data.device_tokens;
  },

  /**
   * Remove a device token.
   */
  async removeDeviceToken(token: string): Promise<void> {
    await api.delete(`${apiVersion}/device-tokens/${encodeURIComponent(token)}`);
  },

  /**
   * Remove all device tokens (logout from all push notifications).
   */
  async removeAllDeviceTokens(): Promise<void> {
    await api.delete(`${apiVersion}/device-tokens`);
  },

  // ============ Notification Preferences ============

  /**
   * Get notification preferences for the current user.
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<{ preferences: NotificationPreferences }>(
      `${apiVersion}/notification-preferences`
    );
    return response.data.preferences;
  },

  /**
   * Update notification preferences.
   */
  async updatePreferences(data: UpdatePreferencesRequest): Promise<NotificationPreferences> {
    const response = await api.put<{ message: string; preferences: NotificationPreferences }>(
      `${apiVersion}/notification-preferences`,
      data
    );
    return response.data.preferences;
  },

  /**
   * Reset notification preferences to defaults.
   */
  async resetPreferences(): Promise<NotificationPreferences> {
    const response = await api.post<{ message: string; preferences: NotificationPreferences }>(
      `${apiVersion}/notification-preferences/reset`
    );
    return response.data.preferences;
  },
};

export default notificationService;
