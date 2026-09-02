import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getOrderById, updateGlobalOrder } from '@/lib/orderStore';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Check central orderStore
    const order = getOrderById(id);
    if (order) {
      return NextResponse.json({ success: true, order });
    }

    // 2. Check Firestore
    try {
      if (db) {
        const snap = await getDoc(doc(db, 'orders', id));
        if (snap.exists()) {
          const fsOrder = { id: snap.id, ...snap.data() };
          return NextResponse.json({ success: true, order: fsOrder });
        }
      }
    } catch (fsErr) {
      console.warn('Firestore single order query fallback:', fsErr);
    }

    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching order' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updated = updateGlobalOrder(id, { status });

    // Sync to Firestore (non-blocking)
    try {
      if (db) {
        setDoc(doc(db, 'orders', id), { status }, { merge: true }).catch(() => {});
      }
    } catch (fsErr) {
      console.warn('Firestore status update fallback:', fsErr);
    }

    return NextResponse.json({
      success: true,
      id,
      status,
      order: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update order' }, { status: 500 });
  }
}
