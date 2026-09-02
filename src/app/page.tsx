'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Header from '@/components/Header';
import OffersBanner from '@/components/OffersBanner';
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
import { Sparkles, Utensils, Award, Info, Heart } from 'lucide-react';

function HomeContent() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState<BannerItem[]>(INITIAL_BANNERS);

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vegFilter, setVegFilter] = useState<boolean | null>(null); // null = all, true = veg, false = non-veg
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNavTab, setActiveNavTab] = useState<'menu' | 'deals' | 'cart' | 'profile'>('menu');

  // Modals
  const [customizingProduct, setCustomizingProduct] = useState<ProductItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isOrderStatusOpen, setIsOrderStatusOpen] = useState<boolean>(false);
  const [recoveredOrderId, setRecoveredOrderId] = useState<string | null>(null);
  const [isViewingTracking, setIsViewingTracking] = useState<boolean>(false);

  const { setDeliveryMode } = useCartStore();

  // Force Delivery mode when on the Home Page
  useEffect(() => {
    setDeliveryMode('Delivery');
  }, [setDeliveryMode]);

  // Auto-Recover Order on Page Load:
  // Runs on mount to check for an active order: const savedOrderId = localStorage.getItem('activeOrderId')
  useEffect(() => {
    try {
      const savedOrderId = localStorage.getItem('activeOrderId');
      if (savedOrderId) {
        setRecoveredOrderId(savedOrderId);
        setIsViewingTracking(true);
      }
    } catch (e) {
      console.warn('Could not read activeOrderId from localStorage:', e);
    }
  }, []);

  // Fetch live menu from API (with instant static data already pre-loaded)
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
      // Category filter
      if (selectedCategory !== 'all' && product.categorySlug !== selectedCategory) {
        return false;
      }
      // Veg / Non-Veg filter
      if (vegFilter !== null && product.isVeg !== vegFilter) {
        return false;
      }
      // Search filter
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

  // Group products by category for clean section headers
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
    setIsOrderStatusOpen(true);
  };

  const handleSelectNavTab = (tab: 'menu' | 'deals' | 'cart' | 'profile') => {
    setActiveNavTab(tab);
    if (tab === 'cart') {
      setIsCartOpen(true);
    } else if (tab === 'deals') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If user is viewing active order, display the 'Order Tracking / Active Order' UI.
  if (isViewingTracking && recoveredOrderId) {
    return (
      <ActiveOrderTracking
        orderId={recoveredOrderId}
        onBackToMenu={() => setIsViewingTracking(false)}
        onOrderFinished={() => {
          try {
            localStorage.removeItem('activeOrderId');
            localStorage.removeItem('activeOrderData');
          } catch (e) {}
          setRecoveredOrderId(null);
          setIsViewingTracking(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-gray-900 pb-28">
      {/* Mobile-sized container constraint */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        {/* Header with Location & Delivery Mode */}
        <Header
          onSearchChange={(q) => setSearchQuery(q)}
          onOpenProfile={() => setIsCartOpen(true)}
        />

        {/* Dynamic Live Offers & Promos Banner */}
        <OffersBanner onApplyCoupon={() => setIsCartOpen(true)} />

        {/* Hero Banner Carousel (Domino's Style) */}
        <BannerCarousel
          banners={banners}
          onApplyCoupon={() => setIsCartOpen(true)}
        />

        {/* Circular Categories List ("What are you craving for?") */}
        <CategoryScroll
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            setSelectedCategory(slug);
            setSearchQuery('');
          }}
        />

        {/* Veg/Non-Veg Filter Bar & Category Chips */}
        <FilterBar
          vegFilter={vegFilter}
          onToggleVegFilter={(val) => setVegFilter(val)}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => setSelectedCategory(slug)}
        />

        {/* Product Cards Feed */}
        <main className="px-4 py-4 space-y-6">
          {groupedProducts.map((group) => (
            <section key={group.title} className="space-y-3">
              {group.title !== 'Results' && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{group.icon || '🍕'}</span>
                    <h2 className="text-base font-black text-gray-900 tracking-tight">
                      {group.title}
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-gray-400">
                    {group.items.length} options
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {group.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenCustomizer={(prod) => setCustomizingProduct(prod)}
                  />
                ))}
              </div>
            </section>
          ))}

          {filteredProducts.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                🔍
              </div>
              <h3 className="font-extrabold text-base text-gray-800">No items found</h3>
              <p className="text-xs text-gray-500 mt-1">Try changing your filters or search keywords</p>
              <button
                onClick={() => {
                  setVegFilter(null);
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-3 bg-[#002855] text-white text-xs font-bold px-4 py-2 rounded-full"
              >
                Reset Filters
              </button>
            </div>
          )}
        </main>

        {/* Footer Brand Banner */}
        <footer className="px-4 py-6 bg-gray-50 border-t border-gray-100 text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">🧀</span>
            <span className="font-black text-base text-[#002855]">7Cheese Pizza</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Handcrafted with 100% real dairy mozzarella and love.
          </p>
          <div className="pt-2 text-[10px] text-gray-400 flex items-center justify-center space-x-3">
            <span>FSSAI Lic No. 10019011002345</span>
            <span>•</span>
            <span>Domino's-Inspired UX</span>
          </div>
        </footer>

        {/* Bottom Floating Cart Bar & Fixed Navigation */}
        <BottomNav
          activeTab={isViewingTracking ? 'orders' : activeNavTab}
          activeOrderId={recoveredOrderId}
          onOpenTracking={() => setIsViewingTracking(true)}
          onSelectTab={(tab) => {
            if (tab === 'orders') {
              setIsViewingTracking(true);
            } else {
              handleSelectNavTab(tab as any);
            }
          }}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* Modifiers Bottom Sheet Modal */}
        <ModifierModal
          product={customizingProduct}
          isOpen={!!customizingProduct}
          onClose={() => setCustomizingProduct(null)}
        />

        {/* Cart & Checkout Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onOrderPlaced={handleOrderPlaced}
        />

        {/* Order Status Timeline Tracker Modal */}
        <OrderStatusModal
          orderId={activeOrderId}
          isOpen={isOrderStatusOpen}
          onClose={() => setIsOrderStatusOpen(false)}
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 border-4 border-[#002855] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-600">Loading 7Cheese Pizza...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
