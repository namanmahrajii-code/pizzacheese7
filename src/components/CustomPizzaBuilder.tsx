'use client';

import React, { useState } from 'react';
import { X, Sparkles, Check, Plus, Minus, Utensils, Info } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import VegNonVegIcon from './VegNonVegIcon';
import confetti from 'canvas-confetti';

interface CustomPizzaBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface PizzaSizeConfig {
  id: string;
  name: string;
  slices: number;
  inches: number;
  basePrice: number;
  description: string;
}

export interface CrustConfig {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface SauceConfig {
  id: string;
  name: string;
  price: number;
  color: string;
  description: string;
}

export interface ToppingConfig {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  category: 'veggies' | 'cheese' | 'meats';
  emoji: string;
}

const PIZZA_SIZES: PizzaSizeConfig[] = [
  { id: 'size-reg', name: 'Regular', slices: 4, inches: 7, basePrice: 199, description: 'Serves 1 • 4 Slices' },
  { id: 'size-med', name: 'Medium', slices: 6, inches: 10, basePrice: 329, description: 'Serves 2-3 • 6 Slices' },
  { id: 'size-lrg', name: 'Large', slices: 8, inches: 12, basePrice: 499, description: 'Serves 3-4 • 8 Slices' },
  { id: 'size-mon', name: 'Monster Feast', slices: 12, inches: 14, basePrice: 699, description: 'Party Size • 12 Slices' },
];

const CRUSTS: CrustConfig[] = [
  { id: 'crust-tossed', name: 'Classic Hand Tossed', price: 0, description: 'Crispy outside, fluffy inside' },
  { id: 'crust-burst', name: 'Cheese Burst', price: 80, description: 'Molten oozing liquid cheese layer' },
  { id: 'crust-thin', name: 'Wafer Thin Crust', price: 40, description: 'Light & crunchy artisan bake' },
  { id: 'crust-garlic', name: 'Garlic Stuffed Edge', price: 70, description: 'Stuffed with herb garlic butter' },
];

const SAUCES: SauceConfig[] = [
  { id: 'sauce-marinara', name: 'San Marzano Marinara', price: 0, color: '#c41d1d', description: 'Classic slow-simmered Italian tomato sauce' },
  { id: 'sauce-periperi', name: 'Spicy Peri Peri', price: 25, color: '#e64a19', description: 'Fiery African bird’s eye chili blend' },
  { id: 'sauce-jalapeno', name: 'Cheesy Jalapeno Cream', price: 35, color: '#fbc02d', description: 'Rich cheddar cream with smoky jalapenos' },
  { id: 'sauce-bbq', name: 'Smoky Sweet BBQ', price: 30, color: '#4e2612', description: 'Deep hickory wood-smoked glaze' },
  { id: 'sauce-makhani', name: 'Butter Makhani Gourmet', price: 30, color: '#ef6c00', description: 'Velvety royal cashew-tomato fusion' },
];

const TOPPINGS: ToppingConfig[] = [
  { id: 'top-paneer', name: 'Tandoori Paneer Tikka', price: 40, isVeg: true, category: 'veggies', emoji: '🧀' },
  { id: 'top-capsicum', name: 'Crisp Green Capsicum', price: 30, isVeg: true, category: 'veggies', emoji: '🫑' },
  { id: 'top-paprika', name: 'Red Paprika', price: 30, isVeg: true, category: 'veggies', emoji: '🌶️' },
  { id: 'top-corn', name: 'Golden Sweet Corn', price: 30, isVeg: true, category: 'veggies', emoji: '🌽' },
  { id: 'top-olives', name: 'Spanish Black Olives', price: 35, isVeg: true, category: 'veggies', emoji: '🫒' },
  { id: 'top-jalapenos', name: 'Pickled Jalapenos', price: 30, isVeg: true, category: 'veggies', emoji: '🌶️' },
  { id: 'top-mushrooms', name: 'Fresh Button Mushrooms', price: 35, isVeg: true, category: 'veggies', emoji: '🍄' },
  { id: 'top-onion', name: 'Crisp Red Onion', price: 25, isVeg: true, category: 'veggies', emoji: '🧅' },
  { id: 'top-ex-cheese', name: 'Extra Mozzarella Melt', price: 50, isVeg: true, category: 'cheese', emoji: '🧀' },
  { id: 'top-chicken-tikka', name: 'Smoked Grilled Chicken', price: 55, isVeg: false, category: 'meats', emoji: '🍗' },
  { id: 'top-pepperoni', name: 'Spicy Chicken Pepperoni', price: 65, isVeg: false, category: 'meats', emoji: '🍕' },
  { id: 'top-bbq-chicken', name: 'BBQ Roast Chicken', price: 55, isVeg: false, category: 'meats', emoji: '🍖' },
];

export const CustomPizzaBuilder: React.FC<CustomPizzaBuilderProps> = ({ isOpen, onClose }) => {
  const { addItem } = useCartStore();

  const [selectedSize, setSelectedSize] = useState<PizzaSizeConfig>(PIZZA_SIZES[1]); // Default Medium
  const [selectedCrust, setSelectedCrust] = useState<CrustConfig>(CRUSTS[0]);
  const [selectedSauce, setSelectedSauce] = useState<SauceConfig>(SAUCES[0]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>(['top-paneer', 'top-capsicum', 'top-corn']);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  if (!isOpen) return null;

  const toggleTopping = (toppingId: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  // Price calculations
  const toppingsCost = selectedToppings.reduce((sum, id) => {
    const t = TOPPINGS.find((item) => item.id === id);
    return sum + (t?.price || 0);
  }, 0);

  const unitPrice = selectedSize.basePrice + selectedCrust.price + selectedSauce.price + toppingsCost;
  const totalPrice = unitPrice * quantity;

  const isNonVeg = selectedToppings.some((id) => {
    const t = TOPPINGS.find((item) => item.id === id);
    return t && !t.isVeg;
  });

  const handleAddToCart = () => {
    const toppingNames = selectedToppings
      .map((id) => TOPPINGS.find((t) => t.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const customPizzaName = `Custom ${selectedSize.name} Pizza`;
    const crustSpec = `${selectedCrust.name} • ${selectedSauce.name} • [${toppingNames || 'Plain Cheese'}]`;

    addItem({
      productId: `custom-pizza-${Date.now()}`,
      name: customPizzaName,
      price: unitPrice,
      basePrice: selectedSize.basePrice,
      size: (selectedSize.name as any) || 'Medium',
      crust: crustSpec,
      quantity,
      image: isNonVeg
        ? 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
      isVeg: !isNonVeg,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#e31837', '#fbbf24', '#10b981'],
      });
    } catch {}

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-[#141824] border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col justify-between overflow-hidden text-white animate-slide-up">
        {/* Top Header */}
        <div className="p-4 bg-[#191e2e] border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#e31837] to-amber-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-white">Modify Your Pizza</h3>
                <VegNonVegIcon isVeg={!isNonVeg} size="sm" />
              </div>
              <p className="text-[11px] text-stone-400 font-medium">Build your handcrafted pizza slice-by-slice</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Tabs */}
        <div className="px-3 py-2 bg-[#121520] border-b border-stone-800 flex items-center justify-around text-xs shrink-0">
          {[
            { step: 1, label: '1. Slices' },
            { step: 2, label: '2. Crust' },
            { step: 3, label: '3. Sauce' },
            { step: 4, label: `4. Toppings (${selectedToppings.length})` },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step as any)}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                activeStep === s.step
                  ? 'bg-gradient-to-r from-[#e31837] to-red-600 text-white shadow-md scale-105'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Scrollable Customization Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Interactive Pizza Visualizer Graphic */}
          <div className="relative mx-auto w-40 h-40 rounded-full bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 p-2.5 shadow-2xl border-4 border-amber-900/60 flex items-center justify-center">
            {/* Crust Rim */}
            <div
              className="w-full h-full rounded-full border-4 border-amber-600/80 flex items-center justify-center relative overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: selectedSauce.color,
                boxShadow: selectedCrust.id === 'crust-burst' ? 'inset 0 0 20px #f59e0b' : 'none',
              }}
            >
              {/* Molten Cheese Surface */}
              <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-300/90 shadow-inner opacity-90" />

              {/* Toppings Emoji Scatter */}
              <div className="relative z-10 grid grid-cols-3 gap-1 p-2 text-base select-none">
                {selectedToppings.slice(0, 9).map((id, idx) => {
                  const t = TOPPINGS.find((item) => item.id === id);
                  return (
                    <span
                      key={idx}
                      className="animate-bounce-short text-center transform hover:scale-125 transition-transform"
                      title={t?.name}
                    >
                      {t?.emoji || '🍕'}
                    </span>
                  );
                })}
              </div>

              {/* Slice count badge */}
              <span className="absolute bottom-1 right-2 text-[9px] font-black bg-black/60 px-1.5 py-0.5 rounded text-amber-300">
                {selectedSize.slices} Slices
              </span>
            </div>
          </div>

          {/* STEP 1: SLICE SIZES */}
          {activeStep === 1 && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-black uppercase tracking-wider text-stone-300 block">
                Choose Size &amp; Slices
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PIZZA_SIZES.map((sz) => {
                  const isSelected = selectedSize.id === sz.id;
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/40 border-[#e31837] shadow-lg shadow-red-950/40 scale-[1.02]'
                          : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white">{sz.name}</span>
                        <span className="text-xs font-black text-amber-400 font-mono">₹{sz.basePrice}</span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">{sz.description}</p>
                      <span className="text-[10px] text-stone-500 font-bold block mt-0.5">{sz.inches}&quot; Handcrafted</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: CRUST TYPES */}
          {activeStep === 2 && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-black uppercase tracking-wider text-stone-300 block">
                Select Crust Style
              </label>
              <div className="space-y-2">
                {CRUSTS.map((cr) => {
                  const isSelected = selectedCrust.id === cr.id;
                  return (
                    <button
                      key={cr.id}
                      type="button"
                      onClick={() => setSelectedCrust(cr)}
                      className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 shadow-md scale-[1.01]'
                          : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs text-white">{cr.name}</span>
                          {cr.price > 0 && (
                            <span className="text-[10px] font-bold text-amber-400 font-mono bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/40">
                              +₹{cr.price}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">{cr.description}</p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-stone-950'
                            : 'border-stone-700 bg-stone-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: SAUCES */}
          {activeStep === 3 && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-black uppercase tracking-wider text-stone-300 block">
                Choose Gourmet Base Sauce
              </label>
              <div className="space-y-2">
                {SAUCES.map((sc) => {
                  const isSelected = selectedSauce.id === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setSelectedSauce(sc)}
                      className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/40 border-red-500 shadow-md scale-[1.01]'
                          : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full shrink-0 border border-white/40 shadow-xs"
                          style={{ backgroundColor: sc.color }}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-xs text-white">{sc.name}</span>
                            {sc.price > 0 && (
                              <span className="text-[10px] font-bold text-amber-400 font-mono">
                                +₹{sc.price}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 mt-0.5">{sc.description}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-red-500 border-red-400 text-white' : 'border-stone-700 bg-stone-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: CUSTOM TOPPINGS */}
          {activeStep === 4 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-stone-300">
                  Pick Handcrafted Toppings
                </label>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-600/30">
                  {selectedToppings.length} Selected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {TOPPINGS.map((top) => {
                  const isSelected = selectedToppings.includes(top.id);
                  return (
                    <button
                      key={top.id}
                      type="button"
                      onClick={() => toggleTopping(top.id)}
                      className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 shadow-sm'
                          : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-1">
                        <span className="text-base shrink-0">{top.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1">
                            <VegNonVegIcon isVeg={top.isVeg} size="sm" />
                            <span className="font-bold text-[11px] text-white truncate">{top.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 font-black">+₹{top.price}</span>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 border-amber-400 text-stone-950'
                            : 'border-stone-700 bg-stone-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Actions & Add to Cart */}
        <div className="p-4 bg-[#191e2e] border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[9.5px] uppercase font-black tracking-wider text-stone-400 block">
              Custom Pizza Total
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-black text-amber-400 font-mono">₹{totalPrice}</span>
              {quantity > 1 && (
                <span className="text-[10px] text-stone-400">({quantity}x @ ₹{unitPrice})</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quantity Controls */}
            <div className="flex items-center space-x-1.5 bg-stone-900 px-2 py-1 rounded-xl border border-stone-700">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-200 cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-black text-white w-4 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-200 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="bg-[#e31837] hover:bg-[#c4122d] active:scale-[0.98] text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-lg flex items-center space-x-1.5 tracking-wider uppercase transition-all cursor-pointer border border-red-400/40"
            >
              <span>Add to Cart</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPizzaBuilder;
