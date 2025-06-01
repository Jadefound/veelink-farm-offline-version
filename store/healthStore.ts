import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { HealthRecord, HealthRecordType } from "@/types";
import { useFarmStore } from "./farmStore";

interface HealthState {
  healthRecords: HealthRecord[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchHealthRecords: (farmId?: string, animalId?: string) => Promise<HealthRecord[]>;
  getHealthRecord: (id: string) => Promise<HealthRecord | undefined>;
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
      
      fetchHealthRecords: async (farmId, animalId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Get health records from storage
          const recordsData = await AsyncStorage.getItem("healthRecords");
          let records: HealthRecord[] = recordsData ? JSON.parse(recordsData) : [];
          
          // Filter by farm if farmId is provided
          if (farmId) {
            records = records.filter(record => record.farmId === farmId);
          } else {
            // Use current farm from farmStore if no farmId is provided
            const currentFarm = useFarmStore.getState().currentFarm;
            if (currentFarm) {
              records = records.filter(record => record.farmId === currentFarm.id);
            }
          }
          
          // Filter by animal if animalId is provided
          if (animalId) {
            records = records.filter(record => record.animalId === animalId);
          }
          
          // Sort by date (most recent first)
          records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          set({ healthRecords: records, isLoading: false });
          return records;
        } catch (error: any) {
          set({ 
            error: error.message || "Failed to fetch health records", 
            isLoading: false 
          });
          return [];
        }
      },
      
      getHealthRecord: async (id) => {
        try {
          // Get health records from storage
          const recordsData = await AsyncStorage.getItem("healthRecords");
          const records: HealthRecord[] = recordsData ? JSON.parse(recordsData) : [];
          
          // Find record by id
          return records.find(record => record.id === id);
        } catch (error) {
          console.error("Failed to get health record:", error);
          return undefined;
        }
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
          
          // Get all health records
          const recordsData = await AsyncStorage.getItem("healthRecords");
          const allRecords: HealthRecord[] = recordsData ? JSON.parse(recordsData) : [];
          
          // Add new record
          const updatedRecords = [...allRecords, newRecord];
          
          // Save to storage
          await AsyncStorage.setItem("healthRecords", JSON.stringify(updatedRecords));
          
          // Update state with records for current farm
          const currentFarm = useFarmStore.getState().currentFarm;
          const farmRecords = updatedRecords
            .filter(record => record.farmId === (currentFarm?.id || recordData.farmId))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          set({ 
            healthRecords: farmRecords, 
            isLoading: false 
          });
          
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
          // Get all health records
          const recordsData = await AsyncStorage.getItem("healthRecords");
          const allRecords: HealthRecord[] = recordsData ? JSON.parse(recordsData) : [];
          
          // Find and update record
          const updatedAllRecords = allRecords.map(record => 
            record.id === id 
              ? { 
                  ...record, 
                  ...recordData, 
                  updatedAt: new Date().toISOString() 
                } 
              : record
          );
          
          // Save to storage
          await AsyncStorage.setItem("healthRecords", JSON.stringify(updatedAllRecords));
          
          // Get updated record
          const updatedRecord = updatedAllRecords.find(r => r.id === id);
          if (!updatedRecord) {
            throw new Error("Health record not found");
          }
          
          // Update state with records for current farm
          const currentFarm = useFarmStore.getState().currentFarm;
          const farmRecords = updatedAllRecords
            .filter(record => record.farmId === currentFarm?.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          set({ 
            healthRecords: farmRecords, 
            isLoading: false 
          });
          
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
          // Get all health records
          const recordsData = await AsyncStorage.getItem("healthRecords");
          const allRecords: HealthRecord[] = recordsData ? JSON.parse(recordsData) : [];
          
          // Filter out the record to delete
          const updatedAllRecords = allRecords.filter(record => record.id !== id);
          
          // Save to storage
          await AsyncStorage.setItem("healthRecords", JSON.stringify(updatedAllRecords));
          
          // Update state with records for current farm
          const currentFarm = useFarmStore.getState().currentFarm;
          const farmRecords = updatedAllRecords
            .filter(record => record.farmId === currentFarm?.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          set({ 
            healthRecords: farmRecords, 
            isLoading: false 
          });
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
    }
  )
);