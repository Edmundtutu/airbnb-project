import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Navigation, Crosshair, Filter, X, Phone, Star, Layers, Map as MapIcon, Users, Bed, Bath, ArrowLeft } from 'lucide-react';
import { Property } from '@/types';
import { useGeolocation } from '@/hooks/utils/useGeolocation';
import { getPropertiesWithinRadius, formatDistance, reverseGeocode } from '@/utils/location';
import PropertyMarker from './PropertyMarker';
import HoverTooltip from '../HoverToolTip';
import '@/styles/custom.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '@/utils/helperfunctions';
import { propertyService } from '@/services/propertyService';
import type { LaravelPaginatedResponse } from '@/types';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PropertyMapProps {
  properties?: Property[];
  onPropertySelect?: (property: Property) => void;
  onLocationTag?: (location: { lat: number; lng: number; address: string }) => void;
  showTagging?: boolean;
  className?: string;
  fetchFromBackend?: boolean; // if true (default), fetch properties using backend with filters
}

import { PROPERTY_CATEGORIES } from '@/shared/constants/properties';

const MAP_STYLES = [
  { value: 'osm', label: 'Street Map', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { value: 'satellite', label: 'Satellite', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' },
  { value: 'hybrid', label: 'Hybrid', url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' },
  { value: 'terrain', label: 'Terrain', url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}' },
];

// Helper function to get property category from description/name
const getPropertyCategory = (property: Property): string => {
  const name = property.name.toLowerCase();
  const desc = property.description?.toLowerCase() || '';
  
  if (name.includes('villa') || desc.includes('villa') || desc.includes('luxury')) return 'villa';
  if (name.includes('apartment') || desc.includes('apartment') || desc.includes('studio')) return 'apartment';
  if (name.includes('cottage') || desc.includes('cottage') || desc.includes('cabin')) return 'cottage';
  if (name.includes('homestay') || desc.includes('homestay') || desc.includes('family')) return 'homestay';
  if (name.includes('lodge') || desc.includes('lodge') || desc.includes('adventure')) return 'lodge';
  if (name.includes('resort') || desc.includes('resort') || desc.includes('spa')) return 'resort';
  if (name.includes('hostel') || desc.includes('hostel') || desc.includes('shared')) return 'hostel';
  if (name.includes('hotel') || desc.includes('hotel') || desc.includes('suite')) return 'hotel';
  
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

const PropertyMap: React.FC<PropertyMapProps> = ({ 
  properties, 
  onPropertySelect, 
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
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mapStyle, setMapStyle] = useState('osm');
  const [isMobile, setIsMobile] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [page, setPage] = useState(1);
  
  // Bottom sheet drag state
  const [sheetHeight, setSheetHeight] = useState(40); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(40);
  const contentRef = useRef<HTMLDivElement>(null);

  // Default center (Your current location)
  const defaultCenter: [number, number] = [-1.268122, 29.985997];
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : defaultCenter;

  // Backend-powered fetching (preferred). Falls back to client filtering if properties prop provided and fetch disabled.
  const shouldFetch = fetchFromBackend;

  const { data: propertiesResponse, isLoading: propertiesLoading, error: propertiesError } = useQuery<LaravelPaginatedResponse<Property>, Error>({
    queryKey: ['properties-map', userLocation, searchRadius[0], searchQuery, selectedCategory, page],
    queryFn: () => {
      if (!userLocation) return Promise.reject('User location not available');
      return propertyService.getProperties({
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

  const clientFilteredProperties = useMemo(() => {
    const input = properties ?? [];
    let filtered = input;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(property => getPropertyCategory(property) === selectedCategory);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(property =>
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (userLocation) {
      filtered = getPropertiesWithinRadius(userLocation, filtered, searchRadius[0]);
    }
    return filtered;
  }, [properties, searchQuery, searchRadius, userLocation, selectedCategory]);

  const displayedProperties: Property[] = shouldFetch ? (propertiesResponse?.data ?? []) : clientFilteredProperties;

  useEffect(() => {
    // Request location on component mount
    if (!userLocation && !loading) {
      requestLocation();
    }
    
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [userLocation, loading, requestLocation]);

  // Bottom sheet drag handlers
  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setDragStartHeight(sheetHeight);
  }, [sheetHeight]);

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = dragStartY - currentY;
    const viewportHeight = window.innerHeight;
    const deltaPercentage = (deltaY / viewportHeight) * 100;
    
    const newHeight = Math.min(70, Math.max(25, dragStartHeight + deltaPercentage));
    setSheetHeight(newHeight);
  }, [isDragging, dragStartY, dragStartHeight]);

  const handleSheetTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    // Snap to nearest position
    if (sheetHeight > 55) {
      setSheetHeight(70); // Expanded
    } else if (sheetHeight < 35) {
      setSheetHeight(25); // Collapsed
    } else {
      setSheetHeight(40); // Resting position
    }
  }, [sheetHeight]);

  const handleSheetMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(sheetHeight);
  }, [sheetHeight]);

  // Handle scroll-triggered expansion
  const handleContentScroll = useCallback(() => {
    const content = contentRef.current;
    if (!content || sheetHeight >= 70) return;
    
    // If user scrolls down within content, expand sheet to full height
    if (content.scrollTop > 5) {
      setSheetHeight(70);
    }
  }, [sheetHeight]);

  const handleSheetMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const currentY = e.clientY;
    const deltaY = dragStartY - currentY;
    const viewportHeight = window.innerHeight;
    const deltaPercentage = (deltaY / viewportHeight) * 100;
    
    const newHeight = Math.min(70, Math.max(25, dragStartHeight + deltaPercentage));
    setSheetHeight(newHeight);
  };

  const handleSheetMouseUp = () => {
    setIsDragging(false);
    
    // Snap to nearest position
    if (sheetHeight > 55) {
      setSheetHeight(70); // Expanded
    } else if (sheetHeight < 35) {
      setSheetHeight(25); // Collapsed
    } else {
      setSheetHeight(40); // Resting position
    }
  };

  // Mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleSheetMouseMove);
      window.addEventListener('mouseup', handleSheetMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleSheetMouseMove);
        window.removeEventListener('mouseup', handleSheetMouseUp);
      };
    }
  }, [isDragging, dragStartY, dragStartHeight, sheetHeight]);

  // Handle property marker click
  const handlePropertyMarkerClick = (property: Property) => {
    setSelectedProperty(property);
    // Expand sheet to show details on mobile
    if (window.innerWidth < 1024) {
      setSheetHeight(60);
    }
  };

  // Close tooltip
  const handleCloseTooltip = () => {
    setSelectedProperty(null);
    setTooltipPosition(null);
  };

  // Navigation to parent (view property)
  const handleViewProperty = () => {
    if (selectedProperty) {
      navigate(`/properties/${selectedProperty.id}`);
      handleCloseTooltip();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // When fetching from backend, resetting page will trigger refetch
    setPage(1);
  };

  return (
    <>
      {/* MOBILE VIEW - Immersive Experience */}
      <div className="lg:hidden fixed inset-0 bg-white overflow-hidden">
        {/* Full-Bleed Map Container (60vh) */}
        <div className="relative h-[60vh] w-full">
          {/* Floating Back Button */}
          <div className="absolute top-4 left-4 z-[1000]">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </Button>
          </div>

          {/* Floating Search Bar */}
          <div className="absolute top-4 left-16 right-4 z-[1000]">
            <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200">
              <form 
                onSubmit={handleSearch} 
                className="relative"
              >
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-20 border-0 bg-transparent rounded-full h-12"
                />
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-9 w-9 rounded-full"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={requestLocation}
                    disabled={loading}
                    className="h-9 w-9 rounded-full"
                    title="Update location"
                  >
                    <Crosshair className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </form>
            </div>

            {/* Filters Card */}
            {showFilters && (
              <Card className="mt-2 shadow-xl">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Category
                    </label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Map Style
                    </label>
                    <Select value={mapStyle} onValueChange={setMapStyle}>
                      <SelectTrigger className="w-full">
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
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Search Radius: {searchRadius[0]} km
                    </label>
                    <Slider
                      value={searchRadius}
                      onValueChange={setSearchRadius}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {displayedProperties.length} properties found
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
          </div>

          {/* Property Count Badge */}
          <div className="absolute bottom-4 right-4 z-[1000]">
            <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm shadow-lg px-3 py-1.5 border border-gray-200">
              {displayedProperties.length} {displayedProperties.length === 1 ? 'property' : 'properties'}
            </Badge>
          </div>

          {/* Map */}
          {!userLocation && !loading ? (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Location Access Needed</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  To show nearby properties and provide accurate results, we need access to your location.
                </p>
                <Button 
                  onClick={requestLocation}
                  className="w-full"
                  size="lg"
                >
                  <Crosshair className="h-4 w-4 mr-2" />
                  Enable Location Access
                </Button>
                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-xs text-destructive">
                      {typeof error === 'string' ? error : 'Unable to access location. Please check your browser settings.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : propertiesLoading ? (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <MapContainer
              key={`${mapCenter[0]}-${mapCenter[1]}`}
              center={mapCenter}
              zoom={userLocation ? 14 : 12}
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              scrollWheelZoom={true}
              dragging={true}
              touchZoom={true}
            >
              <TileLayer
                attribution={mapStyle === 'osm' ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' : '&copy; Google Maps'}
                url={MAP_STYLES.find(style => style.value === mapStyle)?.url || MAP_STYLES[0].url}
              />
              
              {/* User location marker */}
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>
                    <div className="text-center">
                      <p className="text-sm font-medium">Your location</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Property markers */}
              {displayedProperties.map((property) => (
                <PropertyMarker
                  key={property.id}
                  property={property}
                  onMarkerClick={handlePropertyMarkerClick}
                />
              ))}

              {/* Location tagging */}
              {showTagging && onLocationTag && (
                <LocationTagger onLocationTag={onLocationTag} />
              )}
            </MapContainer>
          )}
        </div>

        {/* Bottom Sheet Panel */}
        <div 
          className="absolute left-0 right-0 bg-white rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out"
          style={{ 
            bottom: 0,
            height: `${sheetHeight}vh`,
            zIndex: 45,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {/* Sheet Handle - Draggable area */}
          <div 
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            onMouseDown={handleSheetMouseDown}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Scrollable Content */}
          <div 
            ref={contentRef}
            onScroll={handleContentScroll}
            className="flex-1 overflow-y-auto"
          >
            {!selectedProperty ? (
              /* Property List */
              <div>
                <div className="px-6 py-3 border-b sticky top-0 bg-white z-10">
                  <h3 className="font-bold text-lg">
                    Nearby Properties ({displayedProperties.length})
                  </h3>
                </div>
                {!userLocation && !loading ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-base mb-2">Location Access Required</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We need your location to show nearby properties.
                    </p>
                    <Button 
                      onClick={requestLocation}
                      className="w-full max-w-xs mx-auto"
                    >
                      <Crosshair className="h-4 w-4 mr-2" />
                      Enable Location
                    </Button>
                    {error && (
                      <p className="text-xs text-destructive mt-3">
                        {typeof error === 'string' ? error : 'Location access denied'}
                      </p>
                    )}
                  </div>
                ) : displayedProperties.length === 0 ? (
                  <div className="p-8 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No properties found in your area. Try adjusting filters.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {displayedProperties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center gap-4 p-4 hover:bg-accent cursor-pointer transition-colors active:bg-accent"
                        onClick={() => handlePropertyMarkerClick(property)}
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {property.cover_image ? (
                            <img 
                              src={getImageUrl(property.cover_image) ?? ''} 
                              alt={property.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                              {property.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{property.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{property.rating}</span>
                              <span className="text-xs text-muted-foreground">
                                ({property.total_reviews})
                              </span>
                            </div>
                            <Badge variant={property.verified ? 'default' : 'secondary'} className="text-xs">
                              {property.verified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {property.location.address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Property Details */
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                    {selectedProperty.cover_image ? (
                      <img 
                        src={getImageUrl(selectedProperty.cover_image) ?? ''} 
                        alt={selectedProperty.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {selectedProperty.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">{selectedProperty.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{selectedProperty.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({selectedProperty.total_reviews} reviews)
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={selectedProperty.verified ? 'default' : 'secondary'} 
                      className="mt-2"
                    >
                      {selectedProperty.verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProperty(null)}
                    className="h-9 w-9 flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {selectedProperty.description && (
                  <div className="pb-4 border-b">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedProperty.description}
                    </p>
                  </div>
                )}

                <div className="space-y-3 pb-4 border-b">
                  {selectedProperty.location.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{selectedProperty.location.address}</span>
                    </div>
                  )}
                  
                  {selectedProperty.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={`tel:${selectedProperty.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedProperty.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 h-12 shadow-lg font-bold"
                    onClick={handleViewProperty}
                  >
                    View Details
                  </Button>
                  {selectedProperty.location.lat && selectedProperty.location.lng && (
                    <Button 
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 flex-shrink-0"
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedProperty.location.lat},${selectedProperty.location.lng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <Navigation className="h-5 w-5" />
                    </Button>
                  )}
                  {selectedProperty.phone && (
                    <Button 
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 flex-shrink-0"
                      onClick={() => window.open(`tel:${selectedProperty.phone}`, '_self')}
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW - Keep existing design */}
      <div className={`${className} hidden lg:flex flex-col h-screen`}>
      {/* Search and Controls */}
      <div className="flex-shrink-0 space-y-3 p-4 pb-0 lg:p-0 lg:pb-4">
        <div className="flex gap-3">
          <form 
            onSubmit={handleSearch} 
            className="relative flex-1"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
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
                title="Update location"
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
              {PROPERTY_CATEGORIES.map((category) => (
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

          <Badge variant="outline" className="px-3 py-2 whitespace-nowrap hidden sm:flex">
            {displayedProperties.length} {displayedProperties.length === 1 ? 'property' : 'properties'}
          </Badge>
        </div>

        {showFilters && (
          <Card className="lg:max-w-md">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Search Radius: {searchRadius[0]} km
                </label>
                <Slider
                  value={searchRadius}
                  onValueChange={setSearchRadius}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {displayedProperties.length} properties found
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

        {!userLocation && !loading && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Location Access Required</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Enable location access to discover nearby properties and get accurate distance information.
                  </p>
                  <Button 
                    onClick={requestLocation}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Crosshair className="h-4 w-4 mr-2" />
                    Enable Location Access
                  </Button>
                  {error && (
                    <p className="text-xs text-destructive mt-2">
                      {typeof error === 'string' ? error : 'Unable to access location. Please check browser settings.'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && userLocation && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {typeof error === 'string' ? error : 'An error occurred'}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-0 pt-0 lg:p-0 lg:pt-4">
        {/* Map Container */}
        <div className="flex-1 rounded-none overflow-hidden min-h-[400px] lg:min-h-[500px]">
          <Card className="h-full border-0 rounded-none">
            <CardContent className="p-0 h-full">
              {!userLocation && !loading ? (
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Location Access Needed</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      To show you nearby properties and provide the best experience, we need access to your location. This helps us:
                    </p>
                    <div className="text-left space-y-2 mb-6 max-w-xs mx-auto">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-primary text-xs">✓</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Show properties near you</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-primary text-xs">✓</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Calculate accurate distances</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-primary text-xs">✓</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Provide better recommendations</p>
                      </div>
                    </div>
                    <Button 
                      onClick={requestLocation}
                      size="lg"
                      className="w-full max-w-xs"
                    >
                      <Crosshair className="h-4 w-4 mr-2" />
                      Enable Location Access
                    </Button>
                    {error && (
                      <div className="mt-4 p-3 bg-destructive/10 rounded-lg max-w-xs mx-auto">
                        <p className="text-xs text-destructive">
                          {typeof error === 'string' ? error : 'Unable to access location. Please check your browser settings and allow location access.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : propertiesLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <MapContainer
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                  center={mapCenter}
                  zoom={userLocation ? 14 : 12}
                  style={{ height: '100%', width: '100%', zIndex: 1 }}
                  className="rounded-none"
                  scrollWheelZoom={true}
                  dragging={true}
                  touchZoom={true}
                >
                  <TileLayer
                    attribution={mapStyle === 'osm' ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' : '&copy; Google Maps'}
                    url={MAP_STYLES.find(style => style.value === mapStyle)?.url || MAP_STYLES[0].url}
                  />
                  
                  {/* User location marker */}
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>
                        <div className="text-center">
                          <p className="text-sm font-medium">Your location</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Property markers */}
                  {displayedProperties.map((property) => (
                    <PropertyMarker
                      key={property.id}
                      property={property}
                      onMarkerClick={handlePropertyMarkerClick}
                    />
                  ))}

                  {/* Location tagging */}
                  {showTagging && onLocationTag && (
                    <LocationTagger onLocationTag={onLocationTag} />
                  )}
                </MapContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop Sidebar - Only on large screens */}
        <div className="hidden lg:flex lg:flex-col w-80 xl:w-96 flex-shrink-0 space-y-4">
          {selectedProperty ? (
            <Card className="flex-1">
              <CardContent className="p-4 space-y-4 h-full flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                    {selectedProperty.cover_image ? (
                      <img 
                        src={getImageUrl(selectedProperty.cover_image) ?? ''} 
                        alt={selectedProperty.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {selectedProperty.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedProperty.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{selectedProperty.rating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({selectedProperty.total_reviews})
                        </span>
                      </div>
                      <Badge variant={selectedProperty.verified ? 'default' : 'secondary'}>
                        {selectedProperty.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedProperty.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedProperty.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedProperty.location.address}</span>
                  </div>
                  
                  {selectedProperty.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${selectedProperty.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedProperty.phone}
                      </a>
                    </div>
                  )}
                  
                  {userLocation && (
                    <div className="text-sm text-primary font-medium">
                      {formatDistance(
                        Math.sqrt(
                          Math.pow(selectedProperty.location.lat - userLocation.lat, 2) +
                          Math.pow(selectedProperty.location.lng - userLocation.lng, 2)
                        ) * 111
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button 
                    className="flex-1"
                    onClick={handleViewProperty}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedProperty.location.lat},${selectedProperty.location.lng}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                  {selectedProperty.phone && (
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`tel:${selectedProperty.phone}`, '_self')}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1">
              <CardContent className="p-6 text-center h-full flex flex-col items-center justify-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Select a property</h3>
                <p className="text-sm text-muted-foreground">
                  Click on a marker to view property details
                </p>
              </CardContent>
            </Card>
          )}

          {/* Nearby Properties List */}
          <Card className="flex-1 max-h-80">
            <CardContent className="p-4 h-full flex flex-col">
              <h3 className="font-medium mb-3">
                Nearby Properties ({displayedProperties.length})
              </h3>
              {displayedProperties.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No properties found</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {displayedProperties.slice(0, 10).map((property) => (
                    <div
                      key={property.id}
                      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                        selectedProperty?.id === property.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => handlePropertyMarkerClick(property)}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {property.cover_image ? (
                          <img 
                            src={getImageUrl(property.cover_image) ?? ''} 
                            alt={property.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {property.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{property.name}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{property.rating}</span>
                            <span className="text-xs text-muted-foreground">
                              ({property.total_reviews})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      {showTagging && (
        <div className="hidden lg:block text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <MapPin className="h-4 w-4 inline mr-2" />
          Click anywhere on the map to tag a location for your post
        </div>
      )}
    </>
  );
};

export default PropertyMap;
