import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { Transaction, TransactionType, TransactionCategory, Animal } from "@/types";
import { useFarmStore } from "./farmStore";
import { useHealthStore } from "./healthStore";
import { useAnimalStore } from "./animalStore";

interface FinancialState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTransactions: (farmId?: string) => Promise<Transaction[]>;
  getTransaction: (id: string) => Promise<Transaction | undefined>;
  createTransaction: (transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => Promise<Transaction>;
  updateTransaction: (id: string, transactionData: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getTransactionsByCategory: (category: TransactionCategory) => Transaction[];
  getTransactionsByCategoryAndFarm: (category: TransactionCategory, farmId?: string) => Transaction[];
  getFinancialStats: (farmId: string) => {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    healthCosts: number;
    acquisitionCosts: number;
    animalSales: number;
    totalAssetValue: number;
    recentTransactions: number;
    byCategory: { category: string; amount: number; type: TransactionType }[];
  };
  getAssetStats: (farmId?: string) => Promise<{
    totalAnimalAssets: number;
    totalAcquisitionCost: number;
    assetAppreciation: number;
    animalCount: number;
    averageAnimalValue: number;
  }>;
  searchTransactions: (query: string) => Transaction[];
  getTransactionById: (id: string) => Transaction | null;
}

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      error: null,

      fetchTransactions: async (farmId) => {
        set({ isLoading: true, error: null });

        try {
          // Get transactions from storage
          const transactionsData = await AsyncStorage.getItem("transactions");
          let transactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];

          // Filter by farm if farmId is provided
          if (farmId) {
            transactions = transactions.filter(transaction => transaction.farmId === farmId);
          } else {
            // Use current farm from farmStore if no farmId is provided
            const currentFarm = useFarmStore.getState().currentFarm;
            if (currentFarm) {
              transactions = transactions.filter(transaction => transaction.farmId === currentFarm.id);
            }
          }

          // Sort by date (newest first)
          transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          set({ transactions, isLoading: false });
          return transactions;
        } catch (error: any) {
          set({
            error: error.message || "Failed to fetch transactions",
            isLoading: false
          });
          return [];
        }
      },

      getTransaction: async (id) => {
        try {
          // Get transactions from storage
          const transactionsData = await AsyncStorage.getItem("transactions");
          const transactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];

          // Find transaction by id
          return transactions.find(transaction => transaction.id === id);
        } catch (error) {
          console.error("Failed to get transaction:", error);
          return undefined;
        }
      },

      createTransaction: async (transactionData) => {
        set({ isLoading: true, error: null });

        try {
          // If transaction is animal sale, create both transaction and update animal
          if (transactionData.category === 'AnimalSale') {
            const animalStore = useAnimalStore.getState();
            const animal = await animalStore.getAnimal(transactionData.animalId!);

            if (animal) {
              await animalStore.updateAnimal(animal.id, {
                status: 'Sold',
                salePrice: transactionData.amount
              });
            }
          }

          // Get all transactions
          const transactionsData = await AsyncStorage.getItem("transactions");
          const allTransactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];

          const newTransaction: Transaction = {
            id: generateId(),
            ...transactionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Add new transaction
          const updatedTransactions = [...allTransactions, newTransaction];

          // Save to storage
          await AsyncStorage.setItem("transactions", JSON.stringify(updatedTransactions));

          // Update state with transactions for current farm
          const currentFarm = useFarmStore.getState().currentFarm;
          const farmTransactions = updatedTransactions
            .filter(transaction => transaction.farmId === (currentFarm?.id || transactionData.farmId))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          set({
            transactions: farmTransactions,
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
          // Get all transactions
          const transactionsData = await AsyncStorage.getItem("transactions");
          const allTransactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];

          // Find and update transaction
          const updatedAllTransactions = allTransactions.map(transaction =>
            transaction.id === id
              ? {
                ...transaction,
                ...transactionData,
                updatedAt: new Date().toISOString()
              }
              : transaction
          );

          // Save to storage
          await AsyncStorage.setItem("transactions", JSON.stringify(updatedAllTransactions));

          // Get updated transaction
          const updatedTransaction = updatedAllTransactions.find(t => t.id === id);
          if (!updatedTransaction) {
            throw new Error("Transaction not found");
          }

          // Update state with transactions for current farm
          const currentFarm = useFarmStore.getState().currentFarm;
          const farmTransactions = updatedAllTransactions
            .filter(transaction => transaction.farmId === currentFarm?.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          set({
            transactions: farmTransactions,
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
          // Get all transactions
          const transactionsData = await AsyncStorage.getItem("transactions");
          const allTransactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];

          // Filter out the transaction to delete
          const updatedAllTransactions = allTransactions.filter(transaction => transaction.id !== id);

          // Save to storage
          await AsyncStorage.setItem("transactions", JSON.stringify(updatedAllTransactions));

          // Update state with transactions for current farm
          const currentFarm = useFarmStore.getState().currentFarm;
          const farmTransactions = updatedAllTransactions
            .filter(transaction => transaction.farmId === currentFarm?.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          set({
            transactions: farmTransactions,
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
          transaction.reference.toLowerCase().includes(lowercaseQuery)
        );
      },

      getFinancialStats: (farmId: string) => {
        const { transactions } = get();
        const farmTransactions = transactions.filter(t => t.farmId === farmId);

        // Get health records costs from health store
        const healthStore = useHealthStore.getState();
        const healthRecords = healthStore.healthRecords.filter(h => h.farmId === farmId);
        const healthCosts = healthRecords.reduce((sum, record) => sum + (record.cost || 0), 0);

        // Get animal acquisition costs and sales
        const animalStore = useAnimalStore.getState();
        const animals = animalStore.animals.filter(a => a.farmId === farmId);

        const acquisitionCosts = animals.reduce((sum, animal) => {
          return sum + (animal.acquisitionCost || 0);
        }, 0);

        const animalSales = animals
          .filter(animal => animal.status === 'Sold' && animal.salePrice)
          .reduce((sum, animal) => sum + (animal.salePrice || 0), 0);

        const totalIncome = farmTransactions
          .filter(t => t.type === 'Income')
          .reduce((sum, t) => sum + t.amount, 0) + animalSales;

        const totalExpenses = farmTransactions
          .filter(t => t.type === 'Expense')
          .reduce((sum, t) => sum + t.amount, 0) + healthCosts + acquisitionCosts;

        const netProfit = totalIncome - totalExpenses;

        // Calculate asset value for healthy animals
        const healthyAnimals = animals.filter(animal =>
          animal.status === 'Healthy' || animal.status === 'Pregnant'
        );
        const totalAssetValue = healthyAnimals.reduce((sum, animal) => {
          return sum + (animal.currentValue || animal.acquisitionCost || 0);
        }, 0);

        // Group transactions by category for farm
        const categoryGroups: Record<string, { amount: number; type: TransactionType }> = {};
        farmTransactions.forEach(transaction => {
          if (!categoryGroups[transaction.category]) {
            categoryGroups[transaction.category] = { amount: 0, type: transaction.type };
          }
          categoryGroups[transaction.category].amount += transaction.amount;
        });

        const byCategory = Object.entries(categoryGroups).map(([category, data]) => ({
          category,
          amount: data.amount,
          type: data.type
        }));

        return {
          totalIncome,
          totalExpenses,
          netProfit,
          healthCosts,
          acquisitionCosts,
          animalSales,
          totalAssetValue,
          recentTransactions: farmTransactions.length,
          byCategory,
        };
      },

      getAssetStats: async (farmId) => {
        try {
          // Get animals from storage
          const animalsData = await AsyncStorage.getItem("animals");
          let animals: Animal[] = animalsData ? JSON.parse(animalsData) : [];

          // Filter by farm if farmId is provided
          if (farmId) {
            animals = animals.filter(animal => animal.farmId === farmId);
          } else {
            // Use current farm from farmStore if no farmId is provided
            const currentFarm = useFarmStore.getState().currentFarm;
            if (currentFarm) {
              animals = animals.filter(animal => animal.farmId === currentFarm.id);
            }
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
    }),
    {
      name: "financial-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);