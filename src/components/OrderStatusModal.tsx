'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, ChefHat, Bike, Home, Sparkles } from 'lucide-react';

interface OrderStatusModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({ orderId, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1 = Received, 2 = Baking, 3 = Dispatched, 4 = Delivered

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep(1);

    // Simulate progress
    const timer1 = setTimeout(() => setCurrentStep(2), 4000);
    const timer2 = setTimeout(() => setCurrentStep(3), 12000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  if (!isOpen || !orderId) return null;

  const steps = [
    { title: 'Order Confirmed', desc: 'Sent to 7Cheese kitchen', icon: CheckCircle2 },
    { title: 'Baking in Oven', desc: 'Cheesy crust turning golden', icon: ChefHat },
    { title: 'Out for Delivery', desc: 'Rider on the way', icon: Bike },
    { title: 'Delivered', desc: 'Enjoy your hot cheesy slices!', icon: Home },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="text-center pb-4 border-b border-gray-100">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
            🍕
          </div>
          <h3 className="text-lg font-black text-gray-900">Order Placed Successfully!</h3>
          <p className="text-xs font-mono font-bold text-gray-500 mt-0.5">Order ID: #{orderId}</p>
          <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mt-2 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Estimated delivery in 25-35 mins</span>
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="py-5 space-y-4">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            const Icon = step.icon;

            return (
              <div key={step.title} className="flex items-start space-x-3.5">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[#e31837] text-white ring-4 ring-red-100 animate-pulse'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`w-0.5 h-6 mt-1 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                <div className="pt-1">
                  <h4
                    className={`text-xs font-extrabold leading-tight ${
                      isCurrent ? 'text-[#e31837]' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-gray-500">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#002855] hover:bg-[#001c3d] text-white font-bold py-3 rounded-2xl text-xs shadow-md"
        >
          Track on Home Screen
        </button>
      </div>
    </div>
  );
};
export default OrderStatusModal;
