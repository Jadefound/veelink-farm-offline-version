export type BreedingMethod = "Natural" | "Artificial Insemination";

export type BreedingStatus =
  | "Planned"
  | "Confirmed"
  | "Pregnant"
  | "Successful"
  | "Failed";

export type BreedingRecord = {
  id: string;
  farmId: string;
  femaleAnimalId: string;
  maleAnimalId?: string;
  breedingDate: string;
  expectedBirthDate: string;
  actualBirthDate?: string;
  method: BreedingMethod;
  status: BreedingStatus;
  litterSize?: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
