import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { BookingChatMessage } from '@/types/chat';
import {
  getMessages,
  sendMessage as sendFirebaseMessage,
  subscribeToMessages,
  markMessagesAsRead,
} from '@/services/firebaseChatService';

export const useBookingMessages = (
  bookingId: string | null,
  userRole?: 'guest' | 'host'
) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BookingChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const markAsReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setMessages([]);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const initial = await getMessages(bookingId, 50);
        if (!isMounted) return;
        setMessages(initial);

        unsubscribe = subscribeToMessages(bookingId, (message) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === message.id);
            if (exists) return prev;
            
            // Auto-mark as read if message is from other user and chat is active
            if (
              user &&
              userRole &&
              message.senderId !== user.id &&
              message.id !== lastMessageIdRef.current
            ) {
              lastMessageIdRef.current = message.id;
              
              // Debounce mark-as-read to avoid excessive writes
              if (markAsReadTimeoutRef.current) {
                clearTimeout(markAsReadTimeoutRef.current);
              }
              
              markAsReadTimeoutRef.current = setTimeout(() => {
                markMessagesAsRead(bookingId, user.id, userRole).catch((err) =>
                  console.error('Failed to auto-mark message as read:', err)
                );
              }, 500);
            }
            
            return [...prev, message];
          });
        });
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load booking messages', err);
        setError('Failed to load messages');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
      lastMessageIdRef.current = null;
    };
  }, [bookingId, user, userRole]);

  const sendMessage = useCallback(
    async (content: string, messageType: 'text' | 'image' | 'audio' = 'text', mediaUrl?: string) => {
      if (!user) throw new Error('User not authenticated');
      if (!bookingId) throw new Error('bookingId is required to send a message');

      await sendFirebaseMessage(
        { bookingId, content, messageType, mediaUrl },
        user.id,
        user.role === 'host' ? 'host' : 'guest'
      );
    },
    [user, bookingId]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
};


