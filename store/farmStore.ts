import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateId } from "@/utils/helpers";
import { Farm } from "@/types";
import { farmSchema, validateData } from "@/utils/validation";
import { getMockData } from "@/utils/mockData";

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

          // Initialize with mock data if first run OR data is empty (e.g., after clear)
          if (!state._initialized || farms.length === 0) {
            const mockFarms = getMockData("farms") as Farm[];
            farms = mockFarms;
          }

          // Sort farms alphabetically for consistency
          farms.sort((a, b) => a.name.localeCompare(b.name));

          set({
            farms,
            currentFarm: state.currentFarm || farms[0] || null,
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

          // Update state - Zustand persist handles storage automatically
          set({
            farms,
            currentFarm: newCurrentFarm,
            isLoading: false
          });
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
