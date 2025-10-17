import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Conversation, Message, SendMessagePayload } from '@/services/chatService';
import { getConversation as apiGetConversation, getMessages as apiGetMessages, sendMessage as apiSendMessage, markAsRead as apiMarkRead, getShopConversations as apiGetShopConversations, getUserConversations as apiGetUserConversations, startTyping as apiStartTyping, stopTyping as apiStopTyping, updatePresence as apiUpdatePresence } from '@/services/chatService';
import { getEcho } from '@/services/realtime';

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  typingUsers: { [conversationId: number]: { [userId: string]: { name: string; type: string } } };
  onlineUsers: { [conversationId: number]: { [userId: string]: boolean } };
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

interface ChatContextType extends ChatState {
  // Conversation management
  setActiveConversation: (conversation: Conversation | null) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: number) => Promise<void>;
  ensureConversationForOrder: (orderId: string) => Promise<Conversation>;
  
  // Messaging
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  addMessage: (message: Message) => void;
  
  // Real-time updates
  markAsRead: (conversationId: number) => Promise<void>;
  
  // Typing indicators
  startTyping: (conversationId: number) => Promise<void>;
  stopTyping: (conversationId: number) => Promise<void>;
  
  // Presence
  updatePresence: (conversationId: number, status: 'online' | 'offline') => Promise<void>;
  
  // Utilities
  getConversationById: (id: number) => Conversation | undefined;
  getUnreadCount: (conversationId: number) => number;
  getTypingUsers: (conversationId: number) => { name: string; type: string }[];
  getOnlineUsers: (conversationId: number) => string[];
}

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_CONVERSATION_LAST_MESSAGE'; payload: { conversationId: number; message: Message } }
  | { type: 'MARK_MESSAGES_READ'; payload: { conversationId: number; senderType: string } }
  | { type: 'SET_TYPING_USER'; payload: { conversationId: number; userId: string; name: string; type: string } }
  | { type: 'REMOVE_TYPING_USER'; payload: { conversationId: number; userId: string } }
  | { type: 'SET_USER_PRESENCE'; payload: { conversationId: number; userId: string; status: boolean } }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connecting' | 'connected' | 'disconnected' | 'error' };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONVERSATIONS':
      // Ensure conversations is always an array
      return { ...state, conversations: action.payload ?? [] };
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversation: action.payload, messages: action.payload ? state.messages : [] };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_CONVERSATION_LAST_MESSAGE':
      // Guard against undefined conversations
      return {
        ...state,
        conversations: (state.conversations || []).map(conv =>
          conv.id === action.payload.conversationId
            ? { ...conv, last_message_at: action.payload.message.created_at }
            : conv
        ),
      };
    case 'MARK_MESSAGES_READ':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.conversation_id === action.payload.conversationId &&
          msg.sender_type !== action.payload.senderType &&
          !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        ),
      };
    case 'SET_TYPING_USER':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: {
            ...state.typingUsers[action.payload.conversationId],
            [action.payload.userId]: {
              name: action.payload.name,
              type: action.payload.type,
            },
          },
        },
      };
    case 'REMOVE_TYPING_USER':
      const { [action.payload.userId]: removed, ...remainingTyping } = state.typingUsers[action.payload.conversationId] || {};
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: remainingTyping,
        },
      };
    case 'SET_USER_PRESENCE':
      return {
        ...state,
        onlineUsers: {
          ...state.onlineUsers,
          [action.payload.conversationId]: {
            ...state.onlineUsers[action.payload.conversationId],
            [action.payload.userId]: action.payload.status,
          },
        },
      };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    default:
      return state;
  }
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(chatReducer, {
    conversations: [],
    activeConversation: null,
    messages: [],
    isLoading: false,
    error: null,
    typingUsers: {},
    onlineUsers: {},
    connectionStatus: 'disconnected',
  });

  const currentChannelRef = useRef<any>(null);
  const stateRef = useRef(state);
  
  // Keep state ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Subscribe to Echo channel for a conversation
  const subscribeToConversation = useCallback((conversationId: number) => {
    console.log('🔌 subscribeToConversation called with conversationId:', conversationId);
    try {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
      console.log('🔧 Getting Echo instance...');
      const echo = getEcho();
      console.log('🔌 Echo instance obtained:', !!echo);
      console.log('🔌 Subscribing to conversation channel:', conversationId);
      
      // Unsubscribe previous
      if (currentChannelRef.current) {
        try {
          currentChannelRef.current.stopListening('.message.sent');
          currentChannelRef.current.stopListening('.typing.started');
          currentChannelRef.current.stopListening('.typing.stopped');
          currentChannelRef.current.stopListening('.presence.changed');
          echo.leave(`conversation.${currentChannelRef.current.conversationId}`);
          console.log('🔌 Unsubscribed from previous channel:', currentChannelRef.current.conversationId);
        } catch (error) {
          console.warn('Error unsubscribing from previous channel:', error);
        }
      }
      
      const channel = echo.private(`conversation.${conversationId}`);
      channel.conversationId = conversationId; // Store for cleanup
      
      // Listen for messages
      channel.listen('.message.sent', (event: any) => {
        console.log('📨 Received real-time message:', event);
        
        const incoming: Message = {
          id: event.id,
          conversation_id: event.conversation_id,
          sender_id: event.sender_id,
          sender_type: event.sender_type,
          content: event.content,
          message_type: event.message_type,
          media_url: event.media_url,
          created_at: event.created_at,
          updated_at: event.created_at,
          read_at: event.read_at,
        };
        
        // Check if message already exists to prevent duplicates
        const existingMessage = stateRef.current.messages.find(msg => msg.id === incoming.id);
        if (!existingMessage) {
          dispatch({ type: 'ADD_MESSAGE', payload: incoming });
          dispatch({ type: 'UPDATE_CONVERSATION_LAST_MESSAGE', payload: { conversationId, message: incoming } });
          
          // Play notification sound for received messages (not own messages)
          if (incoming.sender_id !== user?.id && 'Notification' in window) {
            // You can add notification logic here
            console.log('🔔 New message from:', incoming.sender_type);
          }
        }
      });

      // Listen for typing indicators
      channel.listen('.typing.started', (event: any) => {
        if (event.user_id !== user?.id) {
          dispatch({
            type: 'SET_TYPING_USER',
            payload: {
              conversationId,
              userId: event.user_id,
              name: event.user_name,
              type: event.user_type,
            },
          });
        }
      });

      channel.listen('.typing.stopped', (event: any) => {
        if (event.user_id !== user?.id) {
          dispatch({
            type: 'REMOVE_TYPING_USER',
            payload: {
              conversationId,
              userId: event.user_id,
            },
          });
        }
      });

      // Listen for presence changes
      channel.listen('.presence.changed', (event: any) => {
        if (event.user_id !== user?.id) {
          dispatch({
            type: 'SET_USER_PRESENCE',
            payload: {
              conversationId,
              userId: event.user_id,
              status: event.status === 'online',
            },
          });
        }
      });
      
      currentChannelRef.current = channel;
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      console.log('✅ Successfully subscribed to conversation channel:', conversationId);
      
    } catch (e) {
      console.error('❌ Echo subscription failed:', e);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
      dispatch({ type: 'SET_ERROR', payload: 'Real-time connection failed' });
    }
  }, [user]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const isVendor = Array.isArray((user as any)?.shops) && (user as any).shops.length > 0;
      const conversations = isVendor ? await apiGetShopConversations() : await apiGetUserConversations();
      const safeConversations = Array.isArray(conversations) ? conversations : [];
      dispatch({ type: 'SET_CONVERSATIONS', payload: safeConversations });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load conversations' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  // Ensure a conversation exists for an order and return it
  const ensureConversationForOrder = useCallback(async (orderId: string) => {
    console.log('🔍 ensureConversationForOrder called with orderId:', orderId);
    console.log('🔧 apiGetConversation function:', typeof apiGetConversation);
    
    try {
      console.log('📡 Calling apiGetConversation...');
      const resp = await apiGetConversation({ order_id: orderId });
      console.log('💬 Conversation API response:', resp);
      return resp;
    } catch (error) {
      console.error('❌ Failed to get/create conversation:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { messages } = await apiGetMessages(conversationId);
      const safeMessages = Array.isArray(messages) ? messages : [];
      dispatch({ type: 'SET_MESSAGES', payload: safeMessages });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load messages' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (payload: SendMessagePayload): Promise<void> => {
    console.log('🎯 ChatContext sendMessage called with payload:', payload);
    console.log('🔧 apiSendMessage function:', typeof apiSendMessage);
    
    try {
      console.log('📡 Calling apiSendMessage...');
      const sent = await apiSendMessage(payload);
      console.log('📨 API response received:', sent);
      // Rely solely on real-time broadcast to add the message to state
      // This prevents any chance of duplicates/flicker
      console.log('✅ Message sent successfully (awaiting real-time echo):', sent.id);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      console.error('❌ Error details:', {
        message: (error as any).message,
        stack: (error as any).stack,
        name: (error as any).name,
        response: (error as any).response?.data,
        status: (error as any).response?.status
      });
      
      toast({
        title: 'Failed to send message',
        description: 'There was an error sending your message. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to allow UI to handle the error
    }
  }, [toast]);

  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
    dispatch({ type: 'UPDATE_CONVERSATION_LAST_MESSAGE', payload: { conversationId: message.conversation_id, message } });
  }, []);

  const markAsRead = useCallback(async (conversationId: number) => {
    try {
      await apiMarkRead(conversationId);
      const senderType = 'user';
      dispatch({ type: 'MARK_MESSAGES_READ', payload: { conversationId, senderType } });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark messages as read:', error);
    }
  }, []);

  const setActiveConversation = useCallback((conversation: Conversation | null) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversation });
    if (conversation) {
      loadMessages(conversation.id);
      subscribeToConversation(conversation.id);
      markAsRead(conversation.id);
    } else {
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    }
  }, [loadMessages, subscribeToConversation, markAsRead]);

  const getConversationById = useCallback((id: number) => {
    return state.conversations.find(conv => conv.id === id);
  }, [state.conversations]);

  const getUnreadCount = useCallback((conversationId: number) => {
    // Prefer server-provided unread count if available
    const conversation = state.conversations.find(conv => conv.id === conversationId) as any;
    if (!conversation) return 0;

    // If we have messages loaded for this conversation, count unread locally
    const conversationMessages = state.messages.filter(msg => msg.conversation_id === conversationId);
    if (conversationMessages.length > 0) {
      return conversationMessages.filter(msg => !msg.read_at && msg.sender_id !== user?.id).length;
    }

    // Server-provided unread_count support
    if (typeof conversation.unread_count === 'number') {
      return conversation.unread_count;
    }

    // Fallback heuristic using latest_message if available
    const latest = conversation.latest_message;
    if (latest && !latest.read_at && latest.sender_id !== user?.id) {
      return 1;
    }

    return 0;
  }, [state.messages, state.conversations, user?.id]);

  const startTyping = useCallback(async (conversationId: number) => {
    try {
      await apiStartTyping(conversationId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to start typing:', error);
    }
  }, []);

  const stopTyping = useCallback(async (conversationId: number) => {
    try {
      await apiStopTyping(conversationId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to stop typing:', error);
    }
  }, []);

  const updatePresence = useCallback(async (conversationId: number, status: 'online' | 'offline') => {
    try {
      await apiUpdatePresence(conversationId, status);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update presence:', error);
    }
  }, []);

  const getTypingUsers = useCallback((conversationId: number) => {
    const typing = state.typingUsers[conversationId] || {};
    return Object.values(typing);
  }, [state.typingUsers]);

  const getOnlineUsers = useCallback((conversationId: number) => {
    const online = state.onlineUsers[conversationId] || {};
    return Object.keys(online).filter(userId => online[userId]);
  }, [state.onlineUsers]);

  // Load conversations when user changes/login and cleanup on unmount
  useEffect(() => {
    if (user) {
      loadConversations();
    }

    // Cleanup function
    return () => {
      if (currentChannelRef.current) {
        try {
          const echo = getEcho();
          currentChannelRef.current.stopListening('.message.sent');
          currentChannelRef.current.stopListening('.typing.started');
          currentChannelRef.current.stopListening('.typing.stopped');
          currentChannelRef.current.stopListening('.presence.changed');
          echo.leave(`conversation.${currentChannelRef.current.conversationId}`);
        } catch (error) {
          console.warn('Error during chat cleanup:', error);
        }
        currentChannelRef.current = null;
      }
    };
  }, [user, loadConversations]);

  // Background polling to keep conversations (and unread badges) fresh
  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      // Only poll when tab is visible to avoid unnecessary work
      if (document.visibilityState === 'visible') {
        loadConversations();
      }
    }, 15000); // every 15 seconds

    return () => {
      window.clearInterval(interval);
    };
  }, [user, loadConversations]);

  return (
    <ChatContext.Provider
      value={{
        ...state,
        setActiveConversation,
        loadConversations,
        loadMessages,
        ensureConversationForOrder,
        sendMessage,
        addMessage,
        markAsRead,
        startTyping,
        stopTyping,
        updatePresence,
        getConversationById,
        getUnreadCount,
        getTypingUsers,
        getOnlineUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
