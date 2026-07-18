import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateId } from "@/utils/helpers";
import { Animal, AnimalSpecies, AnimalStatus } from "@/types";
import { useFarmStore } from "./farmStore";
import { getMockData, getDemoIds, getDemoFarmIds } from "@/utils/mockData";

// Pagination constants
const PAGE_SIZE = 15;

interface AnimalState {
  animals: Animal[];
  isLoading: boolean;
  error: string | null;
  _initialized: boolean;
  
  // Pagination state
  currentPage: number;
  hasMore: boolean;

  // Actions
  fetchAnimals: (farmId?: string) => Promise<Animal[]>;
  fetchAnimalsPage: (farmId: string, page: number) => Animal[];
  loadMoreAnimals: (farmId: string) => void;
  resetPagination: () => void;
  getAnimal: (id: string) => Animal | undefined;
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
  clearDemoData: () => void;
  resetStore: () => void;
}

export const useAnimalStore = create<AnimalState>()(
  persist(
    (set, get) => ({
      animals: [],
      isLoading: false,
      error: null,
      _initialized: false,
      currentPage: 1,
      hasMore: true,

      fetchAnimals: async (farmId) => {
        set({ isLoading: true, error: null });

        try {
          const state = get();
          let allAnimals = [...state.animals];

          const demoDataEnabled = (await AsyncStorage.getItem("demoDataEnabled")) === "1";

          // Only seed demo data when explicitly enabled
          if ((!state._initialized || allAnimals.length === 0) && demoDataEnabled) {
            allAnimals = getMockData("animals") as Animal[];
          }

          // Filter by farm if farmId is provided
          const targetFarmId = farmId || useFarmStore.getState().currentFarm?.id;
          let filteredAnimals = targetFarmId
            ? allAnimals.filter(animal => animal.farmId === targetFarmId)
            : allAnimals;

          // Sort by identification number for consistent ordering
          filteredAnimals.sort((a, b) => a.identificationNumber.localeCompare(b.identificationNumber));

          set({
            // IMPORTANT: store must keep the FULL dataset; screens/selectors filter by farm.
            animals: allAnimals,
            isLoading: false,
            _initialized: true,
            currentPage: 1,
            hasMore: true,
          });

          return filteredAnimals;
        } catch (error: any) {
          set({
            error: error.message || "Failed to fetch animals",
            isLoading: false,
            _initialized: true,
          });
          return [];
        }
      },

      // Get a specific page of animals (for pagination)
      fetchAnimalsPage: (farmId, page) => {
        const state = get();
        const allAnimals = state.animals.filter(animal => animal.farmId === farmId);
        const startIndex = (page - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        return allAnimals.slice(startIndex, endIndex);
      },

      // Load more animals for infinite scroll
      loadMoreAnimals: (farmId) => {
        const state = get();
        const allAnimals = state.animals.filter(animal => animal.farmId === farmId);
        const nextPage = state.currentPage + 1;
        const hasMore = nextPage * PAGE_SIZE < allAnimals.length;
        
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

      getAnimal: (id) => {
        return get().animals.find(animal => animal.id === id);
      },

      createAnimal: async (animalData) => {
        set({ isLoading: true, error: null });

        try {
          const state = get();

          // Check if identification number already exists
          const existingAnimal = state.animals.find(
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

          // Add new animal to the list
          const updatedAnimals = [...state.animals, newAnimal];

          // Update state - Zustand persist handles storage automatically
          set({
            animals: updatedAnimals,
            isLoading: false
          });

          // Keep acquisition cost in sync with linked Purchase transaction.
          try {
            const acquisitionPrice = newAnimal.acquisitionPrice || 0;
            if (acquisitionPrice > 0) {
              const { useFinancialStore } = await import("./financialStore");
              const financialStore = useFinancialStore.getState();
              const purchaseRef = `ANIMAL-PURCHASE-${newAnimal.id}`;
              const existingPurchase = financialStore.transactions.find(
                transaction => transaction.reference === purchaseRef
              );

              if (existingPurchase) {
                await financialStore.updateTransaction(existingPurchase.id, {
                  amount: acquisitionPrice,
                  date: newAnimal.acquisitionDate,
                  description: `Purchase animal ${newAnimal.identificationNumber}`,
                });
              } else {
                await financialStore.createTransaction({
                  type: "Expense",
                  category: "Purchase",
                  amount: acquisitionPrice,
                  date: newAnimal.acquisitionDate,
                  description: `Purchase animal ${newAnimal.identificationNumber}`,
                  farmId: newAnimal.farmId,
                  paymentMethod: "Cash",
                  reference: purchaseRef,
                  animalId: newAnimal.id,
                });
              }
            }
          } catch (syncError) {
            console.warn("Failed to sync purchase transaction for new animal:", syncError);
          }

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
          const state = get();

          if (animalData.identificationNumber) {
            const existingAnimal = state.animals.find(
              animal => animal.identificationNumber === animalData.identificationNumber &&
                animal.id !== id &&
                animal.farmId === state.animals.find(a => a.id === id)?.farmId
            );

            if (existingAnimal) {
              throw new Error("An animal with this identification number already exists on this farm");
            }
          }

          const index = state.animals.findIndex(a => a.id === id);
          if (index === -1) throw new Error("Animal not found");

          const updatedAnimal = {
            ...state.animals[index],
            ...animalData,
            updatedAt: new Date().toISOString()
          };

          const updatedAnimals = [
            ...state.animals.slice(0, index),
            updatedAnimal,
            ...state.animals.slice(index + 1)
          ];

          set({ animals: updatedAnimals, isLoading: false });

          // Sync linked financial transactions (Purchase + Sales) without recursion.
          // financialStore.updateTransaction / createTransaction will NOT call back
          // into animalStore because the Sales→animal auto-sync has been removed.
          try {
            const { useFinancialStore } = await import("./financialStore");
            const financialStore = useFinancialStore.getState();
            const allTxns = financialStore.transactions;

            // --- Purchase transaction ---
            const purchaseRef = `ANIMAL-PURCHASE-${updatedAnimal.id}`;
            const existingPurchase = allTxns.find(t => t.reference === purchaseRef);
            const acquisitionPrice = updatedAnimal.acquisitionPrice || 0;

            if (acquisitionPrice > 0) {
              if (existingPurchase) {
                if (existingPurchase.amount !== acquisitionPrice || existingPurchase.date !== updatedAnimal.acquisitionDate) {
                  await financialStore.updateTransaction(existingPurchase.id, {
                    amount: acquisitionPrice,
                    date: updatedAnimal.acquisitionDate,
                    description: `Purchase animal ${updatedAnimal.identificationNumber}`,
                  });
                }
              } else {
                await financialStore.createTransaction({
                  type: 'Expense',
                  category: 'Purchase',
                  amount: acquisitionPrice,
                  date: updatedAnimal.acquisitionDate,
                  description: `Purchase animal ${updatedAnimal.identificationNumber}`,
                  farmId: updatedAnimal.farmId,
                  paymentMethod: 'Cash',
                  reference: purchaseRef,
                  animalId: updatedAnimal.id,
                });
              }
            } else if (existingPurchase) {
              await financialStore.deleteTransaction(existingPurchase.id);
            }

            // --- Sales transaction ---
            const saleRef = `ANIMAL-${updatedAnimal.id}`;
            const existingSale = allTxns.find(t => t.reference === saleRef && t.category === 'Sales');

            if (updatedAnimal.status === 'Sold') {
              const saleAmount = updatedAnimal.price || 0;
              if (existingSale) {
                if (existingSale.amount !== saleAmount) {
                  await financialStore.updateTransaction(existingSale.id, {
                    amount: saleAmount,
                    description: `Sold animal ${updatedAnimal.identificationNumber}`,
                  });
                }
              } else {
                await financialStore.createTransaction({
                  type: 'Income',
                  category: 'Sales',
                  amount: saleAmount,
                  date: new Date().toISOString(),
                  description: `Sold animal ${updatedAnimal.identificationNumber}`,
                  farmId: updatedAnimal.farmId,
                  paymentMethod: 'Cash',
                  reference: saleRef,
                  animalId: updatedAnimal.id,
                });
              }
            } else if (existingSale) {
              await financialStore.deleteTransaction(existingSale.id);
            }
          } catch (e) {
            console.warn("Failed to sync linked financial transactions for animal:", e);
          }

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
          const state = get();
          const animal = state.animals.find(a => a.id === id);
          const updatedAnimals = state.animals.filter(animal => animal.id !== id);

          set({
            animals: updatedAnimals,
            isLoading: false
          });

          // Cascade: delete linked health records and financial transactions
          if (animal) {
            try {
              const { useHealthStore } = await import("./healthStore");
              await useHealthStore.getState().deleteHealthRecordsForAnimal(animal.id, animal.farmId);
            } catch (e) {
              console.warn("Failed to cascade-delete health records for animal:", e);
            }

            try {
              const { useFinancialStore } = await import("./financialStore");
              const financialStore = useFinancialStore.getState();
              const linkedTxns = financialStore.transactions.filter(
                t => t.animalId === animal.id
              );
              for (const txn of linkedTxns) {
                await financialStore.deleteTransaction(txn.id);
              }
            } catch (e) {
              console.warn("Failed to cascade-delete financial transactions for animal:", e);
            }
          }
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
      clearDemoData: () => {
        const demoAnimalIds = getDemoIds("animals");
        const demoFarmIds = getDemoFarmIds();
        const animals = get().animals.filter(a => !demoAnimalIds.has(a.id) && !demoFarmIds.has(a.farmId));
        set({ animals });
      },
      resetStore: () => {
        set({
          animals: [],
          isLoading: false,
          error: null,
          _initialized: false,
          currentPage: 1,
          hasMore: true,
        });
      },
    }),
    {
      name: "animal-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        animals: state.animals,
        _initialized: state._initialized,
        // Don't persist pagination state - reset on app start
      }),
    }
  )
);
