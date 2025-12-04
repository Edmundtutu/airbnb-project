import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { BookingChatMessage, BookingChatParticipant } from '@/types/chat';

interface ChatMessageListProps {
  messages: BookingChatMessage[];
  currentUserId: string;
  guest: BookingChatParticipant;
  host: BookingChatParticipant;
  typingUser?: BookingChatParticipant;
  className?: string;
}

export function ChatMessageList({ 
  messages, 
  currentUserId, 
  guest, 
  host,
  typingUser,
  className = ''
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, typingUser]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getParticipant = (senderRole: 'guest' | 'host') => {
    return senderRole === 'guest' ? guest : host;
  };

  return (
    <div 
      ref={scrollContainerRef}
      className={cn("flex-1 overflow-y-auto p-4 space-y-4", className)}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message) => {
          const isCurrentUser = message.senderId === currentUserId;
          const sender = getParticipant(message.senderRole);

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                isCurrentUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={sender.avatar} alt={sender.name} />
                <AvatarFallback>{sender.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className={cn("flex flex-col gap-1 max-w-[70%]", isCurrentUser && "items-end")}>
                <div
                  className={cn(
                    "rounded-lg px-4 py-2",
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm break-words">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground px-1">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          );
        })
      )}

      {typingUser && (
        <div className="flex gap-2 items-center">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={typingUser.avatar} alt={typingUser.name} />
            <AvatarFallback>{typingUser.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="bg-muted rounded-lg px-4 py-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
