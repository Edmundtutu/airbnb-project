import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { BookingChatRoom } from '@/types/chat';

interface ChatHeaderProps {
  room: BookingChatRoom;
  currentUserRole: 'guest' | 'host';
  isOnline?: boolean;
  onClose: () => void;
}

export function ChatHeader({ room, currentUserRole, isOnline = false, onClose }: ChatHeaderProps) {
  // Show the other participant (if I'm guest, show host; if I'm host, show guest)
  const otherParticipant = currentUserRole === 'guest' ? room.host : room.guest;
  
  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
          <AvatarFallback>{otherParticipant.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{otherParticipant.name}</h3>
            {isOnline && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Online
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{room.listingTitle}</p>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="flex-shrink-0 ml-2"
        aria-label="Close chat"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
