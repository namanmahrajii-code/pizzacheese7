import { NextResponse } from 'next/server';
import { getGlobalProducts, getGlobalCategories, getGlobalBanners } from '@/lib/menuStore';

export async function GET() {
  const categories = getGlobalCategories();
  const products = getGlobalProducts();
  const banners = getGlobalBanners();

  return NextResponse.json({
    categories,
    products,
    banners,
  });
}
