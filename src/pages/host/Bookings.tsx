import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHostBookings, confirmBooking, rejectBooking } from '@/services/bookingService';
import { Booking } from '@/types/bookings';
import { Skeleton } from '@/components/ui/skeleton';
import BookingCard from '@/components/shared/BookingCard';
import { toast } from "sonner";

const HostBookings: React.FC = () => {
  const { data: bookings, isLoading, isError } = useQuery<Booking[]>({
    queryKey: ['hostBookings'],
    queryFn: getHostBookings,
  });

  const handleConfirmBooking = (booking: Booking) => () => {
    confirmBooking(booking.id).then(() => toast.success('Booking confirmed successfully'));
  }

  const handleReject = (booking: Booking) => () => {
    rejectBooking(booking.id).then(() => toast.success('Booking cancelled'));
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Incoming Bookings</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Could not fetch host bookings. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">Incoming Bookings</h1>
      
      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No bookings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
          {bookings.map((booking) => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              context="host" 
              onConfirm={async () => { await confirmBooking(booking.id); toast.success('Booking confirmed successfully'); }}
              onReject={async () => { await rejectBooking(booking.id); toast.success('Booking cancelled'); }}
              onOpenConversation={() => {}}
              onStartPost={() => {}}
              isPostDisabled={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HostBookings;