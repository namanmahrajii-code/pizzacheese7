import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { DEFAULT_PAYMENT_SETTINGS } from '@/lib/constants';

export async function GET() {
  try {
    if (db) {
      const docRef = doc(db, 'settings', 'payment');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return NextResponse.json({
          upiId: data.upiId || DEFAULT_PAYMENT_SETTINGS.upiId,
          upiQrUrl: data.upiQrUrl || DEFAULT_PAYMENT_SETTINGS.upiQrUrl,
          restaurantName: data.restaurantName || DEFAULT_PAYMENT_SETTINGS.restaurantName,
        });
      }
    }
  } catch (err) {
    console.warn('Firestore settings public fetch fallback:', err);
  }

  // Fallback to global memory or default
  const cached = globalThis.__GLOBAL_PAYMENT_SETTINGS__ || DEFAULT_PAYMENT_SETTINGS;
  return NextResponse.json({
    upiId: cached.upiId,
    upiQrUrl: cached.upiQrUrl,
    restaurantName: cached.restaurantName,
  });
}
