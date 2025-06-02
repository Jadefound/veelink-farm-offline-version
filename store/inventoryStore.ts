import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper function to generate unique IDs
const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};

interface InventoryItem {
    id: string;
    farmId: string;
    name: string;
    category: 'Feed' | 'Medicine' | 'Equipment' | 'Supplement';
    quantity: number;
    unit: string;
    minimumStock: number;
    expiryDate?: string;
    cost: number;
    supplier?: string;
}

interface InventoryState {
    items: InventoryItem[];
    addItem: (item: Omit<InventoryItem, 'id'>) => void;
    updateStock: (id: string, quantity: number) => void;
    getLowStockItems: () => InventoryItem[];
    getExpiringItems: (days: number) => InventoryItem[];
}

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (itemData) => {
                const newItem: InventoryItem = {
                    id: generateId(),
                    ...itemData,
                };
                set((state) => ({ items: [...state.items, newItem] }));
            },

            updateStock: (id, quantity) => {
                set((state) => ({
                    items: state.items.map(item =>
                        item.id === id ? { ...item, quantity } : item
                    ),
                }));
            },

            getLowStockItems: () => {
                return get().items.filter(item => item.quantity <= item.minimumStock);
            },

            getExpiringItems: (days) => {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() + days);

                return get().items.filter(item => {
                    if (!item.expiryDate) return false;
                    return new Date(item.expiryDate) <= cutoffDate;
                });
            },
        }),
        { name: 'inventory-storage' }
    )
); 