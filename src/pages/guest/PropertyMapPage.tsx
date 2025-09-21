import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropertyMap from '@/components/features/PropertyMap';
import { Property } from '@/types';
import { useGeolocation } from '@/hooks/utils/useGeolocation';

const PropertyMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { location: userLocation, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();

  // Request location on component mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const handlePropertySelect = (property: Property) => {
    navigate(`/properties/${property.id}`);
  };

  const isLoading = geoLoading;
  const error = geoError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Geolocation error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {typeof error === 'string' ? error : (error as Error).message || 'An error occurred'}
        </div>
      )}

      {/* Map Component */}
      {!isLoading && !error && (
        <PropertyMap
          onPropertySelect={handlePropertySelect}
          className="h-[60vh] sm:h-[70vh] lg:h-[600px]"
          fetchFromBackend
        />
      )}
    </div>
  );
};

export default PropertyMapPage;