import React, { useState, useEffect, useMemo, } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MapPin, 
  Navigation,
  Crosshair,
  Filter,
  X,
  Phone,
  Star,
  Layers,
  MapIcon
} from 'lucide-react';
import { Shop } from '@/types';
import { useGeolocation } from '@/hooks/utils/useGeolocation';
import { getShopsWithinRadius, formatDistance, reverseGeocode } from '@/utils/location';
import ShopMarker from './ShopMarker';
import HoverTooltip from '../HoverToolTip';
import '@/styles/custom.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shopService } from '@/services/shopService';
import type { LaravelPaginatedResponse } from '@/types';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ShopMapProps {
  shops?: Shop[];
  onShopSelect?: (shop: Shop) => void;
  onLocationTag?: (location: { lat: number; lng: number; address: string }) => void;
  showTagging?: boolean;
  className?: string;
  fetchFromBackend?: boolean; // if true (default), fetch shops using backend with filters
}

import { SHOP_CATEGORIES } from '@/shared/constants/shops';

const MAP_STYLES = [
  { value: 'osm', label: 'Street Map', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { value: 'satellite', label: 'Satellite', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' },
  { value: 'hybrid', label: 'Hybrid', url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' },
  { value: 'terrain', label: 'Terrain', url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}' },
];

// Helper function to get shop category from description/name
const getShopCategory = (shop: Shop): string => {
  const name = shop.name.toLowerCase();
  const desc = shop.description?.toLowerCase() || '';
  
  if (name.includes('electronic') || desc.includes('electronic') || desc.includes('gadget')) return 'electronics';
  if (name.includes('fashion') || desc.includes('clothes') || desc.includes('trendy')) return 'fashion';
  if (name.includes('market') || desc.includes('food') || desc.includes('fruit')) return 'food';
  if (name.includes('beauty') || desc.includes('cosmetic') || desc.includes('beauty')) return 'beauty';
  if (name.includes('sport') || desc.includes('sport') || desc.includes('fitness')) return 'sports';
  if (name.includes('book') || desc.includes('book') || desc.includes('education')) return 'books';
  if (name.includes('home') || desc.includes('furniture') || desc.includes('garden')) return 'home';
  if (name.includes('tech') || desc.includes('repair') || desc.includes('computer')) return 'tech';
  
  return 'all';
};

interface LocationTaggingProps {
  onLocationTag: (location: { lat: number; lng: number; address: string }) => void;
}

const LocationTagger: React.FC<LocationTaggingProps> = ({ onLocationTag }) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingAddress, setIsGettingAddress] = useState(false);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setSelectedLocation({ lat, lng });
      setIsGettingAddress(true);
      
      try {
        const address = await reverseGeocode({ lat, lng });
        onLocationTag({ lat, lng, address });
      } catch (error) {
        console.error('Failed to get address:', error);
        onLocationTag({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      } finally {
        setIsGettingAddress(false);
      }
    },
  });

  if (!selectedLocation) return null;

  return (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
      <Popup>
        <div className="text-center p-2">
          {isGettingAddress ? (
            <p className="text-sm">Getting address...</p>
          ) : (
            <p className="text-sm">Location selected!</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

const ShopMap: React.FC<ShopMapProps> = ({ 
  shops, 
  onShopSelect, 
  onLocationTag,
  showTagging = false,
  className = "",
  fetchFromBackend = true,
}) => {
  const navigate = useNavigate();
  const { location: userLocation, error, loading, requestLocation } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState([20]); // km
  const [showFilters, setShowFilters] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapStyle, setMapStyle] = useState('osm');
  const [isMobile, setIsMobile] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [page, setPage] = useState(1);

  // Default center (Your current location)
  const defaultCenter: [number, number] = [-1.268122, 29.985997];
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : defaultCenter;

  // Backend-powered fetching (preferred). Falls back to client filtering if shops prop provided and fetch disabled.
  const shouldFetch = fetchFromBackend;

  const { data: shopsResponse, isLoading: shopsLoading, error: shopsError } = useQuery<LaravelPaginatedResponse<Shop>, Error>({
    queryKey: ['shops-map', userLocation, searchRadius[0], searchQuery, selectedCategory, page],
    queryFn: () => {
      if (!userLocation) return Promise.reject('User location not available');
      return shopService.getShops({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: searchRadius[0],
        search: searchQuery,
        category: selectedCategory,
        page,
      });
    },
    enabled: shouldFetch && !!userLocation,
    staleTime: 60 * 1000,
  });

  const clientFilteredShops = useMemo(() => {
    const input = shops ?? [];
    let filtered = input;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(shop => getShopCategory(shop) === selectedCategory);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.location.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (userLocation) {
      filtered = getShopsWithinRadius(userLocation, filtered, searchRadius[0]);
    }
    return filtered;
  }, [shops, searchQuery, searchRadius, userLocation, selectedCategory]);

  const displayedShops: Shop[] = shouldFetch ? (shopsResponse?.data ?? []) : clientFilteredShops;

  useEffect(() => {
    // Request location on component mount
    requestLocation();
    
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [requestLocation]);

  // Show tooltip on marker click
  const handleShopMarkerClick = (shop: Shop, event: any) => {
    setSelectedShop(shop);
    // Get marker position relative to map container
    const rect = event.target._map.getContainer().getBoundingClientRect();
    let x, y;
    if (event.originalEvent && event.originalEvent.touches) {
      // Touch event
      const touch = event.originalEvent.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = event.originalEvent.clientX - rect.left;
      y = event.originalEvent.clientY - rect.top;
    }
    setTooltipPosition({ x, y });
  };

  // Close tooltip
  const handleCloseTooltip = () => {
    setSelectedShop(null);
    setTooltipPosition(null);
  };

  // Navigation to parent (view shop)
  const handleViewShop = () => {
    if (selectedShop) {
      navigate(`/shops/${selectedShop.id}`);
      handleCloseTooltip();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // When fetching from backend, resetting page will trigger refetch
    setPage(1);
  };

  return (
    <div className={`${className} ${isMobile ? 'h-screen flex flex-col' : 'space-y-4'}`}>
      {/* Mobile Header Controls */}
      {isMobile && (
        <div className="bg-background/95 backdrop-blur-sm border-b p-3 space-y-3 z-10">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20 h-10"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 w-8"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={requestLocation}
                disabled={loading}
                className="h-8 w-8"
              >
                <Crosshair className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </form>

          {/* Quick Filters Row */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent               
                position="popper" 
                side="bottom" 
                sideOffset={4}
                style={{ zIndex: 9999 }}
              >
                {SHOP_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={mapStyle} onValueChange={setMapStyle}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <Layers className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAP_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="outline" className="text-xs px-2 py-1 whitespace-nowrap">
              {displayedShops.length} shops
            </Badge>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <Card>
              <CardContent className="p-3 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search Radius: {searchRadius[0]} km
                  </label>
                  <Slider
                    value={searchRadius}
                    onValueChange={setSearchRadius}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-1" />
                  Close Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Desktop Search and Filters */}
      {!isMobile && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-8 w-8"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={requestLocation}
                  disabled={loading}
                  className="h-8 w-8"
                >
                  <Crosshair className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </form>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOP_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={mapStyle} onValueChange={setMapStyle}>
              <SelectTrigger className="w-36">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAP_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Filters */}
          {showFilters && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search Radius: {searchRadius[0]} km
                  </label>
                  <Slider
                    value={searchRadius}
                    onValueChange={setSearchRadius}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {displayedShops.length} shops found
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Status */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div className={`${isMobile ? 'flex-1 relative' : 'grid grid-cols-1 lg:grid-cols-3 gap-4 h-[60vh] sm:h-[70vh] lg:h-[600px]'}`}>
        <div className={`${isMobile ? 'absolute inset-0' : 'lg:col-span-2'} h-full`}>
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <div className="h-full rounded-lg overflow-hidden">
                <MapContainer
                  key={`${mapCenter[0]}-${mapCenter[1]}-${mapStyle}`}
                  center={mapCenter}
                  zoom={isMobile ? 15 : 14}
                  style={{ height: '100%', width: '100%', zIndex:1 }}
                  className="rounded-lg"
                  zoomControl={!isMobile}
                  scrollWheelZoom={true}
                  dragging={true}
                  touchZoom={true}
                  doubleClickZoom={true}
                  boxZoom={true}
                  keyboard={true}
                >
                  <TileLayer
                    attribution={mapStyle === 'osm' ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' : '&copy; Google Maps'}
                    url={MAP_STYLES.find(style => style.value === mapStyle)?.url || MAP_STYLES[0].url}
                  />
                  
                  {/* User location marker */}
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>
                        <div className="text-center p-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <Navigation className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-sm font-medium">Your location</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Shop markers */}
                  {displayedShops.map((shop) => (
                    <ShopMarker
                      key={shop.id}
                      shop={shop}
                      onMarkerClick={handleShopMarkerClick}
                    />
                  ))}
                  {/* Tooltip overlay as click-popup */}
                  {selectedShop && tooltipPosition && (
                    <HoverTooltip
                      shop={selectedShop}
                      position={tooltipPosition}
                      isVisible={!!selectedShop}
                    />
                  )}

                  {/* Location tagging */}
                  {showTagging && onLocationTag && (
                    <LocationTagger onLocationTag={onLocationTag} />
                  )}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Mobile Bottom Sheet for Selected Shop */}
        {isMobile && selectedShop && createPortal(
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t rounded-t-lg p-4 max-h-1/2 overflow-y-auto z-20" style={{ zIndex: 1000 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {selectedShop.avatar ? (
                  <img 
                    src={selectedShop.avatar} 
                    alt={selectedShop.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {selectedShop.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{selectedShop.name}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{selectedShop.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({selectedShop.total_reviews})
                    </span>
                  </div>
                  <Badge variant={selectedShop.verified ? 'default' : 'secondary'} className="text-xs">
                    {selectedShop.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedShop(null)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {selectedShop.location.address}
                </span>
              </div>
              
              {selectedShop.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${selectedShop.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedShop.phone}
                  </a>
                </div>
              )}

              {selectedShop.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {selectedShop.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={handleViewShop}
              >
                View Shop
              </Button>
              <Button 
                variant="outline"
                size="icon"
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedShop.location.lat},${selectedShop.location.lng}`;
                  window.open(url, '_blank');
                }}
              >
                <Navigation className="h-4 w-4" />
              </Button>
              {selectedShop.phone && (
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`tel:${selectedShop.phone}`, '_self')}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* Desktop Shop Details Sidebar */}
        {!isMobile && (
          <div className="space-y-4">
            {selectedShop ? (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                      {selectedShop.avatar ? (
                        <img 
                          src={selectedShop.avatar} 
                          alt={selectedShop.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                          {selectedShop.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedShop.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{selectedShop.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({selectedShop.total_reviews})
                          </span>
                        </div>
                        <Badge variant={selectedShop.verified ? 'default' : 'secondary'}>
                          {selectedShop.verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selectedShop.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedShop.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedShop.location.address}</span>
                    </div>
                    
                    {selectedShop.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${selectedShop.phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedShop.phone}
                        </a>
                      </div>
                    )}
                    
                    {userLocation && (
                      <div className="text-sm text-primary font-medium">
                        {formatDistance(
                          Math.sqrt(
                            Math.pow(selectedShop.location.lat - userLocation.lat, 2) +
                            Math.pow(selectedShop.location.lng - userLocation.lng, 2)
                          ) * 111 // Rough conversion to km
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => onShopSelect?.(selectedShop)}
                    >
                      View Products
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedShop.location.lat},${selectedShop.location.lng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                    {selectedShop.phone && (
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(`tel:${selectedShop.phone}`, '_self')}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Select a shop</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on a marker to view shop details
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Nearby ShopHandlers List */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">
                  Nearby Shops ({displayedShops.length})
                </h3>
                {displayedShops.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No shops found in your area
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {displayedShops.slice(0, 10).map((shop) => (
                      <div
                        key={shop.id}
                        className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                          selectedShop?.id === shop.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => onShopSelect?.(shop)}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {shop.avatar ? (
                            <img 
                              src={shop.avatar} 
                              alt={shop.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                              {shop.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{shop.name}</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{shop.rating}</span>
                              <span className="text-xs text-muted-foreground">
                                ({shop.total_reviews})
                              </span>
                            </div>
                            {userLocation && 'distance' in shop && (
                              <span className="text-xs text-primary">
                                {formatDistance(shop.distance as number)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showTagging && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <MapPin className="h-4 w-4 inline mr-2" />
          Click anywhere on the map to tag a location for your post
        </div>
      )}
    </div>
  );
};

export default ShopMap;