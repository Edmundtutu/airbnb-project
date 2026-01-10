import React, { useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '@/types';
import { getImageUrl } from '@/utils/helperfunctions';

interface PropertyMarkerProps {
  property: Property;
  onMarkerClick: (property: Property) => void;
}

const PropertyMarker: React.FC<PropertyMarkerProps> = ({ property, onMarkerClick }) => {
  const markerRef = useRef<any>(null);

  // Create custom marker icon with property image
  const createCustomIcon = (imageUrl?: string) => {
    const iconHtml = `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 8px;
        border: 3px solid #10b981;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        overflow: hidden;
      ">
        ${imageUrl 
          ? `<img src="${getImageUrl(imageUrl) ?? ''}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />`
          : `<div style="width: 100%; height: 100%; background: #10b981; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border-radius: 4px;">${property.name.charAt(0)}</div>`
        }
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-property-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  };

  return (
    <Marker
      ref={markerRef}
      position={[property.location.lat, property.location.lng]}
      icon={createCustomIcon(property.cover_image)}
      eventHandlers={{
        click: (e) => {
          e.originalEvent.preventDefault?.();
          onMarkerClick(property);
        },
      }}
    />
  );
};

// Legacy alias for backward compatibility
export const ShopMarker = PropertyMarker;

export default PropertyMarker;