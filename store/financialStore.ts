import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { Transaction, TransactionType, TransactionCategory } from "@/types";
import { useFarmStore } from "./farmStore";

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
  getFinancialStats: (farmId?: string) => {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    recentTransactions: number;
    byCategory: { category: string; amount: number; type: TransactionType }[];
  };
  searchTransactions: (query: string) => Transaction[];
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
      
      getFinancialStats: (farmId) => {
        const transactions = get().transactions.filter(transaction => 
          !farmId || transaction.farmId === farmId
        );
        
        // Calculate totals
        const totalIncome = transactions
          .filter(t => t.type === "Income")
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = transactions
          .filter(t => t.type === "Expense")
          .reduce((sum, t) => sum + t.amount, 0);
        
        const netProfit = totalIncome - totalExpenses;
        
        // Recent transactions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentTransactions = transactions.filter(transaction => 
          new Date(transaction.date) >= thirtyDaysAgo
        ).length;
        
        // Group by category
        const categoryGroups: Record<string, { amount: number; type: TransactionType }> = {};
        transactions.forEach(transaction => {
          if (!categoryGroups[transaction.category]) {
            categoryGroups[transaction.category] = { amount: 0, type: transaction.type };
          }
          if (transaction.type === "Income") {
            categoryGroups[transaction.category].amount += transaction.amount;
          } else {
            categoryGroups[transaction.category].amount += transaction.amount;
          }
        });
        
        return {
          totalIncome,
          totalExpenses,
          netProfit,
          recentTransactions,
          byCategory: Object.entries(categoryGroups).map(([category, data]) => ({
            category,
            amount: data.amount,
            type: data.type
          }))
        };
      },
    }),
    {
      name: "financial-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);