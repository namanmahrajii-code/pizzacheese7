import fs from 'fs';
import path from 'path';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface OrderItem {
  id: string;
  name: string;
  size?: string;
  crust?: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  id: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryType?: 'Delivery' | 'Dine-in' | string;
  orderType?: 'Delivery' | 'Dine-in' | string;
  tableNumber?: string | null;
  paymentMethod?: string;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  deliveryFee?: number;
  packagingFee?: number;
  status: 'Pending' | 'Preparing' | 'Dispatched' | 'Delivered' | 'Cancelled' | 'Completed' | string;
  coordinates?: { lat: number; lng: number } | null;
  items: OrderItem[];
  createdAt: string;
}

declare global {
  var __GLOBAL_ORDERS__: OrderData[] | undefined;
}

// Fallback file path for persistent caching on server
const CACHE_FILE = path.join(process.cwd(), '.orders-cache.json');
const TMP_CACHE_FILE = path.join('/tmp', 'orders-cache.json');

function getActiveCachePath(): string {
  try {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return TMP_CACHE_FILE;
    }
    return CACHE_FILE;
  } catch {
    return CACHE_FILE;
  }
}

function loadOrdersFromDisk(): OrderData[] | null {
  try {
    const p = getActiveCachePath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Disk read fallback
  }
  return null;
}

function saveOrdersToDisk(orders: OrderData[]) {
  try {
    const p = getActiveCachePath();
    fs.writeFileSync(p, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {
    // Disk write fallback
  }
}

// Default initial orders
const INITIAL_DEMO_ORDERS: OrderData[] = [
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
    coordinates: { lat: 29.2183, lng: 79.513 },
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    items: [
      { id: 'i1', name: 'Peppy Paneer', size: 'Regular', crust: 'Cheese Burst', quantity: 1, price: 279 },
      { id: 'i2', name: 'Garlic Bread (Veg)', size: 'Standard', crust: 'Standard', quantity: 2, price: 158 },
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
      { id: 'i3', name: 'Chicken Supremo', size: 'Medium', crust: 'Cheese Burst', quantity: 1, price: 529 },
      { id: 'i4', name: 'Choco Lava Cake', size: 'Standard', crust: 'Standard', quantity: 1, price: 119 },
    ],
  },
];

if (!globalThis.__GLOBAL_ORDERS__) {
  const diskOrders = loadOrdersFromDisk();
  globalThis.__GLOBAL_ORDERS__ = diskOrders || [...INITIAL_DEMO_ORDERS];
}

export function getGlobalOrders(): OrderData[] {
  if (!globalThis.__GLOBAL_ORDERS__ || globalThis.__GLOBAL_ORDERS__.length === 0) {
    const diskOrders = loadOrdersFromDisk();
    globalThis.__GLOBAL_ORDERS__ = diskOrders || [...INITIAL_DEMO_ORDERS];
  }
  return globalThis.__GLOBAL_ORDERS__;
}

export function getOrderById(id: string): OrderData | null {
  const orders = getGlobalOrders();
  return orders.find((o) => o.id === id) || null;
}

export function addGlobalOrder(order: OrderData): OrderData {
  const orders = getGlobalOrders();
  const existingIdx = orders.findIndex((o) => o.id === order.id);
  if (existingIdx > -1) {
    orders[existingIdx] = { ...orders[existingIdx], ...order };
  } else {
    orders.unshift(order);
  }
  saveOrdersToDisk(orders);

  // Sync to Firestore if available
  try {
    if (db) {
      setDoc(doc(db, 'orders', order.id), order, { merge: true }).catch(() => {});
    }
  } catch {}

  return order;
}

export function updateGlobalOrder(id: string, updates: Partial<OrderData>): OrderData | null {
  const orders = getGlobalOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;

  orders[idx] = {
    ...orders[idx],
    ...updates,
  };
  saveOrdersToDisk(orders);

  // Sync to Firestore if available
  try {
    if (db) {
      setDoc(doc(db, 'orders', id), updates, { merge: true }).catch(() => {});
    }
  } catch {}

  return orders[idx];
}

export function setGlobalOrders(orders: OrderData[]) {
  globalThis.__GLOBAL_ORDERS__ = orders;
  saveOrdersToDisk(orders);
}
