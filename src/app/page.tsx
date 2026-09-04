'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Header from '@/components/Header';
import LocationBanner from '@/components/LocationBanner';
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
import PreLandingPage from '@/components/PreLandingPage';
import AuthModal from '@/components/AuthModal';
import CustomPizzaBuilder from '@/components/CustomPizzaBuilder';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import {
  ProductItem,
  CategoryItem,
  BannerItem,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
} from '@/lib/data';
import { smartSearchProducts } from '@/lib/smartSearch';
import { useCartStore } from '@/store/cartStore';
import { Sparkles, Utensils, Award, Info, Heart, ArrowRight } from 'lucide-react';

import { useSearchParams } from 'next/navigation';

function HomeContent() {
  const searchParams = useSearchParams();
  const trackingParam = searchParams?.get('tracking') === 'true';

  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('7cheese_entered_app') === 'true';
    }
    return false;
  });

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCustomPizzaOpen, setIsCustomPizzaOpen] = useState<boolean>(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isOrderStatusOpen, setIsOrderStatusOpen] = useState<boolean>(false);
  const [recoveredOrderId, setRecoveredOrderId] = useState<string | null>(null);
  const [isViewingTracking, setIsViewingTracking] = useState<boolean>(false);

  const { deliveryMode, setDeliveryMode, addItem } = useCartStore();
  const { currentUser, userProfile, isLoggedIn } = useAuth();
  const { locationStatus } = useLocation();

  // Enforce Firebase Auth after entering app and location selection
  useEffect(() => {
    if (hasEnteredApp && !isLoggedIn) {
      const timer = setTimeout(() => {
        setIsAuthModalOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasEnteredApp, currentUser, userProfile, locationStatus]);

  // Auto-Recover Order on Page Load (Only auto-open tracking if ?tracking=true was requested)
  useEffect(() => {
    try {
      const savedOrderId = localStorage.getItem('activeOrderId');
      if (savedOrderId) {
        setRecoveredOrderId(savedOrderId);
        if (trackingParam) {
          setIsViewingTracking(true);
        }
      }
    } catch (e) {
      console.warn('Could not read activeOrderId from localStorage:', e);
    }
  }, [trackingParam]);

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

  // Smart Search & Filtered Products (Multi-word tokenization, synonyms, fuzzy typos)
  const filteredProducts = useMemo(() => {
    return smartSearchProducts(products, searchQuery, {
      categoryFilter: selectedCategory,
      vegFilter,
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
    setRecoveredOrderId(orderId);
    setIsViewingTracking(true);
  };

  const handleSelectNavTab = (tab: 'menu' | 'deals' | 'orders' | 'cart' | 'profile') => {
    setActiveNavTab(tab);
    if (tab === 'cart') {
      setIsCartOpen(true);
    } else if (tab === 'deals') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'orders') {
      setIsViewingTracking(true);
    }
  };

  // If user has not yet passed the pre-landing screen, show the highlights pre-landing page
  if (!hasEnteredApp) {
    return (
      <PreLandingPage
        onEnterApp={() => {
          setHasEnteredApp(true);
          try {
            sessionStorage.setItem('7cheese_entered_app', 'true');
          } catch {}
        }}
      />
    );
  }

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

        {/* Real-time GPS Detection & Delivery Area Strip */}
        <LocationBanner />

        {/* Dynamic Live Offers & Promos Banner */}
        <OffersBanner onApplyCoupon={() => setIsCartOpen(true)} />

        {/* Returning Customer Welcome Greeting & Previous Order Shortcuts */}
        {isLoggedIn && userProfile && (
          <div className="mx-4 mt-2.5 p-3.5 bg-gradient-to-r from-[#002855] to-[#0a386c] text-white rounded-2xl shadow-md border border-blue-400/20 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">👋</span>
                <div>
                  <span className="font-extrabold text-xs block text-amber-300">
                    Welcome back, {userProfile.name}!
                  </span>
                  <span className="text-[10.5px] text-blue-100">
                    Special VIP discounts automatically active on your cart.
                  </span>
                </div>
              </div>
              <span className="text-[9.5px] font-black bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full uppercase">
                Member
              </span>
            </div>

            {userProfile.pastOrders && userProfile.pastOrders.length > 0 && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="min-w-0 pr-1">
                  <span className="text-[9.5px] uppercase font-bold text-stone-300 block">
                    Quick Reorder:
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {userProfile.pastOrders[0].itemSummary}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const defaultProd = products[0] || INITIAL_PRODUCTS[0];
                    addItem({
                      productId: defaultProd.id,
                      name: defaultProd.name,
                      price: defaultProd.price,
                      basePrice: defaultProd.price,
                      size: 'Medium',
                      crust: 'Classic Hand Tossed',
                      quantity: 1,
                      image: defaultProd.image,
                      isVeg: defaultProd.isVeg,
                    });
                    setIsCartOpen(true);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer transition-transform"
                >
                  1-Tap Reorder
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hero Banner Carousel (Domino's Style) */}
        <BannerCarousel
          banners={banners}
          onApplyCoupon={() => setIsCartOpen(true)}
        />

        {/* Module 8: USP FEATURE - MODIFY YOUR PIZZA HERO CARD */}
        <div className="mx-4 my-2.5 p-3.5 bg-gradient-to-r from-[#1c0f12] via-[#241317] to-[#12080a] border-2 border-red-500/30 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-white">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#e31837] to-amber-500 flex items-center justify-center text-xl shrink-0 shadow-md">
              🍕
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="font-black text-xs sm:text-sm text-white truncate">Modify Your Pizza</h3>
                <span className="text-[9px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded uppercase">
                  USP
                </span>
              </div>
              <p className="text-[10.5px] text-stone-300 line-clamp-1">
                Custom-build step-by-step: slice sizes, crust, sauces &amp; toppings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomPizzaOpen(true)}
            className="bg-[#e31837] hover:bg-[#c4122d] active:scale-95 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-md shrink-0 cursor-pointer border border-red-400/40 uppercase tracking-wider transition-all"
          >
            Build Now →
          </button>
        </div>

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

        {/* Custom Pizza Builder Modal */}
        <CustomPizzaBuilder
          isOpen={isCustomPizzaOpen}
          onClose={() => setIsCustomPizzaOpen(false)}
        />

        {/* Enforced Firebase Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
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
