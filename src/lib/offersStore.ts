import { INITIAL_OFFERS, OfferItem } from './data';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

declare global {
  var __GLOBAL_OFFERS__: OfferItem[] | undefined;
}

if (!globalThis.__GLOBAL_OFFERS__) {
  globalThis.__GLOBAL_OFFERS__ = [...INITIAL_OFFERS];
}

export function getGlobalOffers(): OfferItem[] {
  return globalThis.__GLOBAL_OFFERS__ || INITIAL_OFFERS;
}

export function setGlobalOffers(offers: OfferItem[]) {
  globalThis.__GLOBAL_OFFERS__ = offers;
}

export function addGlobalOffer(offer: OfferItem): OfferItem {
  if (!globalThis.__GLOBAL_OFFERS__) {
    globalThis.__GLOBAL_OFFERS__ = [...INITIAL_OFFERS];
  }
  globalThis.__GLOBAL_OFFERS__.unshift(offer);
  return offer;
}

export function updateGlobalOffer(id: string, updates: Partial<OfferItem>): OfferItem | null {
  if (!globalThis.__GLOBAL_OFFERS__) {
    globalThis.__GLOBAL_OFFERS__ = [...INITIAL_OFFERS];
  }
  const idx = globalThis.__GLOBAL_OFFERS__.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  globalThis.__GLOBAL_OFFERS__[idx] = {
    ...globalThis.__GLOBAL_OFFERS__[idx],
    ...updates,
  };
  return globalThis.__GLOBAL_OFFERS__[idx];
}

export function deleteGlobalOffer(id: string): boolean {
  if (!globalThis.__GLOBAL_OFFERS__) return false;
  const initialLength = globalThis.__GLOBAL_OFFERS__.length;
  globalThis.__GLOBAL_OFFERS__ = globalThis.__GLOBAL_OFFERS__.filter((o) => o.id !== id);
  return globalThis.__GLOBAL_OFFERS__.length < initialLength;
}
