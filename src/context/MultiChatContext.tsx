import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Conversation } from '@/services/chatService';
import type { Order } from '@/types/orders';

interface OpenChat {
  conversation: Conversation;
  order: Order;
  isMinimized: boolean;
  position: { x: number; y: number };
}

interface MultiChatContextType {
  openChats: Map<string, OpenChat>;
  openChat: (conversation: Conversation, order: Order) => void;
  closeChat: (orderId: string) => void;
  minimizeChat: (orderId: string) => void;
  maximizeChat: (orderId: string) => void;
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

  const openChat = useCallback((conversation: Conversation, order: Order) => {
    const orderId = String(order.id);
    
    setOpenChats(prev => {
      const newChats = new Map(prev);
      
      if (newChats.has(orderId)) {
        // If chat is already open, just maximize it
        const existingChat = newChats.get(orderId)!;
        newChats.set(orderId, { ...existingChat, isMinimized: false });
      } else {
        // Calculate position for new chat (stagger them)
        const chatCount = newChats.size;
        const baseX = 20;
        const baseY = 20;
        const offset = chatCount * 50; // Stagger by 50px each
        
        newChats.set(orderId, {
          conversation,
          order,
          isMinimized: false,
          position: { x: baseX + offset, y: baseY + offset }
        });
      }
      
      return newChats;
    });
    
    // Close conversation list when opening a chat
    setIsConversationListOpen(false);
  }, []);

  const closeChat = useCallback((orderId: string) => {
    setOpenChats(prev => {
      const newChats = new Map(prev);
      newChats.delete(orderId);
      return newChats;
    });
  }, []);

  const minimizeChat = useCallback((orderId: string) => {
    setOpenChats(prev => {
      const newChats = new Map(prev);
      const chat = newChats.get(orderId);
      if (chat) {
        newChats.set(orderId, { ...chat, isMinimized: true });
      }
      return newChats;
    });
  }, []);

  const maximizeChat = useCallback((orderId: string) => {
    setOpenChats(prev => {
      const newChats = new Map(prev);
      const chat = newChats.get(orderId);
      if (chat) {
        newChats.set(orderId, { ...chat, isMinimized: false });
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