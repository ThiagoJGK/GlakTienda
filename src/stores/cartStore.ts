import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  href: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string, size: string, color: string) => void;
  updateQuantity: (id: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;

  // Computed-like helpers
  totalItems: () => number;
  totalPrice: () => number;
  freeShippingRemaining: () => number;
}

const FREE_SHIPPING_THRESHOLD = 25000;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (newItem) => {
        const { items } = get();
        const existing = items.find(
          (i) => i.id === newItem.id && i.size === newItem.size && i.color === newItem.color
        );

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === newItem.id && i.size === newItem.size && i.color === newItem.color
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...newItem, quantity: 1 }] });
        }

        // Auto-open drawer on add
        set({ isOpen: true });
      },

      removeItem: (id, size, color) =>
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.id === id && i.size === size && i.color === color)
          ),
        })),

      updateQuantity: (id, size, color, qty) => {
        if (qty <= 0) {
          get().removeItem(id, size, color);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id && i.size === size && i.color === color
              ? { ...i, quantity: qty }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      freeShippingRemaining: () => {
        const total = get().totalPrice();
        return Math.max(0, FREE_SHIPPING_THRESHOLD - total);
      },
    }),
    {
      name: 'glak-cart',
      // Only persist items, not isOpen state
      partialize: (state) => ({ items: state.items }),
    }
  )
);
