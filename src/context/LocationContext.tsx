'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LocationCoords {
  lat: number;
  lng: number;
}

interface LocationContextType {
  coordinates: LocationCoords | null;
  locationAddress: string;
  isLocating: boolean;
  locationStatus: 'idle' | 'prompt' | 'locating' | 'granted' | 'denied' | 'error';
  errorMessage: string | null;
  requestLocation: () => Promise<void>;
  dismissPrompt: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coordinates, setCoordinates] = useState<LocationCoords | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'prompt' | 'locating' | 'granted' | 'denied' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to reverse geocode or build display address
  const buildAddressFromCoords = async (lat: number, lng: number) => {
    try {
      // Try reverse geocoding via OpenStreetMap nominatim with fast 2s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { signal: controller.signal, headers: { 'Accept-Language': 'en' } }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const parts = [
            data.address?.road || data.address?.suburb || data.address?.neighbourhood,
            data.address?.city || data.address?.town || 'Haldwani',
            data.address?.postcode || '263139',
          ].filter(Boolean);
          if (parts.length > 0) {
            return parts.join(', ');
          }
          return data.display_name.split(',').slice(0, 3).join(',').trim();
        }
      }
    } catch {}
    // Fallback coordinates display string
    return `GPS (${lat.toFixed(5)}, ${lng.toFixed(5)}), Kaladhungi Road, Haldwani`;
  };

  const requestLocation = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('error');
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('locating');
    setErrorMessage(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords = { lat, lng };
        setCoordinates(coords);
        setIsLocating(false);
        setLocationStatus('granted');

        const addr = await buildAddressFromCoords(lat, lng);
        setLocationAddress(addr);

        try {
          localStorage.setItem('7cheese_user_coordinates', JSON.stringify(coords));
          localStorage.setItem('7cheese_user_address', addr);
          localStorage.setItem('7cheese_location_granted', 'true');
        } catch {}
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not fetch your location.';
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('denied');
          msg = 'Location permission was denied. You can enter your address manually.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationStatus('error');
          msg = 'GPS location unavailable. You can enter your address manually.';
        } else if (err.code === err.TIMEOUT) {
          setLocationStatus('error');
          msg = 'Location request timed out.';
        }
        setErrorMessage(msg);
      },
      options
    );
  };

  const dismissPrompt = () => {
    setLocationStatus('denied');
    try {
      sessionStorage.setItem('7cheese_location_prompt_dismissed', 'true');
    } catch {}
  };

  // On site mount: Check if previously granted or prompt immediately!
  useEffect(() => {
    try {
      // 1. Check if already saved in localStorage
      const savedCoordsStr = localStorage.getItem('7cheese_user_coordinates');
      const savedAddr = localStorage.getItem('7cheese_user_address');
      if (savedCoordsStr) {
        const parsed = JSON.parse(savedCoordsStr);
        if (parsed.lat && parsed.lng) {
          setCoordinates(parsed);
          setLocationAddress(savedAddr || `GPS: ${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`);
          setLocationStatus('granted');
          return;
        }
      }

      // 2. If not saved, automatically trigger location permission on site load!
      // Browser will show the native "Allow location" prompt
      if (navigator.geolocation) {
        requestLocation();
      }
    } catch (e) {
      console.warn('Location initialization error:', e);
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coordinates,
        locationAddress,
        isLocating,
        locationStatus,
        errorMessage,
        requestLocation,
        dismissPrompt,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
export default LocationContext;
