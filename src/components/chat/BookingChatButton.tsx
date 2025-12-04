import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/types/bookings';

interface BookingChatButtonProps {
  booking: Booking;
  unreadCount?: number;
  onClick: () => void;
  className?: string;
}

export function BookingChatButton({ 
  booking, 
  unreadCount = 0, 
  onClick,
  className = ''
}: BookingChatButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`relative ${className}`}
      aria-label={`Chat about booking ${booking.id}`}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      <span>Chat</span>
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}
