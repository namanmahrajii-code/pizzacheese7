import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getGlobalOffers } from '@/lib/offersStore';
import { OfferItem } from '@/lib/data';

export async function GET() {
  try {
    if (db) {
      const colRef = collection(db, 'offers');
      const q = query(
        colRef,
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const offers: OfferItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || '',
            description: data.description || '',
            promoCode: data.promoCode || undefined,
            isActive: true,
            createdAt: data.createdAt || new Date().toISOString(),
          };
        });

        // Sort by createdAt descending
        offers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ offers });
      }
    }
  } catch (err) {
    console.warn('Firestore active offers query fallback:', err);
  }

  // Fallback to active in-memory offers
  const activeOffers = getGlobalOffers().filter((o) => o.isActive !== false);

  return NextResponse.json({
    offers: activeOffers,
  });
}
