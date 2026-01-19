import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChatRooms } from '@/context/ChatRoomsContext';
import { useBookingMessages } from '@/hooks/useBookingMessages';
import { useBookingTyping } from '@/hooks/useBookingTyping';
import { useBookingPresence } from '@/hooks/useBookingPresence';
import { useResponsiveChat } from '@/hooks/useResponsiveChat';
import { BookingChatDialog } from '@/components/chat/BookingChatDialog';
import { markMessagesAsRead } from '@/services/firebaseChatService';

const ChatRoomPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const { rooms } = useChatRooms();
  const navigate = useNavigate();
  const chatMode = useResponsiveChat();

  const room = rooms.find((r) => r.bookingId === bookingId);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Calculate user role BEFORE using it in hooks
  const currentUserId = user?.id;
  const currentUserRole: 'guest' | 'host' | null =
    user && room
      ? user.id === room.guest.userId
        ? 'guest'
        : 'host'
      : null;

  // If room doesn't exist, wait a bit for provider to catch up, then show error
  useEffect(() => {
    if (!bookingId || !user || room) {
      setIsCreatingRoom(false);
      return;
    }

    // Wait a moment for ChatRoomsProvider to pick up newly created room
    setIsCreatingRoom(true);
    const timeout = setTimeout(() => {
      setIsCreatingRoom(false);
    }, 2000); // Give provider 2 seconds to catch up

    return () => clearTimeout(timeout);
  }, [bookingId, user, room]);

  const { messages, isLoading, sendMessage } = useBookingMessages(
    bookingId || null,
    currentUserRole || undefined
  );
  const { isOtherTyping, startTyping, stopTyping } = useBookingTyping(
    bookingId || null
  );

  const otherParticipant =
    room && currentUserRole === 'guest' ? room.host : room?.guest;

  const { isOtherOnline } = useBookingPresence(
    bookingId || null,
    otherParticipant?.userId ?? null
  );

  // Mark messages as read when chat opens and when room becomes available
  useEffect(() => {
    if (!bookingId || !currentUserId || !currentUserRole || !room) return;

    // Mark as read immediately when chat opens
    markMessagesAsRead(bookingId, currentUserId, currentUserRole).catch((err) =>
      console.error('Failed to mark messages as read', err)
    );
  }, [bookingId, currentUserId, currentUserRole, room]);

  if (!user) {
    return null;
  }

  if (!room) {
    return (
      <div className="h-[100dvh] flex flex-col">
        <header className="flex items-center gap-2 px-4 py-3 border-b bg-background">
          <button
            type="button"
            onClick={() => navigate('/chats')}
            className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs mr-2"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </button>
          <h1 className="font-semibold text-sm">Chat</h1>
        </header>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {isCreatingRoom ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p>Creating conversation...</p>
            </div>
          ) : (
            'Conversation not found.'
          )}
        </div>
      </div>
    );
  }

  const typingUser =
    isOtherTyping && otherParticipant ? otherParticipant : undefined;

  const isMobile = chatMode === 'mobile';

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center px-2">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl">
        <BookingChatDialog
          room={room}
          messages={messages}
          currentUserId={user.id}
          currentUserRole={currentUserRole || 'guest'}
          isOnline={isOtherOnline}
          typingUser={typingUser}
          onSendMessage={(content) => sendMessage(content)}
          onTyping={(isTyping) =>
            isTyping ? startTyping() : stopTyping()
          }
          onClose={() => navigate('/chats')}
          isMobile={isMobile}
        />
      </div>
      {isLoading && (
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Loading messages...
        </p>
      )}
    </div>
  );
};

export default ChatRoomPage;


