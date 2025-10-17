import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { ConversationList } from './ConversationList';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/services/chatService';

export const ChatLauncher: React.FC = () => {
  const [isConversationListOpen, setIsConversationListOpen] = useState(false);
  
  // Safely get chat context
  let conversations: Conversation[] = [];
  let totalUnreadCount = 0;
  let chatError: string | null = null;

  try {
    const chatContext = useChat();
    conversations = chatContext.conversations || [];
    totalUnreadCount = conversations.reduce((total, conv) => total + (chatContext.getUnreadCount?.(conv.id) || 0), 0);
  } catch (error) {
    console.warn('Chat context not available in ChatLauncher:', error);
    chatError = 'Chat service unavailable';
  }

  const handleToggleConversationList = () => {
    if (chatError) return;
    setIsConversationListOpen(!isConversationListOpen);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    // This will be enhanced with the multi-chat context
    console.log('Selected conversation:', conversation);
  };

  return (
    <>
      {/* Floating Chat Launcher Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleToggleConversationList}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
            "hover:scale-105 active:scale-95",
            chatError && "opacity-50 cursor-not-allowed"
          )}
          disabled={!!chatError}
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center text-xs p-0 min-w-6"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Conversation List */}
      <ConversationList
        isOpen={isConversationListOpen}
        onClose={() => setIsConversationListOpen(false)}
        onSelectConversation={handleSelectConversation}
      />
    </>
  );
};