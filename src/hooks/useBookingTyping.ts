import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { TypingIndicator } from '@/types/chat';
import { setTypingIndicator, subscribeToTyping } from '@/services/firebaseChatService';

export const useBookingTyping = (bookingId: string | null) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  useEffect(() => {
    if (!bookingId) {
      setTypingUsers([]);
      return;
    }

    const unsubscribe = subscribeToTyping(bookingId, (nextTyping) => {
      setTypingUsers(nextTyping);
    });

    return () => {
      unsubscribe();
    };
  }, [bookingId]);

  const startTyping = useCallback(async () => {
    if (!user || !bookingId) return;

    try {
      await setTypingIndicator(
        bookingId,
        user.id,
        user.role === 'host' ? 'host' : 'guest',
        user.name || 'User',
        true
      );
    } catch (err) {
      console.error('Failed to set typing true', err);
    }
  }, [user, bookingId]);

  const stopTyping = useCallback(async () => {
    if (!user || !bookingId) return;

    try {
      await setTypingIndicator(
        bookingId,
        user.id,
        user.role === 'host' ? 'host' : 'guest',
        user.name || 'User',
        false
      );
    } catch (err) {
      console.error('Failed to set typing false', err);
    }
  }, [user, bookingId]);

  const currentUserId = user?.id;
  const otherTyping = typingUsers.find((t) => t.userId !== currentUserId);

  return {
    isOtherTyping: !!otherTyping,
    typingUserName: otherTyping?.userName,
    startTyping,
    stopTyping,
  };
};


