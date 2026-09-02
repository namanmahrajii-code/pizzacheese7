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

if (!globalThis.__GLOBAL_ORDERS__) {
  const diskOrders = loadOrdersFromDisk();
  globalThis.__GLOBAL_ORDERS__ = diskOrders || [];
}

export function getGlobalOrders(): OrderData[] {
  if (!globalThis.__GLOBAL_ORDERS__) {
    const diskOrders = loadOrdersFromDisk();
    globalThis.__GLOBAL_ORDERS__ = diskOrders || [];
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
