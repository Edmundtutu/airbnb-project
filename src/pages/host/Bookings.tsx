import React, { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getHostBookings, confirmBooking, rejectBooking } from '@/services/bookingService';
import { Booking } from '@/types/bookings';
import { Skeleton } from '@/components/ui/skeleton';
import BookingCard from '@/components/shared/BookingCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LaravelPaginatedResponse } from '@/types/api';

const HostBookings: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | Booking['status']>('all');

  const { data, isLoading, isError, isFetching } = useQuery<LaravelPaginatedResponse<Booking>>({
    queryKey: ['hostBookings', { page, status: statusFilter }],
    queryFn: () => getHostBookings({
      page,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    placeholderData: keepPreviousData,
  });

  const bookingsResponse = data as LaravelPaginatedResponse<Booking> | undefined;
  const bookings = bookingsResponse?.data ?? [];
  const meta = bookingsResponse?.meta;

  const confirmMutation = useMutation({
    mutationFn: (bookingId: string) => confirmBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostBookings'] }).catch(() => undefined);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (bookingId: string) => rejectBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostBookings'] }).catch(() => undefined);
    },
  });

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Incoming Bookings</h1>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setPage(1);
              setStatusFilter(value as typeof statusFilter);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked_in">Checked in</SelectItem>
              <SelectItem value="checked_out">Checked out</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {(!bookings || bookings.length === 0) && !isFetching ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No bookings found.</p>
        </div>
      ) : (
        <>
          {isFetching && (
            <div className="text-sm text-muted-foreground mb-3">Refreshing bookings…</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
            {bookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                context="host" 
                onConfirm={async () => {
                  await confirmMutation.mutateAsync(booking.id);
                }}
                onReject={async () => {
                  await rejectMutation.mutateAsync(booking.id);
                }}
                onStartPost={() => {}}
                isPostDisabled
              />
            ))}
          </div>
        </>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1 || isFetching}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </p>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={meta.current_page >= meta.last_page || isFetching}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default HostBookings;