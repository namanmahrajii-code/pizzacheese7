'use client';

import React from 'react';
import VegNonVegIcon from './VegNonVegIcon';
import { ProductItem } from '@/lib/data';
import { useCartStore } from '@/store/cartStore';
import { Plus, Minus, Ban } from 'lucide-react';

interface ProductCardProps {
  product: ProductItem;
  onOpenCustomizer: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenCustomizer }) => {
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  const isPizza = product.categorySlug === 'veg-pizzas' || product.categorySlug === 'non-veg-pizzas';
  const isAvailable = product.inStock !== false;

  // Find all cart items for this product
  const cartItemsForThisProduct = items.filter((item) => item.productId === product.id);
  const totalQty = cartItemsForThisProduct.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuickAdd = () => {
    if (!isAvailable) return;
    if (isPizza) {
      onOpenCustomizer(product);
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        basePrice: product.price,
        size: 'Standard',
        crust: 'Standard',
        quantity: 1,
        image: product.image,
        isVeg: product.isVeg,
      });
    }
  };

  const handleIncrement = () => {
    if (!isAvailable) return;
    if (isPizza) {
      onOpenCustomizer(product);
    } else if (cartItemsForThisProduct.length > 0) {
      updateQuantity(cartItemsForThisProduct[0].id, cartItemsForThisProduct[0].quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (cartItemsForThisProduct.length > 0) {
      const lastItem = cartItemsForThisProduct[cartItemsForThisProduct.length - 1];
      if (lastItem.quantity === 1) {
        removeItem(lastItem.id);
      } else {
        updateQuantity(lastItem.id, lastItem.quantity - 1);
      }
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-xs border transition-all hover:shadow-md flex flex-col justify-between ${
        !isAvailable ? 'opacity-70 border-gray-200' : 'border-gray-100/90'
      }`}
    >
      {/* Product Image Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isAvailable ? 'hover:scale-105' : 'grayscale-50'
          }`}
          loading="lazy"
        />

        {/* Badge (e.g. Bestseller / Must Try) or Out of Stock Badge */}
        {!isAvailable ? (
          <div className="absolute top-2.5 left-2.5 bg-red-950/90 text-red-200 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md backdrop-blur-xs border border-red-500/40 flex items-center space-x-1">
            <Ban className="w-3 h-3" />
            <span>Out of Stock</span>
          </div>
        ) : product.badge ? (
          <div className="absolute top-2.5 left-2.5 bg-[#002855] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md backdrop-blur-xs border border-white/20">
            {product.badge}
          </div>
        ) : null}

        {/* Veg/Non-Veg Badge Icon */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/95 p-1 rounded-md shadow-xs backdrop-blur-xs">
          <VegNonVegIcon isVeg={product.isVeg} size="sm" />
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 leading-tight">
              {product.name}
            </h3>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Add Button Row */}
        <div className="mt-3.5 pt-2 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base font-black text-gray-900">₹{product.price}</span>
              <span className="text-xs text-gray-400 line-through">₹{product.price + 30}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700">Save ₹30</span>
          </div>

          {/* Action button */}
          <div>
            {!isAvailable ? (
              <button
                disabled
                className="bg-gray-200 text-gray-400 font-extrabold text-xs px-3 py-2 rounded-xl cursor-not-allowed shadow-none"
              >
                Sold Out
              </button>
            ) : totalQty > 0 ? (
              <div className="flex items-center bg-[#e31837] text-white rounded-xl shadow-xs overflow-hidden">
                <button
                  onClick={handleDecrement}
                  className="px-2.5 py-1.5 hover:bg-[#c4122d] transition-colors"
                  title="Remove one"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-black text-xs min-w-[20px] text-center">{totalQty}</span>
                <button
                  onClick={handleIncrement}
                  className="px-2.5 py-1.5 hover:bg-[#c4122d] transition-colors"
                  title="Add more or customize"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleQuickAdd}
                className="bg-[#e31837] hover:bg-[#c4122d] active:scale-95 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex flex-col items-center justify-center min-w-[76px]"
              >
                <span className="tracking-wide">ADD +</span>
                {isPizza && <span className="text-[8px] font-medium text-red-100 uppercase -mt-0.5">Customisable</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductCard;
