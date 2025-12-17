import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateId } from "@/utils/helpers";
import { Transaction, TransactionType, TransactionCategory, Animal } from "@/types";
import { useFarmStore } from "./farmStore";
import { useHealthStore } from "./healthStore";
import { getMockData } from "@/utils/mockData";

// Pagination constants
const PAGE_SIZE = 20;

interface FinancialState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  _initialized: boolean;
  
  // Pagination state
  currentPage: number;
  hasMore: boolean;

  // Actions
  fetchTransactions: (farmId?: string) => Promise<Transaction[]>;
  fetchTransactionsPage: (farmId: string, page: number) => Transaction[];
  loadMoreTransactions: (farmId: string) => void;
  resetPagination: () => void;
  getTransaction: (id: string) => Transaction | undefined;
  createTransaction: (transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => Promise<Transaction>;
  updateTransaction: (id: string, transactionData: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getTransactionsByCategory: (category: TransactionCategory) => Transaction[];
  getTransactionsByCategoryAndFarm: (category: TransactionCategory, farmId?: string) => Transaction[];
  getFinancialStats: (farmId: string) => Promise<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    healthCosts: number;
    acquisitionCosts: number;
    animalSales: number;
    totalAssetValue: number;
    recentTransactions: number;
    byCategory: { category: string; amount: number; type: TransactionType }[];
  }>;
  getAssetStats: (farmId?: string) => Promise<{
    totalAnimalAssets: number;
    totalAcquisitionCost: number;
    assetAppreciation: number;
    animalCount: number;
    averageAnimalValue: number;
  }>;
  searchTransactions: (query: string) => Transaction[];
  getTransactionById: (id: string) => Transaction | null;
  getAnimalProfitability: (farmId: string) => Promise<{
    animalId: string;
    identificationNumber: string;
    totalCosts: number;
    healthCosts: number;
    acquisitionCost: number;
    revenue: number;
    profit: number;
    profitMargin: number;
    potentialProfit: number;
    currentValue: number;
    status: string;
  }[]>;
  getPortfolioValue: (farmId: string) => Promise<{
    totalValue: number;
    totalCost: number;
    totalAcquisitionCost: number;
    totalHealthCosts: number;
    unrealizedGain: number;
    realizedProfit: number;
    roi: number;
    animalCount: number;
    soldCount: number;
  }>;
}

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      error: null,
      _initialized: false,
      currentPage: 1,
      hasMore: true,

      fetchTransactions: async (farmId) => {
        set({ isLoading: true, error: null });

        try {
          const state = get();
          let allTransactions = [...state.transactions];

          // Initialize with mock data if first run OR data is empty (e.g., after clear)
          if (!state._initialized || allTransactions.length === 0) {
            const mockTransactions = getMockData("transactions") as Transaction[];
            allTransactions = mockTransactions;
          }

          // Filter by farm if farmId is provided
          const targetFarmId = farmId || useFarmStore.getState().currentFarm?.id;
          let filteredTransactions = targetFarmId
            ? allTransactions.filter(transaction => transaction.farmId === targetFarmId)
            : allTransactions;

          // Sort by date (newest first)
          filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          // Keep a globally-sorted copy in state for consistent UX across screens
          const allTransactionsSorted = [...allTransactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          set({
            // IMPORTANT: store must keep the FULL dataset; screens/selectors filter by farm.
            transactions: allTransactionsSorted,
            isLoading: false,
            _initialized: true,
            currentPage: 1,
            hasMore: true,
          });

          return filteredTransactions;
        } catch (error: any) {
          set({
            error: error.message || "Failed to fetch transactions",
            isLoading: false,
            _initialized: true,
          });
          return [];
        }
      },

      // Get a specific page of transactions (for pagination)
      fetchTransactionsPage: (farmId, page) => {
        const state = get();
        const allTransactions = state.transactions.filter(t => t.farmId === farmId);
        const startIndex = (page - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        return allTransactions.slice(startIndex, endIndex);
      },

      // Load more transactions for infinite scroll
      loadMoreTransactions: (farmId) => {
        const state = get();
        const allTransactions = state.transactions.filter(t => t.farmId === farmId);
        const nextPage = state.currentPage + 1;
        const hasMore = nextPage * PAGE_SIZE < allTransactions.length;
        
        set({
          currentPage: nextPage,
          hasMore,
        });
      },

      // Reset pagination state
      resetPagination: () => {
        set({
          currentPage: 1,
          hasMore: true,
        });
      },

      getTransaction: (id) => {
        return get().transactions.find(transaction => transaction.id === id);
      },

      createTransaction: async (transactionData) => {
        set({ isLoading: true, error: null });

        try {
          const newTransaction: Transaction = {
            id: generateId(),
            ...transactionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Handle animal sale transactions
          // Prefer explicit animalId, fall back to reference format ANIMAL-<animalId>
          if (transactionData.category === 'Sales') {
            const { useAnimalStore } = await import("./animalStore");
            const animalStore = useAnimalStore.getState();
            const animalId =
              transactionData.animalId ||
              (transactionData.reference?.startsWith('ANIMAL-')
                ? transactionData.reference.replace('ANIMAL-', '')
                : undefined);

            if (animalId) {
              await animalStore.updateAnimal(animalId, {
                status: 'Sold',
                price: transactionData.amount,
              });
            }
          }

          const state = get();
          const updatedTransactions = [...state.transactions, newTransaction];

          // Update state - Zustand persist handles storage automatically
          set({
            transactions: updatedTransactions,
            isLoading: false
          });

          return newTransaction;
        } catch (error: any) {
          set({
            error: error.message || "Failed to create transaction",
            isLoading: false
          });
          throw error;
        }
      },

      updateTransaction: async (id, transactionData) => {
        set({ isLoading: true, error: null });

        try {
          const state = get();

          // Find and update transaction
          const index = state.transactions.findIndex(t => t.id === id);
          if (index === -1) throw new Error("Transaction not found");

          const updatedTransaction = {
            ...state.transactions[index],
            ...transactionData,
            updatedAt: new Date().toISOString()
          };

          const updatedTransactions = [
            ...state.transactions.slice(0, index),
            updatedTransaction,
            ...state.transactions.slice(index + 1)
          ];

          // Update state - Zustand persist handles storage automatically
          set({
            transactions: updatedTransactions,
            isLoading: false
          });

          return updatedTransaction;
        } catch (error: any) {
          set({
            error: error.message || "Failed to update transaction",
            isLoading: false
          });
          throw error;
        }
      },

      deleteTransaction: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const state = get();
          const updatedTransactions = state.transactions.filter(transaction => transaction.id !== id);

          // Update state - Zustand persist handles storage automatically
          set({
            transactions: updatedTransactions,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || "Failed to delete transaction",
            isLoading: false
          });
          throw error;
        }
      },

      getTransactionsByType: (type) => {
        return get().transactions.filter(transaction => transaction.type === type);
      },

      getTransactionsByCategory: (category) => {
        return get().transactions.filter(transaction => transaction.category === category);
      },

      getTransactionsByCategoryAndFarm: (category: TransactionCategory, farmId?: string) => {
        const transactions = get().transactions;
        return transactions.filter(transaction =>
          transaction.category === category &&
          (!farmId || transaction.farmId === farmId)
        );
      },

      searchTransactions: (query) => {
        const transactions = get().transactions;
        if (!query.trim()) return transactions;

        const lowercaseQuery = query.toLowerCase();
        return transactions.filter(transaction =>
          transaction.description.toLowerCase().includes(lowercaseQuery) ||
          transaction.category.toLowerCase().includes(lowercaseQuery) ||
          (transaction.reference && transaction.reference.toLowerCase().includes(lowercaseQuery))
        );
      },

      getFinancialStats: async (farmId) => {
        const state = get();
        const transactions = state.transactions.filter(t => t.farmId === farmId);

        // Calculate total asset value from animals (exclude sold/dead)
        const { useAnimalStore } = await import("./animalStore");
        const animalStore = useAnimalStore.getState();
        const animals = animalStore.animals.filter(a => a.farmId === farmId);
        const activeAnimals = animals.filter(a => a.status !== 'Sold' && a.status !== 'Dead');
        const totalAssetValue = activeAnimals.reduce((sum, animal) => sum + (animal.estimatedValue || animal.price || 0), 0);

        const totalIncome = transactions
          .filter((t) => t.type === 'Income')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpensesFromTransactions = transactions
          .filter((t) => t.type === 'Expense')
          .reduce((sum, t) => sum + t.amount, 0);

        // Health costs calculation
        const healthExpenseTransactions = transactions
          .filter((t) => t.category === 'Medication' || t.category === 'Veterinary');

        const healthCostsFromTransactions = healthExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);

        const healthStore = useHealthStore.getState();
        const healthRecords = healthStore.healthRecords.filter(r => r.farmId === farmId);

        const toDayKey = (isoDate: string) => {
          try {
            return new Date(isoDate).toISOString().slice(0, 10);
          } catch {
            return isoDate.slice(0, 10);
          }
        };

        const additionalHealthCostsFromRecords = healthRecords.reduce((sum, record) => {
          const cost = record.cost || 0;
          if (cost <= 0) return sum;

          const linkedRef = `HEALTH-${record.id}`;
          const hasLinkedTransaction = transactions.some(t => t.reference === linkedRef);
          if (hasLinkedTransaction) return sum;

          const recordDay = toDayKey(record.date);
          const hasSimilarTxn = healthExpenseTransactions.some(t =>
            t.type === 'Expense' &&
            t.amount === cost &&
            toDayKey(t.date) === recordDay
          );

          return hasSimilarTxn ? sum : sum + cost;
        }, 0);

        const healthCosts = healthCostsFromTransactions + additionalHealthCostsFromRecords;
        const totalExpenses = totalExpensesFromTransactions + additionalHealthCostsFromRecords;

        const acquisitionCosts = transactions
          .filter((t) => t.category === 'Purchase')
          .reduce((sum, t) => sum + t.amount, 0);

        const animalSales = transactions
          .filter((t) => t.category === 'Sales')
          .reduce((sum, t) => sum + t.amount, 0);

        const byCategory = Object.values(
          transactions.reduce((acc, t) => {
            if (!acc[t.category]) {
              acc[t.category] = { category: t.category, amount: 0, type: t.type };
            }
            acc[t.category].amount += t.amount;
            return acc;
          }, {} as { [key: string]: { category: string; amount: number; type: TransactionType } })
        );

        return {
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses,
          healthCosts,
          acquisitionCosts,
          animalSales,
          totalAssetValue,
          recentTransactions: transactions.slice(0, 5).length,
          byCategory,
        };
      },

      getAssetStats: async (farmId) => {
        try {
          const { useAnimalStore } = await import("./animalStore");
          const animalStore = useAnimalStore.getState();
          let animals = animalStore.animals;

          // Filter by farm if farmId is provided
          const targetFarmId = farmId || useFarmStore.getState().currentFarm?.id;
          if (targetFarmId) {
            animals = animals.filter(animal => animal.farmId === targetFarmId);
          }

          // Filter out sold and dead animals from asset calculation
          const activeAnimals = animals.filter(animal =>
            animal.status !== "Sold" && animal.status !== "Dead"
          );

          const totalAnimalAssets = activeAnimals.reduce((sum, animal) => sum + (animal.price || 0), 0);
          const totalAcquisitionCost = activeAnimals.reduce((sum, animal) => sum + (animal.acquisitionPrice || 0), 0);
          const assetAppreciation = totalAnimalAssets - totalAcquisitionCost;
          const animalCount = activeAnimals.length;
          const averageAnimalValue = animalCount > 0 ? totalAnimalAssets / animalCount : 0;

          return {
            totalAnimalAssets,
            totalAcquisitionCost,
            assetAppreciation,
            animalCount,
            averageAnimalValue
          };
        } catch (error) {
          console.error("Failed to get asset stats:", error);
          return {
            totalAnimalAssets: 0,
            totalAcquisitionCost: 0,
            assetAppreciation: 0,
            animalCount: 0,
            averageAnimalValue: 0
          };
        }
      },

      getTransactionById: (id) => {
        return get().transactions.find(transaction => transaction.id === id) || null;
      },

      getAnimalProfitability: async (farmId) => {
        try {
          const { useAnimalStore } = await import("./animalStore");
          const animalStore = useAnimalStore.getState();
          const animals = animalStore.animals.filter(a => a.farmId === farmId);

          // Get health records for cost calculation
          const healthStore = useHealthStore.getState();
          const healthRecords = healthStore.healthRecords.filter(r => r.farmId === farmId);

          // Get transactions for additional costs
          const state = get();
          const transactions = state.transactions.filter(t => t.farmId === farmId);

          return animals.map(animal => {
            const acquisitionCost = animal.acquisitionPrice || 0;

            const animalHealthRecords = healthRecords.filter(r => r.animalId === animal.id);
            const healthCosts = animalHealthRecords.reduce((sum, record) => sum + (record.cost || 0), 0);

            const animalTransactions = transactions.filter(t => t.animalId === animal.id && t.type === 'Expense');
            const otherCosts = animalTransactions.reduce((sum, t) => sum + t.amount, 0);

            const totalCosts = acquisitionCost + healthCosts + otherCosts;
            const revenue = animal.status === 'Sold' ? (animal.price || 0) : 0;
            const profit = revenue - totalCosts;
            const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

            const currentValue = animal.estimatedValue || animal.price || 0;
            const potentialProfit = animal.status !== 'Sold' ? currentValue - totalCosts : 0;

            return {
              animalId: animal.id,
              identificationNumber: animal.identificationNumber,
              totalCosts,
              healthCosts,
              acquisitionCost,
              revenue,
              profit,
              profitMargin,
              potentialProfit,
              currentValue,
              status: animal.status,
            };
          });
        } catch (error) {
          console.error('Failed to calculate animal profitability:', error);
          return [];
        }
      },

      getPortfolioValue: async (farmId) => {
        try {
          const { useAnimalStore } = await import("./animalStore");
          const animalStore = useAnimalStore.getState();
          const animals = animalStore.animals.filter(a => a.farmId === farmId);

          const healthStore = useHealthStore.getState();
          const healthRecords = healthStore.healthRecords.filter(r => r.farmId === farmId);

          const activeAnimals = animals.filter(a => a.status !== 'Sold' && a.status !== 'Dead');

          const totalValue = activeAnimals.reduce((sum, animal) => {
            return sum + (animal.estimatedValue || animal.price || 0);
          }, 0);

          const totalAcquisitionCost = activeAnimals.reduce((sum, animal) => {
            return sum + (animal.acquisitionPrice || 0);
          }, 0);

          const totalHealthCosts = activeAnimals.reduce((sum, animal) => {
            const animalHealthRecords = healthRecords.filter(r => r.animalId === animal.id);
            return sum + animalHealthRecords.reduce((hSum, record) => hSum + (record.cost || 0), 0);
          }, 0);

          const totalCost = totalAcquisitionCost + totalHealthCosts;

          const soldAnimals = animals.filter(a => a.status === 'Sold');
          const realizedProfit = soldAnimals.reduce((sum, animal) => {
            const salePrice = animal.price || 0;
            const animalHealthRecords = healthRecords.filter(r => r.animalId === animal.id);
            const healthCost = animalHealthRecords.reduce((hSum, record) => hSum + (record.cost || 0), 0);
            const totalAnimalCost = (animal.acquisitionPrice || 0) + healthCost;
            return sum + (salePrice - totalAnimalCost);
          }, 0);

          return {
            totalValue,
            totalCost,
            totalAcquisitionCost,
            totalHealthCosts,
            unrealizedGain: totalValue - totalCost,
            realizedProfit,
            roi: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
            animalCount: activeAnimals.length,
            soldCount: soldAnimals.length,
          };
        } catch (error) {
          console.error('Failed to calculate portfolio value:', error);
          return {
            totalValue: 0,
            totalCost: 0,
            totalAcquisitionCost: 0,
            totalHealthCosts: 0,
            unrealizedGain: 0,
            realizedProfit: 0,
            roi: 0,
            animalCount: 0,
            soldCount: 0,
          };
        }
      },
    }),
    {
      name: "financial-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        _initialized: state._initialized,
        // Don't persist pagination state - reset on app start
      }),
    }
  )
);
