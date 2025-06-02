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

export type Transaction = {
  id: string;
  farmId: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  paymentMethod: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string; // Made optional to allow deletion
  createdAt: string;
  updatedAt: string;
};