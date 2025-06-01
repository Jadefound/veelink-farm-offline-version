import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { Animal, AnimalSpecies, AnimalStatus } from "@/types";
import { useFarmStore } from "./farmStore";

interface AnimalState {
  animals: Animal[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAnimals: (farmId?: string) => Promise<Animal[]>;
  getAnimal: (id: string) => Promise<Animal | undefined>;
  createAnimal: (animalData: Omit<Animal, "id" | "createdAt" | "updatedAt">) => Promise<Animal>;
  updateAnimal: (id: string, animalData: Partial<Animal>) => Promise<Animal>;
  deleteAnimal: (id: string) => Promise<void>;
  getAnimalsBySpecies: (species: AnimalSpecies) => Animal[];
  getAnimalsByStatus: (status: AnimalStatus) => Animal[];
  getAnimalStats: (farmId?: string) => { 
    total: number;
    bySpecies: { species: string; count: number }[];
    byStatus: { status: string; count: number }[];
    healthy: number;
    needsAttention: number;
  };
  searchAnimals: (query: string) => Animal[];
  getAnimalsByAge: (minAge?: number, maxAge?: number) => Animal[];
}

export const useAnimalStore = create<AnimalState>()(
  persist(
    (set, get) => ({
      animals: [],
      isLoading: false,
      error: null,
      
      fetchAnimals: async (farmId) => {
        set({ isLoading: true, error: null });
        
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
          
          // Sort by identification number for consistent ordering
          animals.sort((a, b) => a.identificationNumber.localeCompare(b.identificationNumber));
          
          set({ animals, isLoading: false });
          return animals;
        } catch (error: any) {
          set({ 
            error: error.message || "Failed to fetch animals", 
            isLoading: false 
          });
          return [];
        }
      },
      
      getAnimal: async (id) => {
        try {
          // Get animals from storage
          const animalsData = await AsyncStorage.getItem("animals");
          const animals: Animal[] = animalsData ? JSON.parse(animalsData) : [];
          
          // Find animal by id
          return animals.find(animal => animal.id === id);
        } catch (error) {
          console.error("Failed to get animal:", error);
          return undefined;
        }
      },
      
      createAnimal: async (animalData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Check if identification number already exists
          const animalsData = await AsyncStorage.getItem("animals");
          const allAnimals: Animal[] = animalsData ? JSON.parse(animalsData) : [];
          
          const existingAnimal = allAnimals.find(
            animal => animal.identificationNumber === animalData.identificationNumber && 
                     animal.farmId === animalData.farmId
          );
          
          if (existingAnimal) {
            throw new Error("An animal with this identification number already exists on this farm");
          }
          
          const newAnimal: Animal = {
            id: generateId(),
            ...animalData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          // Add new animal
          const updatedAnimals = [...allAnimals, newAnimal];
          
          // Save to storage
          await AsyncStorage.setItem("animals", JSON.stringify(updatedAnimals));
          
          // Update state with animals for current farm
          const currentFarm = useFarmStore.getState().currentFarm;
          const farmAnimals = updatedAnimals
            .filter(animal => animal.farmId === (currentFarm?.id || animalData.farmId))
            .sort((a, b) => a.identificationNumber.localeCompare(b.identificationNumber));
          
          set({ 
            animals: farmAnimals, 
            isLoading: false 
          });
          
          return newAnimal;
        } catch (error: any) {
          set({ 
            error: error.message || "Failed to create animal", 
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateAnimal: async (id, animalData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Get all animals
          const animalsData = await AsyncStorage.getItem("animals");
          const allAnimals: Animal[] = animalsData ? JSON.parse(animalsData) : [];
          
          // If updating identification number, check for duplicates
          if (animalData.identificationNumber) {
            const existingAnimal = allAnimals.find(
              animal => animal.identificationNumber === animalData.identificationNumber && 
                       animal.id !== id &&
                       animal.farmId === allAnimals.find(a => a.id === id)?.farmId
            );
            
            if (existingAnimal) {
              throw new Error("An animal with this identification number already exists on this farm");
            }
          }
          
          // Find and update animal
          const updatedAllAnimals = allAnimals.map(animal => 
            animal.id === id 
              ? { 
                  ...animal, 
                  ...animalData, 
                  updatedAt: new Date().toISOString() 
                } 
              : animal
          );
          
          // Save to storage
          await AsyncStorage.setItem("animals", JSON.stringify(updatedAllAnimals));
          
          // Get updated animal
          const updatedAnimal = updatedAllAnimals.find(a => a.id === id);
          if (!updatedAnimal) {
            throw new Error("Animal not found");
          }
          
          // Update state with animals for current farm
          const currentFarm = useFarmStore.getState().currentFarm;
          const farmAnimals = updatedAllAnimals
            .filter(animal => animal.farmId === currentFarm?.id)
            .sort((a, b) => a.identificationNumber.localeCompare(b.identificationNumber));
          
          set({ 
            animals: farmAnimals, 
            isLoading: false 
          });
          
          return updatedAnimal;
        } catch (error: any) {
          set({ 
            error: error.message || "Failed to update animal", 
            isLoading: false 
          });
          throw error;
        }
      },
      
      deleteAnimal: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          // Get all animals
          const animalsData = await AsyncStorage.getItem("animals");
          const allAnimals: Animal[] = animalsData ? JSON.parse(animalsData) : [];
          
          // Filter out the animal to delete
          const updatedAllAnimals = allAnimals.filter(animal => animal.id !== id);
          
          // Save to storage
          await AsyncStorage.setItem("animals", JSON.stringify(updatedAllAnimals));
          
          // Update state with animals for current farm
          const currentFarm = useFarmStore.getState().currentFarm;
          const farmAnimals = updatedAllAnimals
            .filter(animal => animal.farmId === currentFarm?.id)
            .sort((a, b) => a.identificationNumber.localeCompare(b.identificationNumber));
          
          set({ 
            animals: farmAnimals, 
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || "Failed to delete animal", 
            isLoading: false 
          });
          throw error;
        }
      },
      
      getAnimalsBySpecies: (species) => {
        return get().animals.filter(animal => animal.species === species);
      },
      
      getAnimalsByStatus: (status) => {
        return get().animals.filter(animal => animal.status === status);
      },
      
      searchAnimals: (query) => {
        const animals = get().animals;
        if (!query.trim()) return animals;
        
        const lowercaseQuery = query.toLowerCase();
        return animals.filter(animal => 
          animal.identificationNumber.toLowerCase().includes(lowercaseQuery)
        );
      },
      
      getAnimalsByAge: (minAge, maxAge) => {
        const animals = get().animals;
        return animals.filter(animal => {
          if (!animal.birthDate) return false;
          
          const birthDate = new Date(animal.birthDate);
          const now = new Date();
          const ageInMonths = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
          
          if (minAge !== undefined && ageInMonths < minAge) return false;
          if (maxAge !== undefined && ageInMonths > maxAge) return false;
          
          return true;
        });
      },
      
      getAnimalStats: (farmId) => {
        const animals = get().animals.filter(animal => 
          !farmId || animal.farmId === farmId
        );
        
        // Group by species
        const speciesGroups: Record<string, Animal[]> = {};
        animals.forEach(animal => {
          if (!speciesGroups[animal.species]) {
            speciesGroups[animal.species] = [];
          }
          speciesGroups[animal.species].push(animal);
        });
        
        // Group by status
        const statusGroups: Record<string, Animal[]> = {};
        animals.forEach(animal => {
          if (!statusGroups[animal.status]) {
            statusGroups[animal.status] = [];
          }
          statusGroups[animal.status].push(animal);
        });
        
        // Calculate health stats
        const healthy = animals.filter(animal => animal.status === "Healthy").length;
        const needsAttention = animals.filter(animal => 
          animal.status === "Sick"
        ).length;
        
        return {
          total: animals.length,
          bySpecies: Object.entries(speciesGroups).map(([species, items]) => ({
            species,
            count: items.length
          })),
          byStatus: Object.entries(statusGroups).map(([status, items]) => ({
            status,
            count: items.length
          })),
          healthy,
          needsAttention
        };
      },
    }),
    {
      name: "animal-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);