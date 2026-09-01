'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  ChefHat,
  Bike,
  Clock,
  MapPin,
  ArrowRight,
  ShoppingBag,
  Home,
  Copy,
  Check,
  UtensilsCrossed,
  Sparkles,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { STORE_LOCATION } from '@/lib/constants';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || 'ORD-RECENT';
  const orderType = searchParams.get('type') || 'Delivery';
  const paymentMethod = searchParams.get('payment') || 'COD';
  const tableNumber = searchParams.get('table') || '';

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Launch celebratory confetti burst
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#e31837', '#002855', '#fbbf24', '#10b981', '#ffffff'],
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDineIn = orderType === 'Dine-in';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2 relative z-10">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#e31837] rounded-xl flex items-center justify-center text-lg shadow-md">
            🧀
          </div>
          <span className="font-black text-sm text-white tracking-tight">7Cheese Pizza</span>
        </Link>
        <span className="text-[11px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
          Haldwani
        </span>
      </header>

      {/* Center Success Card */}
      <main className="max-w-md mx-auto w-full my-auto py-6 relative z-10 animate-scale-in">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center backdrop-blur-md">
          {/* Animated Success Badge */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-full flex items-center justify-center shadow-xl shadow-emerald-950/60">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center space-x-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Order Confirmed & Sent to Kitchen</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Thank You!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {isDineIn
                ? `Your order for ${tableNumber || 'Table Service'} has been received by our kitchen.`
                : 'Your cheesy feast is being prepared with 100% real dairy mozzarella.'}
            </p>
          </div>

          {/* Order Details Ticket Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Order ID
                </span>
                <span className="font-mono text-base font-black text-white">{orderId}</span>
              </div>
              <button
                onClick={handleCopyOrderId}
                className="flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Order Mode</span>
                <div className="flex items-center space-x-1 font-bold text-white mt-0.5">
                  <span>{isDineIn ? '🍽️' : '🛵'}</span>
                  <span>{isDineIn ? (tableNumber ? `Dine-in (${tableNumber})` : 'Dine-in') : 'Home Delivery'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">Payment Method</span>
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-black mt-0.5 ${
                    paymentMethod === 'UPI'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {paymentMethod === 'UPI' ? <QrCode className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                  <span>{paymentMethod === 'UPI' ? 'Paid via UPI' : 'Cash on Delivery (COD)'}</span>
                </span>
              </div>
            </div>

            {/* Estimated Time Strip */}
            <div className="bg-slate-900 border border-slate-800/80 p-2.5 rounded-xl flex items-center space-x-2.5 text-xs text-slate-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Estimated Time: <strong className="text-white">{isDineIn ? '10-15 mins' : '30-40 mins'}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <Link
              href={isDineIn ? '/dine-in' : '/'}
              className="w-full bg-[#e31837] hover:bg-[#c4122d] active:scale-[0.99] text-white font-black text-sm py-3.5 rounded-xl shadow-lg shadow-red-950/50 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Order More Cheesy Pizzas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={isDineIn ? `/dine-in?table=${encodeURIComponent(tableNumber || '')}` : '/'}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Menu</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Store Note */}
      <footer className="max-w-md mx-auto w-full text-center py-2 text-[11px] text-slate-500 relative z-10">
        <p>7Cheese Pizza • Kaladhungi Road, Haldwani (263139)</p>
      </footer>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 border-4 border-[#e31837] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-400">Loading Order Confirmation...</p>
          </div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
