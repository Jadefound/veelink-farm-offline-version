import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateId } from "@/utils/helpers";
import { BreedingRecord } from "@/types";

interface BreedingState {
  breedingRecords: BreedingRecord[];
  isLoading: boolean;
  error: string | null;

  createBreedingRecord: (
    data: Omit<BreedingRecord, "id" | "createdAt" | "updatedAt">
  ) => Promise<BreedingRecord>;
  updateBreedingRecord: (
    id: string,
    data: Partial<BreedingRecord>
  ) => Promise<void>;
  deleteBreedingRecord: (id: string) => Promise<void>;
  getBreedingRecordsByFarm: (farmId: string) => BreedingRecord[];
  getUpcomingBirths: (farmId: string, days: number) => BreedingRecord[];
  getPregnantAnimals: (farmId: string) => BreedingRecord[];
  resetStore: () => void;
}

export const useBreedingStore = create<BreedingState>()(
  persist(
    (set, get) => ({
      breedingRecords: [],
      isLoading: false,
      error: null,

      createBreedingRecord: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const newRecord: BreedingRecord = {
            id: generateId(),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            breedingRecords: [...state.breedingRecords, newRecord],
            isLoading: false,
          }));
          return newRecord;
        } catch (error: any) {
          set({
            error: error.message || "Failed to create breeding record",
            isLoading: false,
          });
          throw error;
        }
      },

      updateBreedingRecord: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          set((state) => ({
            breedingRecords: state.breedingRecords.map((record) =>
              record.id === id
                ? { ...record, ...data, updatedAt: new Date().toISOString() }
                : record
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || "Failed to update breeding record",
            isLoading: false,
          });
          throw error;
        }
      },

      deleteBreedingRecord: async (id) => {
        set({ isLoading: true, error: null });
        try {
          set((state) => ({
            breedingRecords: state.breedingRecords.filter(
              (record) => record.id !== id
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || "Failed to delete breeding record",
            isLoading: false,
          });
          throw error;
        }
      },

      getBreedingRecordsByFarm: (farmId) => {
        return get().breedingRecords.filter(
          (record) => record.farmId === farmId
        );
      },

      getUpcomingBirths: (farmId, days) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + days);
        return get()
          .breedingRecords.filter(
            (record) =>
              record.farmId === farmId &&
              record.status !== "Failed" &&
              record.status !== "Successful"
          )
          .filter((record) => {
            if (!record.expectedBirthDate) return false;
            const expected = new Date(record.expectedBirthDate);
            return expected <= cutoffDate;
          });
      },

      getPregnantAnimals: (farmId) => {
        return get().breedingRecords.filter(
          (record) => record.farmId === farmId && record.status === "Pregnant"
        );
      },

      resetStore: () => {
        set({ breedingRecords: [], isLoading: false, error: null });
      },
    }),
    {
      name: "breeding-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
