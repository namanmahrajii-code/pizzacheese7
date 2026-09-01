import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_BANNERS, ProductItem, CategoryItem, BannerItem } from './data';

declare global {
  var __GLOBAL_PRODUCTS__: ProductItem[] | undefined;
  var __GLOBAL_CATEGORIES__: CategoryItem[] | undefined;
  var __GLOBAL_BANNERS__: BannerItem[] | undefined;
}

if (!globalThis.__GLOBAL_PRODUCTS__) {
  globalThis.__GLOBAL_PRODUCTS__ = INITIAL_PRODUCTS.map((p) => ({
    ...p,
    inStock: p.inStock !== false, // default true
  }));
}

if (!globalThis.__GLOBAL_CATEGORIES__) {
  globalThis.__GLOBAL_CATEGORIES__ = [...INITIAL_CATEGORIES];
}

if (!globalThis.__GLOBAL_BANNERS__) {
  globalThis.__GLOBAL_BANNERS__ = [...INITIAL_BANNERS];
}

export function getGlobalProducts(): ProductItem[] {
  return globalThis.__GLOBAL_PRODUCTS__ || INITIAL_PRODUCTS;
}

export function getGlobalCategories(): CategoryItem[] {
  return globalThis.__GLOBAL_CATEGORIES__ || INITIAL_CATEGORIES;
}

export function getGlobalBanners(): BannerItem[] {
  return globalThis.__GLOBAL_BANNERS__ || INITIAL_BANNERS;
}

export function updateGlobalProduct(id: string, updates: Partial<ProductItem>): ProductItem | null {
  if (!globalThis.__GLOBAL_PRODUCTS__) {
    globalThis.__GLOBAL_PRODUCTS__ = [...INITIAL_PRODUCTS];
  }
  const idx = globalThis.__GLOBAL_PRODUCTS__.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  globalThis.__GLOBAL_PRODUCTS__[idx] = {
    ...globalThis.__GLOBAL_PRODUCTS__[idx],
    ...updates,
  };
  return globalThis.__GLOBAL_PRODUCTS__[idx];
}

export function toggleProductStock(id: string, inStock: boolean): ProductItem | null {
  return updateGlobalProduct(id, { inStock });
}

export function addGlobalProduct(product: ProductItem): ProductItem {
  if (!globalThis.__GLOBAL_PRODUCTS__) {
    globalThis.__GLOBAL_PRODUCTS__ = [...INITIAL_PRODUCTS];
  }
  globalThis.__GLOBAL_PRODUCTS__.unshift(product);
  return product;
}

export function deleteGlobalProduct(id: string): boolean {
  if (!globalThis.__GLOBAL_PRODUCTS__) return false;
  const initialLength = globalThis.__GLOBAL_PRODUCTS__.length;
  globalThis.__GLOBAL_PRODUCTS__ = globalThis.__GLOBAL_PRODUCTS__.filter((p) => p.id !== id);
  return globalThis.__GLOBAL_PRODUCTS__.length < initialLength;
}
