import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Star, 
  Heart, 
  Calendar as CalendarIcon, 
  MapPin, 
  Share,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Coffee
} from 'lucide-react';
import { Listing, Review } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { listingService } from '@/services/listingService';
import { useWishlist } from '@/context/WishlistContext';
import { useBooking } from '@/context/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const ListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { isListingWishlisted, toggleListingWishlist } = useWishlist();
  const { addItem } = useBooking();
  const { toast } = useToast();

  const { data: listingData, isLoading: loadingListing } = useQuery({
    enabled: !!id,
    queryKey: ['listing', id],
    queryFn: () => listingService.getListing(id as string),
    staleTime: 30_000,
  });

  const { data: listingReviews, isLoading: loadingReviews } = useQuery({
    enabled: !!id,
    queryKey: ['listingReviews', id],
    queryFn: () => listingService.getListingReviews(id as string),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (listingData) {
      setListing(listingData as Listing);
    }
  }, [listingData]);

  useEffect(() => {
    if (listingReviews) {
      setReviews(listingReviews as Review[]);
    }
  }, [listingReviews]);

  useEffect(() => {
    setIsLoading(loadingListing || loadingReviews);
  }, [loadingListing, loadingReviews]);

  const handleBookNow = () => {
    if (!listing || !checkInDate || !checkOutDate) {
      toast({
        title: 'Please select dates',
        description: 'Choose your check-in and check-out dates to proceed',
        variant: 'destructive',
      });
      return;
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    addItem(listing, nights, listing.property, checkInDate, checkOutDate, guests);
    toast({
      title: 'Added to bookings',
      description: `${listing.name} has been added to your bookings`,
    });
  };

  const handleToggleWishlist = () => {
    if (!listing) return;
    toggleListingWishlist(listing);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h2 className="text-xl font-medium mb-2">Listing not found</h2>
          <p className="text-muted-foreground mb-4">
            The listing you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/discover">Browse Stays</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalPrice = checkInDate && checkOutDate 
    ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) * listing.price_per_night
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Listing Images */}
        <div className="space-y-4">
          <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {listing.images?.[0] ? (
              <img src={listing.images[0]} alt={listing.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-6xl">🏠</div>
            )}
          </div>
          {listing.images?.length ? (
            <div className="grid grid-cols-4 gap-2">
              {listing.images.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer">
                  <img src={img} alt={`${listing.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Listing Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{listing.name}</h1>
            <Link to={`/properties/${listing.property.id}`} className="text-primary hover:underline">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {listing.property.name}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= listing.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium">{listing.rating}</span>
              <span className="text-muted-foreground">
                ({listing.total_reviews} reviews)
              </span>
            </div>
          </div>

          <div className="text-3xl font-bold">UGX {listing.price_per_night.toLocaleString()}/night</div>

          {/* Accommodation Details */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>Up to {listing.max_guests} guests</span>
            </div>
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-muted-foreground" />
              <span>{listing.bedrooms} bedrooms</span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-5 w-5 text-muted-foreground" />
              <span>{listing.bathrooms} bathrooms</span>
            </div>
          </div>

          {listing.description && (
            <div>
              <h3 className="font-medium mb-2">About this place</h3>
              <p className="text-muted-foreground">{listing.description}</p>
            </div>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
                {listing.amenities.slice(0, 6).map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {amenity === 'WiFi' && <Wifi className="h-4 w-4" />}
                      {amenity === 'Parking' && <Car className="h-4 w-4" />}
                      {amenity === 'Kitchen' && <Coffee className="h-4 w-4" />}
                      {!['WiFi', 'Parking', 'Kitchen'].includes(amenity) && <span>✓</span>}
                    </div>
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-4">
            <h3 className="font-medium">Select dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkInDate ? format(checkInDate, 'MMM dd') : 'Check-in'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkInDate}
                    onSelect={setCheckInDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOutDate ? format(checkOutDate, 'MMM dd') : 'Check-out'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkOutDate}
                    onSelect={setCheckOutDate}
                    disabled={(date) => date <= (checkInDate || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Guests:</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center">{guests}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setGuests(Math.min(listing.max_guests, guests + 1))}
                  disabled={guests >= listing.max_guests}
                >
                  +
                </Button>
              </div>
            </div>

            {totalPrice > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Total for {Math.ceil((checkOutDate!.getTime() - checkInDate!.getTime()) / (1000 * 60 * 60 * 24))} nights</span>
                  <span className="font-bold text-lg">UGX {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleBookNow}
              disabled={!checkInDate || !checkOutDate}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Book Now
            </Button>
            <Button variant="outline" size="lg" onClick={handleToggleWishlist}>
              <Heart className={`h-5 w-5 ${listing && isListingWishlisted(listing.id) ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="lg">
              <Share className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Reviews</h2>
        </div>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">
                Be the first to review this stay!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {review.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{review.user.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {review.comment && <p>{review.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingPage;