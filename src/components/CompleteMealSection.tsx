'use client';

import React, { useState } from 'react';
import { LayoutGrid, Plus, Check, CupSoda, Cake, UtensilsCrossed, Sparkles } from 'lucide-react';
import VegNonVegIcon from './VegNonVegIcon';
import { useCartStore } from '@/store/cartStore';

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  image: string;
  isVeg: boolean;
  category: 'Beverages' | 'Desserts' | 'Sides' | 'Popular';
}

const MEAL_ADDONS: AddonItem[] = [
  // ==========================================
  // 1. BEVERAGES (Default First Tab)
  // ==========================================
  {
    id: 'addon-cold-coffee',
    name: 'Classic Cold Coffee',
    price: 109,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Beverages',
  },
  {
    id: 'addon-oreo-shake',
    name: 'Oreo Thick Shake',
    price: 119,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Beverages',
  },
  {
    id: 'addon-virgin-mojito',
    name: 'Virgin Mojito Cooler',
    price: 129,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Beverages',
  },
  {
    id: 'addon-fresh-lime',
    name: 'Fresh Lime Soda (Sweet & Salt)',
    price: 70,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Beverages',
  },
  {
    id: 'addon-peach-tea',
    name: 'Peach Iced Tea',
    price: 89,
    image: 'https://images.unsplash.com/photo-1558857563-b37cfb4279b9?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Beverages',
  },
  {
    id: 'addon-mango-boba',
    name: 'Mango Popping Boba',
    price: 140,
    image: 'https://images.unsplash.com/photo-1558857563-b37cfb4279b9?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Beverages',
  },

  // ==========================================
  // 2. DESSERTS (Second Tab)
  // ==========================================
  {
    id: 'addon-choco-lava',
    name: 'Warm Choco Lava Cake',
    price: 119,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Desserts',
  },
  {
    id: 'addon-choco-frappe',
    name: 'Belgian Chocolate Frappe',
    price: 119,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Desserts',
  },
  {
    id: 'addon-kesar-mango',
    name: 'Royal Kesar Mango Shake',
    price: 119,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Desserts',
  },
  {
    id: 'addon-strawberry-shake',
    name: 'Strawberry Thick Shake',
    price: 119,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Desserts',
  },

  // ==========================================
  // 3. SIDES (Crunchy & Savory Accompaniments)
  // ==========================================
  {
    id: 'addon-garlic-bread',
    name: 'Classic Stuffed Garlic Bread',
    price: 129,
    image: 'https://images.unsplash.com/photo-1619881589148-c89b7b9015c7?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Sides',
  },
  {
    id: 'addon-chicken-pops',
    name: 'Saucy Chicken Pops - Peri Peri',
    price: 150,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80',
    isVeg: false,
    category: 'Sides',
  },
  {
    id: 'addon-peri-peri-fries',
    name: 'Peri Peri Fries (Spicy)',
    price: 89,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Sides',
  },
  {
    id: 'addon-salted-fries',
    name: 'Crispy Salted Fries',
    price: 79,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Sides',
  },
  {
    id: 'addon-cheese-bites',
    name: 'Mozzarella Cheese Bites (6pc)',
    price: 109,
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Sides',
  },
  {
    id: 'addon-chicken-hot-wings',
    name: 'Crispy Chicken Hot Wings',
    price: 99,
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&auto=format&fit=crop&q=80',
    isVeg: false,
    category: 'Sides',
  },

  // ==========================================
  // 4. POPULAR COMBOS (Top Non-Pizza Picks)
  // ==========================================
  {
    id: 'addon-popular-lava',
    name: 'Choco Lava Cake',
    price: 119,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Popular',
  },
  {
    id: 'addon-popular-coffee',
    name: 'Classic Cold Coffee',
    price: 109,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Popular',
  },
  {
    id: 'addon-popular-oreo',
    name: 'Oreo Thick Shake',
    price: 119,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Popular',
  },
  {
    id: 'addon-popular-gb',
    name: 'Classic Stuffed Garlic Bread',
    price: 129,
    image: 'https://images.unsplash.com/photo-1619881589148-c89b7b9015c7?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Popular',
  },
  {
    id: 'addon-popular-fries',
    name: 'Peri Peri Crispy Fries',
    price: 89,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80',
    isVeg: true,
    category: 'Popular',
  },
];

export const CompleteMealSection: React.FC = () => {
  // Put Beverages first as default category!
  const [activeCategory, setActiveCategory] = useState<'Beverages' | 'Desserts' | 'Sides' | 'Popular'>('Beverages');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const { addItem, items } = useCartStore();

  // Beverages and Desserts first!
  const categories: { key: 'Beverages' | 'Desserts' | 'Sides' | 'Popular'; label: string; icon: string }[] = [
    { key: 'Beverages', label: 'Beverages', icon: '🥤' },
    { key: 'Desserts', label: 'Desserts', icon: '🍫' },
    { key: 'Sides', label: 'Sides', icon: '🥖' },
    { key: 'Popular', label: 'Popular', icon: '⭐' },
  ];

  const filteredItems = MEAL_ADDONS.filter((item) => item.category === activeCategory);

  const handleAdd = (item: AddonItem) => {
    addItem({
      productId: item.id,
      name: item.name,
      price: item.price,
      basePrice: item.price,
      size: 'Standard',
      crust: 'Standard',
      quantity: 1,
      image: item.image,
      isVeg: item.isVeg,
    });

    setRecentlyAddedId(item.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1500);
  };

  return (
    <div className="bg-[#1a1f2c] text-white p-3.5 rounded-2xl border border-gray-800 shadow-md space-y-3">
      {/* Section Header */}
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white/90">
          <LayoutGrid className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-tight">
            Complete your meal with
          </h3>
          <p className="text-[10px] text-gray-400 font-medium">Chilled drinks, desserts & sides to pair with your pizza</p>
        </div>
      </div>

      {/* Filter Category Pills (Beverages & Desserts starting first!) */}
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-tight transition-all duration-150 shrink-0 flex items-center space-x-1 cursor-pointer ${
                isActive
                  ? 'bg-white text-gray-950 shadow-sm scale-[1.02]'
                  : 'bg-white/10 hover:bg-white/15 text-gray-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Horizontal Carousel of Product Cards */}
      <div className="flex space-x-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
        {filteredItems.map((item) => {
          const isAdded = recentlyAddedId === item.id;
          const cartItem = items.find((i) => i.productId === item.id);
          const inCartCount = cartItem?.quantity || 0;

          return (
            <div
              key={item.id}
              className="w-28 sm:w-32 shrink-0 bg-[#242a38] p-2 rounded-xl border border-gray-700/60 flex flex-col justify-between snap-start"
            >
              {/* Product Image & Floating Add Button */}
              <div className="relative w-full h-20 sm:h-22 rounded-lg overflow-hidden bg-gray-900 group">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />

                {/* Domino's Style Red Plus Button on Image */}
                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  className={`absolute bottom-1 right-1 w-6 h-6 rounded-md flex items-center justify-center text-white transition-transform active:scale-90 cursor-pointer shadow-md ${
                    isAdded
                      ? 'bg-emerald-600'
                      : inCartCount > 0
                      ? 'bg-amber-600'
                      : 'bg-[#e31837] hover:bg-red-700'
                  }`}
                  title={`Add ${item.name} to cart`}
                >
                  {isAdded ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </button>
              </div>

              {/* Product Info */}
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center space-x-1">
                  <VegNonVegIcon isVeg={item.isVeg} size="sm" />
                  {inCartCount > 0 && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded">
                      {inCartCount} in cart
                    </span>
                  )}
                </div>

                <h4
                  className="text-[11px] font-bold text-gray-100 line-clamp-2 leading-tight min-h-[26px]"
                  title={item.name}
                >
                  {item.name}
                </h4>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs font-black text-white">₹{item.price}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompleteMealSection;
