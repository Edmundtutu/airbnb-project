import React, { useRef } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Shop } from '@/types';

interface ShopMarkerProps {
  shop: Shop;
  onMarkerClick: (shop: Shop, event: any) => void;
}

const ShopMarker: React.FC<ShopMarkerProps> = ({ shop, onMarkerClick }) => {
  const markerRef = useRef<any>(null);

  // Create custom marker icon with shop avatar
  const createCustomIcon = (avatarUrl?: string) => {
    const iconHtml = `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid #3b82f6;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        overflow: hidden;
      ">
        ${avatarUrl 
          ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
          : `<div style="width: 100%; height: 100%; background: #3b82f6; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${shop.name.charAt(0)}</div>`
        }
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-shop-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  };

  return (
    <Marker
      ref={markerRef}
      position={[shop.location.lat, shop.location.lng]}
      icon={createCustomIcon(shop.avatar)}
      eventHandlers={{
        click: (e) => {
          e.originalEvent.preventDefault?.();
          onMarkerClick(shop, e);
        },
      }}
    />
  );
};

export default ShopMarker;