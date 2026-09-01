'use client';

import React, { useState } from 'react';
import { X, Check, Plus, Minus, Sparkles } from 'lucide-react';
import VegNonVegIcon from './VegNonVegIcon';
import { ProductItem } from '@/lib/data';
import { useCartStore } from '@/store/cartStore';

interface ModifierModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export type PizzaSize = 'Regular' | 'Medium' | 'Large';

export interface CrustOption {
  name: string;
  priceModifier: {
    Regular: number;
    Medium: number;
    Large: number;
  };
  description: string;
}

const CRUST_OPTIONS: CrustOption[] = [
  {
    name: 'Classic Hand Tossed',
    priceModifier: { Regular: 0, Medium: 0, Large: 0 },
    description: 'Crispy on the outside, soft & fluffy on the inside with garlic seasoning',
  },
  {
    name: 'Cheese Burst',
    priceModifier: { Regular: 50, Medium: 80, Large: 110 },
    description: 'Crust with oozing molten liquid cheese that melts with every bite',
  },
  {
    name: 'Thin Crust',
    priceModifier: { Regular: 30, Medium: 40, Large: 70 },
    description: 'Light, crunchy wafer-thin artisan crust baked till golden brown',
  },
];

const TOPPING_PRICES = {
  extraVeg: { Regular: 25, Medium: 35, Large: 45 },
  extraNonVeg: { Regular: 40, Medium: 50, Large: 70 },
  extraCheese: { Regular: 49, Medium: 69, Large: 99 },
};

export const ModifierModal: React.FC<ModifierModalProps> = ({ product, isOpen, onClose }) => {
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('Regular');
  const [selectedCrust, setSelectedCrust] = useState<string>('Classic Hand Tossed');
  const [extraCheese, setExtraCheese] = useState<boolean>(false);
  const [extraVeg, setExtraVeg] = useState<boolean>(false);
  const [extraNonVeg, setExtraNonVeg] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);

  if (!isOpen || !product) return null;

  const isPizza = product.categorySlug === 'veg-pizzas' || product.categorySlug === 'non-veg-pizzas';

  // Base price for selected size
  const baseSizePrice = isPizza && product.prices
    ? product.prices[selectedSize] || product.price
    : product.price;

  const currentCrustObj = CRUST_OPTIONS.find((c) => c.name === selectedCrust) || CRUST_OPTIONS[0];
  const crustPrice = isPizza ? currentCrustObj.priceModifier[selectedSize] : 0;
  
  const extraCheesePrice = isPizza && extraCheese ? TOPPING_PRICES.extraCheese[selectedSize] : 0;
  const extraVegPrice = isPizza && extraVeg ? TOPPING_PRICES.extraVeg[selectedSize] : 0;
  const extraNonVegPrice = isPizza && extraNonVeg ? TOPPING_PRICES.extraNonVeg[selectedSize] : 0;

  const unitPrice = baseSizePrice + crustPrice + extraCheesePrice + extraVegPrice + extraNonVegPrice;
  const totalPrice = unitPrice * quantity;

  // Build modifier label
  const modifierParts: string[] = [];
  if (isPizza) {
    if (selectedCrust !== 'Classic Hand Tossed') modifierParts.push(selectedCrust);
    if (extraCheese) modifierParts.push('Extra Cheese');
    if (extraVeg) modifierParts.push('Extra Veg');
    if (extraNonVeg) modifierParts.push('Extra Non-Veg');
  }
  const crustLabel = isPizza ? (modifierParts.length > 0 ? modifierParts.join(', ') : selectedCrust) : 'Standard';

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: unitPrice,
      basePrice: product.price,
      size: isPizza ? selectedSize : 'Standard',
      crust: crustLabel,
      quantity,
      image: product.image,
      isVeg: product.isVeg,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom Sheet Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center space-x-2">
            <VegNonVegIcon isVeg={product.isVeg} size="md" />
            <h3 className="font-extrabold text-base text-gray-900 leading-tight">{product.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/80 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Customization Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1 text-sm">
          {/* Product quick summary */}
          <div className="flex space-x-3.5 bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-20 rounded-xl object-cover shadow-xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{product.description}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm font-black text-gray-900">₹{unitPrice}</span>
                <span className="text-xs text-gray-400 line-through">₹{unitPrice + 40}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Best Value
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Choose Size (for Category 1 & 2 Pizzas) */}
          {isPizza && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider">
                  1. Select Size <span className="text-red-500">*</span>
                </h4>
                <span className="text-[11px] font-semibold text-gray-500">Pick 1 option</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {(['Regular', 'Medium', 'Large'] as PizzaSize[]).map((size) => {
                  const isSelected = selectedSize === size;
                  const sizePrice = product.prices ? product.prices[size] : product.price;
                  const serves = size === 'Regular' ? 'Serves 1' : size === 'Medium' ? 'Serves 2' : 'Serves 4';

                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#002855] bg-blue-50/50 ring-2 ring-[#002855] shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`font-black text-xs ${isSelected ? 'text-[#002855]' : 'text-gray-900'}`}>
                            {size}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#002855] bg-[#002855] text-white' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-500 block mt-0.5">{serves}</span>
                      </div>
                      <span className="text-xs font-black text-gray-900 mt-2">₹{sizePrice}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Choose Crust (for Category 1 & 2 Pizzas) */}
          {isPizza && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider">
                  2. Select Crust <span className="text-red-500">*</span>
                </h4>
                <span className="text-[11px] font-semibold text-gray-500">Pick 1 option</span>
              </div>

              <div className="space-y-2">
                {CRUST_OPTIONS.map((crust) => {
                  const isSelected = selectedCrust === crust.name;
                  const addedCost = crust.priceModifier[selectedSize];

                  return (
                    <button
                      key={crust.name}
                      onClick={() => setSelectedCrust(crust.name)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#e31837] bg-red-50/40 ring-1 ring-[#e31837]'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5 pr-2">
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                            isSelected ? 'border-[#e31837] bg-[#e31837] text-white' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-gray-900">{crust.name}</span>
                            {crust.name === 'Cheese Burst' && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                ⭐ Highly Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">{crust.description}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-gray-900 shrink-0">
                        {addedCost === 0 ? 'Free' : `+₹${addedCost}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Extra Toppings & Addons (Apply ONLY to Category 1 & 2) */}
          {isPizza && (
            <div className="space-y-2.5">
              <h4 className="font-black text-xs text-gray-900 uppercase tracking-wider">
                3. Extra Toppings & Cheese
              </h4>

              {/* Extra Cheese */}
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">🧀</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Extra Real Mozzarella Cheese</p>
                    <p className="text-[10px] text-gray-600">Rich gooey cheese pull (+₹{TOPPING_PRICES.extraCheese[selectedSize]})</p>
                  </div>
                </div>
                <button
                  onClick={() => setExtraCheese(!extraCheese)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    extraCheese
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  {extraCheese ? 'Added' : `+₹${TOPPING_PRICES.extraCheese[selectedSize]}`}
                </button>
              </div>

              {/* Extra Veg Topping */}
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">🫑</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Extra Veg Toppings</p>
                    <p className="text-[10px] text-gray-600">Olives, mushrooms, paneer, corn (+₹{TOPPING_PRICES.extraVeg[selectedSize]})</p>
                  </div>
                </div>
                <button
                  onClick={() => setExtraVeg(!extraVeg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    extraVeg
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  {extraVeg ? 'Added' : `+₹${TOPPING_PRICES.extraVeg[selectedSize]}`}
                </button>
              </div>

              {/* Extra Non-Veg Topping (Available for all pizzas) */}
              <div className="p-3 bg-red-50/70 rounded-2xl border border-red-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">🍗</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Extra Non-Veg Toppings</p>
                    <p className="text-[10px] text-gray-600">Spiced chicken chunks & seekh (+₹{TOPPING_PRICES.extraNonVeg[selectedSize]})</p>
                  </div>
                </div>
                <button
                  onClick={() => setExtraNonVeg(!extraNonVeg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    extraNonVeg
                      ? 'bg-[#e31837] text-white shadow-xs'
                      : 'bg-white border border-red-300 text-red-900 hover:bg-red-100'
                  }`}
                >
                  {extraNonVeg ? 'Added' : `+₹${TOPPING_PRICES.extraNonVeg[selectedSize]}`}
                </button>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="font-bold text-xs text-gray-700">Quantity</span>
            <div className="flex items-center space-x-3 bg-gray-100 px-3 py-1.5 rounded-xl">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-6 h-6 rounded-md bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs hover:bg-gray-50 disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-black text-sm text-gray-900 w-5 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-6 h-6 rounded-md bg-white text-gray-700 font-bold flex items-center justify-center shadow-xs hover:bg-gray-50"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer sticky Add to cart button */}
        <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
          <button
            onClick={handleAddToCart}
            className="w-full bg-[#e31837] hover:bg-[#c4122d] active:scale-[0.99] text-white font-extrabold py-3.5 px-5 rounded-2xl flex items-center justify-between shadow-md transition-all"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-red-100 uppercase tracking-wider font-semibold">
                {quantity} Item{quantity > 1 ? 's' : ''} Selected
              </span>
              <span className="text-base font-black">₹{totalPrice}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-black/20 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-black tracking-wide">ADD TO ORDER</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
export default ModifierModal;
