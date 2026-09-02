import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { addGlobalOrder, getGlobalOrders, OrderData } from '@/lib/orderStore';

export async function GET() {
  return NextResponse.json({
    orders: getGlobalOrders(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryType,
      orderType,
      tableNumber,
      paymentMethod,
      totalAmount,
      items,
      coordinates,
    } = body;

    const resolvedOrderType: 'Delivery' | 'Dine-in' =
      orderType === 'Dine-in' || deliveryType === 'Dine-in' ? 'Dine-in' : 'Delivery';

    const resolvedPaymentMethod: string =
      paymentMethod ||
      (resolvedOrderType === 'Dine-in' ? 'Pay at Counter' : 'Pay on Delivery');

    const newOrderId =
      body.id || body.orderId || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: OrderData = {
      id: newOrderId,
      customerName: customerName
        ? String(customerName).trim()
        : resolvedOrderType === 'Dine-in'
        ? 'Dine-in Customer'
        : 'Valued Customer',
      customerPhone:
        resolvedOrderType === 'Dine-in'
          ? 'N/A'
          : customerPhone
          ? String(customerPhone).trim()
          : 'N/A',
      deliveryAddress:
        resolvedOrderType === 'Dine-in'
          ? tableNumber
            ? `Table #${tableNumber} (Dine-in)`
            : 'Dine-in Table Order'
          : deliveryAddress
          ? String(deliveryAddress).trim()
          : 'Kaladhungi Road, Haldwani (263139)',
      deliveryType: resolvedOrderType,
      orderType: resolvedOrderType,
      tableNumber: resolvedOrderType === 'Dine-in' ? tableNumber || null : null,
      paymentMethod: resolvedPaymentMethod,
      totalAmount: Number(totalAmount) || 0,
      status: body.status || 'Pending',
      coordinates:
        resolvedOrderType === 'Delivery' &&
        coordinates &&
        typeof coordinates.lat === 'number' &&
        typeof coordinates.lng === 'number'
          ? { lat: coordinates.lat, lng: coordinates.lng }
          : null,
      createdAt: body.createdAt || new Date().toISOString(),
      items: (items || []).map((it: any, idx: number) => ({
        id: it.id || `item-${Date.now()}-${idx}`,
        name: it.name,
        size: it.size || 'Regular',
        crust: it.crust || 'Standard',
        quantity: it.quantity || 1,
        price: it.price || 0,
      })),
    };

    // 1. Save to central persistent order store
    addGlobalOrder(newOrder);

    // 2. Try saving order to Firestore if online
    try {
      if (db) {
        await setDoc(doc(db, 'orders', newOrderId), newOrder, { merge: true });
      }
    } catch (fsErr) {
      console.warn('Firestore order save fallback:', fsErr);
    }

    return NextResponse.json({
      success: true,
      orderId: newOrderId,
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
