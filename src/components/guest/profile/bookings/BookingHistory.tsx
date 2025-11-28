import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGuestBookings } from '@/services/bookingService';
import { Booking } from '@/types/bookings';
import type { LaravelPaginatedResponse } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';
import BookingCard from '@/components/shared/BookingCard';

const BookingHistory: React.FC = () => {
  const { data: bookingsResponse, isLoading, isError } = useQuery<LaravelPaginatedResponse<Booking>>({
    queryKey: ['guestBookings'],
    queryFn: () => getGuestBookings({}),
  });

  const bookings = bookingsResponse?.data ?? [];
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
  const expandPostRef = useRef<() => void>(() => {});

  const handleStartPost = (booking: Booking) => {
    setActiveBookingId(booking.id);
    expandPostRef.current?.();
  };

  const activeBooking = useMemo(() => bookings.find(b => b.id === activeBookingId) ?? null, [bookings, activeBookingId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Could not fetch your bookings. Please try again later.</p>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You have no past bookings.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            context="guest"
            onStartPost={handleStartPost}
            isPostDisabled={false}
          />
        ))}
      </div>
    </div>
  );
};

export default BookingHistory;