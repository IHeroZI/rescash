import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menu_id: number;
  menu_name: string;
  price: number;
  quantity: number;
  menu_image_url: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeItem: (menu_id: number) => void;
  updateQuantity: (menu_id: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item, quantity) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.menu_id === item.menu_id);
          
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.menu_id === item.menu_id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          
          return {
            items: [...state.items, { ...item, quantity }],
          };
        });
      },
      
      removeItem: (menu_id) => {
        set((state) => ({
          items: state.items.filter((item) => item.menu_id !== menu_id),
        }));
      },
      
      updateQuantity: (menu_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menu_id);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.menu_id === menu_id ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
