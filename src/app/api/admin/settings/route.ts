import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_PAYMENT_SETTINGS } from '@/lib/constants';

// In-memory persistent cache for server runtime
declare global {
  var __GLOBAL_PAYMENT_SETTINGS__: {
    upiId: string;
    upiQrUrl: string;
    restaurantName: string;
    updatedAt?: string;
  } | undefined;
}

if (!globalThis.__GLOBAL_PAYMENT_SETTINGS__) {
  globalThis.__GLOBAL_PAYMENT_SETTINGS__ = { ...DEFAULT_PAYMENT_SETTINGS };
}

export async function GET() {
  try {
    if (db) {
      const docRef = doc(db, 'settings', 'payment');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as typeof DEFAULT_PAYMENT_SETTINGS;
        globalThis.__GLOBAL_PAYMENT_SETTINGS__ = {
          ...DEFAULT_PAYMENT_SETTINGS,
          ...data,
        };
        return NextResponse.json({ settings: globalThis.__GLOBAL_PAYMENT_SETTINGS__ });
      }
    }
  } catch (err) {
    console.warn('Firestore settings fetch fallback:', err);
  }

  return NextResponse.json({
    settings: globalThis.__GLOBAL_PAYMENT_SETTINGS__ || DEFAULT_PAYMENT_SETTINGS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { upiId, upiQrUrl, restaurantName } = body;

    const newSettings = {
      upiId: (upiId || DEFAULT_PAYMENT_SETTINGS.upiId).trim(),
      upiQrUrl: (upiQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3D${encodeURIComponent(upiId || DEFAULT_PAYMENT_SETTINGS.upiId)}%26pn%3D7Cheese%2520Pizza%26cu%3DINR`).trim(),
      restaurantName: (restaurantName || DEFAULT_PAYMENT_SETTINGS.restaurantName).trim(),
      updatedAt: new Date().toISOString(),
    };

    globalThis.__GLOBAL_PAYMENT_SETTINGS__ = newSettings;

    // Save to Firestore settings/payment
    if (db) {
      try {
        await setDoc(doc(db, 'settings', 'payment'), newSettings);
      } catch (fsErr) {
        console.warn('Firestore settings save error:', fsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment settings saved successfully',
      settings: newSettings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
