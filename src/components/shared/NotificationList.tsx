import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, MessageCircle, Clock, User, Store, Package, TriangleAlert as AlertTriangle, Calendar, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChatRooms } from '@/context/ChatRoomsContext';
import { useNotifications } from '@/context/NotificationContext';
import type { BookingChatRoom } from '@/types/chat';
import type { Notification as ApiNotification, NotificationType } from '@/types/notifications';

interface Notification {
  id: string;
  type: 'message' | 'booking_update' | NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  room?: BookingChatRoom;
  bookingId?: string;
  actionUrl?: string;
  apiNotification?: ApiNotification;
}

interface NotificationListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (room: BookingChatRoom) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rooms } = useChatRooms();
  const { 
    notifications: apiNotifications, 
    unreadCount: apiUnreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Fetch API notifications when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
    }
  }, [isOpen, fetchNotifications]);

  // Generate notifications from unread messages in Firebase rooms
  const generateChatNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    const userRole = user?.role === 'host' ? 'host' : 'guest';

    rooms.forEach((room) => {
      const unreadCount = userRole === 'guest' ? room.unreadCount.guest : room.unreadCount.host;
      
      if (unreadCount > 0) {
        notifications.push({
          id: `chat-${room.bookingId}-unread`,
          type: 'message',
          title: 'New Message',
          message: room.lastMessage?.content || 'You have new messages',
          timestamp: room.lastActivity || Date.now(),
          isRead: false,
          room,
          bookingId: room.bookingId,
        });
      }
    });

    return notifications;
  };

  // Convert API notifications to our unified format
  const convertApiNotifications = (): Notification[] => {
    return apiNotifications.map((n) => ({
      id: `api-${n.id}`,
      type: n.data.type,
      title: n.data.title,
      message: n.data.message,
      timestamp: new Date(n.created_at).getTime(),
      isRead: !!n.read_at,
      bookingId: n.data.booking_id,
      actionUrl: n.data.action_url,
      apiNotification: n,
    }));
  };

  // Combine and sort all notifications
  const allNotifications = [...generateChatNotifications(), ...convertApiNotifications()]
    .sort((a, b) => b.timestamp - a.timestamp);

  const chatUnreadCount = generateChatNotifications().length;
  const totalUnreadCount = chatUnreadCount + apiUnreadCount;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if it's an API notification
    if (notification.apiNotification && !notification.isRead) {
      markAsRead(notification.apiNotification.id);
    }

    // Handle navigation
    if (notification.room) {
      onSelectConversation(notification.room);
      onClose();
    } else if (notification.actionUrl) {
      const url = new URL(notification.actionUrl);
      navigate(url.pathname);
      onClose();
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'booking_new_request':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'booking_confirmed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'booking_rejected':
      case 'booking_cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      case 'booking_update':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBg = (notification: Notification) => {
    if (notification.isRead) return 'bg-muted';
    
    switch (notification.type) {
      case 'booking_confirmed':
        return 'bg-green-100 text-green-700';
      case 'booking_rejected':
      case 'booking_cancelled':
        return 'bg-red-100 text-red-700';
      case 'booking_new_request':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    fetchNotifications(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {totalUnreadCount}
                </Badge>
              )}
            </DialogTitle>
            {apiUnreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <DialogDescription>
            Stay updated with your latest messages and booking updates
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading && allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="text-sm text-muted-foreground mt-2">Loading notifications...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {allNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <div className="text-muted-foreground">No notifications</div>
                  <div className="text-sm text-muted-foreground">
                    You're all caught up!
                  </div>
                </div>
              ) : (
                allNotifications.map((notification) => (
                  <Button
                    key={notification.id}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={getNotificationBg(notification)}>
                          {getNotificationIcon(notification)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className={`text-sm font-medium truncate ${
                            notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification.title}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatTime(notification.timestamp)}
                          </div>
                        </div>
                        <div className={`text-xs truncate text-left ${
                          notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                        }`}>
                          {notification.message}
                        </div>
                        {notification.bookingId && (
                          <div className="text-xs text-muted-foreground mt-1 text-left">
                            Booking #{notification.bookingId.slice(0, 8)}...
                          </div>
                        )}
                      </div>

                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {allNotifications.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                navigate('/notifications');
                onClose();
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
