import React from 'react';
import { getImageUrl } from '@/utils/helperfunctions';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Phone, ArrowLeft, Users, Bed, Bath } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
        {propertyError && (
          <p className="text-sm text-destructive mb-2">{(propertyError as Error).message}</p>
        )}
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      {/* Back button */}
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Property Profile */}
      <Card className="mb-6">
        <CardContent className="flex flex-col md:flex-row items-center gap-6 p-6">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {property.cover_image ? (
              <img src={getImageUrl(property.cover_image) ?? ''} alt={property.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl">
                {property.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-1">{property.name}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-base font-medium">{property.rating}</span>
                <span className="text-xs text-muted-foreground">({property.total_reviews})</span>
              </div>
              <Badge variant={property.verified ? 'default' : 'secondary'} className="text-xs">
                {property.verified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 items-center md:items-start">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{property.location.address}</span>
              </div>
              {property.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${property.phone}`} className="hover:underline text-primary">{property.phone}</a>
                </div>
              )}
            </div>
            {property.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{property.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      <h3 className="text-xl font-semibold mb-4">Available Stays</h3>
      {loadingListings ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(listings as Listing[] | undefined)?.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8">No listings found for this property.</div>
          ) : (
            (listings as Listing[] | undefined)?.map((listing) => (
              <Card key={listing.id} className="h-full flex flex-col">
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="w-full h-40 bg-muted rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={getImageUrl(listing.images[0]) ?? ''} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">{listing.name.charAt(0)}</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-lg mb-1 truncate">{listing.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{listing.description}</p>
                  
                  {/* Accommodation details */}
                  <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{listing.max_guests}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span>{listing.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      <span>{listing.bathrooms}</span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-base">UGX {listing.price_per_night.toLocaleString()}/night</span>
                      <Badge variant="secondary" className="text-xs">{listing.category}</Badge>
                    </div>
                    <Button className="w-full" onClick={() => navigate(`/listing/${listing.id}`)}>
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