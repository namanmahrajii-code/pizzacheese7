'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Search, User, UtensilsCrossed, Bike } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { STORE_LOCATION } from '@/lib/constants';
import { usePathname } from 'next/navigation';

import { useLocation } from '@/context/LocationContext';

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchChange, onOpenProfile }) => {
  const pathname = usePathname();
  const isDineInRoute = pathname?.startsWith('/dine-in');
  const { setDeliveryMode } = useCartStore();
  const { coordinates, locationAddress, isLocating, locationStatus, requestLocation } = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  // Lock delivery mode according to current URL route
  useEffect(() => {
    if (isDineInRoute) {
      setDeliveryMode('Dine-in');
    } else {
      setDeliveryMode('Delivery');
    }
  }, [isDineInRoute, setDeliveryMode]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#002855] text-white shadow-md">
      {/* Top Status Bar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0 pr-1">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            {isDineInRoute ? (
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <MapPin className={`w-3.5 h-3.5 ${coordinates ? 'text-emerald-400' : 'text-red-400'}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xs tracking-tight text-white truncate">
                {isDineInRoute
                  ? STORE_LOCATION.name
                  : (coordinates ? 'DELIVERING TO' : STORE_LOCATION.name)}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                  isDineInRoute
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : coordinates
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {isDineInRoute ? 'DINE-IN QR' : coordinates ? 'GPS LOCKED' : STORE_LOCATION.city}
              </span>
            </div>
            <p
              className="text-[10.5px] text-gray-300 truncate leading-tight font-normal"
              title={!isDineInRoute && locationAddress ? locationAddress : STORE_LOCATION.fullAddress}
            >
              {!isDineInRoute && locationAddress
                ? locationAddress
                : 'Kaladhungi Road, Unchapul, Near TVS Showroom, Haldwani 263139'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Cheese points pill */}
          <div className="flex items-center space-x-1 bg-white/10 hover:bg-white/15 border border-white/20 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
            <span className="text-yellow-400">🧀</span>
            <span>120/600</span>
          </div>

          {/* Search toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            title="Search Pizza"
          >
            <Search className="w-4 h-4 text-white" />
          </button>

          {/* Profile icon */}
          <button
            onClick={onOpenProfile}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            title="Profile & Orders"
          >
            <User className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Search Input Bar (expandable) */}
      {showSearch && (
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearch}
              placeholder="Search Margherita, Peppy Paneer, Garlic Bread..."
              className="w-full bg-white text-gray-800 placeholder-gray-400 text-xs rounded-full pl-9 pr-4 py-2 outline-none shadow-inner"
              autoFocus
            />
            {searchVal && (
              <button
                onClick={() => {
                  setSearchVal('');
                  if (onSearchChange) onSearchChange('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode Banner according to Route */}
      {!isDineInRoute && (
        <div className="px-3 pb-2.5">
          <div className="bg-white/10 border border-white/10 p-2 rounded-xl backdrop-blur-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bike className="w-4 h-4 text-red-400" />
              <div>
                <span className="text-xs font-black text-white block">🛵 Home Delivery</span>
                <span className="text-[10px] text-gray-300">Hot & Cheesy pizzas at your doorstep • 30-40 Mins</span>
              </div>
            </div>
            <span className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
              LIVE
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
export default Header;
