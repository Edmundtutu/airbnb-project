export interface Location {
  lat: number;
  lng: number;
}

export interface LocationWithAddress extends Location {
  address: string;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }
  return `${distance.toFixed(1)}km away`;
};

/**
 * Check if location is within radius
 */
export const isWithinRadius = (
  center: Location,
  point: Location,
  radiusKm: number
): boolean => {
  return calculateDistance(center, point) <= radiusKm;
};

/**
 * Get properties within radius sorted by distance
 */
export const getPropertiesWithinRadius = <T extends { location: Location }>(
  userLocation: Location,
  properties: T[],
  radiusKm: number = 10
): (T & { distance: number })[] => {
  return properties
    .map(property => ({
      ...property,
      distance: calculateDistance(userLocation, property.location)
    }))
    .filter(property => property.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get shops within radius sorted by distance (legacy alias)
 */
export const getShopsWithinRadius = getPropertiesWithinRadius;

/**
 * Reverse geocoding simulation (in real app, use Google Maps API)
 */
export const reverseGeocode = async (location: Location): Promise<string> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock address based on coordinates
  const addresses = [
    'Mbarara Main Street',
    'Kampala Road, Mbarara',
    'High Street, Mbarara',
    'University Road, Mbarara',
    'Banana Street, Mbarara',
  ];
  
  const index = Math.floor(Math.abs(location.lat + location.lng) * 1000) % addresses.length;
  return addresses[index];
};

/**
 * Get map bounds for multiple locations
 */
export const getBounds = (locations: Location[]): [[number, number], [number, number]] => {
  if (locations.length === 0) {
    return [[0, 0], [0, 0]];
  }

  const lats = locations.map(loc => loc.lat);
  const lngs = locations.map(loc => loc.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return [[minLat, minLng], [maxLat, maxLng]];
};