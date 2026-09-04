'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Search,
  User,
  ChevronDown,
  Store,
  Clock,
  Phone,
  Check,
  X,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { STORE_LOCATION } from '@/lib/constants';
import { usePathname, useRouter } from 'next/navigation';
import { useLocation } from '@/context/LocationContext';

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchChange, onOpenProfile }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isDineInRoute = Boolean(pathname?.startsWith('/dine-in') || pathname?.startsWith('/din-in'));

  const { deliveryMode, setDeliveryMode } = useCartStore();
  const { coordinates, locationAddress, requestLocation, isLocating } = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);

  // Active mode from store: on main site, only Delivery or Takeaway is allowed!
  const activeMode: 'Delivery' | 'Takeaway' | 'Dine-in' = isDineInRoute
    ? 'Dine-in'
    : deliveryMode === 'Takeaway'
    ? 'Takeaway'
    : 'Delivery';

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  const handleSelectMode = (mode: 'Delivery' | 'Takeaway') => {
    setDeliveryMode(mode);
  };

  const displayLocationTitle = coordinates && locationAddress
    ? locationAddress.split(',')[0]
    : 'Bhagwanpur Jaisingh';

  const displayLocationSubtitle = coordinates && locationAddress
    ? locationAddress
    : 'Bhagwanpur Jaisingh, Panpur';

  return (
    <header className="sticky top-0 z-30 bg-[#002855] text-white shadow-md">
      {/* Top Status Bar: Location, Points Wheel, Profile & Search */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
        {/* Left: Location Pin & Dropdown */}
        <button
          type="button"
          onClick={() => setIsLocationModalOpen(true)}
          className="flex items-center space-x-2 flex-1 min-w-0 pr-1 text-left cursor-pointer group"
          title="Change Location"
        >
          {/* Red MapPin as in reference screenshot */}
          <div className="shrink-0">
            <MapPin className="w-4 h-4 text-[#e31837] fill-[#e31837]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-xs sm:text-[13px] tracking-tight text-white truncate group-hover:text-amber-200 transition-colors">
                {displayLocationTitle}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/90 shrink-0 stroke-[2.5]" />
            </div>
            <p className="text-[10px] text-gray-300 truncate leading-tight font-normal">
              {displayLocationSubtitle}
            </p>
          </div>
        </button>

        {/* Right: Pizza Wheel Points Pill, Search & Profile */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* 0/600 Pizza Wheel Reward Pill */}
          <button
            type="button"
            onClick={() => setIsRewardsModalOpen(true)}
            className="flex items-center space-x-1.5 border border-white/25 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md text-xs font-bold text-white backdrop-blur-xs transition-all cursor-pointer"
            title="Cheese Points & Rewards"
          >
            {/* Domino's style sliced pizza wheel icon */}
            <svg
              className="w-3.5 h-3.5 text-white shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
            </svg>
            <span className="text-[11px] tracking-tight">0/600</span>
          </button>

          {/* Search Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Search Pizza"
          >
            <Search className="w-4 h-4 text-white" />
          </button>

          {/* Profile Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
            title="Profile & Cart"
          >
            <User className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearch && (
        <div className="px-3.5 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearch}
              placeholder="Search Margherita, Peppy Paneer, Garlic Bread..."
              className="w-full bg-white text-gray-900 placeholder-gray-400 text-xs rounded-full pl-9 pr-8 py-2 outline-none shadow-inner font-medium"
              autoFocus
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => {
                  setSearchVal('');
                  if (onSearchChange) onSearchChange('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2-Option Segmented Tab Bar on Main Site (Delivery & Takeaway) */}
      {!isDineInRoute ? (
        <div className="px-3 pb-2.5 pt-0.5">
          <div className="grid grid-cols-2 bg-[#001c3d]/60 p-0.5 rounded-xl border border-white/15">
            {/* Tab 1: Delivery */}
            <button
              type="button"
              onClick={() => handleSelectMode('Delivery')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all duration-150 flex flex-col items-center justify-center cursor-pointer ${
                activeMode === 'Delivery'
                  ? 'bg-white text-gray-950 shadow-md scale-[1.01]'
                  : 'text-white hover:bg-white/5 border-r border-white/20'
              }`}
            >
              <span
                className={`text-xs tracking-tight leading-tight block ${
                  activeMode === 'Delivery' ? 'font-black text-gray-950' : 'font-bold text-white'
                }`}
              >
                Delivery
              </span>
              <span
                className={`text-[10px] leading-tight block mt-0.5 ${
                  activeMode === 'Delivery' ? 'font-semibold text-gray-700' : 'text-blue-100/80 font-medium'
                }`}
              >
                30 Mins
              </span>
            </button>

            {/* Tab 2: Takeaway */}
            <button
              type="button"
              onClick={() => handleSelectMode('Takeaway')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all duration-150 flex flex-col items-center justify-center cursor-pointer ${
                activeMode === 'Takeaway'
                  ? 'bg-white text-gray-950 shadow-md scale-[1.01]'
                  : 'text-white hover:bg-white/5'
              }`}
            >
              <span
                className={`text-xs tracking-tight leading-tight block ${
                  activeMode === 'Takeaway' ? 'font-black text-gray-950' : 'font-bold text-white'
                }`}
              >
                Takeaway
              </span>
              <span
                className={`text-[10px] leading-tight block mt-0.5 ${
                  activeMode === 'Takeaway' ? 'font-semibold text-gray-700' : 'text-blue-100/80 font-medium'
                }`}
              >
                Select Store
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Dine-in Route Status (Active only when accessed via /din-in or /dine-in) */
        <div className="px-3 pb-2.5 pt-0.5">
          <div className="bg-amber-400/20 border border-amber-400/30 p-2 rounded-xl backdrop-blur-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-base">🍽️</span>
              <div>
                <span className="text-xs font-black text-white block">Table Dine-in Service</span>
                <span className="text-[10px] text-amber-200">Ordering directly to your table • Freshly served</span>
              </div>
            </div>
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
              Dine-in
            </span>
          </div>
        </div>
      )}

      {/* Store Details Modal (when tapping Select Store or store info) */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-gray-900">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-[#002855]" />
                <h3 className="font-extrabold text-base text-gray-900">7Cheese Outlet</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3">
                <h4 className="font-bold text-sm text-[#002855]">{STORE_LOCATION.name}</h4>
                <p className="text-xs text-gray-600 mt-0.5">{STORE_LOCATION.fullAddress}</p>
                <div className="mt-2 flex items-center space-x-3 text-[11px] text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Open • 11 AM - 11 PM</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>{STORE_LOCATION.phone}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="font-bold text-gray-900 block">Takeaway</span>
                  <span className="text-[11px] text-gray-500">Ready in 15-20 Mins</span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="font-bold text-gray-900 block">Dine-in</span>
                  <span className="text-[11px] text-gray-500">Tables Available</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStoreModalOpen(false)}
              className="w-full bg-[#002855] hover:bg-[#001f44] text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              Confirm This Store
            </button>
          </div>
        </div>
      )}

      {/* Location Modal (When clicking the top address / dropdown) */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-gray-900">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-[#e31837]" />
                <h3 className="font-extrabold text-base text-gray-900">Select Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* GPS Auto-detect button */}
              <button
                type="button"
                onClick={() => {
                  requestLocation();
                  setIsLocationModalOpen(false);
                }}
                className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 p-3 rounded-xl flex items-center space-x-3 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Use Current GPS Location</span>
                  <span className="text-[10.5px] text-emerald-700">
                    {isLocating ? 'Detecting coordinates...' : 'Pinpoint for fast 30-min delivery'}
                  </span>
                </div>
              </button>

              {/* Store Default Location */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 p-3 rounded-xl flex items-center space-x-3 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#002855] text-white flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">{STORE_LOCATION.name} Area</span>
                  <span className="text-[10.5px] text-gray-500">
                    {displayLocationSubtitle}
                  </span>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsLocationModalOpen(false)}
              className="w-full bg-[#002855] hover:bg-[#001f44] text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Rewards Info Modal (When clicking 0/600 pizza wheel) */}
      {isRewardsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-gray-900">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🧀</span>
                <h3 className="font-extrabold text-base text-gray-900">Cheese Rewards</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRewardsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center space-y-2">
              <div className="w-12 h-12 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center mx-auto font-black text-sm shadow-md">
                0/600
              </div>
              <h4 className="font-extrabold text-sm text-gray-900">Earn Free Cheesy Pizzas!</h4>
              <p className="text-xs text-gray-600">
                Collect 100 Cheese points on every order. Reach 600 points to unlock a complimentary Medium Pizza or Garlic Bread!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRewardsModalOpen(false)}
              className="w-full bg-[#002855] hover:bg-[#001f44] text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
