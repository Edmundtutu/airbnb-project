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

  // Check if listing is verified or has special status
  const isVerified = actualListing.tags?.includes('verified');
  const isPopular = actualListing.rating > 4.5;

  return (
    <Card className={`group cursor-pointer bg-card border border-border rounded-xl shadow-sm
      hover:shadow-playful hover:-translate-y-1 transition-all duration-300
      focus-within:ring-2 focus-within:ring-primary/40 active:scale-[0.99] ${className ?? ''}`}>
      <CardContent className="p-0 h-full flex flex-col">
        <div className="relative flex-1">
          {/* Image Container with brand accent border */}
          <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden rounded-t-xl relative
            after:absolute after:inset-0 after:border-2 after:border-transparent after:rounded-t-xl 
            group-hover:after:border-accent/30 group-hover:after:transition-all group-hover:after:duration-300">
            {images.length > 0 ? (
              <>
                <Link to={`/listing/${actualListing.id}`} className="w-full h-full">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${actualListing.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                
                {/* Brand Status Badges */}
                {isVerified && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-accent text-ink font-bold text-[10px] px-1.5 py-0.5 
                      shadow-sm border border-accent/50 rounded-full flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      Verified
                    </Badge>
                  </div>
                )}
                
                {isPopular && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground 
                      font-bold text-[10px] px-1.5 py-0.5 shadow-sm border border-primary/50 rounded-full 
                      flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-current" />
                      Popular
                    </Badge>
                  </div>
                )}
                
                {/* Carousel Navigation Arrows with brand colors */}
                {hasMultipleImages && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-primary/90 
                        hover:bg-primary text-primary-foreground h-7 w-7 opacity-0 
                        group-hover:opacity-100 transition-all duration-200 rounded-full
                        shadow-lg hover:shadow-xl hover:scale-110"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary/90 
                        hover:bg-primary text-primary-foreground h-7 w-7 opacity-0 
                        group-hover:opacity-100 transition-all duration-200 rounded-full
                        shadow-lg hover:shadow-xl hover:scale-110"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="text-4xl text-muted-foreground flex items-center justify-center w-full h-full">
                <div className="bg-primary/10 rounded-xl p-4">
                  <div className="text-3xl">🏠</div>
                </div>
              </div>
            )}
          </div>

          {/* Carousel Indicators with brand color */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToImage(e, index)}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-primary shadow-[0_0_4px_hsl(var(--primary))] scale-125' 
                      : 'bg-white/80 hover:bg-primary/80 hover:scale-110'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Wishlist Button with enhanced brand interaction */}
          {actualShowWishlistButton && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-3 right-3 h-8 w-8 shadow-md rounded-full
                transition-all duration-200 hover:scale-110 active:scale-95
                ${
                  isListingWishlisted(actualListing.id) 
                    ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                    : 'bg-white/90 text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
              onClick={handleToggleWishlist}
            >
              <Heart
                className={`h-4 w-4 transition-all ${
                  isListingWishlisted(actualListing.id) 
                    ? 'fill-primary animate-pulse' 
                    : 'group-hover:stroke-primary'
                }`}
              />
            </Button>
          )}

          {/* Price and Rating Container with brand emphasis */}
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            {/* Price Badge - Using primary color for emphasis */}
            <Badge className="bg-primary text-primary-foreground font-bold px-2.5 py-1 
              shadow-md border border-primary/50 rounded-lg hover:bg-primary/90 
              transition-colors duration-200 group-hover:scale-105">
              UGX {actualListing.price_per_night.toLocaleString()}
            </Badge>

            {/* Rating Badge - Using accent color for contrast */}
            {showRating && actualListing.rating > 0 && (
              <div className={`bg-accent text-ink px-2 py-1 rounded-full flex items-center space-x-1 
                shadow-sm border border-accent/50 ${actualListing.rating > 4.5 ? 'animate-pulse' : ''}`}>
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs font-bold">{actualListing.rating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Area with enhanced typography */}
        <div className="p-3 space-y-1.5">
          <Link to={`/listing/${actualListing.id}`} className="block group">
            <h3 className="font-bold text-sm line-clamp-1 text-ink 
              group-hover:text-primary transition-colors duration-200
              decoration-primary underline-offset-2">
              {actualListing.name}
            </h3>
            <div className="h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300"></div>
          </Link>

          {actualShowProperty && actualListing.property?.name && (
            <div className="flex items-center space-x-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary/70 flex-shrink-0" />
              <span className="text-xs text-ink-muted truncate font-medium">
                {actualListing.property.name}
              </span>
            </div>
          )}

          {/* Guest capacity with subtle brand hint */}
          {actualListing.max_guests > 0 && actualListing.max_guests < 8 && (
            <div className="text-xs text-ink-subtle font-medium pl-4 relative">
              <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-primary/50 rounded-full"></span>
              Up to {actualListing.max_guests} guests
            </div>
          )}

          {/* Amenities hint using brand colors */}
          {actualListing.amenities && actualListing.amenities.length > 0 && (
            <div className="flex items-center gap-1 pt-1">
              <div className="flex -space-x-1">
                {actualListing.amenities.slice(0, 3).map((amenity, index) => (
                  <div 
                    key={index}
                    className="h-5 w-5 rounded-full bg-primary/10 border border-primary/20 
                      flex items-center justify-center text-[8px] font-bold text-primary"
                  >
                    {amenity.charAt(0)}
                  </div>
                ))}
                {actualListing.amenities.length > 3 && (
                  <div className="h-5 w-5 rounded-full bg-accent/20 border border-accent/30 
                    flex items-center justify-center text-[8px] font-bold text-accent">
                    +{actualListing.amenities.length - 3}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-ink-subtle font-medium">
                {actualListing.amenities.slice(0, 2).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Remove from wishlist button with brand colors */}
        {actualOnRemoveWishlist && (
          <div className="p-3 pt-0">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs border-primary/30 text-primary 
                hover:bg-primary/10 hover:text-primary hover:border-primary/50
                transition-all duration-200 rounded-lg font-medium
                hover:shadow-sm"
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