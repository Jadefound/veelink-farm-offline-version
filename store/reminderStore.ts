import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateId } from "@/utils/helpers";

export type ReminderType =
  | "vaccination"
  | "health_checkup"
  | "feeding"
  | "breeding"
  | "inventory_restock"
  | "custom";

export type ReminderStatus = "active" | "completed" | "snoozed" | "overdue";

export interface Reminder {
  id: string;
  farmId: string;
  animalId?: string;
  title: string;
  type: ReminderType;
  dueDate: string;
  status: ReminderStatus;
  notes?: string;
  recurring?: boolean;
  recurringDays?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface ReminderState {
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;

  createReminder: (data: Omit<Reminder, "id" | "createdAt" | "updatedAt" | "status">) => Promise<Reminder>;
  updateReminder: (id: string, data: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  snoozeReminder: (id: string, days: number) => Promise<void>;
  getRemindersByFarm: (farmId: string) => Reminder[];
  getDueReminders: (farmId: string) => Reminder[];
  getUpcomingReminders: (farmId: string, days: number) => Reminder[];
  getOverdueReminders: (farmId: string) => Reminder[];
  resetStore: () => void;
}

const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date();
};

const isDueToday = (dueDate: string): boolean => {
  const due = new Date(dueDate);
  const today = new Date();
  return due.toDateString() === today.toDateString();
};

const isWithinDays = (dueDate: string, days: number): boolean => {
  const due = new Date(dueDate);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return due <= cutoff && due >= new Date();
};

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      reminders: [],
      isLoading: false,
      error: null,

      createReminder: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const newReminder: Reminder = {
            id: generateId(),
            ...data,
            status: isOverdue(data.dueDate) ? "overdue" : "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            reminders: [...state.reminders, newReminder],
            isLoading: false,
          }));
          return newReminder;
        } catch (error: any) {
          set({ error: error.message || "Failed to create reminder", isLoading: false });
          throw error;
        }
      },

      updateReminder: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          set((state) => ({
            reminders: state.reminders.map((r) =>
              r.id === id
                ? { ...r, ...data, updatedAt: new Date().toISOString() }
                : r
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message || "Failed to update reminder", isLoading: false });
          throw error;
        }
      },

      deleteReminder: async (id) => {
        set({ isLoading: true, error: null });
        try {
          set((state) => ({
            reminders: state.reminders.filter((r) => r.id !== id),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message || "Failed to delete reminder", isLoading: false });
          throw error;
        }
      },

      completeReminder: async (id) => {
        const reminder = get().reminders.find((r) => r.id === id);
        if (!reminder) return;

        // If recurring, create the next reminder instead of just completing
        if (reminder.recurring && reminder.recurringDays) {
          const nextDueDate = new Date();
          nextDueDate.setDate(nextDueDate.getDate() + reminder.recurringDays);
          await get().createReminder({
            farmId: reminder.farmId,
            animalId: reminder.animalId,
            title: reminder.title,
            type: reminder.type,
            dueDate: nextDueDate.toISOString().split("T")[0],
            recurring: reminder.recurring,
            recurringDays: reminder.recurringDays,
            notes: reminder.notes,
          });
        }

        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id
              ? { ...r, status: "completed", completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : r
          ),
          isLoading: false,
        }));
      },

      snoozeReminder: async (id, days) => {
        const snoozedDate = new Date();
        snoozedDate.setDate(snoozedDate.getDate() + days);
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id
              ? { ...r, dueDate: snoozedDate.toISOString().split("T")[0], status: "active", updatedAt: new Date().toISOString() }
              : r
          ),
          isLoading: false,
        }));
      },

      getRemindersByFarm: (farmId) => {
        return get().reminders.filter((r) => r.farmId === farmId && r.status !== "completed");
      },

      getDueReminders: (farmId) => {
        return get().reminders.filter(
          (r) => r.farmId === farmId && r.status === "active" && isDueToday(r.dueDate)
        );
      },

      getUpcomingReminders: (farmId, days) => {
        return get().reminders.filter(
          (r) => r.farmId === farmId && r.status === "active" && isWithinDays(r.dueDate, days) && !isDueToday(r.dueDate)
        );
      },

      getOverdueReminders: (farmId) => {
        return get().reminders.filter(
          (r) => r.farmId === farmId && (r.status === "overdue" || (r.status === "active" && isOverdue(r.dueDate)))
        );
      },

      resetStore: () => {
        set({ reminders: [], isLoading: false, error: null });
      },
    }),
    {
      name: "reminder-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
