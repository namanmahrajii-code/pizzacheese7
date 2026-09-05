'use client';

import React, { useState } from 'react';
import { X, Phone, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginWithEmail, signupWithEmail, loginWithPhoneMock } = useAuth();

  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError(null);
    setIsLoading(true);
    const res = await loginWithPhoneMock(phone, name || 'Customer');
    setIsLoading(false);
    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError(null);
    setIsLoading(true);

    if (isRegisterMode) {
      const res = await signupWithEmail(email, password, name);
      setIsLoading(false);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Registration failed');
      }
    } else {
      const res = await loginWithEmail(email, password);
      setIsLoading(false);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Login failed');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in text-white">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#131722] border border-stone-800 shadow-2xl overflow-hidden p-6 space-y-4 animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Banner */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#e31837] to-amber-500 mx-auto flex items-center justify-center text-2xl shadow-lg">
            🍕
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">Login to 7Cheese Pizza</h3>
          <p className="text-xs text-stone-400">Unlock VIP discounts, 30-min delivery &amp; order shortcuts</p>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-stone-900 rounded-2xl border border-stone-800 text-xs font-black">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone');
              setError(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              authMethod === 'phone'
                ? 'bg-[#e31837] text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Mobile OTP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setError(null);
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              authMethod === 'email'
                ? 'bg-[#e31837] text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/80 border border-red-700/60 text-red-200 text-xs p-2.5 rounded-xl font-semibold">
            {error}
          </div>
        )}

        {/* PHONE AUTH FORM */}
        {authMethod === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-3 text-xs">
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name (e.g. Aman Sharma)"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-stone-500 outline-none focus:border-amber-400"
              />
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3 text-stone-400 font-bold">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-12 pr-3 py-2.5 text-white placeholder-stone-500 outline-none focus:border-amber-400 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#e31837] hover:bg-[#c4122d] text-white font-black py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 uppercase tracking-wider text-xs cursor-pointer border border-red-400/40"
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Continue with Phone</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* EMAIL AUTH FORM */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3 text-xs">
            {isRegisterMode && (
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-stone-500 outline-none focus:border-amber-400"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-stone-500 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (Min 6 chars)"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-stone-500 outline-none focus:border-amber-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#e31837] hover:bg-[#c4122d] text-white font-black py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 uppercase tracking-wider text-xs cursor-pointer border border-red-400/40"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <span>{isRegisterMode ? 'Create 7Cheese Account' : 'Sign In with Email'}</span>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-stone-400 hover:text-amber-300 text-[11px] underline cursor-pointer"
              >
                {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
