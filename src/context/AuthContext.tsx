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
  role?: string;
  createdAt?: string;
  lastLoginAt?: string;
  loginMethod?: string;
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
  savePastOrder: (order: {
    id: string;
    totalAmount: number;
    itemSummary: string;
    items?: any[];
    customerPhone?: string;
    customerName?: string;
  }) => Promise<void>;
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('7cheese_auth_session_active', 'true');
        }
        try {
          if (db) {
            const docRef = doc(db, 'users', user.uid);
            const snap = await getDoc(docRef);
            const nowIso = new Date().toISOString();
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              const updated: UserProfile = {
                ...data,
                uid: user.uid,
                lastLoginAt: nowIso,
              };
              await setDoc(docRef, { lastLoginAt: nowIso }, { merge: true }).catch(() => {});
              setUserProfile(updated);
              if (typeof window !== 'undefined') {
                localStorage.setItem('7cheese_user_profile', JSON.stringify(updated));
              }
            } else {
              const newProf: UserProfile = {
                uid: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'Cheese Lover',
                email: user.email || '',
                phone: user.phoneNumber || '',
                role: 'customer',
                createdAt: nowIso,
                lastLoginAt: nowIso,
                loginMethod: (user.providerData?.[0]?.providerId as any) || 'firebase',
                pastOrders: [],
              };
              await setDoc(docRef, newProf, { merge: true }).catch(() => {});
              setUserProfile(newProf);
              if (typeof window !== 'undefined') {
                localStorage.setItem('7cheese_user_profile', JSON.stringify(newProf));
              }
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
      const nowIso = new Date().toISOString();
      setIsSessionActive(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('7cheese_auth_session_active', 'true');
      }

      // Explicitly store/update login info in Firestore database
      if (db && res.user) {
        const docRef = doc(db, 'users', res.user.uid);
        const snap = await getDoc(docRef).catch(() => null);
        let prof: UserProfile;
        if (snap && snap.exists()) {
          prof = {
            ...(snap.data() as UserProfile),
            uid: res.user.uid,
            lastLoginAt: nowIso,
            loginMethod: 'email',
          };
          await setDoc(docRef, { lastLoginAt: nowIso, loginMethod: 'email' }, { merge: true }).catch(() => {});
        } else {
          prof = {
            uid: res.user.uid,
            name: res.user.displayName || email.split('@')[0] || 'Cheese Lover',
            email: res.user.email || email,
            phone: res.user.phoneNumber || '',
            role: 'customer',
            createdAt: nowIso,
            lastLoginAt: nowIso,
            loginMethod: 'email',
            pastOrders: [],
          };
          await setDoc(docRef, prof, { merge: true }).catch(() => {});
        }
        setUserProfile(prof);
        if (typeof window !== 'undefined') {
          localStorage.setItem('7cheese_user_profile', JSON.stringify(prof));
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    try {
      if (!auth) throw new Error('Firebase Auth not initialized');
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const nowIso = new Date().toISOString();
      const newProf: UserProfile = {
        uid: res.user.uid,
        name: name || email.split('@')[0],
        email,
        phone: '',
        role: 'customer',
        createdAt: nowIso,
        lastLoginAt: nowIso,
        loginMethod: 'email',
        pastOrders: [],
      };
      if (db) {
        await setDoc(doc(db, 'users', res.user.uid), newProf, { merge: true }).catch((err) => console.warn('User doc save err:', err));
      }
      setUserProfile(newProf);
      setIsSessionActive(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('7cheese_auth_session_active', 'true');
        localStorage.setItem('7cheese_user_profile', JSON.stringify(newProf));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // Instant seamless phone login with database persistence in Firestore
  const loginWithPhoneMock = async (phone: string, name?: string) => {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const mockUid = `usr_${cleanPhone || Date.now()}`;
      const nowIso = new Date().toISOString();
      let profData: UserProfile;

      if (db) {
        const docRef = doc(db, 'users', mockUid);
        const snap = await getDoc(docRef).catch(() => null);
        if (snap && snap.exists()) {
          const existing = snap.data() as UserProfile;
          profData = {
            ...existing,
            uid: mockUid,
            name: (name && name !== 'Customer' && name !== 'Valued Customer') ? name : (existing.name || name || 'Valued Customer'),
            phone: phone || existing.phone || cleanPhone,
            lastLoginAt: nowIso,
            loginMethod: 'phone',
            role: existing.role || 'customer',
          };
        } else {
          profData = {
            uid: mockUid,
            name: (name && name !== 'Customer') ? name : 'Valued Customer',
            phone: phone || cleanPhone,
            role: 'customer',
            createdAt: nowIso,
            lastLoginAt: nowIso,
            loginMethod: 'phone',
            pastOrders: [],
          };
        }
        await setDoc(docRef, profData, { merge: true }).catch((err) => console.warn('User doc save err:', err));
      } else {
        profData = {
          uid: mockUid,
          name: name || 'Valued Customer',
          phone: phone || cleanPhone,
          role: 'customer',
          createdAt: nowIso,
          lastLoginAt: nowIso,
          loginMethod: 'phone',
          pastOrders: [],
        };
      }

      setUserProfile(profData);
      setIsSessionActive(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('7cheese_auth_session_active', 'true');
        localStorage.setItem('7cheese_user_profile', JSON.stringify(profData));
      }
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

  const savePastOrder = async (order: {
    id: string;
    totalAmount: number;
    itemSummary: string;
    items?: any[];
    customerPhone?: string;
    customerName?: string;
  }) => {
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

    const updatedPhone = (!userProfile.phone && order.customerPhone && order.customerPhone !== 'N/A' && order.customerPhone !== 'Table Service')
      ? order.customerPhone
      : userProfile.phone;
    const updatedName = (!userProfile.name && order.customerName)
      ? order.customerName
      : userProfile.name;

    const updated: UserProfile = {
      ...userProfile,
      pastOrders: updatedOrders,
      phone: updatedPhone,
      name: updatedName,
    };

    setUserProfile(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('7cheese_user_profile', JSON.stringify(updated));
      }
      if (db && userProfile.uid) {
        await setDoc(doc(db, 'users', userProfile.uid), {
          pastOrders: updatedOrders,
          phone: updated.phone || '',
          name: updated.name || '',
        }, { merge: true });
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
