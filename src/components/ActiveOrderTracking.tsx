'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  CheckCircle2,
  ChefHat,
  Bike,
  Home,
  Clock,
  MapPin,
  UtensilsCrossed,
  Phone,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { STORE_LOCATION } from '@/lib/constants';

interface OrderItem {
  id: string;
  name: string;
  size?: string;
  crust?: string;
  quantity: number;
  price: number;
}

interface RecoveredOrder {
  id: string;
  status: 'Pending' | 'Preparing' | 'Dispatched' | 'Delivered' | 'Completed' | 'Cancelled' | string;
  orderType?: 'Delivery' | 'Dine-in' | string;
  tableNumber?: string | null;
  address?: string | null;
  totalAmount?: number;
  items?: OrderItem[];
  paymentMethod?: string;
  createdAt?: string;
}

interface ActiveOrderTrackingProps {
  orderId: string;
  onBackToMenu: () => void;
  onOrderFinished: () => void;
}

export const ActiveOrderTracking: React.FC<ActiveOrderTrackingProps> = ({
  orderId,
  onBackToMenu,
  onOrderFinished,
}) => {
  const [order, setOrder] = useState<RecoveredOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Firestore real-time onSnapshot listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    if (!orderId) {
      setIsLoading(false);
      return;
    }

    try {
      if (db) {
        const orderRef = doc(db, 'orders', orderId);
        unsubscribe = onSnapshot(
          orderRef,
          (snapshot) => {
            if (!isMounted) return;
            setIsLoading(false);

            if (!snapshot.exists()) {
              // Document not found in Firestore
              setErrorStatus('Order document not found or removed');
              try {
                localStorage.removeItem('activeOrderId');
              } catch (e) {}
              return;
            }

            const data = snapshot.data();
            const fetchedOrder: RecoveredOrder = {
              id: snapshot.id,
              status: data.status || 'Pending',
              orderType: data.orderType || 'Delivery',
              tableNumber: data.tableNumber || null,
              address: data.address || null,
              totalAmount: data.totalAmount || 0,
              items: data.items || [],
              paymentMethod: data.paymentMethod || 'Cash / UPI on Delivery',
              createdAt: data.createdAt || new Date().toISOString(),
            };

            setOrder(fetchedOrder);

            // Cleanup Mechanism:
            // If the status updates to 'Delivered', 'Completed', or 'Cancelled',
            // display the final status to the user and automatically clear localStorage.
            const terminalStatuses = ['Delivered', 'Completed', 'Cancelled'];
            if (terminalStatuses.includes(fetchedOrder.status)) {
              try {
                localStorage.removeItem('activeOrderId');
              } catch (e) {
                console.warn('Failed to clear activeOrderId from localStorage:', e);
              }
            }
          },
          (err) => {
            console.warn('Firestore onSnapshot listener error:', err);
            // Fallback to REST API fetch
            fetch(`/api/admin/orders/${orderId}`)
              .then((res) => res.json())
              .then((data) => {
                if (!isMounted) return;
                setIsLoading(false);
                if (data.order) {
                  setOrder(data.order);
                  if (['Delivered', 'Completed', 'Cancelled'].includes(data.order.status)) {
                    try {
                      localStorage.removeItem('activeOrderId');
                    } catch (e) {}
                  }
                } else {
                  setErrorStatus('Order not found');
                  try {
                    localStorage.removeItem('activeOrderId');
                  } catch (e) {}
                }
              })
              .catch(() => {
                if (isMounted) {
                  setIsLoading(false);
                  setErrorStatus('Unable to connect to order tracking');
                  try {
                    localStorage.removeItem('activeOrderId');
                  } catch (e) {}
                }
              });
          }
        );
      }
    } catch (err) {
      console.warn('Error setting up onSnapshot:', err);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [orderId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismissOrder = () => {
    try {
      localStorage.removeItem('activeOrderId');
    } catch (e) {}
    onOrderFinished();
  };

  // Determine active step (1 to 4)
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Pending':
        return 1;
      case 'Preparing':
        return 2;
      case 'Dispatched':
        return 3;
      case 'Delivered':
      case 'Completed':
        return 4;
      default:
        return 1;
    }
  };

  const isDineIn = order?.orderType === 'Dine-in';
  const isTerminal = order && ['Delivered', 'Completed', 'Cancelled'].includes(order.status);
  const isCancelled = order?.status === 'Cancelled';
  const currentStep = getStepIndex(order?.status || 'Pending');

  const steps = [
    {
      title: 'Order Confirmed',
      desc: 'Sent to 7Cheese kitchen & registered in POS',
      icon: CheckCircle2,
    },
    {
      title: 'Baking in Stone Oven',
      desc: 'Handcrafted fresh dough with 100% mozzarella',
      icon: ChefHat,
    },
    {
      title: isDineIn ? 'Serving to Table' : 'Out for Delivery',
      desc: isDineIn
        ? `Delivering sizzling hot to Table ${order?.tableNumber || 'Service'}`
        : 'Rider picked up order and is on the way',
      icon: isDineIn ? UtensilsCrossed : Bike,
    },
    {
      title: 'Delivered',
      desc: 'Enjoy your piping hot cheesy feast!',
      icon: Home,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 text-[#e31837] rounded-full flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-gray-900">Recovering Active Order...</h2>
          <p className="text-xs text-gray-500">
            Checking real-time live status for order #{orderId}
          </p>
        </div>
      </div>
    );
  }

  if (errorStatus || !order) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-4 animate-scale-in">
          <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto text-2xl">
            📦
          </div>
          <h2 className="text-lg font-black text-gray-900">Order Completed or Not Found</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            {errorStatus || 'This order has already been finalized or removed. You are free to place a new order!'}
          </p>
          <button
            onClick={handleDismissOrder}
            className="w-full bg-[#002855] hover:bg-[#001c3d] text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Start New Order / Return to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-gray-900 pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col justify-between">
        {/* Top Header */}
        <div>
          <header className="bg-gradient-to-r from-[#002855] to-[#093566] text-white px-5 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-[#e31837] rounded-xl flex items-center justify-center text-xl shadow-md">
                🧀
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight leading-tight">7Cheese Pizza</h1>
                <span className="text-[10px] text-blue-200 font-bold block">Live Order Tracker</span>
              </div>
            </div>

            {/* Live pulsing badge or completed badge */}
            <div className="flex items-center space-x-1.5 bg-black/30 border border-white/20 px-2.5 py-1 rounded-full text-[11px] font-black">
              {isTerminal ? (
                <span className="text-emerald-400">Finalized</span>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-300 uppercase tracking-wider text-[10px]">Live Updates</span>
                </>
              )}
            </div>
          </header>

          {/* Main Body */}
          <main className="p-4 space-y-4">
            {/* Status Announcement Banner */}
            {isCancelled ? (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-5 text-center space-y-2">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-black">
                  ✕
                </div>
                <h2 className="text-base font-black text-red-700">Order Cancelled</h2>
                <p className="text-xs text-red-600">
                  This order was cancelled. Your storage has been cleared so you can place a new order.
                </p>
              </div>
            ) : order.status === 'Delivered' || order.status === 'Completed' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl">
                  🎉
                </div>
                <h2 className="text-base font-black text-emerald-800">Order Delivered!</h2>
                <p className="text-xs text-emerald-700">
                  Enjoy your hot, cheesy handcrafted meal! We hope to serve you again soon.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-100 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🍕</span>
                    <div>
                      <h2 className="text-sm font-black text-gray-900 leading-tight">
                        {order.status === 'Pending' && 'Order Confirmed by Store'}
                        {order.status === 'Preparing' && 'Freshly Baking in Oven'}
                        {order.status === 'Dispatched' && (isDineIn ? 'Serving to Table' : 'Out for Delivery')}
                      </h2>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                        {order.status === 'Pending' && 'Kitchen preparing ingredients & stone deck oven'}
                        {order.status === 'Preparing' && 'Toppings loaded with 100% real dairy mozzarella'}
                        {order.status === 'Dispatched' && (isDineIn ? 'Server heading to your table' : 'Delivery rider en route to your doorstep')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="inline-flex items-center space-x-1 font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-2.5 py-1 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Est. arrival in {order.status === 'Dispatched' ? '10-15' : '20-30'} mins</span>
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {order.orderType}
                  </span>
                </div>
              </div>
            )}

            {/* Step Progress Tracker (for active orders) */}
            {!isCancelled && (
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Live Preparation Timeline
                </h3>

                <div className="space-y-4">
                  {steps.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = stepNum < currentStep || (stepNum === 4 && (order.status === 'Delivered' || order.status === 'Completed'));
                    const isCurrent = stepNum === currentStep && !isTerminal;
                    const Icon = step.icon;

                    return (
                      <div key={step.title} className="flex items-start space-x-3.5">
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isCurrent
                                ? 'bg-[#e31837] text-white ring-4 ring-red-100 animate-pulse shadow-md'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          {idx < steps.length - 1 && (
                            <div
                              className={`w-0.5 h-7 mt-1 transition-colors ${
                                isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>

                        <div className="pt-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`text-xs font-black ${
                                isCurrent
                                  ? 'text-[#e31837]'
                                  : isCompleted
                                  ? 'text-gray-900'
                                  : 'text-gray-400'
                              }`}
                            >
                              {step.title}
                            </h4>
                            {isCurrent && (
                              <span className="bg-red-50 text-[#e31837] text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200">
                                In Progress
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Details Ticket Box */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Tracking Order
                  </span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="font-mono font-black text-sm text-gray-900">
                      #{order.id}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Copy Order ID"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Mode
                  </span>
                  <span className="font-black text-xs text-gray-800">
                    {order.orderType === 'Dine-in' ? `Table ${order.tableNumber || 'General'}` : 'Delivery'}
                  </span>
                </div>
              </div>

              {/* Destination Address or Table */}
              <div className="text-xs text-gray-600 flex items-start space-x-2 bg-gray-50 p-2.5 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-[#e31837] shrink-0 mt-0.5" />
                <span className="truncate">
                  {order.orderType === 'Dine-in'
                    ? `Dine-in Service • Table ${order.tableNumber || 'General'}`
                    : order.address || 'Haldwani, Uttarakhand'}
                </span>
              </div>

              {/* Items List */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-gray-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    Items ({order.items.length})
                  </span>
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-700 font-black text-[11px] flex items-center justify-center">
                          {item.quantity}×
                        </span>
                        <span className="font-bold text-gray-800">
                          {item.name}
                          {item.size ? ` (${item.size})` : ''}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total & Payment Method */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Payment Mode
                  </span>
                  <span className="text-xs font-black text-gray-700">
                    {order.paymentMethod || 'Cash / UPI on Delivery'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Total Amount
                  </span>
                  <span className="text-base font-black text-[#e31837] font-mono">
                    ₹{order.totalAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Store Contact & Support */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#002855]" />
                <div>
                  <span className="font-bold text-gray-900 block leading-tight">Need help with order?</span>
                  <span className="text-[10px] text-gray-500">7Cheese Kaladhungi Road, Haldwani</span>
                </div>
              </div>

              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi 7Cheese, checking status of my order #${order.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#002855] text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-xs hover:bg-[#001c3d] transition-colors"
              >
                WhatsApp Us
              </a>
            </div>
          </main>
        </div>

        {/* Bottom Actions */}
        <footer className="p-4 bg-white border-t border-gray-100 space-y-2 sticky bottom-0">
          {isTerminal ? (
            <button
              type="button"
              onClick={handleDismissOrder}
              className="w-full bg-[#e31837] hover:bg-[#c4122d] text-white font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-red-900/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Order Again / Return to Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onBackToMenu}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Browse Menu
              </button>

              <button
                type="button"
                onClick={handleDismissOrder}
                className="flex-1 bg-[#002855] hover:bg-[#001c3d] text-white font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Clear & New Order
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ActiveOrderTracking;
