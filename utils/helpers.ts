import { Transaction } from "@/types";
import { Animal } from "@/types";

/**
 * Generates a unique v4 UUID string that works across all platforms
 * @returns {string} A unique identifier
 */
export const generateId = (): string => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation that works everywhere
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Format date to display
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

// Calculate age from birth date — returns "Xy Ym" format for young animals
export const calculateAge = (birthDate: string): string => {
  const birth = new Date(birthDate);
  const now = new Date();

  if (isNaN(birth.getTime())) return "Unknown";

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }

  if (years <= 0 && months <= 0) return "Less than a month";
  if (years === 0) return `${months} month${months !== 1 ? "s" : ""}`;
  if (months === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years}y ${months}m`;
};

// Check if a task is overdue
export const isTaskOverdue = (dueDate: string): boolean => {
  const due = new Date(dueDate);
  const now = new Date();

  return due < now;
};


// Group items by a key
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, currentItem) => {
    const groupKey = String(currentItem[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(currentItem);
    return result;
  }, {} as Record<string, T[]>);
};

// Calculate statistics for animals
export const calculateAnimalStats = (animals: Animal[]) => {
  const speciesCount = groupBy(animals, "species");
  const statusCount = groupBy(animals, "status");

  return {
    total: animals.length,
    bySpecies: Object.entries(speciesCount).map(([species, items]) => ({
      species,
      count: items.length
    })),
    byStatus: Object.entries(statusCount).map(([status, items]) => ({
      status,
      count: items.length
    }))
  };
};

// Calculate financial summary
export const calculateFinancialSummary = (transactions: Transaction[]) => {
  const income = transactions
    .filter(t => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expenses,
    balance: income - expenses,
    byCategory: Object.entries(groupBy(transactions, "category"))
      .map(([category, items]) => ({
        category,
        amount: items.reduce((sum, t) => sum + t.amount, 0)
      }))
  };
};