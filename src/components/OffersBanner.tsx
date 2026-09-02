'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tag, Sparkles, Copy, Check, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { OfferItem } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface OffersBannerProps {
  initialOffers?: OfferItem[];
  onApplyCoupon?: (code: string) => void;
}

export const OffersBanner: React.FC<OffersBannerProps> = ({
  initialOffers,
  onApplyCoupon,
}) => {
  const [offers, setOffers] = useState<OfferItem[]>(initialOffers || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Fetch active offers directly from Firestore (and fallback to API)
  useEffect(() => {
    let isMounted = true;

    const fetchActiveOffers = async () => {
      try {
        if (db) {
          const colRef = collection(db, 'offers');
          const q = query(colRef, where('isActive', '==', true));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const fetched: OfferItem[] = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: data.title || '',
                description: data.description || '',
                promoCode: data.promoCode || undefined,
                isActive: true,
                createdAt: data.createdAt || new Date().toISOString(),
              };
            });
            fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (isMounted) {
              setOffers(fetched);
              return;
            }
          }
        }
      } catch (fsErr) {
        console.warn('Firestore active offers fetch fallback:', fsErr);
      }

      // API fallback
      try {
        const res = await fetch('/api/offers');
        const data = await res.json();
        if (isMounted && data.offers && Array.isArray(data.offers)) {
          setOffers(data.offers);
        }
      } catch (apiErr) {
        console.warn('API offers fallback error:', apiErr);
      }
    };

    fetchActiveOffers();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-scroll through active offers every 4.5 seconds
  useEffect(() => {
    if (offers.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [offers.length, isPaused]);

  // Gracefully hide if no offers are active
  if (!offers || offers.length === 0) {
    return null;
  }

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    if (onApplyCoupon) {
      onApplyCoupon(code);
    }
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      // Swiped left -> next
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    } else if (diff < -40) {
      // Swiped right -> prev
      setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
    }
    touchStartX.current = null;
  };

  const currentOffer = offers[currentIndex] || offers[0];

  return (
    <section
      aria-label="Active Offers and Promotions"
      className="px-4 pt-2 pb-1 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#002855] via-[#093566] to-[#e31837] text-white p-3.5 shadow-lg shadow-blue-950/20 border border-blue-400/20 transition-all">
        {/* Background Decorative Pizza Slice & Glow */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-2 right-3 text-3xl opacity-20 select-none pointer-events-none">
          🏷️
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between space-y-2">
          {/* Top Tag & Slide Indicators */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center space-x-1.5 bg-white/15 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300 border border-white/20 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Special Offer</span>
            </div>

            {offers.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-black/20 px-2 py-0.5 rounded-full">
                {offers.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentIndex === idx ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="pr-8">
            <h3 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight drop-shadow-xs">
              {currentOffer.title}
            </h3>
            <p className="text-xs text-blue-100 font-medium line-clamp-2 mt-0.5 leading-snug">
              {currentOffer.description}
            </p>
          </div>

          {/* Promo Code & Copy Button */}
          {currentOffer.promoCode && (
            <div className="pt-1 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-white/70">Use Code:</span>
                <button
                  type="button"
                  onClick={(e) => handleCopyCode(e, currentOffer.promoCode!)}
                  className="group inline-flex items-center space-x-1.5 bg-black/40 hover:bg-black/60 border border-dashed border-amber-300/80 px-2.5 py-1 rounded-lg text-xs font-mono font-black text-amber-300 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Tag className="w-3 h-3 text-amber-300" />
                  <span>{currentOffer.promoCode}</span>
                  {copiedCode === currentOffer.promoCode ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                  )}
                </button>
              </div>

              {copiedCode === currentOffer.promoCode ? (
                <span className="text-[11px] font-black text-emerald-300 animate-fade-in">
                  ✓ Code Copied!
                </span>
              ) : (
                <span className="text-[10px] text-white/60 font-medium">Tap code to copy</span>
              )}
            </div>
          )}
        </div>

        {/* Carousel Prev/Next subtle nav buttons (if > 1 offer) */}
        {offers.length > 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col space-y-1 z-20">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length)}
              className="w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              aria-label="Previous Offer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % offers.length)}
              className="w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              aria-label="Next Offer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default OffersBanner;
