import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, MessageCircle, Clock, User, Store, Package, TriangleAlert as AlertTriangle, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChatRooms } from '@/context/ChatRoomsContext';
import type { BookingChatRoom } from '@/types/chat';

interface Notification {
  id: string;
  type: 'message' | 'booking_update';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  room?: BookingChatRoom;
  bookingId?: string;
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
  const { user } = useAuth();
  const { rooms } = useChatRooms();

  // Generate notifications from unread messages in Firebase rooms
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    const userRole = user?.role === 'host' ? 'host' : 'guest';

    rooms.forEach((room) => {
      const unreadCount = userRole === 'guest' ? room.unreadCount.guest : room.unreadCount.host;
      
      if (unreadCount > 0) {
        notifications.push({
          id: `${room.bookingId}-unread`,
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

    // Sort by timestamp (newest first)
    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  };

  const notifications = generateNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

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
    if (notification.room) {
      onSelectConversation(notification.room);
      onClose();
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'booking_update':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Stay updated with your latest messages and booking updates
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <div className="text-muted-foreground">No notifications</div>
                <div className="text-sm text-muted-foreground">
                  You're all caught up!
                </div>
              </div>
            ) : (
              notifications.map((notification) => (
                <Button
                  key={notification.id}
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`${
                        notification.isRead ? 'bg-muted' : 'bg-primary text-primary-foreground'
                      }`}>
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
                      <div className={`text-xs truncate ${
                        notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
                        {notification.message}
                      </div>
                      {notification.bookingId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Booking #{notification.bookingId}
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
