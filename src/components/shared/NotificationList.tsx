import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, MessageCircle, Clock, User, Store, Package, AlertTriangle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import type { Conversation, Message } from '@/services/chatService';

interface Notification {
  id: string;
  type: 'message' | 'order_update';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  conversation?: Conversation;
  orderId?: string;
}

interface NotificationListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
}) => {
  const { user } = useAuth();
  
  // Safely get chat context with error handling
  let conversations: Conversation[] = [];
  let messages: Message[] = [];
  let chatError: string | null = null;

  try {
    const chatContext = useChat();
    conversations = chatContext.conversations || [];
    messages = chatContext.messages || [];
  } catch (error) {
    console.warn('Chat context not available in NotificationList:', error);
    chatError = 'Notification service is currently unavailable';
  }

  // Generate notifications from unread messages
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];

    conversations.forEach((conversation) => {
      const unreadMessages = messages.filter(
        msg => msg.conversation_id === conversation.id && 
               !msg.read_at && 
               msg.sender_id !== user?.id
      );

      unreadMessages.forEach((message) => {
        const senderName = message.sender_type === 'user' 
          ? conversation.user?.name || 'Customer'
          : conversation.shop?.name || 'Shop';

        notifications.push({
          id: `msg-${message.id}`,
          type: 'message',
          title: `New message from ${senderName}`,
          message: message.content,
          timestamp: message.created_at,
          isRead: false,
          conversation,
        });
      });
    });

    // Sort by timestamp (newest first)
    return notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const notifications = generateNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const formatTime = (timestamp: string) => {
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
    if (notification.conversation) {
      onSelectConversation(notification.conversation);
      onClose();
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'order_update':
        return <Package className="h-4 w-4" />;
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
            Stay updated with your latest messages and order updates
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {chatError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{chatError}</AlertDescription>
                </Alert>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : notifications.length === 0 ? (
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
                      {notification.conversation && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Order #{notification.conversation.order_id}
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
