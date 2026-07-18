import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateId } from "@/utils/helpers";
import { Farm } from "@/types";
import { farmSchema, validateData } from "@/utils/validation";
import { getMockData, getDemoIds, getDemoFarmIds } from "@/utils/mockData";

interface FarmState {
  farms: Farm[];
  currentFarm: Farm | null;
  isLoading: boolean;
  error: string | null;
  _initialized: boolean;

  // Actions
  fetchFarms: () => Promise<void>;
  createFarm: (farmData: Omit<Farm, "id" | "createdAt" | "updatedAt">) => Promise<Farm>;
  updateFarm: (id: string, farmData: Partial<Farm>) => Promise<Farm>;
  deleteFarm: (id: string) => Promise<void>;
  setCurrentFarm: (farm: Farm | null) => void;
  getFarmStats: (farmId: string) => {
    totalAnimals: number;
    totalArea: number;
    animalDensity: number;
  };
  clearDemoData: () => void;
  resetStore: () => void;
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      farms: [],
      currentFarm: null,
      isLoading: false,
      error: null,
      _initialized: false,

      fetchFarms: async () => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          let farms = [...state.farms];

          const demoDataEnabled = (await AsyncStorage.getItem("demoDataEnabled")) === "1";

          // Only seed demo data when explicitly enabled
          if ((!state._initialized || farms.length === 0) && demoDataEnabled) {
            farms = getMockData("farms") as Farm[];
          }

          // Sort farms alphabetically for consistency
          farms.sort((a, b) => a.name.localeCompare(b.name));

          const currentFarmStillExists = state.currentFarm && farms.some(f => f.id === state.currentFarm!.id);
          set({
            farms,
            currentFarm: currentFarmStillExists ? state.currentFarm : (farms[0] || null),
            isLoading: false,
            _initialized: true,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch farms',
            isLoading: false,
            _initialized: true,
          });
        }
      },

      createFarm: async (farmData) => {
        set({ isLoading: true, error: null });

        try {
          // Validate farm data
          const validationResult = validateData(farmSchema, farmData);

          if (!validationResult.success) {
            throw new Error(validationResult.error);
          }

          const validatedData = validationResult.data;

          const newFarm: Farm = {
            id: generateId(),
            ...validatedData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Get current farms and add new one
          const farms = [...get().farms, newFarm].sort((a, b) => a.name.localeCompare(b.name));

          // Update state - Zustand persist handles storage automatically
          set({
            farms,
            currentFarm: newFarm,
            isLoading: false
          });

          return newFarm;
        } catch (error: any) {
          set({
            error: error.message || "Failed to create farm",
            isLoading: false
          });
          throw error;
        }
      },

      updateFarm: async (id, farmData) => {
        set({ isLoading: true, error: null });

        try {
          // Find the existing farm
          const existingFarm = get().farms.find(f => f.id === id);
          if (!existingFarm) {
            throw new Error("Farm not found");
          }

          // Prepare the complete farm data for validation
          const completeData = { ...existingFarm, ...farmData };

          // Validate the farm data
          const fieldsToValidate = Object.keys(farmData) as (keyof typeof farmSchema.shape)[];

          const partialSchema = farmSchema.pick(
            fieldsToValidate.reduce((acc, field) => {
              acc[field] = true;
              return acc;
            }, {} as { [K in keyof typeof farmSchema.shape]?: true })
          );

          const validationResult = validateData(partialSchema, farmData);

          if (!validationResult.success) {
            throw new Error(validationResult.error);
          }

          // Find and update farm
          const farms = get().farms.map(farm =>
            farm.id === id
              ? {
                ...farm,
                ...farmData,
                updatedAt: new Date().toISOString()
              }
              : farm
          ).sort((a, b) => a.name.localeCompare(b.name));

          // Get updated farm
          const updatedFarm = farms.find(f => f.id === id);
          if (!updatedFarm) {
            throw new Error("Farm not found");
          }

          // Update state - Zustand persist handles storage automatically
          set({
            farms,
            currentFarm: get().currentFarm?.id === id ? updatedFarm : get().currentFarm,
            isLoading: false
          });

          return updatedFarm;
        } catch (error: any) {
          set({
            error: error.message || "Failed to update farm",
            isLoading: false
          });
          throw error;
        }
      },

      deleteFarm: async (id) => {
        set({ isLoading: true, error: null });

        try {
          const state = get();
          // Filter out the farm to delete
          const farms = state.farms.filter(farm => farm.id !== id);

          // Update current farm if it's the one being deleted
          const newCurrentFarm = state.currentFarm?.id === id
            ? (farms.length > 0 ? farms[0] : null)
            : state.currentFarm;

          set({
            farms,
            currentFarm: newCurrentFarm,
            isLoading: false
          });

          // Cascade: delete all animals, health records, and financial
          // transactions belonging to this farm.
          try {
            const { useAnimalStore } = await import("./animalStore");
            const animalStore = useAnimalStore.getState();
            const farmAnimals = animalStore.animals.filter(a => a.farmId === id);
            for (const animal of farmAnimals) {
              await animalStore.deleteAnimal(animal.id);
            }
          } catch (e) {
            console.warn("Failed to cascade-delete animals for farm:", e);
          }

          try {
            const { useHealthStore } = await import("./healthStore");
            const healthStore = useHealthStore.getState();
            const farmHealthRecords = healthStore.healthRecords.filter(r => r.farmId === id);
            for (const record of farmHealthRecords) {
              await healthStore.deleteHealthRecord(record.id);
            }
          } catch (e) {
            console.warn("Failed to cascade-delete health records for farm:", e);
          }

          try {
            const { useFinancialStore } = await import("./financialStore");
            const financialStore = useFinancialStore.getState();
            const farmTransactions = financialStore.transactions.filter(t => t.farmId === id);
            for (const txn of farmTransactions) {
              await financialStore.deleteTransaction(txn.id);
            }
          } catch (e) {
            console.warn("Failed to cascade-delete financial transactions for farm:", e);
          }
        } catch (error: any) {
          set({
            error: error.message || "Failed to delete farm",
            isLoading: false
          });
          throw error;
        }
      },

      setCurrentFarm: (farm) => {
        set({ currentFarm: farm });
      },

      getFarmStats: (farmId) => {
        const farm = get().farms.find(f => f.id === farmId);
        if (!farm) {
          return {
            totalAnimals: 0,
            totalArea: 0,
            animalDensity: 0
          };
        }

        const totalArea = farm.size || 0;

        return {
          totalAnimals: 0,
          totalArea,
          animalDensity: 0
        };
      },
      clearDemoData: () => {
        const demoFarmIds = getDemoFarmIds();
        const farms = get().farms.filter(f => !demoFarmIds.has(f.id));
        const currentFarmGone = get().currentFarm && demoFarmIds.has(get().currentFarm!.id);
        set({
          farms,
          currentFarm: currentFarmGone ? (farms[0] || null) : get().currentFarm,
        });
      },
      resetStore: () => {
        set({
          farms: [],
          currentFarm: null,
          isLoading: false,
          error: null,
          _initialized: false,
        });
      },
    }),
    {
      name: "farm-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        farms: state.farms,
        currentFarm: state.currentFarm,
        _initialized: state._initialized,
      }),
    }
  )
);
