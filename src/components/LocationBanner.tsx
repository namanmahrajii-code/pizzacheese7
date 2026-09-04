'use client';

import React from 'react';
import { MapPin, Navigation, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { usePathname } from 'next/navigation';

export const LocationBanner: React.FC = () => {
  const pathname = usePathname();
  const isDineIn = pathname?.startsWith('/dine-in') || pathname?.startsWith('/din-in');
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

  // If granted, show the redesigned compact delivery banner with dynamic promotional text/offers space
  if (locationStatus === 'granted' && coordinates) {
    return (
      <div className="bg-[#053d26] border-b border-emerald-500/30 text-emerald-100 px-3 py-1.5 text-xs flex items-center justify-between gap-2 shadow-sm animate-fade-in">
        {/* Left: Compact delivery location indicator */}
        <div className="flex items-center space-x-1.5 min-w-0 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-extrabold text-white text-[10.5px]">To:</span>
          <span
            className="text-emerald-200 text-[10.5px] font-semibold truncate max-w-[130px] sm:max-w-[170px]"
            title={locationAddress}
          >
            {locationAddress ? locationAddress.split(',')[0] : `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`}
          </span>
          <button
            onClick={requestLocation}
            className="text-[9.5px] text-emerald-300 hover:text-white underline font-bold cursor-pointer"
            title="Refresh GPS"
          >
            Change
          </button>
        </div>

        {/* Center/Right: Dynamic promotional text & free delivery tier space */}
        <div className="flex-1 min-w-0 text-right overflow-hidden">
          <div className="inline-flex items-center space-x-1.5 bg-black/25 px-2 py-0.5 rounded-full text-[10px] text-amber-300 font-bold border border-emerald-400/20 truncate max-w-full">
            <span className="text-[10px] animate-pulse">⚡</span>
            <span className="truncate">FREE DELIVERY ABOVE ₹299 • AUTO 15% OFF ≥₹1500</span>
          </div>
        </div>
      </div>
    );
  }

  // If idle or not granted yet, show promotional ticker
  return (
    <div className="bg-[#002855] border-b border-blue-900/60 px-3 py-1.5 text-xs flex items-center justify-between text-blue-200">
      <div className="flex items-center space-x-1.5 truncate">
        <span className="text-amber-400 font-black text-[10px] uppercase tracking-wider bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/30">
          OFFER
        </span>
        <span className="text-[10.5px] font-bold text-white truncate">
          Lowest Prices Only on 7Cheese App | Free Delivery Above ₹299
        </span>
      </div>
      <button
        onClick={requestLocation}
        className="text-[10px] text-amber-300 hover:text-white font-extrabold shrink-0 ml-2 cursor-pointer"
      >
        Set Location 📍
      </button>
    </div>
  );
};
export default LocationBanner;
