import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { BookingChatRoom } from '@/types/chat';

interface ChatRoomsListProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: BookingChatRoom[];
  currentUserRole: 'guest' | 'host';
  onSelectRoom: (room: BookingChatRoom) => void;
}

export function ChatRoomsList({ 
  isOpen, 
  onClose, 
  rooms, 
  currentUserRole,
  onSelectRoom 
}: ChatRoomsListProps) {
  if (!isOpen) return null;

  const sortedRooms = [...rooms].sort((a, b) => b.lastActivity - a.lastActivity);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUnreadCount = (room: BookingChatRoom) => {
    return currentUserRole === 'guest' ? room.unreadCount.guest : room.unreadCount.host;
  };

  const getOtherParticipant = (room: BookingChatRoom) => {
    return currentUserRole === 'guest' ? room.host : room.guest;
  };

  return (
    <div className="fixed inset-0 z-50 lg:inset-auto lg:top-16 lg:right-4 lg:bottom-auto lg:w-96 lg:max-h-[600px]">
      {/* Backdrop for mobile */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute inset-0 lg:inset-auto lg:relative bg-card border lg:rounded-lg lg:shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Chats</h2>
            {rooms.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {rooms.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close chat list"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Rooms List */}
        <ScrollArea className="flex-1">
          {sortedRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm">
                No chats yet. Start chatting from your bookings!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedRooms.map((room) => {
                const otherParticipant = getOtherParticipant(room);
                const unreadCount = getUnreadCount(room);
                const hasUnread = unreadCount > 0;

                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      onSelectRoom(room);
                      onClose();
                    }}
                    className="w-full p-4 hover:bg-muted/50 transition-colors text-left flex gap-3 items-start"
                  >
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                      <AvatarFallback>
                        {otherParticipant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-semibold text-sm truncate ${hasUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                          {otherParticipant.name}
                        </h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {room.lastActivity && formatTimestamp(room.lastActivity)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {room.listingTitle}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        {room.lastMessage ? (
                          <p className={`text-sm truncate flex-1 ${hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {room.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic flex-1">
                            No messages yet
                          </p>
                        )}

                        {hasUnread && (
                          <Badge variant="default" className="flex-shrink-0 h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
