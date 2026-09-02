import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, orderBy, query } from 'firebase/firestore';
import {
  getGlobalOffers,
  addGlobalOffer,
  setGlobalOffers,
} from '@/lib/offersStore';
import { OfferItem } from '@/lib/data';

export async function GET() {
  try {
    if (db) {
      const colRef = collection(db, 'offers');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const offers: OfferItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || '',
            description: data.description || '',
            promoCode: data.promoCode || undefined,
            isActive: data.isActive !== false,
            createdAt: data.createdAt || new Date().toISOString(),
          };
        });
        setGlobalOffers(offers);
        return NextResponse.json({ offers });
      }
    }
  } catch (err) {
    console.warn('Firestore offers query fallback:', err);
  }

  return NextResponse.json({
    offers: getGlobalOffers(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, promoCode, isActive } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Offer Title and Description are required' },
        { status: 400 }
      );
    }

    const newOffer: OfferItem = {
      id: `off-${Date.now()}`,
      title: String(title).trim(),
      description: String(description).trim(),
      promoCode: promoCode ? String(promoCode).trim().toUpperCase() : undefined,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    };

    // Save to global in-memory
    const created = addGlobalOffer(newOffer);

    // Save to Firestore
    try {
      if (db) {
        await setDoc(doc(db, 'offers', newOffer.id), newOffer);
      }
    } catch (fsErr) {
      console.warn('Firestore offer creation fallback:', fsErr);
    }

    return NextResponse.json({
      success: true,
      offer: created,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create offer' },
      { status: 500 }
    );
  }
}
