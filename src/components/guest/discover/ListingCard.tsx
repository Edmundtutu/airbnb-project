import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Listing } from '@/types';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/utils/helperfunctions';

type ListingCardProps = {
  listing: Listing;
  className?: string;
  showProperty?: boolean;
  showRating?: boolean;
  showWishlistButton?: boolean;
  onRemoveWishlist?: (listingId: string) => void;
  // Legacy props for backward compatibility
  product?: Listing;
  showShop?: boolean;
  showFavoriteButton?: boolean;
  onRemoveFavorite?: (productId: string) => void;
};

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  className,
  showProperty = true,
  showRating = true,
  showWishlistButton = true,
  onRemoveWishlist,
  // Legacy props
  product,
  showShop,
  showFavoriteButton,
  onRemoveFavorite,
}) => {
  // Use legacy props if provided for backward compatibility
  const actualListing = product || listing;
  const actualShowProperty = showShop !== undefined ? showShop : showProperty;
  const actualShowWishlistButton = showFavoriteButton !== undefined ? showFavoriteButton : showWishlistButton;
  const actualOnRemoveWishlist = onRemoveFavorite || onRemoveWishlist;

  const { isListingWishlisted, toggleListingWishlist } = useWishlist();
  const { toast } = useToast();
  
  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasWishlisted = isListingWishlisted(actualListing.id);
    toggleListingWishlist(actualListing);
    toast({
      title: wasWishlisted ? 'Removed from wishlist' : 'Added to wishlist',
      description: wasWishlisted ? 'Listing removed from your wishlist' : 'Listing added to your wishlist',
    });
  };

  // Carousel navigation
  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === (actualListing.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? (actualListing.images?.length || 1) - 1 : prev - 1
    );
  };

  const goToImage = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  const images = (actualListing.images || []).map(img => getImageUrl(img)).filter((url): url is string => url !== null);
  const hasMultipleImages = images.length > 1;

  return (
    <Card className={`group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-sm rounded-lg ${className ?? ''}`}>
      <CardContent className="p-0 h-full flex flex-col">
        <div className="relative flex-1">
          {/* Image Container - Takes most of the card space */}
          <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden rounded-t-lg relative">
            {images.length > 0 ? (
              <>
                <Link to={`/listing/${actualListing.id}`} className="w-full h-full">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${actualListing.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </Link>
                
                {/* Carousel Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="text-4xl text-muted-foreground">🏠</div>
            )}
          </div>

          {/* Carousel Indicators */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToImage(e, index)}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Wishlist Button */}
          {actualShowWishlistButton && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-3 right-3 bg-white/90 hover:bg-white h-8 w-8 shadow-md ${
                isListingWishlisted(actualListing.id) ? 'text-red-500' : 'text-gray-600'
              }`}
              onClick={handleToggleWishlist}
            >
              <Heart
                className={`h-4 w-4 ${
                  isListingWishlisted(actualListing.id) ? 'fill-current' : ''
                }`}
              />
            </Button>
          )}

          {/* Price and Rating Container */}
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            {/* Price Badge */}
            <Badge className="bg-white/90 text-foreground hover:bg-white font-semibold border-0 shadow-sm">
              UGX {actualListing.price_per_night.toLocaleString()}
            </Badge>

            {/* Rating Badge - Now positioned next to price */}
            {showRating && actualListing.rating > 0 && (
              <div className="bg-black/70 text-white px-2 py-1 rounded-full flex items-center space-x-1">
                <Star className="h-3 w-3 fill-white" />
                <span className="text-xs font-medium">{actualListing.rating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Content Area - Only essential info */}
        <div className="p-3 space-y-1">
          <Link to={`/listing/${actualListing.id}`}>
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {actualListing.name}
            </h3>
          </Link>

          {actualShowProperty && actualListing.property?.name && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {actualListing.property.name}
              </span>
            </div>
          )}

          {/* Guest capacity - only show if relevant */}
          {actualListing.max_guests > 0 && actualListing.max_guests < 8 && (
            <div className="text-xs text-muted-foreground">
              · Up to {actualListing.max_guests} guests
            </div>
          )}
        </div>

        {/* Remove from wishlist button (only when needed) */}
        {actualOnRemoveWishlist && (
          <div className="p-3 pt-0">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                actualOnRemoveWishlist(actualListing.id);
              }}
            >
              Remove from Wishlist
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { ListingCard };

// Legacy export for backward compatibility
export { ListingCard as ProductCard };