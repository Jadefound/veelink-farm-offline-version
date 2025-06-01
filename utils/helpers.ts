import 'react-native-get-random-values';
import { Platform } from "react-native";
import { v4 as uuidv4 } from 'uuid';

// Generate a unique ID using UUID v4 (cryptographically strong random IDs)
export const generateId = (): string => {
  return uuidv4();
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
    currency: "USD",
  }).format(amount);
};

// Calculate age from birth date
export const calculateAge = (birthDate: string): string => {
  const birth = new Date(birthDate);
  const now = new Date();

  const yearDiff = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    return `${yearDiff - 1} years`;
  }

  return `${yearDiff} years`;
};

// Check if a task is overdue
export const isTaskOverdue = (dueDate: string): boolean => {
  const due = new Date(dueDate);
  const now = new Date();

  return due < now;
};

// Get platform-specific styles
export const getPlatformStyles = (webStyles: any, nativeStyles: any) => {
  return Platform.OS === "web" ? webStyles : nativeStyles;
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
export const calculateAnimalStats = (animals: any[]) => {
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
export const calculateFinancialSummary = (transactions: any[]) => {
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