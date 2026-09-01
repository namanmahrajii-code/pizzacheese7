import React from 'react';

interface VegNonVegIconProps {
  isVeg: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VegNonVegIcon: React.FC<VegNonVegIconProps> = ({ isVeg, size = 'md', className = '' }) => {
  const dimensionClass = {
    sm: 'w-3.5 h-3.5 p-[2px]',
    md: 'w-4 h-4 p-[2.5px]',
    lg: 'w-5 h-5 p-[3px]',
  }[size];

  const dotClass = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  if (isVeg) {
    return (
      <div
        className={`inline-flex items-center justify-center border-2 border-emerald-600 bg-white rounded-xs ${dimensionClass} ${className}`}
        title="Vegetarian"
      >
        <span className={`bg-emerald-600 rounded-full ${dotClass}`} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center border-2 border-red-700 bg-white rounded-xs ${dimensionClass} ${className}`}
      title="Non-Vegetarian"
    >
      <span
        className={`bg-red-700 ${dotClass}`}
        style={{
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        }}
      />
    </div>
  );
};
export default VegNonVegIcon;
