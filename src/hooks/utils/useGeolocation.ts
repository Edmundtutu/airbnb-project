import { useState, useEffect, useCallback, useRef } from 'react';

interface UseGeolocationReturn {
  location: { lat: number; lng: number } | null;
  error: string | null;
  loading: boolean;
  accuracy: number | null;
  requestLocation: () => void;
  watchPosition: () => void;
  stopWatching: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const accuracy = position.coords.accuracy;
    
    // Only accept positions with good accuracy (< 100 meters)
    // If accuracy is poor and we're still loading, it will retry
    if (accuracy > 100) {
      console.log(`Low accuracy (${accuracy}m), waiting for better fix...`);
      // Don't update location with poor accuracy
      return;
    }
    
    setLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
    setAccuracy(position.coords.accuracy);
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unable to get location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }
    
    setError(errorMessage);
    setLoading(false);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    // Try high accuracy first - NO CACHE, longer timeout for GPS lock
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (highAccuracyError) => {
        // If high accuracy fails, try with low accuracy as fallback
        console.log('High accuracy failed, trying low accuracy...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // For low accuracy, accept any result
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setLoading(false);
          },
          handleError,
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0, // No cache even for fallback
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds for GPS lock
        maximumAge: 0, // Force fresh position, no cache at all
      }
    );
  }, [handleSuccess, handleError, setLocation, setLoading]);

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Force fresh positions for live tracking
      }
    );
  }, [handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    error,
    loading,
    accuracy,
    requestLocation,
    watchPosition,
    stopWatching,
  };
};