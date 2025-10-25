import { create } from "zustand";

export interface PurchaseItem {
  ingredient_id: number;
  ingredient_name: string;
  unit_of_measure: string;
  quantity: number;
  unit_cost: number;
}

interface PurchaseStore {
  items: PurchaseItem[];
  addItem: (item: PurchaseItem) => void;
  updateItem: (ingredient_id: number, quantity: number, unit_cost: number) => void;
  removeItem: (ingredient_id: number) => void;
  clearItems: () => void;
  getTotalAmount: () => number;
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  items: [],
  
  addItem: (item) => {
    set((state) => {
      const exists = state.items.find((i) => i.ingredient_id === item.ingredient_id);
      if (exists) {
        return {
          items: state.items.map((i) =>
            i.ingredient_id === item.ingredient_id ? item : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  updateItem: (ingredient_id, quantity, unit_cost) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.ingredient_id === ingredient_id
          ? { ...item, quantity, unit_cost }
          : item
      ),
    }));
  },

  removeItem: (ingredient_id) => {
    set((state) => ({
      items: state.items.filter((item) => item.ingredient_id !== ingredient_id),
    }));
  },

  clearItems: () => set({ items: [] }),

  getTotalAmount: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.quantity * item.unit_cost, 0);
  },
}));
