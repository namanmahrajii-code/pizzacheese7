'use client';

import React, { useState } from 'react';
import { Star, X, Check, Heart, Sparkles, Send, ThumbsUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import confetti from 'canvas-confetti';

interface FeedbackModalProps {
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  isOpen: boolean;
  onClose: () => void;
}

const SATISFACTION_TAGS = [
  'Super Cheesy 🧀',
  'Hot & Fresh 🍕',
  'Lightning Fast Delivery 🛵',
  'Crispy Stone-Baked Crust 🔥',
  'Loaded Toppings 🍅',
  'Great Packaging 📦',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  orderId,
  customerName,
  customerPhone,
  isOpen,
  onClose,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Super Cheesy 🧀', 'Hot & Fresh 🍕']);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const feedbackData = {
      orderId,
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || 'N/A',
      rating,
      tags: selectedTags,
      comment: comment.trim(),
      status: 'pending', // Pending Admin Moderation
      syncedToGoogle: false,
      createdAt: new Date().toISOString(),
    };

    try {
      if (db) {
        await addDoc(collection(db, 'feedbacks'), feedbackData);
      }
      // Also cache locally
      const savedFeedbacks = JSON.parse(localStorage.getItem('7cheese_customer_feedbacks') || '[]');
      savedFeedbacks.unshift({ ...feedbackData, id: `fb-${Date.now()}` });
      localStorage.setItem('7cheese_customer_feedbacks', JSON.stringify(savedFeedbacks));

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#e31837', '#10b981'],
        });
      } catch {}

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.warn('Feedback submit error:', err);
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in text-white">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#141824] border border-stone-800 shadow-2xl p-6 text-center space-y-4 animate-scale-in">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="py-8 space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="text-lg font-black text-white">Thank You For Your Feedback!</h3>
            <p className="text-xs text-stone-300">
              Your review has been sent to our head chef. We appreciate your love for 7Cheese!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="space-y-1 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#e31837] to-amber-500 mx-auto flex items-center justify-center text-2xl shadow-md">
                🍕
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">How was your pizza feast?</h3>
              <p className="text-xs text-stone-400">Order #{orderId} has been marked Delivered</p>
            </div>

            {/* 5-Star Interactive Rating */}
            <div className="flex items-center justify-center space-x-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 stroke-amber-400 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-stone-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <span className="text-xs font-black text-amber-300 block">
              {rating === 5
                ? '⭐ Outstanding & Cheesy!'
                : rating === 4
                ? '👍 Very Good Taste!'
                : rating === 3
                ? '👌 Average'
                : 'Need Improvement'}
            </span>

            {/* Satisfaction Tag Chips */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {SATISFACTION_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-xs'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Comment Text Area */}
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what you loved about your meal or delivery..."
                rows={2}
                className="w-full bg-stone-900 border border-stone-700 rounded-2xl p-3 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#e31837] hover:bg-[#c4122d] text-white font-black py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 uppercase tracking-wider text-xs cursor-pointer border border-red-400/40"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
