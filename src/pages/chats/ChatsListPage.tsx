import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChatRooms } from '@/context/ChatRoomsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const ChatsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rooms, totalUnreadCount } = useChatRooms();

  if (!user) {
    return null;
  }

  const currentUserRole = user.role === 'host' ? 'host' : 'guest';

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

  const sortedRooms = [...rooms].sort((a, b) => b.lastActivity - a.lastActivity);

  return (
    <div className="max-w-3xl mx-auto h-[100dvh] flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h1 className="font-semibold text-lg">Messages</h1>
          {totalUnreadCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {sortedRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm px-4">
            <MessageCircle className="h-10 w-10 mb-3" />
            <p className="font-medium mb-1">No conversations yet</p>
            <p className="text-xs">
              Start a chat from one of your bookings to see it appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {sortedRooms.map((room) => {
              const other =
                currentUserRole === 'guest' ? room.host : room.guest;
              const unread =
                currentUserRole === 'guest'
                  ? room.unreadCount.guest
                  : room.unreadCount.host;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => navigate(`/chats/${room.bookingId}`)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 text-left"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={other.avatar} alt={other.name} />
                    <AvatarFallback>
                      {other.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-semibold text-sm truncate">
                        {room.listingTitle}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {room.lastActivity
                          ? formatTimestamp(room.lastActivity)
                          : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      with {other.name}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p
                        className={`text-sm truncate ${
                          unread > 0
                            ? 'font-medium text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {room.lastMessage?.content || 'No messages yet'}
                      </p>
                      {unread > 0 && (
                        <Badge className="flex-shrink-0 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-xs">
                          {unread > 99 ? '99+' : unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatsListPage;


