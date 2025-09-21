import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Heart, Calendar } from 'lucide-react';
import { Listing } from '@/types';
import { useWishlist } from '@/context/WishlistContext';
import { useBooking } from '@/context/BookingContext';
import { useToast } from '@/hooks/use-toast';

type ListingCardProps = {
  listing: Listing;
  className?: string;
  showProperty?: boolean;
  showRating?: boolean;
  showWishlistButton?: boolean;
  showBookButton?: boolean;
  onRemoveWishlist?: (listingId: string) => void;
  // Legacy props for backward compatibility
  product?: Listing;
  showShop?: boolean;
  showFavoriteButton?: boolean;
  showAddButton?: boolean;
  onRemoveFavorite?: (productId: string) => void;
};

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  className,
  showProperty = true,
  showRating = true,
  showWishlistButton = true,
  showBookButton = true,
  onRemoveWishlist,
  // Legacy props
  product,
  showShop,
  showFavoriteButton,
  showAddButton,
  onRemoveFavorite,
}) => {
  // Use legacy props if provided for backward compatibility
  const actualListing = product || listing;
  const actualShowProperty = showShop !== undefined ? showShop : showProperty;
  const actualShowWishlistButton = showFavoriteButton !== undefined ? showFavoriteButton : showWishlistButton;
  const actualShowBookButton = showAddButton !== undefined ? showAddButton : showBookButton;
  const actualOnRemoveWishlist = onRemoveFavorite || onRemoveWishlist;

  const { isListingWishlisted, toggleListingWishlist } = useWishlist();
  const { addItem } = useBooking();
  const { toast } = useToast();

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const wasWishlisted = isListingWishlisted(actualListing.id);
    toggleListingWishlist(actualListing);
    toast({
      title: wasWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      description: wasWishlisted ? 'Listing removed from your wishlist' : 'Listing added to your wishlist',
    });
  };

  const handleBookListing = (e: React.MouseEvent) => {
    e.preventDefault();
    // For now, we'll use placeholder dates - in a real app, this would open a date picker
    const checkIn = new Date();
    const checkOut = new Date(checkIn.getTime() + 24 * 60 * 60 * 1000); // Next day
    addItem(actualListing, 1, actualListing.property, checkIn, checkOut, 1);
    toast({ title: 'Added to bookings', description: `${actualListing.name} has been added to your bookings` });
  };

  // Legacy method for backward compatibility
  const handleToggleFavorite = handleToggleWishlist;
  const handleAddToBookings = handleBookListing;

  return (
    <Card className={`group hover:shadow-lg transition-shadow ${className ?? ''}`}>
      <CardContent className="p-0">
        <div className="relative">
          <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
            {actualListing.images?.[0] ? (
              <img
                src={actualListing.images[0]}
                alt={actualListing.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="text-2xl md:text-4xl text-muted-foreground">🏠</div>
            )}
          </div>
          {actualShowWishlistButton && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-2 right-2 bg-white/80 hover:bg-white h-6 w-6 md:h-8 md:w-8 xl:h-7 xl:w-7 ${
                isListingWishlisted(actualListing.id) ? 'text-red-500' : ''
              }`}
              onClick={handleToggleWishlist}
            >
              <Heart
                className={`h-3 w-3 md:h-4 md:w-4 xl:h-3 xl:w-3 ${
                  isListingWishlisted(actualListing.id) ? 'fill-current' : ''
                }`}
              />
            </Button>
          )}
        </div>

        <div className="p-3 md:p-4 xl:p-3">
          <Link to={`/listing/${actualListing.id}`}>
            <h3 className="font-medium text-sm md:text-base xl:text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
              {actualListing.name}
            </h3>
          </Link>

          {actualShowProperty && (
            <div className="flex items-center gap-1 md:gap-2 xl:gap-1 mb-2">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 xl:h-3 xl:w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs md:text-sm xl:text-xs text-muted-foreground truncate">
                {actualListing.property?.name}
              </span>
            </div>
          )}

          {showRating && (
            <div className="flex items-center gap-1 md:gap-2 xl:gap-1 mb-2 md:mb-3 xl:mb-2">
              <div className="flex items-center">
                <Star className="h-3 w-3 md:h-4 md:w-4 xl:h-3 xl:w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs md:text-sm xl:text-xs ml-1">{actualListing.rating}</span>
                <span className="text-xs text-muted-foreground ml-1 hidden md:inline xl:hidden">
                  ({actualListing.total_reviews})
                </span>
              </div>
            </div>
          )}

          <div className={`flex items-center justify-between ${actualShowBookButton ? 'xl:flex-col xl:items-start xl:gap-2' : ''}`}>
            <span className="text-sm md:text-lg xl:text-sm font-bold">UGX {actualListing.price_per_night.toLocaleString()}/night</span>
            <div className="flex gap-2">
              {actualOnRemoveWishlist && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  onClick={(e) => {
                    e.preventDefault();
                    actualOnRemoveWishlist(actualListing.id);
                  }}
                >
                  Remove
                </Button>
              )}
              {actualShowBookButton && (
                <Button
                  size="sm"
                  className="h-6 md:h-8 xl:h-6 xl:w-full px-2 md:px-3 xl:px-2 text-xs xl:text-xs"
                  onClick={handleBookListing}
                  disabled={actualListing.max_guests === 0}
                >
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 xl:h-3 xl:w-3 mr-1" />
                  <span className="hidden md:inline xl:inline">Book</span>
                </Button>
              )}
            </div>
          </div>

          {actualListing.max_guests < 5 && actualListing.max_guests > 0 && (
            <Badge variant="destructive" className="mt-2 text-xs xl:text-xs">
              Max {actualListing.max_guests} guests
            </Badge>
          )}

          {actualListing.max_guests === 0 && (
            <Badge variant="secondary" className="mt-2 text-xs xl:text-xs">
              Not available
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingCard;

// Legacy export for backward compatibility
export { ListingCard as ProductCard };


