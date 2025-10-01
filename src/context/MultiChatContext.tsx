import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Conversation } from '@/services/chatService';
import type { Booking } from '@/types/bookings';

interface OpenChat {
  conversation: Conversation;
  booking: Booking;
  isMinimized: boolean;
  position: { x: number; y: number };
}

interface MultiChatContextType {
  openChats: Map<string, OpenChat>;
  openChat: (conversation: Conversation, booking: Booking) => void;
  closeChat: (bookingId: string) => void;
  minimizeChat: (bookingId: string) => void;
  maximizeChat: (bookingId: string) => void;
  isConversationListOpen: boolean;
  setIsConversationListOpen: (open: boolean) => void;
}

const MultiChatContext = createContext<MultiChatContextType | undefined>(undefined);

export const useMultiChat = () => {
  const context = useContext(MultiChatContext);
  if (!context) {
    throw new Error('useMultiChat must be used within a MultiChatProvider');
  }
  return context;
};

export const MultiChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openChats, setOpenChats] = useState<Map<string, OpenChat>>(new Map());
  const [isConversationListOpen, setIsConversationListOpen] = useState(false);

  const openChat = useCallback((conversation: Conversation, booking: Booking) => {
    const bookingId = String(booking.id);
    
    setOpenChats(prev => {
      const newChats = new Map(prev);
      
      if (newChats.has(bookingId)) {
        // If chat is already open, just maximize it
        const existingChat = newChats.get(bookingId)!;
        newChats.set(bookingId, { ...existingChat, isMinimized: false });
      } else {
        // Calculate position for new chat (stagger them)
        const chatCount = newChats.size;
        const baseX = 20;
        const baseY = 20;
        const offset = chatCount * 50; // Stagger by 50px each
        
        newChats.set(bookingId, {
          conversation,
          booking,
          isMinimized: false,
          position: { x: baseX + offset, y: baseY + offset }
        });
      }
      
      return newChats;
    });
    
    // Close conversation list when opening a chat
    setIsConversationListOpen(false);
  }, []);

  const closeChat = useCallback((bookingId: string) => {
    setOpenChats(prev => {
      const newChats = new Map(prev);
      newChats.delete(bookingId);
      return newChats;
    });
  }, []);

  const minimizeChat = useCallback((bookingId: string) => {
    setOpenChats(prev => {
      const newChats = new Map(prev);
      const chat = newChats.get(bookingId);
      if (chat) {
        newChats.set(bookingId, { ...chat, isMinimized: true });
      }
      return newChats;
    });
  }, []);

  const maximizeChat = useCallback((bookingId: string) => {
    setOpenChats(prev => {
      const newChats = new Map(prev);
      const chat = newChats.get(bookingId);
      if (chat) {
        newChats.set(bookingId, { ...chat, isMinimized: false });
      }
      return newChats;
    });
  }, []);

  return (
    <MultiChatContext.Provider value={{
      openChats,
      openChat,
      closeChat,
      minimizeChat,
      maximizeChat,
      isConversationListOpen,
      setIsConversationListOpen,
    }}>
      {children}
    </MultiChatContext.Provider>
  );
};