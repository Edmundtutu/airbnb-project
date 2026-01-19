import React from 'react';
import { Bell, Check, Home, X, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Notification, NotificationType } from '@/types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  compact?: boolean;
}

/**
 * Get icon for notification type
 */
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'booking_new_request':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'booking_confirmed':
      return <Check className="h-5 w-5 text-green-500" />;
    case 'booking_rejected':
      return <X className="h-5 w-5 text-red-500" />;
    case 'booking_cancelled':
      return <X className="h-5 w-5 text-orange-500" />;
    case 'booking_reminder':
      return <Bell className="h-5 w-5 text-yellow-500" />;
    case 'message_received':
      return <MessageSquare className="h-5 w-5 text-purple-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
}

/**
 * Get background color for notification type
 */
function getNotificationBgColor(type: NotificationType, isRead: boolean) {
  if (isRead) return 'bg-white';
  
  switch (type) {
    case 'booking_new_request':
      return 'bg-blue-50';
    case 'booking_confirmed':
      return 'bg-green-50';
    case 'booking_rejected':
    case 'booking_cancelled':
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
}

/**
 * Single notification item component
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  compact = false,
}) => {
  const isRead = !!notification.read_at;
  const data = notification.data;
  const bgColor = getNotificationBgColor(data.type, isRead);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const handleClick = () => {
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-100',
          bgColor,
          !isRead && 'border-l-4 border-primary'
        )}
      >
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(data.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm', !isRead && 'font-semibold')}>
            {data.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
        {!isRead && (
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-100 rounded-lg',
        bgColor,
        !isRead && 'border-l-4 border-primary'
      )}
    >
      <div className="flex-shrink-0 p-2 bg-white rounded-full shadow-sm">
        {getNotificationIcon(data.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn('text-sm', !isRead && 'font-semibold')}>
            {data.title}
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          {data.message}
        </p>
        
        {data.property_name && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Home className="h-3 w-3" />
            <span>{data.property_name}</span>
          </div>
        )}
        
        {data.check_in_date && data.check_out_date && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{data.check_in_date} - {data.check_out_date}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-3">
          {!isRead && (
            <button
              onClick={handleMarkAsRead}
              className="text-xs text-primary hover:underline"
            >
              Mark as read
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
