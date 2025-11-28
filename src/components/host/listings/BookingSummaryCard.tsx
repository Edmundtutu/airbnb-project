import React from 'react';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { ListingReservation } from '@/types/bookings';

interface BookingSummaryCardProps {
  reservation: ListingReservation;
}

const statusVariant: Record<ListingReservation['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  checked_in: 'bg-emerald-100 text-emerald-800',
  checked_out: 'bg-slate-100 text-slate-800',
  completed: 'bg-gray-900 text-white',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
};

const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({ reservation }) => {
  const checkInDate = new Date(reservation.check_in_date);
  const checkOutDate = new Date(reservation.check_out_date);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Booking #{reservation.id}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {format(checkInDate, 'MMM d, yyyy')} — {format(checkOutDate, 'MMM d, yyyy')}
          </p>
        </div>
        <Badge className={statusVariant[reservation.status] ?? 'bg-muted text-muted-foreground'}>
          {reservation.status.replace(/_/g, ' ')}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{reservation.guest_count} guest{reservation.guest_count === 1 ? '' : 's'}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="truncate" title={reservation.property_id}>
            Property #{reservation.property_id}
          </span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              View calendar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={checkInDate}
              selected={{ from: checkInDate, to: checkOutDate }}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
};

export default BookingSummaryCard;
