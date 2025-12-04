import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { BookingChatRoom } from '@/types/chat';
import { subscribeToUserRooms } from '@/services/firebaseChatService';

interface ChatRoomsContextValue {
  rooms: BookingChatRoom[];
  isLoading: boolean;
  error: string | null;
  totalUnreadCount: number;
  getUnreadForBooking: (bookingId: string) => number;
}

const ChatRoomsContext = createContext<ChatRoomsContextValue | undefined>(undefined);

export const ChatRoomsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<BookingChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRooms([]);
      return;
    }

    const userRole = user.role === 'host' ? 'host' : 'guest';
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToUserRooms(user.id, userRole, (nextRooms) => {
      setRooms(nextRooms);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const value = useMemo<ChatRoomsContextValue>(() => {
    const userRole = user?.role === 'host' ? 'host' : 'guest';

    const totalUnreadCount = rooms.reduce((total, room) => {
      const count = userRole === 'guest' ? room.unreadCount.guest : room.unreadCount.host;
      return total + count;
    }, 0);

    const getUnreadForBooking = (bookingId: string) => {
      const room = rooms.find((r) => r.bookingId === bookingId);
      if (!room) return 0;
      return userRole === 'guest' ? room.unreadCount.guest : room.unreadCount.host;
    };

    return {
      rooms,
      isLoading,
      error,
      totalUnreadCount,
      getUnreadForBooking,
    };
  }, [rooms, isLoading, error, user]);

  return <ChatRoomsContext.Provider value={value}>{children}</ChatRoomsContext.Provider>;
};

export const useChatRooms = (): ChatRoomsContextValue => {
  const ctx = useContext(ChatRoomsContext);
  if (!ctx) {
    throw new Error('useChatRooms must be used within a ChatRoomsProvider');
  }
  return ctx;
};


