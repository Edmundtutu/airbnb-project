/**
 * useBookingChat Hook
 *
 * Lightweight hook responsible for ensuring a booking-scoped chat room exists
 * and providing navigation helpers + role/unread info.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useChatRooms } from '@/context/ChatRoomsContext';
import { createOrGetChatRoom } from '@/services/firebaseChatService';
import type { BookingChatRoom } from '@/types/chat';
import type { Booking } from '@/types/bookings';

export const useBookingChat = (booking: Booking | null) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rooms, getUnreadForBooking } = useChatRooms();
  const [room, setRoom] = useState<BookingChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole: 'guest' | 'host' | null = useMemo(() => {
    if (!booking || !user) return null;
    return booking.guest_id === user.id ? 'guest' : 'host';
  }, [booking, user]);

  // Keep room in sync with ChatRoomsContext if it already exists there
  useEffect(() => {
    if (!booking) return;
    const existing = rooms.find((r) => r.bookingId === String(booking.id));
    if (existing) {
      setRoom(existing);
    }
  }, [rooms, booking]);

  // Ensure room exists in Firebase when needed
  useEffect(() => {
    if (!booking || !user || !userRole) return;

    // If we already have a room from context, don't re-create
    if (room) return;

    let isMounted = true;

    const initRoom = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const guestId = booking.guest_id;
        const hostId = booking.property?.host_id || '';

        const guestInfo =
          userRole === 'guest'
            ? { name: user.name || 'Guest', avatar: (user as any).avatar }
            : { name: booking.guest?.name || 'Guest', avatar: booking.guest?.avatar };

        const hostInfo =
          userRole === 'host'
            ? { name: user.name || 'Host', avatar: (user as any).avatar }
            : {
                name: booking.property?.host?.name || 'Host',
                avatar: booking.property?.host?.avatar,
              };

        const createdRoom = await createOrGetChatRoom({
          bookingId: String(booking.id),
          listingId: booking.property_id,
          listingTitle: booking.property?.name || 'Property',
          listingImage: booking.property?.cover_image,
          guest: {
            userId: guestId,
            role: 'guest',
            name: guestInfo.name,
            avatar: guestInfo.avatar,
          },
          host: {
            userId: hostId,
            role: 'host',
            name: hostInfo.name,
            avatar: hostInfo.avatar,
          },
          bookingStatus: booking.status,
          checkIn: booking.check_in_date,
          checkOut: booking.check_out_date,
        });

        if (!isMounted) return;
        setRoom(createdRoom);
      } catch (err) {
        console.error('Failed to initialize chat room:', err);
        if (isMounted) {
          setError('Failed to initialize chat');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initRoom();

    return () => {
      isMounted = false;
    };
  }, [booking, user, userRole, room]);

  const openChat = async () => {
    if (!booking || !user || !userRole) return;

    // If room already exists in context, navigate immediately
    const existingRoom = rooms.find((r) => r.bookingId === String(booking.id));
    if (existingRoom) {
      navigate(`/chats/${booking.id}`);
      return;
    }

    // Otherwise, ensure room is created before navigating
    setIsLoading(true);
    try {
      const guestId = booking.guest_id;
      const hostId = booking.property?.host_id || '';

      const guestInfo =
        userRole === 'guest'
          ? { name: user.name || 'Guest', avatar: (user as any).avatar }
          : { name: booking.guest?.name || 'Guest', avatar: booking.guest?.avatar };

      const hostInfo =
        userRole === 'host'
          ? { name: user.name || 'Host', avatar: (user as any).avatar }
          : {
              name: booking.property?.host?.name || 'Host',
              avatar: booking.property?.host?.avatar,
            };

      const createdRoom = await createOrGetChatRoom({
        bookingId: String(booking.id),
        listingId: booking.property_id,
        listingTitle: booking.property?.name || 'Property',
        listingImage: booking.property?.cover_image,
        guest: {
          userId: guestId,
          role: 'guest',
          name: guestInfo.name,
          avatar: guestInfo.avatar,
        },
        host: {
          userId: hostId,
          role: 'host',
          name: hostInfo.name,
          avatar: hostInfo.avatar,
        },
        bookingStatus: booking.status,
        checkIn: booking.check_in_date,
        checkOut: booking.check_out_date,
      });

      // Wait a brief moment for ChatRoomsProvider to pick up the new room
      // This helps avoid race conditions where navigation happens before provider updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      setRoom(createdRoom);
      navigate(`/chats/${booking.id}`);
    } catch (err) {
      console.error('Failed to create chat room before navigation:', err);
      setError('Failed to create chat room');
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount =
    booking && userRole ? getUnreadForBooking(String(booking.id)) : 0;

  return {
    room,
    isLoading,
    error,
    unreadCount,
    userRole,
    openChat,
  };
};
