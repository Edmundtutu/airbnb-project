import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  Image, 
  Mic, 
  Paperclip, 
  Circle, 
  AlertTriangle, 
  Package, 
  Store, 
  User,
  Minus,
  X,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ChatStatusIndicator } from './ChatStatusIndicator';
import { QuickChatActions } from './QuickChatActions';
import { cn } from '@/lib/utils';
import type { Order } from '@/types/orders';
import type { Conversation, Message } from '@/services/chatService';

type ChatMode = 'desktop' | 'tablet' | 'mobile';

interface ResponsiveChatDialogProps {
  order: Order;
  conversation: Conversation | null;
  isOpen: boolean;
  isMinimized?: boolean;
  mode: ChatMode;
  position?: { x: number; y: number };
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  // Chat functionality props
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  typingUsers: any[];
  onlineUsers: string[];
  startTyping: () => void;
  stopTyping: () => void;
}

export const ResponsiveChatDialog: React.FC<ResponsiveChatDialogProps> = ({
  order,
  conversation,
  isOpen,
  isMinimized = false,
  mode,
  position = { x: 20, y: 20 },
  onClose,
  onMinimize,
  onMaximize,
  messages,
  sendMessage,
  isLoading = false,
  typingUsers,
  onlineUsers,
  startTyping,
  stopTyping,
}) => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      if (isTyping) {
        stopTyping();
        setIsTyping(false);
      }
      
      await sendMessage(messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);
    
    if (!conversation) return;

    if (!isTyping && text.trim()) {
      setIsTyping(true);
      startTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        stopTyping();
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.sender_id === user?.id;
  };

  // Mobile mode - full screen
  if (mode === 'mobile') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="h-screen w-screen max-w-none p-0 m-0 rounded-none">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-background">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <Badge variant="outline">Order #{order.id}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === 'customer' ? (
                  <>
                    <Store className="h-4 w-4" />
                    <span className="font-medium">{order.shop?.name || 'Shop'}</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    <span className="font-medium">{order.user?.name || 'Customer'}</span>
                  </>
                )}
              </div>
              <ChatStatusIndicator 
                status={onlineUsers.length > 0 ? 'online' : 'offline'}
                className="ml-auto"
              />
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
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
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
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
                                <Circle className={`h-2 w-2 ${message.read_at ? 'fill-blue-400 text-blue-400' : 'fill-muted-foreground text-muted-foreground'}`} />
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
                        <span className="text-xs text-muted-foreground">typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            {messages.length < 3 && (
              <div className="px-4 pb-2">
                <QuickChatActions 
                  onActionSelect={(action) => setMessageText(action.text)}
                  orderStatus={order.status}
                  userRole={(user?.role === 'guest' ? 'customer' : user?.role) as 'customer' | 'vendor'}
                />
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={messageText}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="pr-20"
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Paperclip className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Image className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Mic className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop mode - floating window
  if (mode === 'desktop') {
    const chatWindow = (
      <div
        className={cn(
          "fixed bg-background border rounded-lg shadow-xl transition-all duration-200",
          isMinimized ? "h-12 w-80" : "h-96 w-80",
          "z-50"
        )}
        style={{
          bottom: position.y,
          right: position.x,
        }}
      >
        {/* Desktop Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Package className="h-3 w-3 flex-shrink-0" />
            <Badge variant="outline" className="text-xs">#{order.id}</Badge>
            <span className="text-xs truncate">
              {user?.role === 'customer' 
                ? (order.shop?.name || 'Shop')
                : (order.user?.name || 'Customer')
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ChatStatusIndicator 
              status={onlineUsers.length > 0 ? 'online' : 'offline'}
              className="text-xs"
            />
            {onMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={isMinimized ? onMaximize : onMinimize}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <ChevronDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Desktop Content - only show when not minimized */}
        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="h-64 p-3">
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <p className="text-xs">No messages yet</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = isOwnMessage(message);
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded px-2 py-1 text-xs ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <span className={`text-[10px] opacity-70 ${
                            isOwn ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}>
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded px-2 py-1">
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-2 border-t">
              <div className="flex gap-1">
                <Input
                  value={messageText}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type..."
                  className="text-xs h-8"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isLoading}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );

    // Use portal to render outside the main DOM tree
    return createPortal(chatWindow, document.body);
  }

  // Tablet mode - large modal
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
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
        </DialogHeader>

        {/* Rest of the content similar to mobile but with tablet-specific styling */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 border rounded-lg p-4 mb-4">
            {/* Same message rendering logic as mobile */}
            <div className="space-y-3">
              {messages.map((message, index) => {
                const isOwn = isOwnMessage(message);
                
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
                      <span className={`text-xs ${
                        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isLoading}
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
