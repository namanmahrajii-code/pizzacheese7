import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import {
  updateGlobalOffer,
  deleteGlobalOffer,
  getGlobalOffers,
} from '@/lib/offersStore';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = getGlobalOffers().find((o) => o.id === id);
    const updates: any = {};

    if (typeof body.title === 'string') updates.title = body.title.trim();
    if (typeof body.description === 'string') updates.description = body.description.trim();
    if (body.promoCode !== undefined) {
      updates.promoCode = body.promoCode ? String(body.promoCode).trim().toUpperCase() : undefined;
    }
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;

    const updated = updateGlobalOffer(id, updates);

    // Sync to Firestore
    try {
      if (db) {
        await setDoc(doc(db, 'offers', id), updates, { merge: true });
      }
    } catch (fsErr) {
      console.warn('Firestore offer update fallback:', fsErr);
    }

    return NextResponse.json({
      success: true,
      offer: updated || { id, ...existing, ...updates },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update offer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    deleteGlobalOffer(id);

    // Delete from Firestore
    try {
      if (db) {
        await deleteDoc(doc(db, 'offers', id));
      }
    } catch (fsErr) {
      console.warn('Firestore offer delete fallback:', fsErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully',
      deletedId: id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete offer' },
      { status: 500 }
    );
  }
}
