import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyA3bYv7sWjzBWld70MEMb4Fy1zm-3jKuHk",
  authDomain: "cheesepizza-7df1f.firebaseapp.com",
  projectId: "cheesepizza-7df1f",
  storageBucket: "cheesepizza-7df1f.firebasestorage.app",
  messagingSenderId: "16322023918",
  appId: "1:16322023918:web:e2a378528c0bcd0d903eff",
  measurementId: "G-PHFNW60CS2"
};

// Initialize Firebase app singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics client-side initialization
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};
