import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Clock, User, Store, AlertTriangle, Package } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatStatusIndicator } from './ChatStatusIndicator';
import { useResponsiveChat } from '@/hooks/useResponsiveChat';
import { useMultiChat } from '@/context/MultiChatContext';
import type { Conversation } from '@/services/chatService';

interface ConversationListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation?: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
}) => {
  const { user } = useAuth();
  const chatMode = useResponsiveChat();
  const { openChat } = useMultiChat();
  
  // Safely get chat context with error handling
  let conversations: Conversation[] = [];
  let getUnreadCount = (id: number) => 0;
  let getTypingUsers: (conversationId: number) => { name: string; type: string }[] = () => [];
  let getOnlineUsers: (conversationId: number) => string[] = () => [];
  let isLoading = false;
  let chatError: string | null = null;

  try {
    const chatContext = useChat();
    conversations = chatContext.conversations || [];
    getUnreadCount = chatContext.getUnreadCount || (() => 0);
    getTypingUsers = chatContext.getTypingUsers || (() => []);
    getOnlineUsers = chatContext.getOnlineUsers || (() => []);
    isLoading = chatContext.isLoading || false;
  } catch (error) {
    console.warn('Chat context not available in ConversationList:', error);
    chatError = 'Chat service is currently unavailable';
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (user?.role === 'vendor') {
      return conversation.user?.name || 'Customer';
    } else {
      return conversation.shop?.name || 'Shop';
    }
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    // API returns latest_message in snake_case
    const latest = (conversation as any).latest_message;
    // If someone is typing in this conversation, show that hint
    const typing = getTypingUsers(conversation.id);
    if (typing.length > 0) {
      const names = typing.map(t => t.name).join(', ');
      return `${names} ${typing.length === 1 ? 'is' : 'are'} typing...`;
    }
    if (latest) {
      const prefix = latest.sender_type === 'user' ? 'You: ' : '';
      return `${prefix}${latest.content}`;
    }
    return 'No messages yet';
  };

  const handleConversationClick = async (conversation: Conversation) => {
    try {
      // Create a mock order object from conversation data
      const order = {
        id: parseInt(conversation.order_id),
        user_id: conversation.user_id,
        shop_id: conversation.shop_id,
        total: 0,
        delivery_address: '',
        delivery_lat: 0,
        delivery_lng: 0,
        phone_number: '',
        notes: '',
        status: 'pending' as const,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        shop: conversation.shop,
        user: conversation.user,
        items: [],
      };
      
      // Use the multi-chat context to open the chat
      openChat(conversation, order);
      
      // Call the optional callback
      if (onSelectConversation) {
        onSelectConversation(conversation);
      }
    } catch (error) {
      console.error('Failed to open conversation:', error);
    }
    
    onClose();
  };

  // Use Sheet for mobile, Dialog for desktop/tablet
  if (chatMode === 'mobile') {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversations
            </SheetTitle>
            <SheetDescription>
              Select a conversation to start chatting
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-2">
              {chatError ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{chatError}</AlertDescription>
                  </Alert>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading conversations...</div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <div className="text-muted-foreground">No conversations yet</div>
                  <div className="text-sm text-muted-foreground">
                    Start a conversation by placing an order
                  </div>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const unreadCount = getUnreadCount(conversation.id);
                  const title = getConversationTitle(conversation);
                  const subtitle = getConversationSubtitle(conversation);
                  const time = conversation.last_message_at ? formatTime(conversation.last_message_at) : '';
                const online = getOnlineUsers(conversation.id);

                  return (
                    <Button
                      key={conversation.id}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user?.role === 'vendor' ? (
                              <User className="h-5 w-5" />
                            ) : (
                              <Store className="h-5 w-5" />
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-sm truncate">{title}</div>
                            {time && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Clock className="h-3 w-3" />
                                {time}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate mb-1">
                            <Package className="h-3 w-3" />
                            <span>Order #{conversation.order_id}</span>
                            <ChatStatusIndicator 
                              status="offline" 
                              lastSeen={conversation.last_message_at}
                              className="ml-auto"
                            />
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {subtitle}
                          </div>
                        </div>

                        {unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="h-5 w-5 flex items-center justify-center text-xs p-0 flex-shrink-0"
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversations
          </DialogTitle>
          <DialogDescription>
            Select a conversation to start chatting
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {chatError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{chatError}</AlertDescription>
                </Alert>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading conversations...</div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <div className="text-muted-foreground">No conversations yet</div>
                <div className="text-sm text-muted-foreground">
                  Start a conversation by placing an order
                </div>
              </div>
            ) : (
              conversations.map((conversation) => {
                const unreadCount = getUnreadCount(conversation.id);
                const title = getConversationTitle(conversation);
                const subtitle = getConversationSubtitle(conversation);
                const time = conversation.last_message_at ? formatTime(conversation.last_message_at) : '';
                const online = getOnlineUsers(conversation.id);

                return (
                  <Button
                    key={conversation.id}
                    variant="ghost"
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user?.role === 'vendor' ? (
                            <User className="h-5 w-5" />
                          ) : (
                            <Store className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm truncate">{title}</div>
                          {time && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              {time}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground truncate mb-1">
                          <Package className="h-3 w-3" />
                          <span>Order #{conversation.order_id}</span>
                          <ChatStatusIndicator
                            status={online.length > 0 ? 'online' : 'offline'}
                            lastSeen={conversation.last_message_at}
                            className="ml-auto"
                          />
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {subtitle}
                        </div>
                      </div>

                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="h-5 w-5 flex items-center justify-center text-xs p-0 flex-shrink-0"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                  </Button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
