import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getOrderById, updateGlobalOrder } from '@/lib/orderStore';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
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

    // 1. Update in central orderStore
    const updated = updateGlobalOrder(id, { status });

    // 2. Sync to Firestore if available (non-blocking)
    try {
      if (db) {
        setDoc(doc(db, 'orders', id), { status }, { merge: true }).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore status update fallback:', e);
    }

    return NextResponse.json({
      success: true,
      id,
      status,
      order: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
