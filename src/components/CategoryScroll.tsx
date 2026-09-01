'use client';

import React from 'react';
import { CategoryItem } from '@/lib/data';

interface CategoryScrollProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export const CategoryScroll: React.FC<CategoryScrollProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const categoryImages: Record<string, string> = {
    'veg-pizzas': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&auto=format&fit=crop&q=80',
    'non-veg-pizzas': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80',
    'pan-pizzas': 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=300&auto=format&fit=crop&q=80',
    'starters-sides': 'https://images.unsplash.com/photo-1619881589148-c89b7b9015c7?w=300&auto=format&fit=crop&q=80',
    'burgers-wraps': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80',
    'pasta-chicken-corner': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=300&auto=format&fit=crop&q=80',
    'desserts-beverages': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&auto=format&fit=crop&q=80',
  };

  const categoryPriceBadges: Record<string, string> = {
    'veg-pizzas': '@119',
    'non-veg-pizzas': '@199',
    'pan-pizzas': '@99',
    'starters-sides': '@69',
    'burgers-wraps': '@59',
    'pasta-chicken-corner': '@99',
    'desserts-beverages': '@70',
  };

  return (
    <div className="bg-white py-3 border-b border-gray-100">
      <div className="px-4 mb-2 flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900 tracking-tight">What are you craving for?</h3>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-[11px] font-bold text-[#e31837] hover:underline"
          >
            Show All
          </button>
        )}
      </div>

      <div className="flex overflow-x-auto space-x-3.5 px-4 pb-1 no-scrollbar">
        {/* All Items Bubble */}
        <button
          onClick={() => onSelectCategory('all')}
          className="flex flex-col items-center shrink-0 group focus:outline-none"
        >
          <div
            className={`w-16 h-16 rounded-full p-0.5 transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'ring-2 ring-[#e31837] ring-offset-2 scale-105 shadow-md'
                : 'ring-1 ring-gray-200 group-hover:ring-gray-300'
            }`}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#002855] to-[#006491] flex flex-col items-center justify-center text-white relative overflow-hidden">
              <span className="text-xs font-black">ALL</span>
              <span className="text-[9px] font-medium text-yellow-300">MENU</span>
            </div>
          </div>
          <span
            className={`mt-1.5 text-[11px] font-bold tracking-tight text-center ${
              selectedCategory === 'all' ? 'text-[#e31837]' : 'text-gray-700'
            }`}
          >
            All Items
          </span>
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          const bgImg = categoryImages[cat.slug] || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80';
          const priceBadge = categoryPriceBadges[cat.slug];

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className="flex flex-col items-center shrink-0 group focus:outline-none"
            >
              <div
                className={`w-16 h-16 rounded-full p-0.5 transition-all duration-200 relative ${
                  isSelected
                    ? 'ring-2 ring-[#e31837] ring-offset-2 scale-105 shadow-md'
                    : 'ring-1 ring-gray-200 group-hover:ring-gray-300'
                }`}
              >
                <div
                  className="w-full h-full rounded-full bg-cover bg-center overflow-hidden relative shadow-inner"
                  style={{ backgroundImage: `url(${bgImg})` }}
                >
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    {priceBadge && (
                      <span className="bg-[#002855]/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full backdrop-blur-xs border border-white/30">
                        {priceBadge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={`mt-1.5 text-[11px] font-bold tracking-tight text-center max-w-[76px] leading-tight line-clamp-2 ${
                  isSelected ? 'text-[#e31837]' : 'text-gray-700'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default CategoryScroll;
