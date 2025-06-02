export type Farm = {
  id: string;
  name: string;
  location: string;
  size: number;
  sizeUnit: string;
  type: string;
  createdAt: string;
  updatedAt: string;
};

export type AnimalSpecies =
  | "Cattle"
  | "Sheep"
  | "Goat"
  | "Pig"
  | "Chicken"
  | "Duck"
  | "Turkey"
  | "Horse"
  | "Rabbit"
  | "Other";

export type AnimalStatus =
  | "Healthy"
  | "Sick"
  | "Pregnant"
  | "Lactating"
  | "Growing"
  | "ForSale"
  | "Sold"
  | "Recovering"
  | "Dead"; // Changed from "Deceased" to "Dead" to match usage in the code

export type Animal = {
  id: string;
  farmId: string;
  identificationNumber: string; // Primary identifier for the animal
  species: AnimalSpecies;
  breed: string;
  gender: "Male" | "Female";
  birthDate: string;
  acquisitionDate: string;
  status: AnimalStatus;
  weight: number;
  weightUnit: string;
  price: number; // Current market value of the animal
  acquisitionPrice: number; // Original purchase price
  notes: string;
  createdAt: string;
  updatedAt: string;
  age: number;
  healthStatus: 'healthy' | 'sick' | 'recovering';
  estimatedValue?: number;
};

export type HealthRecordType =
  | "Vaccination"
  | "Treatment"
  | "Checkup"
  | "Surgery"
  | "Medication"
  | "Other";

export type HealthRecord = {
  id: string;
  animalId: string;
  farmId: string;
  type: HealthRecordType;
  date: string;
  description: string;
  diagnosis: string;
  treatment: string;
  medication: string;
  dosage: string;
  veterinarian: string;
  cost: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionType =
  | "Income"
  | "Expense";

export type TransactionCategory =
  | "Feed"
  | "Medication"
  | "Equipment"
  | "Veterinary"
  | "Labor"
  | "Sales"
  | "Purchase"
  | "Utilities"
  | "Other";

export interface Transaction {
  id: string;
  farmId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  reference?: string;
  animalId?: string;
  createdAt: string;
  updatedAt: string;
}

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string; // Made optional to allow deletion
  createdAt: string;
  updatedAt: string;
};