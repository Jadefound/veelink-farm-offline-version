import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { Transaction, TransactionType, TransactionCategory, Animal } from "@/types";
import { useFarmStore } from "./farmStore";
import { useHealthStore } from "./healthStore";
import { getMockData } from "@/utils/mockData";

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

      fetchTransactions: async (farmId) => {
        set({ isLoading: true, error: null });

        try {
          // Get transactions from storage
          const transactionsData = await AsyncStorage.getItem("transactions");
          let transactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];

          // If no transactions in storage, fall back to mock data (first-run experience)
          if (!transactions.length) {
            const mockTransactions = getMockData("transactions") as Transaction[];
            transactions = mockTransactions;
            if (mockTransactions.length) {
              await AsyncStorage.setItem("transactions", JSON.stringify(mockTransactions));
            }
          }

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
          const newTransaction: Transaction = {
            id: generateId(),
            ...transactionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Handle animal sale transactions
          if (transactionData.category === 'Sales' && transactionData.reference?.startsWith('ANIMAL-')) {
            // Use dynamic import to avoid circular dependency
            const { useAnimalStore } = await import("./animalStore");
            const animalStore = useAnimalStore.getState();
            const animalId = transactionData.reference.replace('ANIMAL-', '');

            await animalStore.updateAnimal(animalId, {
              status: 'Sold',
              price: transactionData.amount, // Use price instead of salePrice
            });
          }

          // Get all transactions
          const transactionsData = await AsyncStorage.getItem("transactions");
          const allTransactions: Transaction[] = transactionsData ? JSON.parse(transactionsData) : [];

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
          (transaction.reference && transaction.reference.toLowerCase().includes(lowercaseQuery))
        );
      },

      getFinancialStats: async (farmId) => {
        const state = get();
        const transactions = state.transactions.filter(t => t.farmId === farmId);

        // Calculate total asset value from animals (exclude sold/dead)
        // Use dynamic import to avoid circular dependency
        const { useAnimalStore } = await import("./animalStore");
        const animalStore = useAnimalStore.getState();
        const animals = await animalStore.fetchAnimals(farmId);
        const activeAnimals = animals.filter(a => a.status !== 'Sold' && a.status !== 'Dead');
        const totalAssetValue = activeAnimals.reduce((sum, animal) => sum + (animal.estimatedValue || animal.price || 0), 0);

        const totalIncome = transactions
          .filter((t) => t.type === 'Income')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpensesFromTransactions = transactions
          .filter((t) => t.type === 'Expense')
          .reduce((sum, t) => sum + t.amount, 0);

        // Health costs can come from:
        // - explicit financial transactions (Medication/Veterinary)
        // - health records (Health module) which may not create transactions
        //
        // To avoid double-counting when a health record is linked to a transaction,
        // we de-dupe using a stable reference (HEALTH-<recordId>) and a fallback
        // heuristic (same day + same amount in a Medication/Veterinary expense).
        const healthExpenseTransactions = transactions
          .filter((t) => t.category === 'Medication' || t.category === 'Veterinary')

        const healthCostsFromTransactions = healthExpenseTransactions.reduce((sum, t) => sum + t.amount, 0);

        const healthStore = useHealthStore.getState();
        const healthRecords = await healthStore.fetchHealthRecords(farmId);

        const toDayKey = (isoDate: string) => {
          try {
            return new Date(isoDate).toISOString().slice(0, 10); // YYYY-MM-DD
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

      getAnimalProfitability: async (farmId) => {
        try {
          // Use dynamic import to avoid circular dependency
          const { useAnimalStore } = await import("./animalStore");
          const animalStore = useAnimalStore.getState();
          const animals = await animalStore.fetchAnimals(farmId);
          
          // Get health records for cost calculation
          const healthStore = useHealthStore.getState();
          const healthRecords = await healthStore.fetchHealthRecords(farmId);
          
          // Get transactions for additional costs (feed, etc.)
          const state = get();
          const transactions = state.transactions.filter(t => t.farmId === farmId);

          return animals.map(animal => {
            // Base acquisition cost
            const acquisitionCost = animal.acquisitionPrice || 0;
            
            // Health costs for this specific animal
            const animalHealthRecords = healthRecords.filter(r => r.animalId === animal.id);
            const healthCosts = animalHealthRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
            
            // Get any transactions linked to this animal
            const animalTransactions = transactions.filter(t => t.animalId === animal.id && t.type === 'Expense');
            const otherCosts = animalTransactions.reduce((sum, t) => sum + t.amount, 0);
            
            // Total costs = acquisition + health + other expenses
            const totalCosts = acquisitionCost + healthCosts + otherCosts;

            // Calculate revenue from sales
            const revenue = animal.status === 'Sold' ? (animal.price || 0) : 0;
            const profit = revenue - totalCosts;
            const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
            
            // For unsold animals, calculate potential profit based on current value
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
          // Use dynamic import to avoid circular dependency
          const { useAnimalStore } = await import("./animalStore");
          const animalStore = useAnimalStore.getState();
          const animals = await animalStore.fetchAnimals(farmId);
          
          // Get health records for accurate cost calculation
          const healthStore = useHealthStore.getState();
          const healthRecords = await healthStore.fetchHealthRecords(farmId);
          
          // Filter to only active animals (not sold or dead) for portfolio value
          const activeAnimals = animals.filter(a => a.status !== 'Sold' && a.status !== 'Dead');
          
          // Calculate total current value of active animals
          const totalValue = activeAnimals.reduce((sum, animal) => {
            return sum + (animal.estimatedValue || animal.price || 0);
          }, 0);

          // Calculate total acquisition cost of active animals
          const totalAcquisitionCost = activeAnimals.reduce((sum, animal) => {
            return sum + (animal.acquisitionPrice || 0);
          }, 0);
          
          // Calculate total health costs for active animals
          const totalHealthCosts = activeAnimals.reduce((sum, animal) => {
            const animalHealthRecords = healthRecords.filter(r => r.animalId === animal.id);
            return sum + animalHealthRecords.reduce((hSum, record) => hSum + (record.cost || 0), 0);
          }, 0);
          
          // Total cost includes acquisition + health expenses
          const totalCost = totalAcquisitionCost + totalHealthCosts;
          
          // Calculate realized profit from sold animals
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
    }
  )
);