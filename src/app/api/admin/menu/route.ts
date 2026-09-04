import { NextResponse } from 'next/server';
import {
  getGlobalProducts,
  getGlobalCategories,
  addGlobalProduct,
  updateGlobalProduct,
  deleteGlobalProduct,
} from '@/lib/menuStore';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export async function GET() {
  const categories = getGlobalCategories();
  const products = getGlobalProducts();

  return NextResponse.json({
    categories,
    products,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, prices, categorySlug, isVeg, badge, image } = body;

    if (!name || !price || !categorySlug) {
      return NextResponse.json({ error: 'Name, price and category are required' }, { status: 400 });
    }

    const newProduct = {
      id: `prod-${Date.now()}`,
      name,
      description: description || '',
      price: Number(price),
      prices: prices ? {
        Regular: Number(prices.Regular || price),
        Medium: Number(prices.Medium || Number(price) + 150),
        Large: Number(prices.Large || Number(price) + 250),
      } : undefined,
      image: image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
      isVeg: isVeg !== false,
      badge: badge || undefined,
      categorySlug,
      inStock: true,
      isCustomizable: categorySlug === 'veg-pizzas' || categorySlug === 'non-veg-pizzas',
    };

    const created = addGlobalProduct(newProduct);

    // Sync to Firestore if available
    try {
      if (db) {
        await setDoc(doc(db, 'menu', newProduct.id), newProduct);
      }
    } catch (fsErr) {
      console.warn('Firestore menu creation fallback:', fsErr);
    }

    return NextResponse.json({ success: true, product: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const updated = updateGlobalProduct(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Sync to Firestore if available
    try {
      if (db) {
        await setDoc(doc(db, 'menu', id), updated, { merge: true });
      }
    } catch (fsErr) {
      console.warn('Firestore menu update fallback:', fsErr);
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {
        // ignore body parse error if not json
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const success = deleteGlobalProduct(id);

    try {
      if (db) {
        await deleteDoc(doc(db, 'menu', id));
      }
    } catch (fsErr) {
      console.warn('Firestore menu delete fallback:', fsErr);
    }

    return NextResponse.json({ success, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 });
  }
}
