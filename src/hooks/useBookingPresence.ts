import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { PresenceStatus } from '@/types/chat';
import { subscribeToPresence, updatePresence } from '@/services/firebaseChatService';

export const useBookingPresence = (bookingId: string | null, otherUserId: string | null) => {
  const { user } = useAuth();
  const [presence, setPresence] = useState<{ [userId: string]: PresenceStatus }>({});

  useEffect(() => {
    if (!bookingId) {
      setPresence({});
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      if (user) {
        try {
          await updatePresence(bookingId, user.id, 'online');
        } catch (err) {
          console.error('Failed to set presence online', err);
        }
      }

      unsubscribe = subscribeToPresence(bookingId, (nextPresence) => {
        setPresence(nextPresence);
      });
    };

    init();

    return () => {
      if (user) {
        updatePresence(bookingId, user.id, 'offline').catch((err) =>
          console.error('Failed to set presence offline', err)
        );
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [bookingId, user]);

  const other =
    otherUserId && presence[otherUserId] ? presence[otherUserId] : undefined;

  return {
    isOtherOnline: other?.status === 'online',
    lastSeen: other?.lastSeen,
  };
};


