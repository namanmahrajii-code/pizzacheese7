'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import VegNonVegIcon from './VegNonVegIcon';

interface FilterBarProps {
  vegFilter: boolean | null; // null = all, true = veg only, false = non-veg only
  onToggleVegFilter: (val: boolean | null) => void;
  categories: { id: string; name: string; slug: string }[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  vegFilter,
  onToggleVegFilter,
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const pathname = usePathname();
  const isDineIn = pathname?.startsWith('/dine-in');

  return (
    <div
      className={`sticky z-20 bg-white border-b border-gray-200 px-4 py-2 shadow-xs ${
        isDineIn ? 'top-[53px]' : 'top-[98px]'
      }`}
    >
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
        {/* Veg Only Pill */}
        <button
          onClick={() => onToggleVegFilter(vegFilter === true ? null : true)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
            vegFilter === true
              ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-600'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <VegNonVegIcon isVeg={true} size="sm" />
          <span>Veg Only</span>
        </button>

        {/* Non-Veg Only Pill */}
        <button
          onClick={() => onToggleVegFilter(vegFilter === false ? null : false)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
            vegFilter === false
              ? 'bg-red-50 border-red-700 text-red-800 ring-1 ring-red-700'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <VegNonVegIcon isVeg={false} size="sm" />
          <span>Non Veg Only</span>
        </button>

        <div className="h-5 w-px bg-gray-200 shrink-0 mx-1" />

        {/* Categories Chips */}
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(selectedCategory === cat.slug ? 'all' : cat.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === cat.slug
                ? 'bg-[#002855] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};
export default FilterBar;
