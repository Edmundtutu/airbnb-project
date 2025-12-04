/**
 * Firebase Chat Service
 * 
 * This service handles all Firebase Realtime Database operations for the booking-based chat system.
 * It provides methods for creating chat rooms, sending messages, managing typing indicators,
 * and handling presence status.
 */

import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  query,
  orderByChild,
  limitToLast,
  off,
  Database,
} from 'firebase/database';

import { getFirebaseDatabase } from '@/lib/firebase';
import type {
  BookingChatRoom,
  BookingChatMessage,
  TypingIndicator,
  PresenceStatus,
  SendFirebaseMessagePayload,
  CreateChatRoomPayload,
} from '@/types/chat';
import { CHAT_PATHS } from '@/types/chat';

/**
 * Get database instance
 */
const getDb = (): Database => {
  const db = getFirebaseDatabase();
  if (!db) {
    throw new Error('Firebase database not initialized');
  }
  return db;
};

/**
 * Create or update a chat room for a booking
 */
export const createOrUpdateChatRoom = async (payload: CreateChatRoomPayload): Promise<BookingChatRoom> => {
  const db = getDb();
  const roomRef = ref(db, CHAT_PATHS.metadata(payload.bookingId));

  // Helper to remove undefined values (Firebase doesn't accept undefined)
  const cleanObject = <T extends Record<string, any>>(obj: T): any => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          cleaned[key] = cleanObject(value);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  };

  const roomData: BookingChatRoom = {
    id: payload.bookingId,
    bookingId: payload.bookingId,
    listingId: payload.listingId,
    listingTitle: payload.listingTitle,
    listingImage: payload.listingImage || null, // Use null instead of undefined
    guest: payload.guest,
    host: payload.host,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    unreadCount: {
      guest: 0,
      host: 0,
    },
    bookingStatus: payload.bookingStatus,
    checkIn: payload.checkIn || null,
    checkOut: payload.checkOut || null,
  };

  // Check if room already exists
  const snapshot = await get(roomRef);
  if (snapshot.exists()) {
    // Update existing room but preserve certain fields
    const existingData = snapshot.val();
    roomData.createdAt = existingData.createdAt || roomData.createdAt;
    roomData.lastMessage = existingData.lastMessage;
    roomData.unreadCount = existingData.unreadCount || roomData.unreadCount;
  }

  // Clean undefined values before writing to Firebase
  const cleanedRoomData = cleanObject(roomData);
  await set(roomRef, cleanedRoomData);
  return roomData;
};

/**
 * Create a chat room if it does not exist, otherwise return the existing room.
 * This is a convenience helper for UI code that wants idempotent behavior.
 */
export const createOrGetChatRoom = async (
  payload: CreateChatRoomPayload
): Promise<BookingChatRoom> => {
  const existing = await getChatRoom(payload.bookingId);
  if (existing) {
    return existing;
  }
  return createOrUpdateChatRoom(payload);
};

/**
 * Get a chat room by booking ID
 */
export const getChatRoom = async (bookingId: string): Promise<BookingChatRoom | null> => {
  const db = getDb();
  const roomRef = ref(db, CHAT_PATHS.metadata(bookingId));
  const snapshot = await get(roomRef);

  if (snapshot.exists()) {
    return snapshot.val() as BookingChatRoom;
  }

  return null;
};

/**
 * Get all chat rooms for a user
 */
export const getUserChatRooms = async (userId: string, userRole: 'guest' | 'host'): Promise<BookingChatRoom[]> => {
  const db = getDb();
  const roomsRef = ref(db, CHAT_PATHS.rooms);
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms: BookingChatRoom[] = [];
  snapshot.forEach((childSnapshot) => {
    const metadata = childSnapshot.child('metadata').val();
    if (metadata) {
      // Filter rooms where user is a participant
      const isParticipant = userRole === 'guest'
        ? metadata.guest?.userId === userId
        : metadata.host?.userId === userId;

      if (isParticipant) {
        rooms.push(metadata);
      }
    }
  });

  // Sort by last activity (most recent first)
  return rooms.sort((a, b) => b.lastActivity - a.lastActivity);
};

/**
 * Send a message
 */
export const sendMessage = async (
  payload: SendFirebaseMessagePayload,
  senderId: string,
  senderRole: 'guest' | 'host'
): Promise<BookingChatMessage> => {
  const db = getDb();
  const messagesRef = ref(db, CHAT_PATHS.messages(payload.bookingId));
  const newMessageRef = push(messagesRef);

  const message: BookingChatMessage = {
    id: newMessageRef.key!,
    bookingId: payload.bookingId,
    senderId,
    senderRole,
    content: payload.content,
    messageType: payload.messageType || 'text',
    mediaUrl: payload.mediaUrl || null, // Use null instead of undefined
    timestamp: Date.now(),
    read: false,
  };

  // Remove undefined values before writing to Firebase
  const cleanMessage: any = {};
  for (const [key, value] of Object.entries(message)) {
    if (value !== undefined) {
      cleanMessage[key] = value;
    }
  }

  await set(newMessageRef, cleanMessage);

  // Update room metadata
  const metadataRef = ref(db, CHAT_PATHS.metadata(payload.bookingId));
  const recipientRole = senderRole === 'guest' ? 'host' : 'guest';
  const unreadRef = ref(
    db,
    `${CHAT_PATHS.metadata(payload.bookingId)}/unreadCount/${recipientRole}`
  );
  const unreadSnapshot = await get(unreadRef);
  const unreadVal = unreadSnapshot.val();
  const currentUnread =
    typeof unreadVal === 'number' && Number.isFinite(unreadVal) ? unreadVal : 0;

  await update(metadataRef, {
    lastActivity: Date.now(),
    lastMessage: {
      content: payload.content,
      senderId,
      timestamp: message.timestamp,
    },
  });

  // Update unread count at the nested path to avoid invalid keys in update()
  await set(unreadRef, currentUnread + 1);

  return message;
};

/**
 * Get messages for a chat room with pagination
 */
export const getMessages = async (
  bookingId: string,
  limit: number = 50
): Promise<BookingChatMessage[]> => {
  const db = getDb();
  const messagesRef = ref(db, CHAT_PATHS.messages(bookingId));
  const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(limit));
  const snapshot = await get(messagesQuery);

  if (!snapshot.exists()) {
    return [];
  }

  const messages: BookingChatMessage[] = [];
  snapshot.forEach((childSnapshot) => {
    messages.push(childSnapshot.val() as BookingChatMessage);
  });

  return messages;
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  bookingId: string,
  userId: string,
  userRole: 'guest' | 'host'
): Promise<void> => {
  const db = getDb();
  const messagesRef = ref(db, CHAT_PATHS.messages(bookingId));
  const snapshot = await get(messagesRef);

  if (!snapshot.exists()) {
    return;
  }

  const updates: { [key: string]: any } = {};
  const now = Date.now();

  snapshot.forEach((childSnapshot) => {
    const message = childSnapshot.val() as BookingChatMessage;
    // Mark as read if sent by the other party and not already read
    if (message.senderId !== userId && !message.read) {
      updates[`${childSnapshot.key}/read`] = true;
      updates[`${childSnapshot.key}/readAt`] = now;
    }
  });

  if (Object.keys(updates).length > 0) {
    await update(messagesRef, updates);
  }

  // Reset unread count for this user
  const unreadRef = ref(
    db,
    `${CHAT_PATHS.metadata(bookingId)}/unreadCount/${userRole}`
  );
  await set(unreadRef, 0);
};

/**
 * Set typing indicator
 */
export const setTypingIndicator = async (
  bookingId: string,
  userId: string,
  userRole: 'guest' | 'host',
  userName: string,
  isTyping: boolean
): Promise<void> => {
  const db = getDb();
  const typingRef = ref(db, CHAT_PATHS.typingUser(bookingId, userId));

  if (isTyping) {
    const indicator: TypingIndicator = {
      userId,
      userRole,
      userName,
      timestamp: Date.now(),
    };
    await set(typingRef, indicator);
    
    // Auto-remove after 5 seconds
    setTimeout(async () => {
      await remove(typingRef);
    }, 5000);
  } else {
    await remove(typingRef);
  }
};

/**
 * Update presence status
 */
export const updatePresence = async (
  bookingId: string,
  userId: string,
  status: 'online' | 'offline'
): Promise<void> => {
  const db = getDb();
  const presenceRef = ref(db, CHAT_PATHS.presenceUser(bookingId, userId));

  const presence: PresenceStatus = {
    userId,
    status,
    lastSeen: Date.now(),
  };

  await set(presenceRef, presence);
};

/**
 * Subscribe to new messages
 */
export const subscribeToMessages = (
  bookingId: string,
  onMessage: (message: BookingChatMessage) => void
): (() => void) => {
  const db = getDb();
  const messagesRef = ref(db, CHAT_PATHS.messages(bookingId));

  const handleChildAdded = (snapshot: any) => {
    const message = snapshot.val() as BookingChatMessage;
    onMessage(message);
  };

  onChildAdded(messagesRef, handleChildAdded);

  // Return unsubscribe function
  return () => {
    off(messagesRef, 'child_added', handleChildAdded);
  };
};

/**
 * Subscribe to typing indicators
 */
export const subscribeToTyping = (
  bookingId: string,
  onTypingChange: (typingUsers: TypingIndicator[]) => void
): (() => void) => {
  const db = getDb();
  const typingRef = ref(db, CHAT_PATHS.typing(bookingId));

  const handleChange = (snapshot: any) => {
    const typing: TypingIndicator[] = [];
    snapshot.forEach((childSnapshot: any) => {
      typing.push(childSnapshot.val() as TypingIndicator);
    });
    onTypingChange(typing);
  };

  onValue(typingRef, handleChange);

  // Return unsubscribe function
  return () => {
    off(typingRef, 'value', handleChange);
  };
};

/**
 * Subscribe to presence updates
 */
export const subscribeToPresence = (
  bookingId: string,
  onPresenceChange: (presence: { [userId: string]: PresenceStatus }) => void
): (() => void) => {
  const db = getDb();
  const presenceRef = ref(db, CHAT_PATHS.presence(bookingId));

  const handleChange = (snapshot: any) => {
    const presence: { [userId: string]: PresenceStatus } = {};
    snapshot.forEach((childSnapshot: any) => {
      const data = childSnapshot.val() as PresenceStatus;
      presence[data.userId] = data;
    });
    onPresenceChange(presence);
  };

  onValue(presenceRef, handleChange);

  // Return unsubscribe function
  return () => {
    off(presenceRef, 'value', handleChange);
  };
};

/**
 * Subscribe to room metadata changes
 */
export const subscribeToRoomMetadata = (
  bookingId: string,
  onChange: (room: BookingChatRoom) => void
): (() => void) => {
  const db = getDb();
  const metadataRef = ref(db, CHAT_PATHS.metadata(bookingId));

  const handleChange = (snapshot: any) => {
    if (snapshot.exists()) {
      onChange(snapshot.val() as BookingChatRoom);
    }
  };

  onValue(metadataRef, handleChange);

  // Return unsubscribe function
  return () => {
    off(metadataRef, 'value', handleChange);
  };
};

/**
 * Subscribe to user's chat rooms
 */
export const subscribeToUserRooms = (
  userId: string,
  userRole: 'guest' | 'host',
  onChange: (rooms: BookingChatRoom[]) => void
): (() => void) => {
  const db = getDb();
  const roomsRef = ref(db, CHAT_PATHS.rooms);

  // Store rooms in a Map for efficient updates
  const roomsMap = new Map<string, BookingChatRoom>();
  let updateTimeout: NodeJS.Timeout | null = null;

  const emitUpdate = () => {
    // Debounce updates to prevent rapid-fire onChange calls
    // Reduced to 50ms for faster unread count updates
    if (updateTimeout) clearTimeout(updateTimeout);
    
    updateTimeout = setTimeout(() => {
      const rooms = Array.from(roomsMap.values())
        .sort((a, b) => b.lastActivity - a.lastActivity);
      onChange(rooms);
    }, 50); // 50ms debounce for faster updates
  };

  // Listen for child added
  const handleChildAdded = onChildAdded(roomsRef, (snapshot) => {
    const bookingId = snapshot.key;
    if (!bookingId) return;

    const metadata = snapshot.child('metadata').val();
    if (metadata) {
      const isParticipant = userRole === 'guest'
        ? metadata.guest?.userId === userId
        : metadata.host?.userId === userId;

      if (isParticipant) {
        roomsMap.set(bookingId, metadata);
        emitUpdate();
      }
    }
  });

  // Listen for child changed
  const handleChildChanged = onChildChanged(roomsRef, (snapshot) => {
    const bookingId = snapshot.key;
    if (!bookingId) return;

    const metadata = snapshot.child('metadata').val();
    if (metadata) {
      const isParticipant = userRole === 'guest'
        ? metadata.guest?.userId === userId
        : metadata.host?.userId === userId;

      if (isParticipant) {
        roomsMap.set(bookingId, metadata);
        emitUpdate();
      } else {
        // User is no longer a participant, remove from map
        if (roomsMap.has(bookingId)) {
          roomsMap.delete(bookingId);
          emitUpdate();
        }
      }
    }
  });

  // Listen for child removed
  const handleChildRemoved = onChildRemoved(roomsRef, (snapshot) => {
    const bookingId = snapshot.key;
    if (bookingId && roomsMap.has(bookingId)) {
      roomsMap.delete(bookingId);
      emitUpdate();
    }
  });

  // Return unsubscribe function that removes all listeners
  return () => {
    if (updateTimeout) clearTimeout(updateTimeout);
    off(roomsRef, 'child_added', handleChildAdded as any);
    off(roomsRef, 'child_changed', handleChildChanged as any);
    off(roomsRef, 'child_removed', handleChildRemoved as any);
    roomsMap.clear();
  };
};

/**
 * Delete a chat room (admin/cleanup function)
 */
export const deleteChatRoom = async (bookingId: string): Promise<void> => {
  const db = getDb();
  const roomRef = ref(db, CHAT_PATHS.room(bookingId));
  await remove(roomRef);
};
