import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

export async function GET() {
  try {
    if (db) {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ orders });
      }
    }
  } catch (fsErr) {
    console.warn('Firestore orders query fallback to memory:', fsErr);
  }

  // Return fallback global orders
  return NextResponse.json({
    orders: globalThis.__GLOBAL_ORDERS__ || [],
  });
}
