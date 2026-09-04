'use client';

import React from 'react';
import { ArrowRight, Sparkles, Clock, ShieldCheck, Award, Flame, Heart } from 'lucide-react';

interface PreLandingPageProps {
  onEnterApp: () => void;
}

export const PreLandingPage: React.FC<PreLandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-[#001733] text-white flex flex-col justify-between selection:bg-[#e31837] selection:text-white">
      {/* Mobile-constrained container */}
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col justify-between p-4 relative shadow-2xl bg-gradient-to-b from-[#002855] via-[#001c3d] to-[#0b0f19]">
        {/* Top Brand & Badges */}
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">🧀</span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">
                7CHEESE <span className="text-[#e31837]">PIZZA</span>
              </h1>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                Artisanal Woodfired Slices
              </span>
            </div>
          </div>

          <span className="bg-white/10 border border-white/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300">
            ★ 4.9 Rated
          </span>
        </div>

        {/* Hero Feast Promotion Banner (Recreated from Domino's Reference Screen 1) */}
        <div className="my-5 rounded-3xl overflow-hidden bg-gradient-to-b from-[#00204a] via-[#001838] to-[#120508] border border-blue-500/20 shadow-2xl relative">
          {/* Top Banner Tag */}
          <div className="p-4 text-center space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-amber-300">
              5 COURSE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter drop-shadow-md">
              LUNCH <span className="text-amber-400">FEAST</span>
            </h2>
            <div className="inline-flex items-center space-x-1 text-xs text-amber-200 font-bold bg-white/10 px-3 py-0.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>Available 11AM - 3PM Daily</span>
            </div>
          </div>

          {/* 2 Hot Deals Cards Side-by-Side as in Screenshot 1 */}
          <div className="grid grid-cols-2 gap-2.5 p-3.5 pt-0">
            {/* Card 1: Pizza Meal */}
            <div className="bg-[#b31429] p-3 rounded-2xl shadow-lg flex flex-col justify-between border border-red-400/30">
              <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-black/30">
                <img
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80"
                  alt="Pizza Meal"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-red-100 block">Pizza Meal @</span>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <span className="text-xs text-red-200 line-through">₹233</span>
                  <span className="text-xl font-black text-white font-mono">₹149</span>
                </div>
              </div>
            </div>

            {/* Card 2: Cheese Burst */}
            <div className="bg-[#a81326] p-3 rounded-2xl shadow-lg flex flex-col justify-between border border-red-400/30">
              <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2 bg-black/30">
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80"
                  alt="Cheese Burst"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-red-100 block">Cheese Burst @</span>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <span className="text-xs text-red-200 line-through">₹503</span>
                  <span className="text-xl font-black text-white font-mono">₹299</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Free delivery trigger */}
          <div className="bg-[#001733] py-2 px-3 text-center border-t border-blue-900/50">
            <p className="text-[11px] font-black tracking-wider text-blue-200 uppercase">
              Lowest Prices Only on 7Cheese App • <span className="text-amber-300">Free Delivery Above ₹299</span>
            </p>
          </div>
        </div>

        {/* Restaurant Highlights & USPs */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 px-1">
            Why 7Cheese Pizza Haldwani?
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-300 font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Real Dairy</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-tight">
                Crafted with pure whole-milk mozzarella cheese with zero analog fillers.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-extrabold">
                <Flame className="w-3.5 h-3.5" />
                <span>Fresh Dough Daily</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-tight">
                Slow-fermented for 24 hours for that ultra-crispy &amp; airy crust.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 text-blue-400 font-extrabold">
                <Clock className="w-3.5 h-3.5" />
                <span>30-Mins Delivery</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-tight">
                Hot piping delivery with real-time live GPS rider dispatch.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 text-red-400 font-extrabold">
                <Award className="w-3.5 h-3.5" />
                <span>Custom Builder</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-tight">
                Modify your pizza step-by-step with slice sizes, sauces &amp; toppings.
              </p>
            </div>
          </div>
        </div>

        {/* Enter Now CTA Button */}
        <div className="pt-6 pb-2 space-y-2">
          <button
            type="button"
            onClick={onEnterApp}
            className="w-full bg-gradient-to-r from-[#e31837] via-[#f01c3d] to-[#c4122d] hover:brightness-110 active:scale-[0.98] text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-red-950/60 flex items-center justify-center space-x-3 text-sm tracking-wider uppercase transition-all cursor-pointer border border-red-400/40 group"
          >
            <span>Enter Now &amp; Start Ordering</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[3]" />
          </button>

          <p className="text-center text-[10px] text-stone-400">
            Open 11:00 AM – 11:00 PM • Kaladhungi Road, Haldwani
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreLandingPage;
