import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { addGlobalOrder, getGlobalOrders, setGlobalOrders, OrderData } from '@/lib/orderStore';

export async function GET() {
  try {
    if (db) {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const fsOrders: OrderData[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }));

        // Merge with local store to ensure no orders are missing
        fsOrders.forEach((o) => addGlobalOrder(o));
        return NextResponse.json({ orders: getGlobalOrders() });
      }
    }
  } catch (fsErr) {
    console.warn('Firestore orders query fallback to orderStore:', fsErr);
  }

  // Return central persistent orders
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

// Reset/clear all orders
export async function DELETE() {
  try {
    // 1. Reset memory and disk cache
    setGlobalOrders([]);

    // 2. Clear Firestore orders collection if online
    try {
      if (db) {
        const ordersRef = collection(db, 'orders');
        const snap = await getDocs(ordersRef);
        const batchDeletes = snap.docs.map((d) => deleteDoc(doc(db, 'orders', d.id)));
        await Promise.all(batchDeletes);
      }
    } catch (e) {
      console.warn('Firestore orders reset fallback:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'All orders have been reset',
      orders: [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reset orders' }, { status: 500 });
  }
}
