import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // generated from productId-size-crust
  productId: string;
  name: string;
  price: number; // final unit price with size and crust modifier
  basePrice: number;
  size: 'Regular' | 'Medium' | 'Large' | 'Standard';
  crust: string;
  quantity: number;
  image: string;
  isVeg: boolean;
}

interface CartStore {
  items: CartItem[];
  deliveryMode: 'Delivery' | 'Takeaway' | 'Dine-in';
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  tableNumber: string;
  appliedCoupon: string | null;
  discountAmount: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryMode: (mode: 'Delivery' | 'Takeaway' | 'Dine-in') => void;
  setCustomerInfo: (info: { name?: string; phone?: string; address?: string; tableNumber?: string }) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  
  // Computed helpers
  getTotalCount: () => number;
  getSubtotal: () => number;
  getTierDiscount: () => number;
  getTierPercentage: () => number;
  getTotalDiscount: () => number;
  getTaxes: () => number;
  getDeliveryFee: () => number;
  getGrandTotal: () => number;
  getNextTierInfo: () => { amountNeeded: number; message: string; target: 'delivery' | 'tier1' | 'tier2' | 'max' };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryMode: 'Delivery',
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      tableNumber: '',
      appliedCoupon: null,
      discountAmount: 0,

      addItem: (itemData) => {
        const id = `${itemData.productId}-${itemData.size}-${itemData.crust.replace(/\s+/g, '-').toLowerCase()}`;
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.id === id);

        if (existingIndex > -1) {
          const updated = [...currentItems];
          updated[existingIndex].quantity += itemData.quantity || 1;
          set({ items: updated });
        } else {
          set({ items: [...currentItems, { ...itemData, id, quantity: itemData.quantity || 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
        } else {
          set({
            items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          });
        }
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, discountAmount: 0 });
      },

      setDeliveryMode: (deliveryMode) => {
        set({ deliveryMode });
      },

      setCustomerInfo: (info) => {
        set((state) => ({
          customerName: info.name !== undefined ? info.name : state.customerName,
          customerPhone: info.phone !== undefined ? info.phone : state.customerPhone,
          deliveryAddress: info.address !== undefined ? info.address : state.deliveryAddress,
          tableNumber: info.tableNumber !== undefined ? info.tableNumber : state.tableNumber,
        }));
      },

      applyCoupon: (code) => {
        const cleanCode = code.trim().toUpperCase();
        const subtotal = get().getSubtotal();

        if (subtotal <= 0) {
          return { success: false, message: 'Your cart is empty' };
        }

        if (cleanCode === 'TUESDAYFREE') {
          const discount = Math.min(150, Math.round(subtotal * 0.25));
          set({ appliedCoupon: cleanCode, discountAmount: discount });
          return { success: true, message: `Tuesday Treat applied! Saved ₹${discount}` };
        }

        if (cleanCode === 'BOGOFRIDAY') {
          const discount = Math.min(200, Math.round(subtotal * 0.3));
          set({ appliedCoupon: cleanCode, discountAmount: discount });
          return { success: true, message: `Funday Friday Buy 1 Get 1 applied! Saved ₹${discount}` };
        }

        if (cleanCode === 'CHEESE50') {
          const discount = 50;
          set({ appliedCoupon: cleanCode, discountAmount: discount });
          return { success: true, message: '₹50 flat discount applied!' };
        }

        return { success: false, message: 'Invalid coupon code. Try TUESDAYFREE or BOGOFRIDAY' };
      },

      removeCoupon: () => {
        set({ appliedCoupon: null, discountAmount: 0 });
      },

      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      // Module 5: 10% off for >= ₹1000, 15% off for >= ₹1500
      getTierDiscount: () => {
        const subtotal = get().getSubtotal();
        if (subtotal >= 1500) {
          return Math.round(subtotal * 0.15);
        } else if (subtotal >= 1000) {
          return Math.round(subtotal * 0.10);
        }
        return 0;
      },

      getTierPercentage: () => {
        const subtotal = get().getSubtotal();
        if (subtotal >= 1500) return 15;
        if (subtotal >= 1000) return 10;
        return 0;
      },

      getTotalDiscount: () => {
        return get().getTierDiscount() + get().discountAmount;
      },

      getTaxes: () => {
        const subtotal = get().getSubtotal();
        // 5% GST on post-tier-discount items
        const taxableAmount = Math.max(0, subtotal - get().getTierDiscount());
        return Math.round(taxableAmount * 0.05);
      },

      // Module 5: Free delivery when cart reaches or exceeds ₹299
      getDeliveryFee: () => {
        const { deliveryMode } = get();
        if (deliveryMode !== 'Delivery') return 0;
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return subtotal >= 299 ? 0 : 40;
      },

      getGrandTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        const taxes = get().getTaxes();
        const delivery = get().getDeliveryFee();
        const totalDiscount = get().getTotalDiscount();
        return Math.max(0, subtotal + taxes + delivery - totalDiscount);
      },

      getNextTierInfo: () => {
        const subtotal = get().getSubtotal();
        if (subtotal < 299) {
          return {
            amountNeeded: 299 - subtotal,
            message: `Add ₹${299 - subtotal} more to unlock FREE Delivery!`,
            target: 'delivery',
          };
        } else if (subtotal < 1000) {
          return {
            amountNeeded: 1000 - subtotal,
            message: `Add ₹${1000 - subtotal} more to get 10% Auto-Discount!`,
            target: 'tier1',
          };
        } else if (subtotal < 1500) {
          return {
            amountNeeded: 1500 - subtotal,
            message: `Add ₹${1500 - subtotal} more to unlock 15% VIP Discount!`,
            target: 'tier2',
          };
        }
        return {
          amountNeeded: 0,
          message: '🎉 15% VIP Discount + FREE Delivery Unlocked!',
          target: 'max',
        };
      },
    }),
    {
      name: '7cheese-cart-storage',
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
        discountAmount: state.discountAmount,
      }),
    }
  )
);
