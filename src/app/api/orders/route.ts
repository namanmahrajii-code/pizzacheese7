import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Global in-memory order store fallback for instant reactivity
declare global {
  var __GLOBAL_ORDERS__: Array<any> | undefined;
}

if (!globalThis.__GLOBAL_ORDERS__) {
  globalThis.__GLOBAL_ORDERS__ = [
    {
      id: 'ORD-70192',
      customerName: 'Aarav Sharma',
      customerPhone: '+91 98765 43210',
      deliveryAddress: 'Flat 402, Green Valley Apartments, Kaladhungi Road, Haldwani',
      deliveryType: 'Delivery',
      orderType: 'Delivery',
      tableNumber: null,
      totalAmount: 437,
      status: 'Preparing',
      coordinates: {
        lat: 29.2183,
        lng: 79.5130,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      items: [
        {
          id: 'i1',
          name: 'Peppy Paneer',
          size: 'Regular',
          crust: 'Cheese Burst',
          quantity: 1,
          price: 279,
        },
        {
          id: 'i2',
          name: 'Garlic Bread (Veg)',
          size: 'Standard',
          crust: 'Standard',
          quantity: 2,
          price: 158,
        },
      ],
    },
    {
      id: 'ORD-70193',
      customerName: 'Priya Patel',
      customerPhone: '+91 91234 56789',
      deliveryAddress: 'Table #04 (Dine-in at 7Cheese Pizza Haldwani)',
      deliveryType: 'Dine-in',
      orderType: 'Dine-in',
      tableNumber: '04',
      totalAmount: 648,
      status: 'Pending',
      coordinates: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      items: [
        {
          id: 'i3',
          name: 'Chicken Supremo',
          size: 'Medium',
          crust: 'Cheese Burst',
          quantity: 1,
          price: 529,
        },
        {
          id: 'i4',
          name: 'Choco Lava Cake',
          size: 'Standard',
          crust: 'Standard',
          quantity: 1,
          price: 119,
        },
      ],
    },
  ];
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

    const resolvedPaymentMethod: 'COD' | 'UPI' = paymentMethod === 'UPI' ? 'UPI' : 'COD';

    const newOrderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder = {
      id: newOrderId,
      customerName: customerName ? String(customerName).trim() : (resolvedOrderType === 'Dine-in' ? 'Dine-in Customer' : 'Valued Customer'),
      customerPhone: resolvedOrderType === 'Dine-in' ? 'N/A' : (customerPhone ? String(customerPhone).trim() : 'N/A'),
      deliveryAddress:
        resolvedOrderType === 'Dine-in'
          ? (tableNumber ? `Table #${tableNumber} (Dine-in)` : 'Dine-in Table Order')
          : (deliveryAddress ? String(deliveryAddress).trim() : 'Kaladhungi Road, Haldwani (263139)'),
      deliveryType: resolvedOrderType,
      orderType: resolvedOrderType,
      tableNumber: resolvedOrderType === 'Dine-in' ? (tableNumber || null) : null,
      paymentMethod: resolvedPaymentMethod,
      totalAmount: Number(totalAmount) || 0,
      status: 'Pending',
      coordinates: resolvedOrderType === 'Delivery' && coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number'
        ? { lat: coordinates.lat, lng: coordinates.lng }
        : null,
      createdAt: new Date().toISOString(),
      items: (items || []).map((it: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        name: it.name,
        size: it.size || 'Regular',
        crust: it.crust || 'Standard',
        quantity: it.quantity || 1,
        price: it.price || 0,
      })),
    };

    // 1. Try saving order to Firestore (Schema: orderType: 'Delivery' | 'Dine-in', coordinates: { lat, lng } | null)
    try {
      if (db) {
        await setDoc(doc(db, 'orders', newOrderId), {
          ...newOrder,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (fsErr) {
      console.warn('Firestore order save fallback:', fsErr);
    }

    // 2. Try saving to Prisma DB
    try {
      await prisma.order.create({
        data: {
          id: newOrder.id,
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          deliveryAddress: newOrder.deliveryAddress,
          deliveryType: newOrder.deliveryType,
          totalAmount: newOrder.totalAmount,
          status: newOrder.status,
          items: {
            create: newOrder.items.map((it: any) => ({
              name: it.name,
              size: it.size,
              crust: it.crust,
              quantity: it.quantity,
              price: it.price,
              productId: 'vp-margherita',
            })),
          },
        },
      });
    } catch (dbErr) {
      console.warn('Prisma order save fallback to memory:', dbErr);
    }

    // 3. Save to global in-memory list for instant reactive retrieval
    globalThis.__GLOBAL_ORDERS__?.unshift(newOrder);

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
