/**
 * Firebase Chat Types
 * 
 * These types define the data structures for the Firebase-based chat system.
 * Each chat room is scoped to a booking with exactly two participants: guest and host.
 */

export interface BookingChatParticipant {
  userId: string;
  role: 'guest' | 'host';
  name: string;
  avatar?: string;
  email?: string;
}

export interface BookingChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: 'guest' | 'host';
  content: string;
  messageType: 'text' | 'image' | 'audio';
  mediaUrl?: string;
  timestamp: number;
  read: boolean;
  readAt?: number;
}

export interface BookingChatRoom {
  id: string; // Same as bookingId
  bookingId: string;
  listingId: string;
  listingTitle: string;
  listingImage: string | null;
  
  // Participants
  guest: BookingChatParticipant;
  host: BookingChatParticipant;
  
  // Room metadata
  createdAt: number;
  lastActivity: number;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: number;
  };
  
  // Unread counters (per participant)
  unreadCount: {
    guest: number;
    host: number;
  };
  
  // Booking details for quick reference
  bookingStatus: string;
  checkIn?: string | null;
  checkOut?: string | null;
}

export interface TypingIndicator {
  userId: string;
  userRole: 'guest' | 'host';
  userName: string;
  timestamp: number;
}

export interface PresenceStatus {
  userId: string;
  status: 'online' | 'offline';
  lastSeen: number;
}

/**
 * Firebase database structure:
 * 
 * /bookingChats/{bookingId}/
 *   - metadata: BookingChatRoom (without messages)
 *   - messages/{messageId}: BookingChatMessage
 *   - typing/{userId}: TypingIndicator
 *   - presence/{userId}: PresenceStatus
 */

export interface FirebaseChatPaths {
  rooms: string; // '/bookingChats'
  room: (bookingId: string) => string; // '/bookingChats/{bookingId}'
  metadata: (bookingId: string) => string; // '/bookingChats/{bookingId}/metadata'
  messages: (bookingId: string) => string; // '/bookingChats/{bookingId}/messages'
  message: (bookingId: string, messageId: string) => string; // '/bookingChats/{bookingId}/messages/{messageId}'
  typing: (bookingId: string) => string; // '/bookingChats/{bookingId}/typing'
  typingUser: (bookingId: string, userId: string) => string; // '/bookingChats/{bookingId}/typing/{userId}'
  presence: (bookingId: string) => string; // '/bookingChats/{bookingId}/presence'
  presenceUser: (bookingId: string, userId: string) => string; // '/bookingChats/{bookingId}/presence/{userId}'
}

export const CHAT_PATHS: FirebaseChatPaths = {
  rooms: '/bookingChats',
  room: (bookingId: string) => `/bookingChats/${bookingId}`,
  metadata: (bookingId: string) => `/bookingChats/${bookingId}/metadata`,
  messages: (bookingId: string) => `/bookingChats/${bookingId}/messages`,
  message: (bookingId: string, messageId: string) => `/bookingChats/${bookingId}/messages/${messageId}`,
  typing: (bookingId: string) => `/bookingChats/${bookingId}/typing`,
  typingUser: (bookingId: string, userId: string) => `/bookingChats/${bookingId}/typing/${userId}`,
  presence: (bookingId: string) => `/bookingChats/${bookingId}/presence`,
  presenceUser: (bookingId: string, userId: string) => `/bookingChats/${bookingId}/presence/${userId}`,
};

// Helper type for message send payload
export interface SendFirebaseMessagePayload {
  bookingId: string;
  content: string;
  messageType?: 'text' | 'image' | 'audio';
  mediaUrl?: string;
}

// Helper type for room creation
export interface CreateChatRoomPayload {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  guest: BookingChatParticipant;
  host: BookingChatParticipant;
  bookingStatus: string;
  checkIn?: string;
  checkOut?: string;
}
