'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Tag,
  MapPin,
  UtensilsCrossed,
  User,
  Phone,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  CreditCard,
  Check,
  Navigation,
  ArrowLeft,
  ChevronRight,
  ChevronUp,
  Gift,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLocation } from '@/context/LocationContext';
import VegNonVegIcon from './VegNonVegIcon';
import CompleteMealSection from './CompleteMealSection';
import ChocoLavaUpsellModal from './ChocoLavaUpsellModal';
import confetti from 'canvas-confetti';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderPlaced }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    deliveryMode,
    setDeliveryMode,
    customerName,
    customerPhone,
    deliveryAddress,
    tableNumber,
    setCustomerInfo,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getTierDiscount,
    getTierPercentage,
    getTotalDiscount,
    getNextTierInfo,
    getTaxes,
    getDeliveryFee,
    getGrandTotal,
    getTotalCount,
  } = useCartStore();

  // STRICT SEPARATION: Dine-in ONLY on /dine-in or /din-in routes. Main site is strictly Delivery or Takeaway!
  const isDineInRoute = Boolean(pathname?.startsWith('/dine-in') || pathname?.startsWith('/din-in'));
  const effectiveMode: 'Delivery' | 'Takeaway' | 'Dine-in' = isDineInRoute
    ? 'Dine-in'
    : deliveryMode === 'Takeaway'
    ? 'Takeaway'
    : 'Delivery';

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmitting = isLoading;
  const setIsSubmitting = setIsLoading;
  const [formError, setFormError] = useState<string | null>(null);
  const [showLavaUpsell, setShowLavaUpsell] = useState<boolean>(false);
  const [hasShownUpsell, setHasShownUpsell] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<'Paytm UPI' | 'Cash on Delivery'>('Paytm UPI');

  // Editable customer details
  const [name, setName] = useState(customerName || '');
  const [phone, setPhone] = useState(customerPhone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');

  // Read table param from URL if present (e.g. /dine-in?table=5)
  const urlTable = searchParams?.get('table') || '';
  const [tableNum, setTableNum] = useState(urlTable || tableNumber || '');

  // Global Site Location Context (Captured automatically on site opening)
  const {
    coordinates: globalCoords,
    locationAddress: globalAddress,
    isLocating: globalIsLocating,
    locationStatus: globalLocationStatus,
    errorMessage: globalLocationError,
    requestLocation,
  } = useLocation();

  // HTML5 Geolocation State (Only used for Delivery)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSuccess, setLocationSuccess] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Sync global site-opening GPS coordinates into local checkout state
  useEffect(() => {
    if (globalCoords) {
      setCoordinates(globalCoords);
      setLocationSuccess(true);
      if (!addressLine2 && globalAddress) {
        setAddressLine2(globalAddress);
      }
    }
  }, [globalCoords, globalAddress, addressLine2]);

  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please enter your address manually.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });
        setLocationSuccess(true);
        setIsLocating(false);

        // Attempt reverse geocoding to fill landmark/area automatically
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              const parts = data.display_name.split(',');
              const concise = parts.slice(0, 3).join(',').trim();
              setAddressLine2(concise);
              return;
            }
          }
        } catch {}

        if (!addressLine2) {
          setAddressLine2(globalAddress || 'Kaladhungi Road, Haldwani (263139)');
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationSuccess(false);
        let msg = 'Unable to fetch your GPS coordinates. Please type your delivery address manually.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access was denied. Please allow location permissions in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS signal unavailable. Please enter your address manually.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please enter your address manually.';
        }
        setLocationError(msg);
      },
      options
    );
  };

  // Lock delivery mode according to current Route if on dine-in route
  useEffect(() => {
    if (isDineInRoute) {
      setDeliveryMode('Dine-in');
      if (urlTable && !tableNum) {
        setTableNum(urlTable);
      }
    }
  }, [isDineInRoute, setDeliveryMode, urlTable, tableNum]);

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const tierDiscount = getTierDiscount();
  const tierPercentage = getTierPercentage();
  const totalDiscount = getTotalDiscount();
  const nextTier = getNextTierInfo();
  const taxes = getTaxes();
  const deliveryFee = effectiveMode === 'Delivery' ? getDeliveryFee() : 0;
  const grandTotal = getGrandTotal();
  const totalCount = getTotalCount();
  const freeDeliverySavings = effectiveMode === 'Delivery' && subtotal >= 299 ? 40 : 0;
  const totalSavings = totalDiscount + freeDeliverySavings;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponFeedback(res);
    if (res.success) setCouponInput('');
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e31837', '#002855', '#fbbf24', '#10b981'],
    });
  };

  // Main order execution logic
  const executeOrderPlacement = async () => {
    setIsLoading(true);

    const combinedDeliveryAddress = [addressLine1.trim(), addressLine2.trim()].filter(Boolean).join(', ');

    // Save user info into store
    setCustomerInfo({
      name: name.trim(),
      phone: phone.trim(),
      address: combinedDeliveryAddress,
      tableNumber: tableNum.trim(),
    });

    const currentMode = effectiveMode;
    const finalAddress =
      effectiveMode === 'Dine-in'
        ? `Table #${tableNum.trim()} (7Cheese Pizza Haldwani)`
        : effectiveMode === 'Takeaway'
        ? 'Self-Pickup at 7Cheese Pizza Outlet, Kaladhungi Road, Haldwani'
        : combinedDeliveryAddress || 'Kaladhungi Road, Haldwani (263139)';
    const impliedPaymentMethod =
      effectiveMode === 'Delivery'
        ? selectedPayment
        : 'Pay at Counter';

    // 1. Payload Sanitation: Extract ONLY primitive values
    const sanitizedItems = items.map((item) => ({
      id: String(item.id || item.productId || ''),
      name: String(item.name || ''),
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      size: String(item.size || 'Regular'),
      crust: String(item.crust || 'Standard'),
    }));

    const cleanPayload = {
      customerName: String(name || '').trim() || (effectiveMode === 'Dine-in' ? 'Dine-in Customer' : effectiveMode === 'Takeaway' ? 'Takeaway Customer' : 'Valued Customer'),
      customerPhone: effectiveMode === 'Dine-in' && !phone.trim() ? 'N/A' : (String(phone || '').trim() || 'N/A'),
      deliveryAddress: String(finalAddress || '').trim(),
      deliveryType: String(currentMode),
      orderType: String(currentMode),
      tableNumber: effectiveMode === 'Dine-in' && tableNum ? String(tableNum).trim() : null,
      paymentMethod: String(impliedPaymentMethod),
      totalAmount: Number(grandTotal) || 0,
      coordinates: (effectiveMode === 'Delivery' && coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number')
        ? { lat: coordinates.lat, lng: coordinates.lng }
        : null,
      items: sanitizedItems,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    // Guarantee clean plain serializable object with zero circular/component references
    const orderPayload = JSON.parse(JSON.stringify(cleanPayload));

    let placedOrderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      // Non-blocking Firestore save if online
      if (db) {
        addDoc(collection(db, 'orders'), { ...orderPayload, id: placedOrderId }).catch(() => {});
      }

      const finalOrder = { ...orderPayload, id: placedOrderId };

      // Immediately save newly created document ID and full order data to localStorage
      try {
        localStorage.setItem('activeOrderId', placedOrderId);
        localStorage.setItem('activeOrderData', JSON.stringify(finalOrder));
      } catch (e) {
        console.warn('Failed to save activeOrderId to localStorage:', e);
      }

      // Fast non-blocking sync to server API store
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalOrder),
      }).catch((err) => console.warn('Order API sync error:', err));

      try {
        triggerConfetti();
      } catch {}

      // Instantly clear Zustand cart state
      clearCart();
      onClose();
      onOrderPlaced(placedOrderId);

      // Instantly push to the /thank-you route
      const targetUrl = `/thank-you?orderId=${encodeURIComponent(placedOrderId)}&type=${encodeURIComponent(
        currentMode
      )}&payment=${encodeURIComponent(impliedPaymentMethod)}&table=${encodeURIComponent(
        tableNum.trim()
      )}`;

      if (typeof window !== 'undefined') {
        window.location.href = targetUrl;
      } else {
        router.push(targetUrl);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      clearCart();
      onClose();
      const mockId = `7C-${Math.floor(100000 + Math.random() * 900000)}`;
      onOrderPlaced(mockId);
      const fallbackUrl = `/thank-you?orderId=${encodeURIComponent(mockId)}&type=${encodeURIComponent(
        currentMode
      )}&payment=${encodeURIComponent(impliedPaymentMethod)}&table=${encodeURIComponent(
        tableNum.trim()
      )}`;
      if (typeof window !== 'undefined') {
        window.location.href = fallbackUrl;
      } else {
        router.push(fallbackUrl);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async (e?: React.SyntheticEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (items.length === 0) return;
    setFormError(null);

    // Validation based on effective order mode
    if (effectiveMode === 'Dine-in') {
      if (!tableNum.trim()) {
        setFormError('Table Number is required for Dine-in orders. Please select or enter your table number.');
        return;
      }
    } else if (effectiveMode === 'Takeaway') {
      if (!phone.trim()) {
        setFormError('Phone Number is required for Takeaway pickup so we can notify you when ready.');
        return;
      }
    } else {
      if (!phone.trim()) {
        setFormError('Phone Number is required for delivery orders so our rider can contact you.');
        return;
      }
      const combinedAddress = [addressLine1.trim(), addressLine2.trim()].filter(Boolean).join(', ');
      if (!combinedAddress) {
        setFormError('Please enter your Delivery Address (House/Flat No. & Landmark).');
        return;
      }
    }

    // Module 4: Choco Lava Cake Upsell Popup Trigger
    // When a user tries to place an order containing any pizza, right before final placement
    const hasPizza = items.some(
      (it) =>
        it.crust !== 'Standard' ||
        it.name.toLowerCase().includes('pizza') ||
        it.name.toLowerCase().includes('margherita') ||
        it.name.toLowerCase().includes('paneer') ||
        (it.size && it.size !== 'Standard')
    );
    const hasLavaCake = items.some(
      (it) =>
        it.productId.toLowerCase().includes('lava') ||
        it.name.toLowerCase().includes('lava')
    );

    if (hasPizza && !hasLavaCake && !hasShownUpsell) {
      setShowLavaUpsell(true);
      return;
    }

    executeOrderPlacement();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end animate-fade-in text-white">
        <div className="w-full max-w-md bg-[#12151c] h-full flex flex-col justify-between shadow-2xl relative animate-slide-left border-l border-stone-800">
          {/* Top Domino's Dark Header */}
          <div className="bg-[#181d27] px-3.5 py-3 border-b border-stone-800 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center space-x-2.5 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                title="Back to menu"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h2 className="font-extrabold text-xs text-stone-300 leading-tight">7Cheese Pizza</h2>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="font-black text-xs text-white">30-35 mins to Home</span>
                  <span className="text-stone-500">•</span>
                  <span className="text-[11px] text-stone-400 truncate max-w-[150px]">
                    {globalAddress ? globalAddress.split(',')[0] : 'Bhagwanpur Jaisingh'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Domino's Blue Savings Banner */}
          {totalSavings > 0 && (
            <div className="bg-[#124ba8] text-white px-4 py-2.5 text-xs font-black flex items-center justify-between animate-fade-in shadow-md">
              <div className="flex items-center space-x-2">
                <span className="text-base">🥳</span>
                <span>You saved ₹{totalSavings} on this order</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                Max Savings
              </span>
            </div>
          )}

          {/* Scrollable Cart Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#12151c]">
            {items.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <div className="w-16 h-16 bg-red-950/60 text-[#e31837] border border-red-800/40 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
                  🍕
                </div>
                <h3 className="font-extrabold text-base text-white">Your Cart is Empty</h3>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  Add hot, cheesy handcrafted pizzas from our menu to begin your feast!
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 bg-[#e31837] hover:bg-[#c4122d] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Complete Your Meal With Addons Section (Domino's Dark Style) */}
                <CompleteMealSection />

                {/* Free Delivery & Tier Discount Unlocked Strip */}
                <div className="space-y-2">
                  {tierDiscount > 0 ? (
                    <div className="bg-[#18251e] border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{tierPercentage}% Auto-Tier Discount Applied!</span>
                      </div>
                      <span className="font-black text-emerald-400 font-mono text-sm">-₹{tierDiscount}</span>
                    </div>
                  ) : (
                    nextTier.amountNeeded > 0 && (
                      <div className="bg-[#241c14] border border-amber-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-200">
                        <div className="flex items-center space-x-1.5">
                          <span>🚀</span>
                          <span className="font-bold">{nextTier.message}</span>
                        </div>
                      </div>
                    )
                  )}

                  {/* Free Delivery status */}
                  {effectiveMode === 'Delivery' && (
                    <div className="bg-stone-900/90 border border-stone-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-stone-300 font-bold">
                        <span className="text-sm">🛵</span>
                        <span>
                          {subtotal >= 299 ? (
                            <span className="text-emerald-400 font-extrabold">FREE Delivery Unlocked (above ₹299)</span>
                          ) : (
                            <span>
                              Add <strong className="text-amber-300 font-mono">₹{299 - subtotal}</strong> more for Free Delivery
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-[11px] font-black font-mono text-stone-400">
                        {subtotal >= 299 ? '₹0' : '₹40'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Coupon Row Matching Domino's Layout */}
                <div className="bg-[#181d27] p-3 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Percent className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black uppercase text-stone-200 tracking-wider">
                        Coupons & Offers
                      </span>
                    </div>
                    {appliedCoupon && (
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-black text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-600/40 p-2.5 rounded-xl text-xs">
                      <div className="flex items-center space-x-1.5 text-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold">{appliedCoupon} Applied</span>
                      </div>
                      <span className="font-black text-emerald-400 font-mono">-₹{discountAmount}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter CHEESE10, FEAST20..."
                        className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs font-bold uppercase placeholder-stone-500 text-white outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-black px-4 py-2 rounded-xl transition-colors cursor-pointer border border-stone-700"
                      >
                        Apply
                      </button>
                    </form>
                  )}

                  {couponFeedback && (
                    <p
                      className={`text-[11px] font-bold ${
                        couponFeedback.success ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {couponFeedback.message}
                    </p>
                  )}
                </div>

                {/* Domino's Cashback Notification */}
                <div className="bg-[#16201a] border border-emerald-900/60 p-3 rounded-2xl flex items-center space-x-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">You will get cashback with PAYTMUPI 🎉</span>
                </div>

                {/* Domino's Special Offer Box */}
                <div className="bg-[#1d1723] border border-purple-900/50 p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-sm">
                      🎁
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-purple-200">Special Offer from 7Cheese VIP</h4>
                      <p className="text-[10px] text-stone-400">Claim 5-Course Feasting Perks with this order</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md uppercase">
                    ADDED FREE
                  </span>
                </div>

                {/* Ordered Items List */}
                <div className="bg-[#181d27] p-3 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
                    <span className="text-xs font-black uppercase text-stone-300 tracking-wider">
                      Ordered Items ({totalCount})
                    </span>
                    <button
                      onClick={clearCart}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>

                  <div className="divide-y divide-stone-800/80">
                    {items.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-start justify-between space-x-3">
                        <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            <VegNonVegIcon isVeg={item.isVeg} size="sm" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-white leading-tight truncate">
                              {item.name}
                            </h4>
                            <div className="text-[10px] text-stone-400 mt-0.5 space-y-0.5">
                              {item.size !== 'Standard' && (
                                <p>
                                  Size: <span className="font-semibold text-stone-300">{item.size}</span>
                                </p>
                              )}
                              {item.crust !== 'Standard' && (
                                <p className="truncate">
                                  Crust: <span className="font-semibold text-stone-300">{item.crust}</span>
                                </p>
                              )}
                            </div>
                            <span className="text-xs font-black text-amber-400 mt-1 block">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center space-x-2 bg-stone-900 px-2 py-1 rounded-xl border border-stone-800 shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-5 h-5 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs text-white w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-5 h-5 rounded-md bg-[#e31837] hover:bg-red-700 text-white font-bold flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Details Form */}
                <div className="bg-[#181d27] p-3 rounded-2xl border border-stone-800 space-y-2">
                  <span className="text-xs font-black uppercase text-stone-300 tracking-wider block">
                    {effectiveMode === 'Dine-in'
                      ? 'Table Details'
                      : effectiveMode === 'Takeaway'
                      ? 'Takeaway Details'
                      : 'Delivery Address & Contact'}
                  </span>

                  {formError && (
                    <div className="bg-red-950/70 border border-red-700/60 text-red-200 p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="space-y-2 text-xs">
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        placeholder="Phone Number (Required for rider/pickup alert)"
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    {effectiveMode === 'Delivery' && (
                      <>
                        {/* GPS Location Action Bar */}
                        <div className="flex items-center justify-between pt-1 pb-0.5">
                          <span className="text-[11px] font-bold text-stone-300">Exact GPS Destination</span>
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={isLocating}
                            className={`inline-flex items-center space-x-1.5 text-[11px] font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm ${
                              locationSuccess
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-[#e31837] hover:bg-[#c4122d] text-white shadow-red-950/40'
                            }`}
                          >
                            {isLocating ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                <span>Fetching GPS...</span>
                              </>
                            ) : locationSuccess ? (
                              <>
                                <Navigation className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                                <span>GPS Captured ✓</span>
                              </>
                            ) : (
                              <>
                                <Navigation className="w-3.5 h-3.5 fill-white" />
                                <span>Use Current Location</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* GPS Location Success Indicator */}
                        {locationSuccess && coordinates && (
                          <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-emerald-300 animate-fade-in">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1 font-extrabold">
                                  <span>Exact GPS Coordinates:</span>
                                  <span className="font-mono text-[10.5px] text-emerald-200">
                                    {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-emerald-400/80 truncate">
                                  {addressLine2 || globalAddress || 'Location attached to order'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCoordinates(null);
                                setLocationSuccess(false);
                              }}
                              className="text-[10px] text-stone-400 hover:text-red-400 underline shrink-0 ml-2 cursor-pointer font-semibold"
                            >
                              Clear
                            </button>
                          </div>
                        )}

                        {/* GPS Error Prompt */}
                        {locationError && (
                          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 text-[11px] text-amber-300 flex items-start space-x-2 animate-fade-in">
                            <span className="shrink-0 mt-0.5">⚠️</span>
                            <span>{locationError}</span>
                          </div>
                        )}

                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                          <input
                            type="text"
                            value={addressLine1}
                            onChange={(e) => {
                              setAddressLine1(e.target.value);
                              if (formError) setFormError(null);
                            }}
                            placeholder="Flat / House No., Floor, Building"
                            className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-400"
                            required
                          />
                        </div>

                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                          <input
                            type="text"
                            value={addressLine2}
                            onChange={(e) => {
                              setAddressLine2(e.target.value);
                              if (formError) setFormError(null);
                            }}
                            placeholder="Landmark & Area (e.g. Near TVS Showroom, Haldwani)"
                            className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                      </>
                    )}

                    {effectiveMode === 'Dine-in' && (
                      <div className="relative">
                        <UtensilsCrossed className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                        <input
                          type="text"
                          value={tableNum}
                          onChange={(e) => setTableNum(e.target.value)}
                          placeholder="Table Number (e.g. Table 3)"
                          className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-400"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Domino's Style Bill Summary */}
                <div className="bg-[#181d27] p-3.5 rounded-2xl border border-stone-800 space-y-2 text-xs">
                  <span className="text-xs font-black uppercase text-stone-300 tracking-wider block">
                    Bill Summary
                  </span>

                  <div className="space-y-1.5 text-stone-300">
                    <div className="flex justify-between">
                      <span>Item Total</span>
                      <span className="font-bold text-white font-mono">₹{subtotal}</span>
                    </div>

                    {tierDiscount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Automatic Tier Discount ({tierPercentage}%)</span>
                        <span className="font-mono">-₹{tierDiscount}</span>
                      </div>
                    )}

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-semibold">
                        <span>Coupon Discount</span>
                        <span className="font-mono">-₹{discountAmount}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Taxes (5% GST)</span>
                      <span className="font-bold text-white font-mono">₹{taxes}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-bold font-mono">
                        {deliveryFee === 0 ? (
                          <span className="text-emerald-400">FREE</span>
                        ) : (
                          <span className="text-white">₹{deliveryFee}</span>
                        )}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-stone-800 flex justify-between items-baseline">
                      <div>
                        <span className="font-black text-sm text-white block">Grand Total</span>
                        <span className="text-[10px] text-stone-400">Includes all taxes and discounts</span>
                      </div>
                      <span className="font-black text-lg text-amber-400 font-mono">₹{grandTotal}</span>
                    </div>
                  </div>
                </div>

                {/* 7Cheese Money Balance */}
                <div className="text-[11px] text-stone-400 px-1 flex items-center justify-between">
                  <span>7Cheese Reward Balance: ₹0</span>
                  <button type="button" className="text-amber-400 font-bold hover:underline">
                    • Add money
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sticky Bottom Bar Matching Reference Image 2 */}
          {items.length > 0 && (
            <div className="p-3 bg-[#181d27] border-t border-stone-800 flex items-center justify-between gap-3 sticky bottom-0 z-30 shadow-2xl">
              {/* Left: Payment Method Selector */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPayment((prev) =>
                      prev === 'Paytm UPI' ? 'Cash on Delivery' : 'Paytm UPI'
                    )
                  }
                  className="flex items-center space-x-1.5 text-left group cursor-pointer"
                >
                  <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 font-black text-[9px] flex items-center justify-center shrink-0">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[9.5px] uppercase font-black tracking-wider text-stone-400">
                        PAY USING
                      </span>
                      <ChevronUp className="w-3 h-3 text-stone-400 group-hover:text-white" />
                    </div>
                    <span className="text-xs font-black text-white block leading-tight">
                      {selectedPayment}
                    </span>
                  </div>
                </button>
              </div>

              {/* Right: Red Domino's Checkout Pill Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isLoading}
                className="flex items-center bg-[#e31837] hover:bg-[#c4122d] active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl shadow-xl transition-all cursor-pointer overflow-hidden border border-red-400/40"
              >
                <div className="px-3.5 py-3 bg-black/20 font-mono font-black text-xs sm:text-sm border-r border-white/20">
                  <span>₹{grandTotal}</span>
                  <span className="text-[8px] uppercase tracking-wider block text-white/70">TOTAL</span>
                </div>

                <div className="px-4 py-3 flex items-center space-x-1.5 font-black text-xs tracking-wider uppercase">
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Placing...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Choco Lava Cake 10s Upsell Popup Modal */}
      <ChocoLavaUpsellModal
        isOpen={showLavaUpsell}
        onAddCake={() => {
          addItem({
            productId: 'addon-choco-lava',
            name: 'Warm Choco Lava Cake',
            price: 119,
            basePrice: 119,
            size: 'Standard',
            crust: 'Standard',
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
            isVeg: true,
          });
          setShowLavaUpsell(false);
          setHasShownUpsell(true);
          setTimeout(() => {
            executeOrderPlacement();
          }, 60);
        }}
        onProceedWithoutCake={() => {
          setShowLavaUpsell(false);
          setHasShownUpsell(true);
          executeOrderPlacement();
        }}
      />
    </>
  );
};

export default CartDrawer;
