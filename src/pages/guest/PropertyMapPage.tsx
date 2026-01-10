import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropertyMap from '@/components/features/PropertyMap';
import { Property } from '@/types';
import { useGeolocation } from '@/hooks/utils/useGeolocation';

const PropertyMapPage: React.FC = () => {
  const navigate = useNavigate();

  const handlePropertySelect = (property: Property) => {
    navigate(`/properties/${property.id}`);
  };

  return (
    <PropertyMap
      onPropertySelect={handlePropertySelect}
      className="h-[60vh] sm:h-[70vh] lg:h-[600px]"
      fetchFromBackend
    />
  );
};

export default PropertyMapPage;