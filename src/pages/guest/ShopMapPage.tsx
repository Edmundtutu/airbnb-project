import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopMap from '@/components/features/ShopMap';
import { Shop } from '@/types';
import { useGeolocation } from '@/hooks/utils/useGeolocation';

const ShopMapPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters and pagination are handled inside ShopMap to avoid duplication.

  const { location: userLocation, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();

  // Request location on component mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);


  // No fetching here; ShopMap handles fetching & filters.


  // Filtering interactions removed from page; kept within ShopMap for single source of truth.

  const handleShopSelect = (shop: Shop) => {
    // Navigate to shop page or show shop details
    navigate(`/shops/${shop.id}`);
  };

  // Pagination moved to ShopMap.

  const isLoading = geoLoading; // Only geolocation loading here
  const error = geoError; // Only geolocation error here

  if (isLoading) {
    // Display loading spinner while geolocation is loading or shops are fetching
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && ( // Show error if not loading
        <div className="text-center text-destructive py-12">Failed to load shops. Please try again later.</div>
      )}

      {/* Map Component */}
      {!isLoading && !error && (
        <ShopMap
          onShopSelect={handleShopSelect}
          className="h-[60vh] sm:h-[70vh] lg:h-[600px]"
          fetchFromBackend
        />
      )}

      {/* Pagination Controls */}
      {/* Pagination controls are inside ShopMap when backend fetching is enabled */}
    </div>
  );
};

export default ShopMapPage;