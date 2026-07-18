import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/helpers';
import { getMockData, getDemoIds } from '@/utils/mockData';

export interface InventoryItem {
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
    createdAt: string;
    updatedAt: string;
}

interface InventoryState {
    items: InventoryItem[];
    isLoading: boolean;
    error: string | null;

    getItemsByFarm: (farmId: string) => InventoryItem[];
    addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InventoryItem>;
    updateItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
    updateStock: (id: string, quantity: number) => void;
    deleteItem: (id: string) => Promise<void>;
    getLowStockItems: (farmId?: string) => InventoryItem[];
    getExpiringItems: (days: number, farmId?: string) => InventoryItem[];
    clearDemoData: () => void;
    resetStore: () => void;
}

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set, get) => ({
            items: [],
            isLoading: false,
            error: null,

            getItemsByFarm: (farmId) => {
                return get().items.filter(item => item.farmId === farmId);
            },

            addItem: async (itemData) => {
                set({ isLoading: true, error: null });
                try {
                    const newItem: InventoryItem = {
                        id: generateId(),
                        ...itemData,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    set((state) => ({
                        items: [...state.items, newItem],
                        isLoading: false,
                    }));
                    return newItem;
                } catch (error: any) {
                    set({ error: error.message || 'Failed to add item', isLoading: false });
                    throw error;
                }
            },

            updateItem: async (id, data) => {
                set({ isLoading: true, error: null });
                try {
                    set((state) => ({
                        items: state.items.map(item =>
                            item.id === id
                                ? { ...item, ...data, updatedAt: new Date().toISOString() }
                                : item
                        ),
                        isLoading: false,
                    }));
                } catch (error: any) {
                    set({ error: error.message || 'Failed to update item', isLoading: false });
                    throw error;
                }
            },

            updateStock: (id, quantity) => {
                set((state) => ({
                    items: state.items.map(item =>
                        item.id === id
                            ? { ...item, quantity, updatedAt: new Date().toISOString() }
                            : item
                    ),
                }));
            },

            deleteItem: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    set((state) => ({
                        items: state.items.filter(item => item.id !== id),
                        isLoading: false,
                    }));
                } catch (error: any) {
                    set({ error: error.message || 'Failed to delete item', isLoading: false });
                    throw error;
                }
            },

            getLowStockItems: (farmId?) => {
                const items = farmId
                    ? get().items.filter(item => item.farmId === farmId)
                    : get().items;
                return items.filter(item => item.quantity <= item.minimumStock);
            },

            getExpiringItems: (days, farmId?) => {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() + days);
                const items = farmId
                    ? get().items.filter(item => item.farmId === farmId)
                    : get().items;
                return items.filter(item => {
                    if (!item.expiryDate) return false;
                    return new Date(item.expiryDate) <= cutoffDate;
                });
            },

            resetStore: () => {
                set({ items: [], isLoading: false, error: null });
            },

            clearDemoData: () => {
                const demoIds = getDemoIds("inventory");
                set(state => ({ items: state.items.filter(i => !demoIds.has(i.id)) }));
            },
        }),
        {
            name: 'inventory-storage',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => async (state, error) => {
                if (error || !state) return;
                try {
                    const demoEnabled = (await AsyncStorage.getItem("demoDataEnabled")) === "1";
                    if (demoEnabled && state.items.length === 0) {
                        const demo = getMockData("inventory") as InventoryItem[];
                        if (demo.length) state.items = demo;
                    }
                } catch { /* noop */ }
            },
        }
    )
); 