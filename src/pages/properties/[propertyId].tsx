import React from 'react';
import { getImageUrl } from '@/utils/helperfunctions';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Phone, ArrowLeft, Users, Bed, Bath, Sparkles, Shield, Award, Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { propertyService } from '@/services/propertyService';
import { Property, Listing } from '@/types';

const PropertyDetails: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();

  const { data: property, isLoading: loadingProperty, error: propertyError } = useQuery<Property>({
    enabled: !!propertyId,
    queryKey: ['property', propertyId],
    queryFn: () => propertyService.getProperty(propertyId as string),
    staleTime: 30_000,
  });

  const { data: listings, isLoading: loadingListings } = useQuery({
    enabled: !!propertyId,
    queryKey: ['propertyListings', propertyId],
    queryFn: async () => {
      const response = await propertyService.getPropertyListings(propertyId as string);
      return response;
    },
    staleTime: 30_000,
  });

  if (loadingProperty) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-accent"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <Home className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-ink">Property Not Found</h2>
        {propertyError && (
          <p className="text-sm text-destructive mb-4 text-center">{(propertyError as Error).message}</p>
        )}
        <Button onClick={() => navigate(-1)} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      {/* Back button with brand color */}
      <Button 
        variant="ghost" 
        className="mb-6 text-ink hover:text-primary hover:bg-primary/10 transition-colors"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Property Profile with enhanced brand styling */}
      <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-yellowcard/30 to-primary/5 shadow-playful">
        <CardContent className="flex flex-col md:flex-row items-center gap-6 p-6">
          <div className="w-28 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0 border-2 border-primary/20">
            {property.cover_image ? (
              <img src={getImageUrl(property.cover_image) ?? ''} alt={property.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-4xl">
                {property.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <h2 className="text-2xl font-bold text-ink group">
                {property.name}
                <div className="h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300"></div>
              </h2>
              {property.verified && (
                <Badge className="bg-accent text-ink font-bold px-2 py-1 shadow-sm border border-accent/50">
                  <Shield className="h-3 w-3 fill-current mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            
            {/* Rating with brand colors */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center gap-1 bg-accent/20 px-3 py-1.5 rounded-full">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-bold text-sm text-ink">{property.rating}</span>
                <span className="text-xs text-ink-muted">/5</span>
                <span className="text-xs text-ink-muted">({property.total_reviews})</span>
              </div>
            </div>

            {/* Location and Contact with brand colors */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-center mb-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-3 w-3 text-primary" />
                </div>
                <span className="text-ink-muted hover:text-primary transition-colors cursor-default">{property.location.address}</span>
              </div>
              {property.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="h-3 w-3 text-primary" />
                  </div>
                  <a 
                    href={`tel:${property.phone}`} 
                    className="text-primary font-medium hover:text-primary/80 hover:underline transition-all"
                  >
                    {property.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Description with subtle brand styling */}
            {property.description && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-ink">About this property</span>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed">{property.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listings Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-ink">Available Stays</h3>
          <Badge className="bg-primary/10 text-primary font-bold px-2 py-1">
            {(listings as Listing[] | undefined)?.length || 0}
          </Badge>
        </div>
      </div>

      {/* Listings Grid */}
      {loadingListings ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(listings as Listing[] | undefined)?.length === 0 ? (
            <Card className="col-span-full border-primary/20 bg-primary/5">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bed className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-lg font-bold mb-2 text-ink">No listings found</h4>
                <p className="text-ink-muted mb-4">This property doesn't have any available stays yet.</p>
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                  Check back later
                </Button>
              </CardContent>
            </Card>
          ) : (
            (listings as Listing[] | undefined)?.map((listing) => (
              <Card 
                key={listing.id} 
                className="h-full flex flex-col border-2 border-border hover:border-primary/30 hover:shadow-playful transition-all duration-200"
              >
                <CardContent className="p-4 flex flex-col flex-1">
                  {/* Image with brand accent border */}
                  <div className="relative w-full h-40 bg-muted rounded-lg mb-3 overflow-hidden border-2 border-primary/10 group">
                    {listing.images && listing.images.length > 0 ? (
                      <img 
                        src={getImageUrl(listing.images[0]) ?? ''} 
                        alt={listing.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">{listing.name.charAt(0)}</span>
                      </div>
                    )}
                    
                    {/* Price badge with strong brand presence */}
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground font-bold px-2 py-1 shadow-lg">
                      UGX {listing.price_per_night.toLocaleString()}
                    </Badge>
                    
                    {/* Rating badge with accent color */}
                    {listing.rating > 0 && (
                      <Badge className="absolute top-2 right-2 bg-accent text-ink font-bold px-2 py-1 shadow-lg">
                        <Star className="h-3 w-3 fill-current mr-1" />
                        {listing.rating}
                      </Badge>
                    )}
                  </div>

                  <h4 className="font-bold text-lg mb-1 text-ink truncate group">
                    {listing.name}
                    <div className="h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300"></div>
                  </h4>
                  <p className="text-sm text-ink-muted mb-2 line-clamp-2">{listing.description}</p>
                  
                  {/* Accommodation details with brand icons */}
                  <div className="flex items-center gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-3 w-3 text-primary" />
                      </div>
                      <span className="font-medium text-ink">{listing.max_guests}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bed className="h-3 w-3 text-primary" />
                      </div>
                      <span className="font-medium text-ink">{listing.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bath className="h-3 w-3 text-primary" />
                      </div>
                      <span className="font-medium text-ink">{listing.bathrooms}</span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-primary font-bold text-base">
                        UGX {listing.price_per_night.toLocaleString()}
                        <span className="text-xs font-normal text-ink-muted">/night</span>
                      </div>
                      <Badge variant="outline" className="border-primary/30 text-primary font-medium">
                        {listing.category}
                      </Badge>
                    </div>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;