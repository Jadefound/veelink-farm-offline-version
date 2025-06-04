import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { Animal, AnimalSpecies, AnimalStatus } from "@/types";
import { useFarmStore } from "./farmStore";
import { useFinancialStore } from "./financialStore";

// Mock data for animals
const mockAnimals: Animal[] = [
  {
    id: '1',
    farmId: 'farm-1',
    identificationNumber: 'C001',
    species: 'Cattle',
    breed: 'Holstein',
    gender: 'Female',
    birthDate: '2022-03-15',
    acquisitionDate: '2022-03-20',
    status: 'Healthy',
    weight: 450,
    weightUnit: 'kg',
    price: 1200,
    acquisitionPrice: 1000,
    notes: 'High milk producer, good health record',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z',
    age: 2,
    healthStatus: 'healthy',
    estimatedValue: 1200,
    type: 'Cattle',
  },
  {
    id: '2',
    farmId: 'farm-1',
    identificationNumber: 'G001',
    species: 'Goat',
    breed: 'Nubian',
    gender: 'Male',
    birthDate: '2023-01-10',
    acquisitionDate: '2023-01-15',
    status: 'Healthy',
    weight: 75,
    weightUnit: 'kg',
    price: 300,
    acquisitionPrice: 250,
    notes: 'Strong breeding male',
    createdAt: '2023-02-01T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z',
    age: 1,
    healthStatus: 'healthy',
    estimatedValue: 300,
    type: 'Goat',
  },
  {
    id: '3',
    farmId: 'farm-1',
    identificationNumber: 'P001',
    species: 'Pig',
    breed: 'Yorkshire',
    gender: 'Female',
    birthDate: '2023-06-01',
    acquisitionDate: '2023-06-05',
    status: 'Sick',
    weight: 120,
    weightUnit: 'kg',
    price: 400,
    acquisitionPrice: 350,
    notes: 'Currently under treatment for minor infection',
    createdAt: '2023-06-05T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z',
    age: 1,
    healthStatus: 'sick',
    estimatedValue: 400,
    type: 'Pig',
  },
  {
    id: '4',
    farmId: 'farm-1',
    identificationNumber: 'CH001',
    species: 'Chicken',
    breed: 'Rhode Island Red',
    gender: 'Female',
    birthDate: '2023-08-15',
    acquisitionDate: '2023-08-20',
    status: 'Healthy',
    weight: 2.5,
    weightUnit: 'kg',
    price: 25,
    acquisitionPrice: 20,
    notes: 'Good egg layer',
    createdAt: '2023-08-20T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z',
    age: 0,
    healthStatus: 'healthy',
    estimatedValue: 25,
    type: 'Chicken',
  },
  {
    id: '5',
    farmId: 'farm-1',
    identificationNumber: 'S001',
    species: 'Sheep',
    breed: 'Merino',
    gender: 'Female',
    birthDate: '2022-09-10',
    acquisitionDate: '2022-09-15',
    status: 'Recovering',
    weight: 65,
    weightUnit: 'kg',
    price: 200,
    acquisitionPrice: 180,
    notes: 'Recovering from minor injury',
    createdAt: '2022-09-15T10:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z',
    age: 1,
    healthStatus: 'recovering',
    estimatedValue: 200,
    type: 'Sheep',
  }
];

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
          const index = allAnimals.findIndex(a => a.id === id);
          if (index === -1) throw new Error("Animal not found");

          const updatedAnimal = {
            ...allAnimals[index],
            ...animalData,
            updatedAt: new Date().toISOString()
          };
          // Handle financial impacts
          if (animalData.status === 'Sold') {
            const financialStore = useFinancialStore.getState();
            await financialStore.createTransaction({
              type: 'Income',
              category: 'Sales',
              amount: updatedAnimal.price,
              date: new Date().toISOString(),
              description: `Sold animal ${updatedAnimal.identificationNumber}`,
              farmId: updatedAnimal.farmId,
              paymentMethod: 'Cash',
              reference: `ANIMAL-${updatedAnimal.identificationNumber}`,
            });
          }

          // Save to storage
          const updatedAllAnimals = [...allAnimals.slice(0, index), updatedAnimal, ...allAnimals.slice(index + 1)];
          await AsyncStorage.setItem("animals", JSON.stringify(updatedAllAnimals));

          // Get updated animal
          const updatedAnimalResult = updatedAllAnimals.find(a => a.id === id);
          if (!updatedAnimalResult) {
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

          return updatedAnimalResult;
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