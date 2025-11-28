import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Users, Bed, Bath, X } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking } from '@/services/bookingService';
import type { CreateBookingPayload, Booking } from '@/types/bookings';
import { format } from 'date-fns';

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    items,
    removeItem,
    clearBooking,
    getItemCount,
    getItemsByProperty,
    canCheckout,
    getTotalWithAddOns,
    getItemTotalWithAddOns,
  } = useBooking();

  const [notes, setNotes] = useState('');
  const itemsByProperty = useMemo(() => getItemsByProperty(), [items]);
  const propertyIds = Object.keys(itemsByProperty);
  const total = useMemo(() => getTotalWithAddOns(), [items]);
  const itemCount = getItemCount();

  const { mutateAsync: placeBookings, isPending: isProcessingBooking } = useMutation<Booking[], Error, CreateBookingPayload[]>(
    {
      mutationFn: async (payloads) => {
        const results = await Promise.all(payloads.map(payload => createBooking(payload)));
        return results;
      },
      onSuccess: () => {
        clearBooking();
        queryClient.invalidateQueries({ queryKey: ['bookings'] }).catch(() => undefined);
        queryClient.invalidateQueries({ queryKey: ['guestBookings'] }).catch(() => undefined);
        toast({
          title: 'Booking confirmed!',
          description: 'You can view your bookings in your profile.',
        });
        navigate('/profile');
      },
      onError: (error: Error) => {
        console.error('Booking failed', error);
        toast({
          title: 'Booking failed',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      },
    }
  );

  const handleCheckout = async () => {
    if (!canCheckout) return;

    const payloads = Object.entries(itemsByProperty).map(([propertyId, propertyItems]) => ({
      property_id: propertyId,
      details: propertyItems.map((item) => ({
        listing_id: item.listing.id,
        nights: item.nights,
        price_per_night: item.basePricePerNight,
        add_ons: (item.addOns ?? []).map((a) => ({
          listing_id: a.listing.id,
          nights: a.nights,
          original_price: a.originalPrice,
          discounted_price: a.discountedPrice,
        })),
      })),
      check_in_date: format(propertyItems[0].checkInDate, 'yyyy-MM-dd'),
      check_out_date: format(propertyItems[0].checkOutDate, 'yyyy-MM-dd'),
      guest_count: propertyItems[0].guests,
      notes: notes || undefined,
    } satisfies CreateBookingPayload));

    if (payloads.length === 0) {
      return;
    }

    try {
      await placeBookings(payloads);
    } catch (error) {
      console.error('An error occurred during booking:', error);
    }
  };

  if (!canCheckout) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-2">No bookings yet</h2>
            <p className="text-muted-foreground mb-6">
              Start exploring to add stays to your bookings
            </p>
            <Button asChild>
              <Link to="/">Start Exploring</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-2 sm:max-w-6xl sm:mx-auto space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Your Bookings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {itemCount} stay{itemCount !== 1 ? 's' : ''} from {propertyIds.length} propert{propertyIds.length !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Booking Items by Property */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {Object.entries(itemsByProperty).map(([propertyId, propertyItems]) => (
            <Card key={propertyId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                      {propertyItems[0].property.cover_image ? (
                        <img 
                          src={propertyItems[0].property.cover_image} 
                          alt={propertyItems[0].property.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {propertyItems[0].property.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{propertyItems[0].property.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{propertyItems.length} listing{propertyItems.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    UGX {propertyItems.reduce((sum, item) => sum + (item.basePricePerNight * item.nights), 0).toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {propertyItems.map((item) => (
                  <div key={item.id} className="flex gap-3 sm:gap-4 p-3 rounded-lg border">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.listing.images?.[0] ? (
                        <img 
                          src={item.listing.images[0]} 
                          alt={item.listing.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-xl sm:text-2xl">🏠</div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/listing/${item.listing.id}`}
                            className="font-medium hover:text-primary text-sm sm:text-base line-clamp-2"
                          >
                            {item.listing.name}
                          </Link>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                            {format(item.checkInDate, 'MMM dd')} - {format(item.checkOutDate, 'MMM dd')}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{item.guests} guests</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{item.nights} nights</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ml-2"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          <div className="font-medium text-sm sm:text-base">
                            UGX {getItemTotalWithAddOns(item.id).toLocaleString()}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            UGX {item.basePricePerNight.toLocaleString()}/night
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={clearBooking}>
              Clear Bookings
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Continue Exploring</Link>
            </Button>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} nights)</span>
                <span>UGX {total.toLocaleString()}</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>UGX {total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Special Requests (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests for your stay..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessingBooking}
              >
                {isProcessingBooking ? 'Processing...' : `Confirm Booking - UGX ${total.toLocaleString()}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Bookings;