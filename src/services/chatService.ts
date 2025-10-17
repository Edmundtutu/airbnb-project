import api from './api';
import type { ApiResponse } from '@/types/api';

const apiVersion = import.meta.env.VITE_API_VERSION;

export interface Conversation {
  id: number;
  order_id: string;
  user_id: string;
  shop_id: string;
  status: 'active' | 'archived';
  last_message_at: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  order?: any;
  user?: any;
  shop?: any;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  sender_type: 'user' | 'shop';
  content: string;
  message_type: 'text' | 'image' | 'audio';
  media_url?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: any;
}

export interface SendMessagePayload {
  conversation_id: number;
  content: string;
  message_type: 'text' | 'image' | 'audio';
  media_url?: string;
}

export interface GetConversationPayload {
  order_id: string;
}

// Get or create conversation for an order
export const getConversation = async (payload: GetConversationPayload): Promise<Conversation> => {
  console.log('🌐 API getConversation called with payload:', payload);
  console.log('🔗 API URL:', `${apiVersion}/chat/conversation`);
  
  try {
    const response = await api.post<{ conversation: Conversation }>(`${apiVersion}/chat/conversation`, payload);
    console.log('📡 API response received:', response);
    console.log('📊 Response data structure:', response.data);
    console.log('💬 Conversation data:', response.data.conversation);
    
    return response.data.conversation;
  } catch (error) {
    console.error('❌ API getConversation error:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};

// Send a message
export const sendMessage = async (payload: SendMessagePayload): Promise<Message> => {
  console.log('🌐 API sendMessage called with payload:', payload);
  console.log('🔗 API URL:', `${apiVersion}/chat/message`);
  
  try {
    const response = await api.post<{ message: Message }>(`${apiVersion}/chat/message`, payload);
    console.log('📡 API response received:', response);
    console.log('📊 Response data structure:', response.data);
    console.log('💬 Message data:', response.data.message);
    
    return response.data.message;
  } catch (error) {
    console.error('❌ API sendMessage error:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    throw error;
  }
};

// Get conversation messages
export const getMessages = async (conversationId: number, page: number = 1): Promise<{ messages: Message[]; pagination: any }> => {
  const response = await api.get<ApiResponse<{ messages: Message[]; pagination: any }>>(
    `${apiVersion}/chat/conversations/${conversationId}/messages?page=${page}`
  );
  const payload: any = (response as any).data;
  const root = payload?.data ?? payload;

  // Normalize various possible shapes
  const messagesCandidate =
    Array.isArray(root?.messages) ? root.messages :
    Array.isArray(root?.messages?.data) ? root.messages.data :
    Array.isArray(root?.data?.messages) ? root.data.messages :
    Array.isArray(root?.data) ? root.data :
    [];

  const messages: Message[] = Array.isArray(messagesCandidate) ? messagesCandidate : [];

  const pagination =
    root?.pagination ??
    root?.messages?.meta ??
    root?.meta ??
    null;

  return { messages, pagination };
};

// Mark messages as read
export const markAsRead = async (conversationId: number): Promise<{ message: string }> => {
  const response = await api.patch<{ message: string }>(`${apiVersion}/chat/conversations/${conversationId}/read`);
  return response.data;
};

// Get user's conversations
export const getUserConversations = async (): Promise<Conversation[]> => {
  const response = await api.get<ApiResponse<any>>(`${apiVersion}/chat/conversations/user`);
  const payload: any = (response as any).data;
  const root = payload?.data ?? payload;
  const conversations = Array.isArray(root)
    ? root
    : Array.isArray(root?.conversations?.data)
      ? root.conversations.data
      : Array.isArray(root?.conversations)
        ? root.conversations
        : Array.isArray(root?.data)
          ? root.data
          : [];
  return conversations;
};

// Get shop's conversations
export const getShopConversations = async (): Promise<Conversation[]> => {
  const response = await api.get<ApiResponse<any>>(`${apiVersion}/chat/conversations/shop`);
  const payload: any = (response as any).data;
  const root = payload?.data ?? payload;
  const conversations = Array.isArray(root)
    ? root
    : Array.isArray(root?.conversations?.data)
      ? root.conversations.data
      : Array.isArray(root?.conversations)
        ? root.conversations
        : Array.isArray(root?.data)
          ? root.data
          : [];
  return conversations;
};

// Start typing indicator
export const startTyping = async (conversationId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`${apiVersion}/chat/typing/start`, {
    conversation_id: conversationId,
  });
  return response.data;
};

// Stop typing indicator
export const stopTyping = async (conversationId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`${apiVersion}/chat/typing/stop`, {
    conversation_id: conversationId,
  });
  return response.data;
};

// Update user presence
export const updatePresence = async (conversationId: number, status: 'online' | 'offline'): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`${apiVersion}/chat/presence`, {
    conversation_id: conversationId,
    status,
  });
  return response.data;
};
