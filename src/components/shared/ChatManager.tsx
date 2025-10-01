import React from 'react';
import { useMultiChat } from '@/context/MultiChatContext';
import { useResponsiveChat } from '@/hooks/useResponsiveChat';
import { ResponsiveChatDialog } from './ResponsiveChatDialog';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';

export const ChatManager: React.FC = () => {
  const { openChats, closeChat, minimizeChat, maximizeChat } = useMultiChat();
  const chatMode = useResponsiveChat();
  const { user } = useAuth();
  
  // Safely get chat context
  let chatContext: any = {};
  let chatError: string | null = null;

  try {
    chatContext = useChat();
  } catch (error) {
    console.warn('Chat context not available in ChatManager:', error);
    chatError = 'Chat service is currently unavailable';
  }

  const {
    messages = [],
    sendMessage: contextSendMessage = async () => {},
    startTyping = async () => {},
    stopTyping = async () => {},
    getTypingUsers = () => [],
    getOnlineUsers = () => [],
    isLoading = false,
    activeConversation = null,
    setActiveConversation = () => {},
    ensureConversationForBooking = async () => null,
  } = chatContext;

  // In mobile mode, only show one chat at a time
  const chatsToRender = chatMode === 'mobile' 
    ? Array.from(openChats.values()).slice(-1) // Only show the most recent
    : Array.from(openChats.values());

  const handleSendMessage = async (bookingId: string, content: string) => {
    const chat = openChats.get(bookingId);
    if (!chat || !chat.conversation) return;

    try {
      await contextSendMessage({
        conversation_id: chat.conversation.id,
        content: content,
        message_type: 'text',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleChatAction = async (bookingId: string, action: 'open' | 'close' | 'minimize' | 'maximize') => {
    const chat = openChats.get(bookingId);
    if (!chat) return;

    switch (action) {
      case 'open':
        // Ensure this conversation is active
        if (activeConversation?.id !== chat.conversation.id) {
          setActiveConversation(chat.conversation);
        }
        break;
      case 'close':
        closeChat(bookingId);
        // If this was the active conversation, clear it
        if (activeConversation?.id === chat.conversation.id) {
          setActiveConversation(null);
        }
        break;
      case 'minimize':
        minimizeChat(bookingId);
        break;
      case 'maximize':
        maximizeChat(bookingId);
        // Set as active when maximizing
        if (activeConversation?.id !== chat.conversation.id) {
          setActiveConversation(chat.conversation);
        }
        break;
    }
  };

  if (chatError || chatsToRender.length === 0) {
    return null;
  }

  return (
    <>
      {chatsToRender.map(({ conversation, booking, isMinimized, position }) => {
        const bookingId = String(booking.id);
        const isActive = activeConversation?.id === conversation.id;
        const chatMessages = isActive ? messages : [];
        const typingUsers = isActive ? getTypingUsers(conversation.id) : [];
        const onlineUsers = isActive ? getOnlineUsers(conversation.id) : [];

        return (
          <ResponsiveChatDialog
            key={bookingId}
            booking={booking}
            conversation={conversation}
            isOpen={true}
            isMinimized={isMinimized}
            mode={chatMode}
            position={position}
            onClose={() => handleChatAction(bookingId, 'close')}
            onMinimize={() => handleChatAction(bookingId, 'minimize')}
            onMaximize={() => handleChatAction(bookingId, 'maximize')}
            messages={chatMessages}
            sendMessage={(content) => handleSendMessage(bookingId, content)}
            isLoading={isLoading}
            typingUsers={typingUsers}
            onlineUsers={onlineUsers}
            startTyping={() => startTyping(conversation.id)}
            stopTyping={() => stopTyping(conversation.id)}
          />
        );
      })}
    </>
  );
};