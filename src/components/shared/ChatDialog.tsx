
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Image, Mic, Paperclip, Circle, AlertTriangle, Package, Store, User } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { ChatStatusIndicator } from './ChatStatusIndicator';
import { QuickChatActions } from './QuickChatActions';
import type { Order } from '@/types/orders';

interface ChatDialogProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({ order, isOpen, onClose }) => {
  const { user } = useAuth();
  
  // Safely get chat context with error handling
  let chatContext: any = {};
  let chatError: string | null = null;

  try {
    chatContext = useChat();
  } catch (error) {
    console.warn('Chat context not available in ChatDialog:', error);
    chatError = 'Chat service is currently unavailable';
  }

  const { 
    activeConversation = null, 
    messages = [], 
    sendMessage = async () => {}, 
    setActiveConversation = () => {},
    ensureConversationForOrder = async () => null,
    isLoading = false,
    startTyping = async () => {},
    stopTyping = async () => {},
    updatePresence = async () => {},
    getTypingUsers = () => [],
    getOnlineUsers = () => []
  } = chatContext;
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation when dialog opens
  useEffect(() => {
    const init = async () => {
      console.log('🔄 ChatDialog initialization started');
      console.log('📊 Dialog state:', { isOpen, orderId: order?.id });
      
      if (!isOpen || !order?.id) {
        console.log('⏭️ Skipping initialization - dialog not open or no order ID');
        return;
      }
      
      try {
        console.log('🔍 Ensuring conversation for order:', order.id);
        console.log('🔧 ensureConversationForOrder function:', typeof ensureConversationForOrder);
        
        const conversation = await ensureConversationForOrder(String(order.id));
        console.log('💬 Conversation result:', conversation);
        
        console.log('🎯 Setting active conversation');
        setActiveConversation(conversation);
        
        // Set user as online when opening chat
        if (conversation) {
          console.log('🟢 Setting user presence to online for conversation:', conversation.id);
          updatePresence(conversation.id, 'online');
        } else {
          console.log('⚠️ No conversation returned from ensureConversationForOrder');
        }
      } catch (e) {
        console.error('❌ Failed to init conversation:', e);
        console.error('❌ Error details:', {
          message: e.message,
          stack: e.stack,
          name: e.name
        });
      }
    };
    init();
  }, [isOpen, order?.id, ensureConversationForOrder, setActiveConversation, updatePresence]);

  // Set user as offline when closing chat
  useEffect(() => {
    if (!isOpen && activeConversation) {
      updatePresence(activeConversation.id, 'offline');
    }
  }, [isOpen, activeConversation, updatePresence]);

  const handleSendMessage = async () => {
    console.log('🚀 handleSendMessage called');
    console.log('📝 Message text:', messageText);
    console.log('💬 Active conversation:', activeConversation);
    console.log('👤 Current user:', user);
    
    if (!messageText.trim() || !activeConversation) {
      console.log('❌ Validation failed - messageText:', !!messageText.trim(), 'activeConversation:', !!activeConversation);
      return;
    }

    console.log('✅ Validation passed, proceeding with message send');

    try {
      // Stop typing indicator when sending
      if (isTyping) {
        console.log('🛑 Stopping typing indicator');
        await stopTyping(activeConversation.id);
        setIsTyping(false);
      }

      const messagePayload = {
        conversation_id: activeConversation.id,
        content: messageText.trim(),
        message_type: 'text',
      };
      
      console.log('📤 Sending message with payload:', messagePayload);
      console.log('🔧 sendMessage function:', typeof sendMessage);
      
      const result = await sendMessage(messagePayload);
      console.log('✅ Message sent successfully, result:', result);
      
      setMessageText('');
      console.log('🧹 Message text cleared');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  };

  const handleTyping = async (text: string) => {
    setMessageText(text);
    
    if (!activeConversation) return;

    // Start typing if not already typing
    if (!isTyping && text.trim()) {
      setIsTyping(true);
      await startTyping(activeConversation.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      if (isTyping) {
        await stopTyping(activeConversation.id);
        setIsTyping(false);
      }
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: any) => {
    setMessageText(action.text);
  };

  // Get typing users and online users for current conversation
  const typingUsers = activeConversation ? getTypingUsers(activeConversation.id) : [];
  const onlineUsers = activeConversation ? getOnlineUsers(activeConversation.id) : [];

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (message: any) => {
    return message.sender_id === user?.id;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <Badge variant="outline">Order #{order.id}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'customer' ? (
                <>
                  <Store className="h-4 w-4" />
                  <span>{order.shop?.name || 'Shop'}</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  <span>{order.user?.name || 'Customer'}</span>
                </>
              )}
            </div>
            <ChatStatusIndicator 
              status={onlineUsers.length > 0 ? 'online' : 'offline'}
              className="ml-auto"
            />
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>
              Communicate about your order details and any questions you may have.
            </span>
            {typingUsers.length > 0 && (
              <span className="text-blue-600 text-sm">
                {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 border rounded-lg p-4 mb-4">
            <div className="space-y-3">
              {chatError ? (
                <div className="text-center py-8">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{chatError}</AlertDescription>
                  </Alert>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = isOwnMessage(message);
                  const isLastMessage = index === messages.length - 1;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <div className={`flex items-center justify-between mt-1 gap-2 ${
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          <span className="text-xs">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwn && isLastMessage && (
                            <div className="flex items-center gap-1">
                              {message.read_at ? (
                                <Circle className="h-2 w-2 fill-blue-400 text-blue-400" />
                              ) : (
                                <Circle className="h-2 w-2 fill-gray-400 text-gray-400" />
                              )}
                              <span className="text-xs">
                                {message.read_at ? 'Read' : 'Sent'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {typingUsers.map(user => user.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {!chatError && messages.length < 3 && (
            <QuickChatActions 
              onActionSelect={handleQuickAction}
              orderStatus={order.status}
              userRole={(user?.role === 'guest' ? 'customer' : user?.role) as 'customer' | 'vendor'}
            />
          )}

          {/* Message Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={messageText}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={chatError ? "Chat unavailable" : "Type your message..."}
                className="pr-20"
                disabled={isLoading || !!chatError}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  title="Attach file"
                >
                  <Paperclip className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  title="Send image"
                >
                  <Image className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  title="Record audio"
                >
                  <Mic className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isLoading || !!chatError}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
