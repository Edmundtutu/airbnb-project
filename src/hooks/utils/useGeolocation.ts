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

    // Try high accuracy first with shorter timeout
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (highAccuracyError) => {
        // If high accuracy fails, try with low accuracy as fallback
        console.log('High accuracy failed, trying low accuracy...');
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          handleError,
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 10000, // Accept 10-second-old position
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000, // 8 seconds for high accuracy
        maximumAge: 5000, // Only use 5-second-old high accuracy positions
      }
    );
  }, [handleSuccess, handleError]);

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
        maximumAge: 5000, // Use recent positions for live tracking
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