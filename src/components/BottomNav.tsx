'use client';

import React from 'react';
import { UtensilsCrossed, Tag, ShoppingCart, User, ChevronRight, Clock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface BottomNavProps {
  activeTab: 'menu' | 'deals' | 'orders' | 'cart' | 'profile';
  onSelectTab: (tab: 'menu' | 'deals' | 'orders' | 'cart' | 'profile') => void;
  onOpenCart: () => void;
  activeOrderId?: string | null;
  onOpenTracking?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenCart,
  activeOrderId,
  onOpenTracking,
}) => {
  const { getTotalCount, getGrandTotal } = useCartStore();
  const itemCount = getTotalCount();
  const totalAmount = getGrandTotal();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none">
      {/* Floating Cart Strip (Domino's style: "X ITEMS | ₹XXX - VIEW CART & ORDER NOW >") */}
      {itemCount > 0 && (
        <div className="px-3 mb-2 pointer-events-auto animate-bounce-short">
          <button
            onClick={onOpenCart}
            className="w-full bg-[#008000] hover:bg-[#007000] active:scale-[0.99] text-white py-3 px-4 rounded-2xl shadow-2xl flex items-center justify-between transition-all border border-emerald-400/50 cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <span className="bg-white text-[#008000] text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
                {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
              </span>
              <div className="text-left leading-tight">
                <span className="text-sm font-black block tracking-tight">₹{totalAmount}</span>
                <span className="text-[10px] text-emerald-100 font-medium">Extra savings applied</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 font-black text-xs uppercase tracking-wider bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 group-hover:bg-white/25 transition-all">
              <span>View Cart &amp; Order Now</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* Floating Active Order Tracker Strip (When Cart is empty but an order is in progress) */}
      {activeOrderId && itemCount === 0 && (
        <div className="px-4 mb-2 pointer-events-auto animate-bounce-short">
          <button
            onClick={onOpenTracking}
            className="w-full bg-gradient-to-r from-[#002855] to-[#0a3a70] hover:from-[#001f44] hover:to-[#082e59] active:scale-[0.99] text-white py-2.5 px-4 rounded-2xl shadow-xl flex items-center justify-between transition-all border border-blue-400/30 cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center relative">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-xs font-black block text-white">Order #{activeOrderId}</span>
                <span className="text-[10px] text-blue-200 font-medium">Kitchen is baking your pizzas</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 font-black text-xs uppercase tracking-wider text-emerald-300">
              <span>Track Live</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <nav className="bg-white border-t border-gray-200 shadow-bottom-bar px-3 py-2 flex items-center justify-around pointer-events-auto safe-area-bottom">
        {/* Menu Tab */}
        <button
          onClick={() => onSelectTab('menu')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            activeTab === 'menu' ? 'text-[#e31837] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Menu</span>
        </button>

        {/* Deals Tab */}
        <button
          onClick={() => onSelectTab('deals')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors cursor-pointer ${
            activeTab === 'deals' ? 'text-[#e31837] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span className="absolute -top-1 right-5 bg-[#e31837] text-white text-[8px] font-black px-1 rounded-full">
            OFFER
          </span>
          <Tag className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Deals</span>
        </button>

        {/* Live Order Tab (Dynamically shown when active order exists) */}
        {activeOrderId && (
          <button
            onClick={onOpenTracking}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'text-[#e31837] font-black'
                : 'text-emerald-700 hover:text-emerald-900 font-extrabold'
            }`}
          >
            <span className="absolute -top-1 right-4 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              LIVE
            </span>
            <Clock className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] mt-1 tracking-tight font-black">Live Order</span>
          </button>
        )}

        {/* Cart Tab */}
        <button
          onClick={onOpenCart}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors cursor-pointer ${
            activeTab === 'cart' ? 'text-[#e31837] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {itemCount > 0 && (
            <span className="absolute -top-1 right-5 bg-[#e31837] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Cart</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-[#e31837] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Profile</span>
        </button>
      </nav>
    </div>
  );
};
export default BottomNav;
