'use client';

import React from 'react';
import { UtensilsCrossed, Tag, ShoppingCart, User, ChevronRight, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface BottomNavProps {
  activeTab: 'menu' | 'deals' | 'cart' | 'profile';
  onSelectTab: (tab: 'menu' | 'deals' | 'cart' | 'profile') => void;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onOpenCart }) => {
  const { getTotalCount, getGrandTotal } = useCartStore();
  const itemCount = getTotalCount();
  const totalAmount = getGrandTotal();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none">
      {/* Floating Cart Strip (Domino's style: "X ITEMS | ₹XXX - VIEW CART >") */}
      {itemCount > 0 && (
        <div className="px-4 mb-2 pointer-events-auto animate-bounce-short">
          <button
            onClick={onOpenCart}
            className="w-full bg-[#008000] hover:bg-[#007000] active:scale-[0.99] text-white py-3 px-4 rounded-2xl shadow-xl flex items-center justify-between transition-all border border-emerald-400/40"
          >
            <div className="flex items-center space-x-2">
              <span className="bg-white text-emerald-800 text-xs font-black px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
              <div className="text-left leading-tight">
                <span className="text-xs font-black block">₹{totalAmount}</span>
                <span className="text-[10px] text-emerald-100 font-medium">Extra charges may apply</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 font-black text-xs uppercase tracking-wider">
              <span>View Cart</span>
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
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'menu' ? 'text-[#e31837] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Menu</span>
        </button>

        {/* Deals Tab */}
        <button
          onClick={() => onSelectTab('deals')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
            activeTab === 'deals' ? 'text-[#e31837] font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span className="absolute -top-1 right-5 bg-[#e31837] text-white text-[8px] font-black px-1 rounded-full">
            OFFER
          </span>
          <Tag className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Deals</span>
        </button>

        {/* Cart Tab */}
        <button
          onClick={onOpenCart}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
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
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
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
