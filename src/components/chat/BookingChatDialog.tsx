import { Card } from '@/components/ui/card';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatMessageInput } from './ChatMessageInput';
import { cn } from '@/lib/utils';
import type { BookingChatRoom, BookingChatMessage, BookingChatParticipant } from '@/types/chat';

interface BookingChatDialogProps {
  room: BookingChatRoom;
  messages: BookingChatMessage[];
  currentUserId: string;
  currentUserRole: 'guest' | 'host';
  isOnline?: boolean;
  typingUser?: BookingChatParticipant;
  onSendMessage: (content: string) => void;
  onTyping?: (isTyping: boolean) => void;
  onClose: () => void;
  className?: string;
  isMobile?: boolean;
}

export function BookingChatDialog({
  room,
  messages,
  currentUserId,
  currentUserRole,
  isOnline = false,
  typingUser,
  onSendMessage,
  onTyping,
  onClose,
  className = '',
  isMobile = false,
}: BookingChatDialogProps) {
  return (
    <Card 
      className={cn(
        "flex flex-col overflow-hidden",
        isMobile ? "h-screen w-screen rounded-none" : "h-[600px] w-[400px] shadow-lg",
        className
      )}
    >
      <ChatHeader 
        room={room}
        currentUserRole={currentUserRole}
        isOnline={isOnline}
        onClose={onClose}
      />
      
      <ChatMessageList
        messages={messages}
        currentUserId={currentUserId}
        guest={room.guest}
        host={room.host}
        typingUser={typingUser}
        className="flex-1"
      />
      
      <ChatMessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        placeholder={`Message ${currentUserRole === 'guest' ? room.host.name : room.guest.name}...`}
      />
    </Card>
  );
}
