export interface BreedingRecord {
    id: string;
    farmId: string;
    maleAnimalId: string;
    femaleAnimalId: string;
    breedingDate: string;
    expectedDueDate: string;
    actualBirthDate?: string;
    offspring: string[];
    status: 'Planned' | 'Confirmed' | 'Pregnant' | 'Born' | 'Failed';
    notes?: string;
} 