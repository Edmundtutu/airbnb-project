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
  Coffee,
  ChevronLeft,
  ChevronRight,
  Home,
  Shield,
  CheckCircle
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  const nextImage = () => {
    if (!listing?.images?.length) return;
    setCurrentImageIndex(prev => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!listing?.images?.length) return;
    setCurrentImageIndex(prev => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
            <Link to="/">Browse Stays</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalPrice = checkInDate && checkOutDate 
    ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) * listing.price_per_night
    : 0;

  return (
    <div className="lg:max-w-6xl lg:mx-auto">
      {/* Mobile-optimized layout */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
        
        {/* Image Gallery - Mobile Enhanced */}
        <div className="lg:space-y-4">
          <div className="relative aspect-[4/3] bg-muted overflow-hidden lg:rounded-lg">
            {listing.images?.[currentImageIndex] ? (
              <>
                <img 
                  src={listing.images[currentImageIndex]} 
                  alt={listing.name} 
                  className="w-full h-full object-cover" 
                />
                
                {/* Image Navigation */}
                {listing.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white h-8 w-8"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white h-8 w-8"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {listing.images.map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            index === currentImageIndex 
                              ? 'bg-white scale-125' 
                              : 'bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🏠</div>
            )}
            
            {/* Floating Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/90 hover:bg-white h-8 w-8 shadow-md"
                onClick={handleToggleWishlist}
              >
                <Heart className={`h-4 w-4 ${
                  isListingWishlisted(listing.id) ? 'fill-current text-red-500' : ''
                }`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/90 hover:bg-white h-8 w-8 shadow-md"
              >
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image Thumbnails - Hidden on mobile, shown on desktop */}
          {listing.images?.length > 1 && (
            <div className="hidden lg:grid lg:grid-cols-4 gap-2">
              {listing.images.slice(0, 4).map((img, i) => (
                <div 
                  key={i} 
                  className={`aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer border-2 ${
                    i === currentImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setCurrentImageIndex(i)}
                >
                  <img src={img} alt={`${listing.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Area - Mobile Optimized */}
        <div className="px-4 lg:px-0 lg:space-y-6">
          
          {/* Header Section */}
          <div className="pt-4 lg:pt-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold mb-2 leading-tight">{listing.name}</h1>
                <Link to={`/properties/${listing.property.id}`} className="text-primary hover:underline">
                  <div className="flex items-center gap-2 text-sm lg:text-base">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">{listing.property.name}</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Rating and Reviews - Compact */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-sm">{listing.rating}</span>
              </div>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm underline">
                {listing.total_reviews} reviews
              </span>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y">
            <div className="text-center">
              <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Guests</div>
              <div className="font-semibold text-sm">{listing.max_guests}</div>
            </div>
            <div className="text-center">
              <Bed className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Bedrooms</div>
              <div className="font-semibold text-sm">{listing.bedrooms}</div>
            </div>
            <div className="text-center">
              <Bath className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Bathrooms</div>
              <div className="font-semibold text-sm">{listing.bathrooms}</div>
            </div>
          </div>

          {/* Price Section */}
          <div className="py-4 border-b">
            <div className="text-2xl lg:text-3xl font-bold">
              UGX {listing.price_per_night.toLocaleString()}
              <span className="text-base font-normal text-muted-foreground"> night</span>
            </div>
          </div>

          {/* Booking Widget - Sticky on Mobile */}
          <div className="lg:space-y-6">
            {/* Date Selection */}
            <div className="space-y-4 py-4">
              <h3 className="font-semibold text-lg">Select dates and guests</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start h-12 border-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <div className="text-left">
                        <div className="text-xs font-medium">CHECK-IN</div>
                        <div className="text-sm">{checkInDate ? format(checkInDate, 'MMM dd') : 'Add date'}</div>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                    <Button variant="outline" className="justify-start h-12 border-2">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <div className="text-left">
                        <div className="text-xs font-medium">CHECK-OUT</div>
                        <div className="text-sm">{checkOutDate ? format(checkOutDate, 'MMM dd') : 'Add date'}</div>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOutDate}
                      onSelect={setCheckOutDate}
                      disabled={(date) => date <= (checkInDate || new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Guests Selector */}
              <div className="border-2 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Guests</div>
                    <div className="text-sm text-muted-foreground">{guests} guest{guests !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                    >
                      -
                    </Button>
                    <span className="w-6 text-center font-medium">{guests}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setGuests(Math.min(listing.max_guests, guests + 1))}
                      disabled={guests >= listing.max_guests}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              {totalPrice > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">UGX {listing.price_per_night.toLocaleString()} x {Math.ceil((checkOutDate!.getTime() - checkInDate!.getTime()) / (1000 * 60 * 60 * 24))} nights</span>
                    <span className="font-medium">UGX {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">UGX {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Book Button - Sticky on Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 lg:static lg:border-0 lg:p-0">
              <Button
                size="lg"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-red-imperial to-red-cinnabar hover:from-red-imperial/90 hover:to-red-cinnabar/90"
                onClick={handleBookNow}
                disabled={!checkInDate || !checkOutDate}
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                {!checkInDate || !checkOutDate ? 'Select dates to book' : 'Book Now'}
              </Button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="hidden lg:flex lg:items-center lg:gap-6 lg:py-4 lg:border-t lg:border-b">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Secure booking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Instant confirmation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description and Amenities Section */}
      <div className="px-4 lg:px-0 lg:mt-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Description */}
          <div className="py-6 border-b lg:border-0">
            <h2 className="text-xl font-semibold mb-4">About this place</h2>
            <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
          </div>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="py-6 border-b lg:border-0">
              <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
              <div className="grid grid-cols-1 gap-3">
                {listing.amenities.slice(0, 8).map((amenity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-green-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
                {listing.amenities.length > 8 && (
                  <Button variant="ghost" className="justify-start text-primary font-medium">
                    Show all {listing.amenities.length} amenities
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section - Mobile Optimized */}
      <div className="px-4 lg:px-0 lg:mt-8">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-lg">{listing.rating}</span>
            </div>
            <span className="text-lg font-semibold">·</span>
            <span className="text-lg font-semibold">{listing.total_reviews} reviews</span>
          </div>

          {reviews.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                <p className="text-muted-foreground">
                  Be the first to review this stay!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <Card key={review.id} className="border-0 shadow-none">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-medium">
                          {review.user.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{review.user.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
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
                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {reviews.length > 3 && (
                <Button variant="outline" className="w-full">
                  Show all {reviews.length} reviews
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Spacing for Mobile Sticky Button */}
      <div className="h-20 lg:h-0"></div>
    </div>
  );
};

export default ListingPage;