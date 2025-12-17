import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateId } from "@/utils/helpers";
import { HealthRecord, HealthRecordType } from "@/types";
import { useFarmStore } from "./farmStore";
import { getMockData } from "@/utils/mockData";

interface HealthState {
  healthRecords: HealthRecord[];
  isLoading: boolean;
  error: string | null;
  _initialized: boolean;

  // Actions
  fetchHealthRecords: (farmId?: string, animalId?: string) => Promise<HealthRecord[]>;
  getHealthRecord: (id: string) => HealthRecord | undefined;
  createHealthRecord: (recordData: Omit<HealthRecord, "id" | "createdAt" | "updatedAt">) => Promise<HealthRecord>;
  updateHealthRecord: (id: string, recordData: Partial<HealthRecord>) => Promise<HealthRecord>;
  deleteHealthRecord: (id: string) => Promise<void>;
  getHealthRecordsByType: (type: HealthRecordType) => HealthRecord[];
  getHealthRecordsByAnimal: (animalId: string) => HealthRecord[];
  getHealthStats: (farmId?: string) => {
    total: number;
    byType: { type: string; count: number }[];
    totalCost: number;
    recentRecords: number;
  };
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      healthRecords: [],
      isLoading: false,
      error: null,
      _initialized: false,

      fetchHealthRecords: async (farmId, animalId) => {
        set({ isLoading: true, error: null });

        try {
          const state = get();
          let allRecords = [...state.healthRecords];

          // Initialize with mock data if first run OR data is empty (e.g., after clear)
          if (!state._initialized || allRecords.length === 0) {
            const mockHealthRecords = getMockData("healthRecords") as HealthRecord[];
            allRecords = mockHealthRecords;
          }

          // Filter by farm if farmId is provided
          const targetFarmId = farmId || useFarmStore.getState().currentFarm?.id;
          let filteredRecords = targetFarmId
            ? allRecords.filter(record => record.farmId === targetFarmId)
            : allRecords;

          // Filter by animal if animalId is provided
          if (animalId) {
            filteredRecords = filteredRecords.filter(record => record.animalId === animalId);
          }

          // Sort by date (most recent first)
          filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const allRecordsSorted = [...allRecords].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          set({
            // IMPORTANT: store must keep the FULL dataset; screens/selectors filter by farm/animal.
            healthRecords: allRecordsSorted,
            isLoading: false,
            _initialized: true,
          });

          return filteredRecords;
        } catch (error: any) {
          set({
            error: error.message || "Failed to fetch health records",
            isLoading: false,
            _initialized: true,
          });
          return [];
        }
      },

      getHealthRecord: (id) => {
        return get().healthRecords.find(record => record.id === id);
      },

      createHealthRecord: async (recordData) => {
        set({ isLoading: true, error: null });

        try {
          const newRecord: HealthRecord = {
            id: generateId(),
            ...recordData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const state = get();
          const updatedRecords = [...state.healthRecords, newRecord];

          // Update state - Zustand persist handles storage automatically
          set({
            healthRecords: updatedRecords,
            isLoading: false
          });

          // Link Health costs into Financials (create an Expense transaction tied to this record)
          if ((newRecord.cost || 0) > 0) {
            try {
              const { useFinancialStore } = await import("./financialStore");
              const financialStore = useFinancialStore.getState();
              await financialStore.createTransaction({
                farmId: newRecord.farmId,
                type: "Expense",
                category: newRecord.type === "Vaccination" ? "Medication" : "Veterinary",
                amount: newRecord.cost,
                date: newRecord.date,
                description: `Health: ${newRecord.type}${newRecord.treatment ? ` - ${newRecord.treatment}` : ""}`,
                paymentMethod: "Cash",
                reference: `HEALTH-${newRecord.id}`,
                animalId: newRecord.animalId,
              });
            } catch (e) {
              console.warn("Failed to create linked financial transaction for health record:", e);
            }
          }

          return newRecord;
        } catch (error: any) {
          set({
            error: error.message || "Failed to create health record",
            isLoading: false
          });
          throw error;
        }
      },

      updateHealthRecord: async (id, recordData) => {
        set({ isLoading: true, error: null });

        try {
          const state = get();

          // Find and update record
          const index = state.healthRecords.findIndex(r => r.id === id);
          if (index === -1) throw new Error("Health record not found");

          const updatedRecord = {
            ...state.healthRecords[index],
            ...recordData,
            updatedAt: new Date().toISOString()
          };

          const updatedRecords = [
            ...state.healthRecords.slice(0, index),
            updatedRecord,
            ...state.healthRecords.slice(index + 1)
          ];

          // Update state - Zustand persist handles storage automatically
          set({
            healthRecords: updatedRecords,
            isLoading: false
          });

          // Keep the linked financial transaction in sync
          try {
            const { useFinancialStore } = await import("./financialStore");
            const financialStore = useFinancialStore.getState();

            const reference = `HEALTH-${updatedRecord.id}`;
            const linkedTxn = financialStore.transactions.find(
              t => t.farmId === updatedRecord.farmId && t.reference === reference
            );

            const nextCost = updatedRecord.cost || 0;
            const nextCategory = updatedRecord.type === "Vaccination" ? "Medication" : "Veterinary";
            const nextDescription = `Health: ${updatedRecord.type}${updatedRecord.treatment ? ` - ${updatedRecord.treatment}` : ""}`;

            if (nextCost > 0) {
              if (linkedTxn) {
                await financialStore.updateTransaction(linkedTxn.id, {
                  amount: nextCost,
                  date: updatedRecord.date,
                  category: nextCategory,
                  description: nextDescription,
                  animalId: updatedRecord.animalId,
                });
              } else {
                await financialStore.createTransaction({
                  farmId: updatedRecord.farmId,
                  type: "Expense",
                  category: nextCategory,
                  amount: nextCost,
                  date: updatedRecord.date,
                  description: nextDescription,
                  paymentMethod: "Cash",
                  reference,
                  animalId: updatedRecord.animalId,
                });
              }
            } else if (linkedTxn) {
              await financialStore.deleteTransaction(linkedTxn.id);
            }
          } catch (e) {
            console.warn("Failed to sync linked financial transaction for health record:", e);
          }

          return updatedRecord;
        } catch (error: any) {
          set({
            error: error.message || "Failed to update health record",
            isLoading: false
          });
          throw error;
        }
      },

      deleteHealthRecord: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const state = get();
          const recordToDelete = state.healthRecords.find(record => record.id === id);
          const updatedRecords = state.healthRecords.filter(record => record.id !== id);

          // Update state - Zustand persist handles storage automatically
          set({
            healthRecords: updatedRecords,
            isLoading: false
          });

          // Delete linked financial transaction (if present)
          if (recordToDelete) {
            try {
              const { useFinancialStore } = await import("./financialStore");
              const financialStore = useFinancialStore.getState();

              const reference = `HEALTH-${recordToDelete.id}`;
              const linkedTxn = financialStore.transactions.find(
                t => t.farmId === recordToDelete.farmId && t.reference === reference
              );
              if (linkedTxn) {
                await financialStore.deleteTransaction(linkedTxn.id);
              }
            } catch (e) {
              console.warn("Failed to delete linked financial transaction for health record:", e);
            }
          }
        } catch (error: any) {
          set({
            error: error.message || "Failed to delete health record",
            isLoading: false
          });
          throw error;
        }
      },

      getHealthRecordsByType: (type) => {
        return get().healthRecords.filter(record => record.type === type);
      },

      getHealthRecordsByAnimal: (animalId) => {
        return get().healthRecords.filter(record => record.animalId === animalId);
      },

      getHealthStats: (farmId) => {
        const records = get().healthRecords.filter(record =>
          !farmId || record.farmId === farmId
        );

        // Group by type
        const typeGroups: Record<string, HealthRecord[]> = {};
        records.forEach(record => {
          if (!typeGroups[record.type]) {
            typeGroups[record.type] = [];
          }
          typeGroups[record.type].push(record);
        });

        // Calculate total cost
        const totalCost = records.reduce((sum, record) => sum + record.cost, 0);

        // Calculate recent records (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRecords = records.filter(record =>
          new Date(record.date) >= thirtyDaysAgo
        ).length;

        return {
          total: records.length,
          byType: Object.entries(typeGroups).map(([type, items]) => ({
            type,
            count: items.length
          })),
          totalCost,
          recentRecords
        };
      },
    }),
    {
      name: "health-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        healthRecords: state.healthRecords,
        _initialized: state._initialized,
      }),
    }
  )
);
