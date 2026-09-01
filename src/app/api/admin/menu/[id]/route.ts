import { NextResponse } from 'next/server';
import { updateGlobalProduct, deleteGlobalProduct } from '@/lib/menuStore';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = updateGlobalProduct(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    try {
      if (db) {
        await setDoc(doc(db, 'menu', id), updated, { merge: true });
      }
    } catch (fsErr) {
      console.warn('Firestore menu patch fallback:', fsErr);
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to patch product' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteGlobalProduct(id);

    try {
      if (db) {
        await deleteDoc(doc(db, 'menu', id));
      }
    } catch (fsErr) {
      console.warn('Firestore menu delete fallback:', fsErr);
    }

    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 });
  }
}
