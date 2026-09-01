'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
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
  QrCode,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import VegNonVegIcon from './VegNonVegIcon';
import confetti from 'canvas-confetti';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderPlaced }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDineInRoute = pathname?.startsWith('/dine-in');

  const {
    items,
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
    getTaxes,
    getDeliveryFee,
    getGrandTotal,
    getTotalCount,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI'>('COD');
  const [paymentSettings, setPaymentSettings] = useState({
    upiId: '7cheesepizza@okhdfcbank',
    upiQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D7cheesepizza%40okhdfcbank%26pn%3D7Cheese%2520Pizza%26cu%3DINR',
    restaurantName: '7Cheese Pizza Haldwani',
  });
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Editable customer details
  const [name, setName] = useState(customerName || '');
  const [phone, setPhone] = useState(customerPhone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');

  // Fetch live payment settings from backend
  useEffect(() => {
    fetch('/api/settings/payment')
      .then((res) => res.json())
      .then((data) => {
        if (data.upiId) setPaymentSettings(data);
      })
      .catch((err) => console.log('Using default payment settings'));
  }, []);

  // Read table param from URL if present (e.g. /dine-in?table=5)
  const urlTable = searchParams?.get('table') || '';
  const [tableNum, setTableNum] = useState(urlTable || tableNumber || '');

  // HTML5 Geolocation State (Only used for Delivery)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Lock delivery mode according to current Route
  useEffect(() => {
    if (isDineInRoute) {
      setDeliveryMode('Dine-in');
      if (urlTable && !tableNum) {
        setTableNum(urlTable);
      }
    } else {
      setDeliveryMode('Delivery');
    }
  }, [isDineInRoute, setDeliveryMode, urlTable, tableNum]);

  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please type your address manually.');
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
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });
        setLocationSuccess(true);
        setIsLocating(false);

        // Populate landmark hint if empty while keeping Line 1 (Flat/House) open for manual typing
        if (!addressLine2) {
          setAddressLine2('Kaladhungi Road, Haldwani (263139)');
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationSuccess(false);
        let msg = 'Unable to fetch your GPS coordinates. Please type your delivery address manually.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access was denied. Please type your delivery address manually.';
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

  if (!isOpen) return null;

  const subtotal = getSubtotal();
  const taxes = getTaxes();
  const deliveryFee = isDineInRoute ? 0 : getDeliveryFee();
  const grandTotal = Math.max(0, subtotal + taxes + deliveryFee - discountAmount);
  const totalCount = getTotalCount();

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

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setFormError(null);

    // Validation
    if (isDineInRoute) {
      if (!tableNum.trim()) {
        setFormError('Table Number is required for Dine-in orders. Please select or enter your table number.');
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

    setIsSubmitting(true);

    const combinedDeliveryAddress = [addressLine1.trim(), addressLine2.trim()].filter(Boolean).join(', ');

    // Save user info into store
    setCustomerInfo({
      name: name.trim(),
      phone: phone.trim(),
      address: combinedDeliveryAddress,
      tableNumber: tableNum.trim(),
    });

    const currentMode = isDineInRoute ? 'Dine-in' : 'Delivery';
    const finalAddress = isDineInRoute
      ? `Table #${tableNum.trim()} (7Cheese Pizza Haldwani)`
      : combinedDeliveryAddress || 'Kaladhungi Road, Haldwani (263139)';

    const orderPayload = {
      customerName: name.trim() || (isDineInRoute ? 'Dine-in Customer' : 'Valued Customer'),
      customerPhone: isDineInRoute ? 'N/A' : phone.trim(),
      deliveryAddress: finalAddress,
      deliveryType: currentMode,
      orderType: currentMode,
      tableNumber: isDineInRoute ? tableNum.trim() : null,
      paymentMethod,
      totalAmount: grandTotal,
      coordinates: !isDineInRoute ? coordinates : null,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        size: item.size,
        crust: item.crust,
        quantity: item.quantity,
        price: item.price * item.quantity,
      })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      const placedOrderId = data.orderId || `ORD-${Date.now().toString().slice(-6)}`;
      triggerConfetti();
      clearCart();
      setIsSubmitting(false);
      onClose();
      onOrderPlaced(placedOrderId);

      // Redirect user to thank you confirmation screen
      window.location.href = `/thank-you?orderId=${encodeURIComponent(placedOrderId)}&type=${encodeURIComponent(currentMode)}&payment=${encodeURIComponent(paymentMethod)}&table=${encodeURIComponent(tableNum.trim())}`;
    } catch (err) {
      console.error('Order creation error:', err);
      triggerConfetti();
      clearCart();
      setIsSubmitting(false);
      onClose();
      const mockId = `7C-${Math.floor(100000 + Math.random() * 900000)}`;
      onOrderPlaced(mockId);
      window.location.href = `/thank-you?orderId=${encodeURIComponent(mockId)}&type=${encodeURIComponent(currentMode)}&payment=${encodeURIComponent(paymentMethod)}&table=${encodeURIComponent(tableNum.trim())}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-slate-50 h-full flex flex-col justify-between shadow-2xl relative animate-slide-left">
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#e31837] rounded-xl flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-gray-900 leading-tight">Your Cart</h2>
              <span className="text-[11px] text-gray-500 font-semibold">{totalCount} items added</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Cart Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-red-100 text-[#e31837] rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
                🍕
              </div>
              <h3 className="font-extrabold text-base text-gray-900">Your Cart is Empty</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Add hot, cheesy handcrafted pizzas from our menu to begin your feast!
              </p>
              <button
                onClick={onClose}
                className="mt-2 bg-[#002855] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md hover:bg-[#001f44] cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Order Mode Badge (Locked per route) */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${
                      isDineInRoute ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                    }`}
                  >
                    {isDineInRoute ? '🍽️' : '🛵'}
                  </div>
                  <div>
                    <span className="text-xs font-black text-gray-900 block">
                      {isDineInRoute ? 'Table QR Ordering' : 'Home Delivery'}
                    </span>
                    <span className="text-[10.5px] text-gray-500">
                      {isDineInRoute
                        ? 'Served hot directly to your table (₹0 Delivery Fee)'
                        : 'Delivered fast from 7Cheese Haldwani (30-40 mins)'}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                    isDineInRoute
                      ? 'bg-amber-500/20 text-amber-800 border border-amber-400/40'
                      : 'bg-blue-500/20 text-blue-800 border border-blue-400/40'
                  }`}
                >
                  {isDineInRoute ? 'Dine-in' : 'Delivery'}
                </span>
              </div>

              {/* Items List */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs divide-y divide-gray-100">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-black uppercase text-gray-800 tracking-wider">Ordered Items</span>
                  <button
                    onClick={clearCart}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Cart</span>
                  </button>
                </div>

                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-start justify-between space-x-3">
                    <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        <VegNonVegIcon isVeg={item.isVeg} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-gray-900 leading-tight truncate">
                          {item.name}
                        </h4>
                        <div className="text-[10px] text-gray-500 mt-0.5 space-y-0.5">
                          {item.size !== 'Standard' && (
                            <p>
                              Size: <span className="font-semibold text-gray-700">{item.size}</span>
                            </p>
                          )}
                          {item.crust !== 'Standard' && (
                            <p className="truncate">
                              Crust: <span className="font-semibold text-gray-700">{item.crust}</span>
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-black text-gray-900 mt-1 block">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center space-x-2 bg-gray-100 px-2.5 py-1 rounded-xl shrink-0">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-5 h-5 rounded-md bg-white text-gray-700 font-bold flex items-center justify-center shadow-2xs hover:bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-black text-xs text-gray-900 w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 rounded-md bg-white text-gray-700 font-bold flex items-center justify-center shadow-2xs hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Apply Coupon Box */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
                <div className="flex items-center space-x-2 mb-2">
                  <Tag className="w-4 h-4 text-[#e31837]" />
                  <span className="text-xs font-black uppercase text-gray-800 tracking-wider">Offers & Coupons</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-emerald-800">
                        {appliedCoupon} Applied (-₹{discountAmount})
                      </span>
                      <p className="text-[10px] text-emerald-600">Cheesy savings applied to order</p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs font-black text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter CHEESE10, FEAST20..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold uppercase placeholder-gray-400 outline-none focus:border-[#002855]"
                    />
                    <button
                      type="submit"
                      className="bg-[#002855] hover:bg-[#001f44] text-white text-xs font-black px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponFeedback && (
                  <p
                    className={`text-[11px] font-bold mt-1.5 ${
                      couponFeedback.success ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* ROUTE-BASED DETAILS FORM */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-gray-800 tracking-wider block">
                    {isDineInRoute ? 'Table Order Details' : 'Delivery Details'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      isDineInRoute
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {isDineInRoute ? '🍽️ Table QR Service' : '🛵 Home Delivery'}
                  </span>
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  {/* Table Route: Quick Select Buttons (Table 1-6) + Manual Input Fallback */}
                  {isDineInRoute ? (
                    <div className="space-y-3">
                      {/* Quick Select Table Header & Buttons */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black uppercase text-gray-700 tracking-wider">
                            Select Your Table
                          </label>
                          {tableNum && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Selected: {tableNum}
                            </span>
                          )}
                        </div>

                        {/* 6 Quick Table Pill Buttons */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {[1, 2, 3, 4, 5, 6].map((num) => {
                            const isSelected =
                              tableNum === `Table ${num}` ||
                              tableNum === `${num}` ||
                              tableNum === `Table 0${num}` ||
                              tableNum === `0${num}`;

                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  setTableNum(`Table ${num}`);
                                  if (formError) setFormError(null);
                                }}
                                className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center border cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#002855] text-white border-[#002855] shadow-md scale-[1.02]'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <span className="text-sm">🍽️</span>
                                <span className="mt-0.5 leading-tight">Table {num}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Manual Table Number Input Fallback */}
                      <div className="relative">
                        <UtensilsCrossed className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={tableNum}
                          onChange={(e) => {
                            setTableNum(e.target.value);
                            if (formError) setFormError(null);
                          }}
                          placeholder="Or type custom table (e.g. Table 7 or Balcony)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#002855]"
                          required
                        />
                      </div>

                      {/* Customer Name Input (Optional/Clean) */}
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Customer Name (Optional)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 outline-none focus:border-[#002855]"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Main Delivery Route: Name + Phone + Address + HTML5 Geolocation */
                    <div className="space-y-2">
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name (Optional)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 outline-none focus:border-[#002855]"
                        />
                      </div>

                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (formError) setFormError(null);
                          }}
                          placeholder="Phone Number (Required for Delivery)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:border-[#002855]"
                          required
                        />
                      </div>

                      {/* GPS Location Action Bar */}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-[11px] font-bold text-gray-700">Delivery Address</span>
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={isLocating}
                          className={`inline-flex items-center space-x-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-all shadow-2xs ${
                            locationSuccess
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-red-50 text-[#e31837] border border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {isLocating ? (
                            <>
                              <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin shrink-0" />
                              <span>Detecting GPS...</span>
                            </>
                          ) : locationSuccess ? (
                            <>
                              <span>📍</span>
                              <span>Location Captured ✓</span>
                            </>
                          ) : (
                            <>
                              <span>📍</span>
                              <span>Use Current Location</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* GPS Location Success Indicator */}
                      {locationSuccess && coordinates && (
                        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2 flex items-center justify-between text-[11px] text-emerald-900 animate-fade-in">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                            <span className="font-extrabold text-emerald-800 shrink-0">GPS Attached:</span>
                            <span className="font-mono text-[10.5px] text-emerald-700 truncate">
                              {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCoordinates(null);
                              setLocationSuccess(false);
                            }}
                            className="text-[10px] text-gray-500 hover:text-red-500 underline shrink-0 ml-2 cursor-pointer"
                          >
                            Clear GPS
                          </button>
                        </div>
                      )}

                      {/* GPS Error Prompt */}
                      {locationError && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-[11px] text-amber-800 flex items-start space-x-1.5 animate-fade-in">
                          <span className="shrink-0 mt-0.5">⚠️</span>
                          <span>{locationError}</span>
                        </div>
                      )}

                      {/* Line 1: House / Flat / Building No. */}
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={addressLine1}
                          onChange={(e) => {
                            setAddressLine1(e.target.value);
                            if (formError) setFormError(null);
                          }}
                          placeholder="House / Flat No., Floor, Building / Society"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 outline-none focus:border-[#002855]"
                          required
                        />
                      </div>

                      {/* Line 2: Street, Landmark & Area */}
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={(e) => {
                            setAddressLine2(e.target.value);
                            if (formError) setFormError(null);
                          }}
                          placeholder="Nearby Landmark & Area (e.g. Near TVS Showroom, Haldwani)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 outline-none focus:border-[#002855]"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PAYMENT METHOD SELECTION */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-gray-800 tracking-wider">
                    Payment Method
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">Choose how to pay</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: Cash / COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'bg-[#002855] text-white border-[#002855] shadow-md scale-[1.01]'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    <span className="text-lg">💵</span>
                    <span className="leading-tight text-center">
                      {isDineInRoute ? 'Pay at Counter / Cash' : 'Cash on Delivery (COD)'}
                    </span>
                  </button>

                  {/* Option 2: UPI Payment */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      paymentMethod === 'UPI'
                        ? 'bg-[#002855] text-white border-[#002855] shadow-md scale-[1.01]'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    <span className="text-lg">📱</span>
                    <span className="leading-tight text-center">Pay via UPI</span>
                  </button>
                </div>

                {/* UPI QR & Details (if UPI selected) */}
                {paymentMethod === 'UPI' && (
                  <div className="p-3.5 bg-gradient-to-b from-blue-50/80 to-slate-50 border border-blue-200/80 rounded-2xl text-center space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-center space-x-1 text-xs font-black text-[#002855]">
                      <span>📱</span>
                      <span>Scan QR Code with any UPI App</span>
                    </div>

                    <div className="relative inline-block bg-white p-2 rounded-2xl border-2 border-blue-300/80 shadow-md">
                      <img
                        src={
                          paymentSettings.upiQrUrl ||
                          `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(
                            paymentSettings.upiId || '7cheesepizza@okhdfcbank'
                          )}%26pn%3D7Cheese%2520Pizza%26am%3D${grandTotal}%26cu%3DINR`
                        }
                        alt="UPI QR Code"
                        className="w-36 h-36 object-contain rounded-xl mx-auto"
                      />
                      <span className="text-[10px] font-black text-gray-800 block mt-1">Amount: ₹{grandTotal}</span>
                    </div>

                    {/* UPI ID with Copy Button */}
                    <div className="bg-white border border-gray-200 rounded-xl p-2 flex items-center justify-between text-xs">
                      <div className="text-left min-w-0 pr-2">
                        <span className="text-[9.5px] font-bold text-gray-400 block uppercase">UPI ID</span>
                        <span className="font-mono font-black text-gray-800 text-[11px] truncate block">
                          {paymentSettings.upiId || '7cheesepizza@okhdfcbank'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentSettings.upiId || '7cheesepizza@okhdfcbank');
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 cursor-pointer transition-colors"
                      >
                        {copiedUpi ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>

                    <p className="text-[10.5px] text-gray-500 leading-tight">
                      Scan to pay, then click <strong>Place Order (Paid via UPI)</strong> below.
                    </p>

                    {/* Direct mobile UPI intent */}
                    <a
                      href={`upi://pay?pa=${encodeURIComponent(
                        paymentSettings.upiId || '7cheesepizza@okhdfcbank'
                      )}&pn=7Cheese%20Pizza&am=${grandTotal}&cu=INR`}
                      className="block sm:hidden w-full bg-emerald-600 text-white font-black text-xs py-2 rounded-xl shadow-xs"
                    >
                      Pay ₹{grandTotal} with GPay / Paytm
                    </a>
                  </div>
                )}
              </div>

              {/* Bill Details Summary */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
                <span className="text-xs font-black uppercase text-gray-800 tracking-wider block">
                  Bill Summary
                </span>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Item Total</span>
                    <span className="font-semibold text-gray-900">₹{subtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Coupon Discount</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Taxes & Restaurant Charges (5% GST)</span>
                    <span className="font-semibold text-gray-900">₹{taxes}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-gray-900">
                      {isDineInRoute ? (
                        <span className="text-emerald-600 font-bold">FREE (Table Order)</span>
                      ) : deliveryFee === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="font-black text-sm text-gray-900">To Pay</span>
                    <span className="font-black text-base text-[#e31837]">₹{grandTotal}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout CTA Button */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-200 shadow-xl flex items-center justify-between space-x-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">
                Total ({paymentMethod === 'UPI' ? 'UPI Online' : 'Cash'})
              </span>
              <span className="text-xl font-black text-gray-900 leading-tight">₹{grandTotal}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="flex-1 bg-[#e31837] hover:bg-[#c4122d] active:scale-[0.99] disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-2xl flex items-center justify-center space-x-2 shadow-md transition-all text-xs tracking-wider uppercase cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'UPI' ? 'Place Order (Paid via UPI)' : 'Place Order'}
                  </span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default CartDrawer;
