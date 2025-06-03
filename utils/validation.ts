import { z } from 'zod';
import { AnimalSpecies, AnimalStatus, HealthRecordType, TransactionType, TransactionCategory } from '@/types';

// User validation schemas
export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Farm validation schema
export const farmSchema = z.object({
  name: z.string().min(1, "Farm name is required"),
  location: z.string().min(1, "Location is required"),
  size: z.number().positive("Size must be positive"),
  sizeUnit: z.string().min(1, "Size unit is required"),
  type: z.string().min(1, "Farm type is required"),
});

// Animal validation schema
export const animalSchema = z.object({
  farmId: z.string().uuid("Invalid farm ID"),
  identificationNumber: z.string().min(1, "Identification number is required"),
  species: z.enum([
    "Cattle", "Sheep", "Goat", "Pig", "Chicken", 
    "Duck", "Turkey", "Horse", "Rabbit", "Other"
  ] as [AnimalSpecies, ...AnimalSpecies[]]),
  breed: z.string().min(1, "Breed is required"),
  gender: z.enum(["Male", "Female"]),
  birthDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid birth date format"
  }),
  acquisitionDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid acquisition date format"
  }),
  status: z.enum([
    "Healthy", "Sick", "Pregnant", "Lactating", 
    "Growing", "ForSale", "Sold", "Dead"
  ] as [AnimalStatus, ...AnimalStatus[]]),
  weight: z.number().positive("Weight must be positive"),
  weightUnit: z.string().min(1, "Weight unit is required"),
  notes: z.string().optional(),
});

// Health record validation schema
export const healthRecordSchema = z.object({
  animalId: z.string().uuid("Invalid animal ID"),
  farmId: z.string().uuid("Invalid farm ID"),
  type: z.enum([
    "Vaccination", "Treatment", "Checkup", 
    "Surgery", "Medication", "Other"
  ] as [HealthRecordType, ...HealthRecordType[]]),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  description: z.string().min(1, "Description is required"),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  medication: z.string().optional(),
  dosage: z.string().optional(),
  veterinarian: z.string().optional(),
  cost: z.number().nonnegative("Cost cannot be negative"),
  notes: z.string().optional(),
});

// Transaction validation schema
export const transactionSchema = z.object({
  farmId: z.string().uuid("Invalid farm ID"),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  type: z.enum(["Income", "Expense"] as [TransactionType, ...TransactionType[]]),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum([
    "Feed", "Medication", "Equipment", "Veterinary", 
    "Labor", "Sales", "Purchase", "Utilities", "Other"
  ] as [TransactionCategory, ...TransactionCategory[]]),
  description: z.string().min(1, "Description is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
});

// Helper function to validate data with a schema and return typed result
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
}