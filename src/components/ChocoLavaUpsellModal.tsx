'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Clock, ArrowRight } from 'lucide-react';

interface ChocoLavaUpsellModalProps {
  isOpen: boolean;
  onAddCake: () => void;
  onProceedWithoutCake: () => void;
}

export const ChocoLavaUpsellModal: React.FC<ChocoLavaUpsellModalProps> = ({
  isOpen,
  onAddCake,
  onProceedWithoutCake,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(10);
      return;
    }

    setSecondsRemaining(10);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onProceedWithoutCake();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onProceedWithoutCake]);

  if (!isOpen) return null;

  const progressPercent = ((10 - secondsRemaining) / 10) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-[#1a1311] via-[#231713] to-[#120c0a] border border-amber-900/60 shadow-2xl text-white animate-scale-in">
        {/* Top Progress bar for countdown */}
        <div className="h-1.5 w-full bg-stone-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-1000 ease-linear"
            style={{ width: `${100 - progressPercent}%` }}
          />
        </div>

        {/* Top Header Row with Skip Cross */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-black">
            <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Offer ending in {secondsRemaining}s</span>
          </div>

          <button
            type="button"
            onClick={onProceedWithoutCake}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Skip and proceed to checkout"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Cake Image Hero with Molten Glow */}
        <div className="px-5 pt-1 text-center">
          <div className="relative mx-auto w-40 h-40 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-xl shadow-amber-950/60 group">
            <img
              src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80"
              alt="Warm Oozing Choco Lava Cake"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-black uppercase tracking-wider bg-amber-600/90 text-white py-0.5 rounded-md backdrop-blur-xs">
              Molten Chocolate Core
            </span>
          </div>

          {/* Catchy Tagline as requested */}
          <div className="mt-3.5 space-y-1.5">
            <div className="flex items-center justify-center space-x-1 text-amber-400 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chef&apos;s Special Companion</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>

            <h3 className="text-base sm:text-lg font-black text-amber-100 leading-tight px-1 drop-shadow-sm">
              &ldquo;Your food won&apos;t taste as good without a Choco Lava Cake!&rdquo;
            </h3>

            <p className="text-xs text-stone-300 font-medium px-2 leading-relaxed">
              Warm chocolate cake with a molten chocolate fudge center. Freshly baked to pair with your hot pizza!
            </p>
          </div>

          {/* Special Price Tag */}
          <div className="mt-3 inline-flex items-center space-x-2 bg-stone-900/90 border border-stone-700/80 px-4 py-1.5 rounded-full">
            <span className="text-xs text-stone-400 line-through">₹149</span>
            <span className="text-base font-black text-amber-400">₹119</span>
            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              SAVE ₹30
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 pt-4 space-y-2.5">
          <button
            type="button"
            onClick={onAddCake}
            className="w-full bg-gradient-to-r from-[#e31837] to-[#c4122d] hover:from-[#c4122d] hover:to-[#a50d23] active:scale-[0.98] text-white font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-red-950/50 flex items-center justify-center space-x-2 text-sm tracking-wide uppercase transition-all cursor-pointer border border-red-400/40"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add For ₹119 & Place Order</span>
          </button>

          <button
            type="button"
            onClick={onProceedWithoutCake}
            className="w-full text-stone-400 hover:text-stone-200 font-bold text-xs py-1.5 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
          >
            <span>No thanks, proceed without cake</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChocoLavaUpsellModal;
