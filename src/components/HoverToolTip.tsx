import React from 'react';
import { Star, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Shop } from '@/types';

/**
 * Props for HoverTooltip
 */
interface HoverTooltipProps {
  shop: Shop | null;
  position: { x: number; y: number };
  isVisible: boolean;
}

/**
 * Tooltip shown on shop marker hover or touch.
 */
const HoverTooltip: React.FC<HoverTooltipProps> = ({ shop, position, isVisible }) => {
  if (!isVisible || !shop) return null;

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg border p-3 max-w-xs pointer-events-none z-50"
      style={{
        left: position.x + 10,
        top: position.y - 100,
        transform: 'translateY(-50%)',
        zIndex: 10000
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {shop.avatar ? (
            <img 
              src={shop.avatar} 
              alt={shop.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {shop.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{shop.name}</h4>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">{shop.rating}</span>
            <span className="text-xs text-muted-foreground">
              ({shop.total_reviews})
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground line-clamp-2">
            {shop.location.address}
          </span>
        </div>
        {shop.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {shop.phone}
            </span>
          </div>
        )}
        {shop.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
            {shop.description}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <Badge variant={shop.verified ? 'default' : 'secondary'} className="text-xs">
          {shop.verified ? 'Verified' : 'Unverified'}
        </Badge>
        <span className="text-xs text-primary font-medium">
          Click to view details
        </span>
      </div>
      {/* Tooltip arrow */}
      <div 
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1"
        style={{ 
          width: 0, 
          height: 0, 
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '6px solid white'
        }}
      />
    </div>
  );
};

export default HoverTooltip;