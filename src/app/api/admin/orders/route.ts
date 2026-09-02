import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { addGlobalOrder, getGlobalOrders, setGlobalOrders, OrderData } from '@/lib/orderStore';

export async function GET() {
  try {
    if (db) {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));

      // Fast 600ms race so response is never blocked by disabled or offline Firestore
      const getDocsPromise = getDocs(q);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 600)
      );
      const snapshot = (await Promise.race([getDocsPromise, timeoutPromise])) as any;

      if (snapshot?.docs && !snapshot.empty) {
        const fsOrders: OrderData[] = snapshot.docs.map((d: any) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        // Merge with local store to ensure no orders are missing
        fsOrders.forEach((o) => addGlobalOrder(o));
        return NextResponse.json({ orders: getGlobalOrders() });
      }
    }
  } catch (fsErr) {
    // Firestore offline / timeout fallback
  }

  // Return central persistent orders instantly
  return NextResponse.json({
    orders: getGlobalOrders(),
  });
}

// Support batch sync from Admin localStorage backup
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const incomingOrders: OrderData[] = Array.isArray(body.orders)
      ? body.orders
      : body.order
      ? [body.order]
      : [];

    incomingOrders.forEach((order) => {
      if (order && order.id) {
        addGlobalOrder(order);
      }
    });

    return NextResponse.json({
      success: true,
      count: getGlobalOrders().length,
      orders: getGlobalOrders(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 });
  }
}

// Reset/clear all orders instantly
export async function DELETE() {
  try {
    // 1. Reset memory and disk cache instantly
    setGlobalOrders([]);

    // 2. Clear Firestore orders collection in background (non-blocking)
    try {
      if (db) {
        getDocs(collection(db, 'orders'))
          .then((snap) => {
            snap.docs.forEach((d) => {
              deleteDoc(doc(db, 'orders', d.id)).catch(() => {});
            });
          })
          .catch(() => {});
      }
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'All orders have been reset',
      orders: [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reset orders' }, { status: 500 });
  }
}
