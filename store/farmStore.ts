import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { Farm } from "@/types";
import { farmSchema, validateData } from "@/utils/validation";

// Mock farm data
const mockFarms: Farm[] = [
  {
    id: 'farm-1',
    name: 'Green Valley Farm',
    location: 'California, USA',
    size: 150,
    sizeUnit: 'acres',
    type: 'Mixed Livestock',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z',
  },
  {
    id: 'farm-2',
    name: 'Sunrise Ranch',
    location: 'Texas, USA',
    size: 200,
    sizeUnit: 'acres',
    type: 'Cattle Ranch',
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z',
  }
];

interface FarmState {
  farms: Farm[];
  currentFarm: Farm | null;
  isLoading: boolean;
  error: string | null;

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

      fetchFarms: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set({ 
            farms: mockFarms, 
            currentFarm: mockFarms[0], // Set first farm as current
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch farms',
            isLoading: false 
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

          // Save to storage
          await AsyncStorage.setItem("farms", JSON.stringify(farms));

          // Update state
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
          // We only validate fields that are being updated
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

          // Save to storage
          await AsyncStorage.setItem("farms", JSON.stringify(farms));

          // Get updated farm
          const updatedFarm = farms.find(f => f.id === id);
          if (!updatedFarm) {
            throw new Error("Farm not found");
          }

          // Update current farm if it's the one being updated
          if (get().currentFarm?.id === id) {
            set({ currentFarm: updatedFarm });
          }

          // Update state
          set({ farms, isLoading: false });

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
          // Filter out the farm to delete
          const farms = get().farms.filter(farm => farm.id !== id);

          // Save to storage
          await AsyncStorage.setItem("farms", JSON.stringify(farms));

          // Update current farm if it's the one being deleted
          if (get().currentFarm?.id === id) {
            set({ currentFarm: farms.length > 0 ? farms[0] : null });
          }

          // Update state
          set({ farms, isLoading: false });
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
        // This would typically get animal data, but we'll keep it simple for now
        // In a real implementation, this would integrate with the animal store
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
          totalAnimals: 0, // Would be calculated from animal store
          totalArea,
          animalDensity: 0 // Would be totalAnimals / totalArea
        };
      },
    }),
    {
      name: "farm-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);