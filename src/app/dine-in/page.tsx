'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Header from '@/components/Header';
import BannerCarousel from '@/components/BannerCarousel';
import CategoryScroll from '@/components/CategoryScroll';
import FilterBar from '@/components/FilterBar';
import ProductCard from '@/components/ProductCard';
import ModifierModal from '@/components/ModifierModal';
import CartDrawer from '@/components/CartDrawer';
import BottomNav from '@/components/BottomNav';
import OrderStatusModal from '@/components/OrderStatusModal';
import ActiveOrderTracking from '@/components/ActiveOrderTracking';
import {
  ProductItem,
  CategoryItem,
  BannerItem,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
} from '@/lib/data';
import { useCartStore } from '@/store/cartStore';
import { Sparkles, Utensils, UtensilsCrossed } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function DineInContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams?.get('table') || '';
  const trackingParam = searchParams?.get('tracking') === 'true';
  const orderIdParam = searchParams?.get('orderId') || '';

  const { setDeliveryMode, setCustomerInfo } = useCartStore();

  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState<BannerItem[]>(INITIAL_BANNERS);

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegFilter, setVegFilter] = useState<boolean | null>(null); // null = all, true = veg, false = non-veg
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNavTab, setActiveNavTab] = useState<'menu' | 'deals' | 'orders' | 'cart' | 'profile'>('menu');

  // Modals
  const [customizingProduct, setCustomizingProduct] = useState<ProductItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isOrderStatusOpen, setIsOrderStatusOpen] = useState<boolean>(false);

  // Active Order Live Tracking state
  const [recoveredOrderId, setRecoveredOrderId] = useState<string | null>(null);
  const [isViewingTracking, setIsViewingTracking] = useState<boolean>(false);

  // Lock to Dine-in mode and prefill table if present in QR code url
  useEffect(() => {
    setDeliveryMode('Dine-in');
    if (tableParam) {
      setCustomerInfo({ tableNumber: tableParam });
    }
  }, [tableParam, setDeliveryMode, setCustomerInfo]);

  // Check for active order or tracking url params
  useEffect(() => {
    try {
      const savedId = orderIdParam || localStorage.getItem('activeOrderId');
      if (savedId) {
        setRecoveredOrderId(savedId);
        if (trackingParam || orderIdParam) {
          setIsViewingTracking(true);
        }
      }
    } catch {}
  }, [trackingParam, orderIdParam]);

  // Fetch live menu from API
  useEffect(() => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (data.products) setProducts(data.products);
        if (data.banners) setBanners(data.banners);
      })
      .catch((err) => console.log('Using pre-populated 7Cheese menu items'));
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== 'all' && product.categorySlug !== selectedCategory) {
        return false;
      }
      if (vegFilter !== null && product.isVeg !== vegFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, vegFilter, searchQuery]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery.trim() !== '') {
      return [{ title: 'Results', slug: 'results', icon: '🔍', items: filteredProducts }];
    }

    const groups: { title: string; slug: string; icon: string; items: ProductItem[] }[] = [];
    categories.forEach((cat) => {
      const items = filteredProducts.filter((p) => p.categorySlug === cat.slug);
      if (items.length > 0) {
        groups.push({
          title: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          items,
        });
      }
    });
    return groups;
  }, [filteredProducts, categories, selectedCategory, searchQuery]);

  const handleOrderPlaced = (orderId: string) => {
    setActiveOrderId(orderId);
    setRecoveredOrderId(orderId);
    setIsViewingTracking(true);
  };

  // If user clicked View Live Status, display full ActiveOrderTracking component!
  if (isViewingTracking && recoveredOrderId) {
    return (
      <ActiveOrderTracking
        orderId={recoveredOrderId}
        onBackToMenu={() => setIsViewingTracking(false)}
        onOrderFinished={() => {
          try {
            localStorage.removeItem('activeOrderId');
            localStorage.removeItem('activeOrderData');
          } catch {}
          setRecoveredOrderId(null);
          setIsViewingTracking(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-28">
      {/* 1. Header with Table QR Mode indicator */}
      <Header onSearchChange={(q) => setSearchQuery(q)} />

      {/* Table Welcome Banner */}
      <div className="px-4 pt-3 pb-1">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-3 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0">
              🍽️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-black text-xs sm:text-sm leading-tight">
                  Welcome to 7Cheese Table Ordering!
                </h2>
                {tableParam && (
                  <span className="bg-white text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                    Table #{tableParam.replace(/^table\s*/i, '')}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-100 mt-0.5 leading-tight">
                Order directly from your phone. Kitchen prepares and serves hot to your table.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Banner Offers Carousel */}
      <div className="pt-2">
        <BannerCarousel banners={banners} />
      </div>

      {/* 3. Circular Category Navigation */}
      <div className="sticky top-[110px] z-20 bg-slate-50/95 backdrop-blur-md pt-2 pb-1 border-b border-gray-200/50 shadow-2xs">
        <CategoryScroll
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => setSelectedCategory(slug)}
        />
      </div>

      {/* 4. Filter Bar (Veg / Non-Veg / Bestsellers) */}
      <FilterBar
        vegFilter={vegFilter}
        onToggleVegFilter={(val) => setVegFilter(val)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(slug) => setSelectedCategory(slug)}
      />

      {/* 5. Menu Catalog Feed */}
      <main className="px-3.5 pt-2 space-y-6 max-w-4xl mx-auto">
        {groupedProducts.map((group) => (
          <section key={group.slug} className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 pt-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{group.icon}</span>
                <h2 className="font-black text-base text-gray-900 tracking-tight">
                  {group.title}
                </h2>
                <span className="text-xs font-bold text-gray-400">
                  ({group.items.length})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {group.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenCustomizer={(p) => setCustomizingProduct(p)}
                />
              ))}
            </div>
          </section>
        ))}

        {groupedProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="font-black text-gray-700 text-sm">No items found</h3>
            <p className="text-xs text-gray-500 mt-1">Try resetting your search or veg/non-veg filter</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setVegFilter(null);
                setSearchQuery('');
              }}
              className="mt-4 bg-[#002855] text-white font-bold text-xs px-4 py-2 rounded-full shadow-xs"
            >
              Show All Menu Items
            </button>
          </div>
        )}
      </main>

      {/* 6. Customization Modifier Bottom Sheet Modal */}
      {customizingProduct && (
        <ModifierModal
          product={customizingProduct}
          isOpen={!!customizingProduct}
          onClose={() => setCustomizingProduct(null)}
        />
      )}

      {/* 7. Cart / Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* 8. Live Order Status Modal */}
      {activeOrderId && (
        <OrderStatusModal
          orderId={activeOrderId}
          isOpen={isOrderStatusOpen}
          onClose={() => setIsOrderStatusOpen(false)}
        />
      )}

      {/* 9. Fixed Bottom Navigation with Live Order Tab & Floating Strip */}
      <BottomNav
        activeTab={isViewingTracking ? 'orders' : activeNavTab}
        activeOrderId={recoveredOrderId}
        onOpenTracking={() => setIsViewingTracking(true)}
        onSelectTab={(tab) => {
          if (tab === 'orders') {
            setIsViewingTracking(true);
          } else {
            setActiveNavTab(tab);
            if (tab === 'cart') setIsCartOpen(true);
          }
        }}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}

export default function DineInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 border-4 border-[#002855] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-600">Loading Table Ordering Menu...</p>
          </div>
        </div>
      }
    >
      <DineInContent />
    </Suspense>
  );
}
