'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  pastOrders?: Array<{
    id: string;
    date: string;
    totalAmount: number;
    itemSummary: string;
    items?: any[];
  }>;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhoneMock: (phone: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  savePastOrder: (order: { id: string; totalAmount: number; itemSummary: string; items?: any[] }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('7cheese_auth_session_active') === 'true';
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Only load cached profile if the user actually has an active authenticated session
  useEffect(() => {
    try {
      const active = localStorage.getItem('7cheese_auth_session_active') === 'true';
      if (active) {
        const cached = localStorage.getItem('7cheese_user_profile');
        if (cached) {
          setUserProfile(JSON.parse(cached));
        }
      } else {
        // Clear unauthenticated / guest cached data
        setUserProfile(null);
        localStorage.removeItem('7cheese_user_profile');
      }
    } catch {}
  }, []);

  // Sync Firebase Auth state
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsSessionActive(true);
        localStorage.setItem('7cheese_auth_session_active', 'true');
        try {
          if (db) {
            const docRef = doc(db, 'users', user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              setUserProfile(data);
              localStorage.setItem('7cheese_user_profile', JSON.stringify(data));
            } else {
              const newProf: UserProfile = {
                uid: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'Cheese Lover',
                email: user.email || '',
                phone: user.phoneNumber || '',
                pastOrders: [],
              };
              await setDoc(docRef, newProf, { merge: true });
              setUserProfile(newProf);
              localStorage.setItem('7cheese_user_profile', JSON.stringify(newProf));
            }
          }
        } catch (e) {
          console.warn('Firestore profile fetch fallback:', e);
        }
      } else {
        // If not logged into Firebase and no manual active session, clear profile
        const active = typeof window !== 'undefined' && localStorage.getItem('7cheese_auth_session_active') === 'true';
        if (!active) {
          setUserProfile(null);
          setIsSessionActive(false);
          try {
            localStorage.removeItem('7cheese_user_profile');
          } catch {}
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      if (!auth) throw new Error('Firebase Auth not initialized');
      const res = await signInWithEmailAndPassword(auth, email, pass);
      setIsSessionActive(true);
      localStorage.setItem('7cheese_auth_session_active', 'true');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    try {
      if (!auth) throw new Error('Firebase Auth not initialized');
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const newProf: UserProfile = {
        uid: res.user.uid,
        name: name || email.split('@')[0],
        email,
        pastOrders: [],
      };
      if (db) {
        await setDoc(doc(db, 'users', res.user.uid), newProf, { merge: true });
      }
      setUserProfile(newProf);
      setIsSessionActive(true);
      localStorage.setItem('7cheese_auth_session_active', 'true');
      localStorage.setItem('7cheese_user_profile', JSON.stringify(newProf));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // Instant seamless phone login with profile persistence
  const loginWithPhoneMock = async (phone: string, name?: string) => {
    try {
      const mockUid = `usr_${phone.replace(/\D/g, '') || Date.now()}`;
      const newProf: UserProfile = {
        uid: mockUid,
        name: name || 'Valued Customer',
        phone,
        pastOrders: [],
      };
      if (db) {
        await setDoc(doc(db, 'users', mockUid), newProf, { merge: true }).catch(() => {});
      }
      setUserProfile(newProf);
      setIsSessionActive(true);
      localStorage.setItem('7cheese_auth_session_active', 'true');
      localStorage.setItem('7cheese_user_profile', JSON.stringify(newProf));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Phone login failed' };
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth).catch(() => {});
    }
    setCurrentUser(null);
    setUserProfile(null);
    setIsSessionActive(false);
    try {
      localStorage.removeItem('7cheese_user_profile');
      localStorage.removeItem('7cheese_auth_session_active');
    } catch {}
  };

  const savePastOrder = async (order: { id: string; totalAmount: number; itemSummary: string; items?: any[] }) => {
    if (!userProfile) return;
    const updatedOrders = [
      {
        id: order.id,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        totalAmount: order.totalAmount,
        itemSummary: order.itemSummary,
        items: order.items,
      },
      ...(userProfile.pastOrders || []),
    ].slice(0, 10);

    const updated = { ...userProfile, pastOrders: updatedOrders };
    setUserProfile(updated);
    try {
      localStorage.setItem('7cheese_user_profile', JSON.stringify(updated));
      if (db && userProfile.uid) {
        await setDoc(doc(db, 'users', userProfile.uid), { pastOrders: updatedOrders }, { merge: true });
      }
    } catch {}
  };

  const isLoggedIn = Boolean(
    currentUser || (userProfile && isSessionActive)
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoggedIn,
        isLoading,
        loginWithEmail,
        signupWithEmail,
        loginWithPhoneMock,
        logout,
        savePastOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
