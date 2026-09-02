'use client';

import React from 'react';
import { MapPin, Navigation, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { usePathname } from 'next/navigation';

export const LocationBanner: React.FC = () => {
  const pathname = usePathname();
  const isDineIn = pathname?.startsWith('/dine-in');
  const { coordinates, locationAddress, isLocating, locationStatus, errorMessage, requestLocation, dismissPrompt } =
    useLocation();

  // Don't show on dine-in page (dine-in uses table QR)
  if (isDineIn) return null;

  // If locating
  if (isLocating) {
    return (
      <div className="bg-[#001f44] text-white px-4 py-2 text-xs flex items-center justify-between border-b border-blue-900/50 animate-fade-in shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="font-semibold text-blue-100">Detecting your delivery GPS location...</span>
        </div>
      </div>
    );
  }

  // If permission denied or failed, show a subtle prompt so they can retry or see why
  if (locationStatus === 'denied' || locationStatus === 'error') {
    return (
      <div className="bg-amber-950/60 border-b border-amber-800/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between animate-fade-in">
        <div className="flex items-center space-x-2 min-w-0 pr-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate text-[11px]">
            {errorMessage || 'Location permission off. Enter address manually during checkout.'}
          </span>
        </div>
        <button
          onClick={requestLocation}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-md shrink-0 uppercase tracking-wider cursor-pointer"
        >
          Enable GPS
        </button>
      </div>
    );
  }

  // If granted, show the detected GPS delivery location bar!
  if (locationStatus === 'granted' && coordinates) {
    return (
      <div className="bg-emerald-950/80 border-b border-emerald-800/40 text-emerald-200 px-4 py-1.5 text-xs flex items-center justify-between animate-fade-in">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="font-extrabold text-white text-[11px] shrink-0">Delivering to:</span>
          <span className="text-emerald-100 text-[11px] truncate font-medium" title={locationAddress}>
            {locationAddress || `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`}
          </span>
        </div>

        <button
          onClick={requestLocation}
          className="text-[10px] text-emerald-300 hover:text-white underline font-semibold shrink-0 ml-2 cursor-pointer"
          title="Refresh GPS location"
        >
          Update
        </button>
      </div>
    );
  }

  return null;
};
export default LocationBanner;
