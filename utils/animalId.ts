import { Animal } from "@/types";

const SPECIES_PREFIXES: Record<string, string> = {
  Cattle: "C",
  Sheep: "S",
  Goat: "G",
  Pig: "P",
  Chicken: "CH",
  Duck: "D",
  Turkey: "T",
  Horse: "H",
  Rabbit: "R",
  Other: "O",
};

/**
 * Generate a species-based animal ID using the max-suffix algorithm.
 * Finds the highest existing numeric suffix for the species and increments it,
 * avoiding collisions after deletions.
 *
 * @param species - The animal species
 * @param existingAnimals - Current animals in the store
 * @returns A unique ID like "C001", "S002", etc.
 */
export const generateAnimalId = (
  species: string,
  existingAnimals: Animal[]
): string => {
  const prefix = SPECIES_PREFIXES[species] || "O";

  const speciesNumbers = existingAnimals
    .filter(animal => animal.species === species)
    .map(animal => {
      const id = animal.identificationNumber || "";
      return id.startsWith(prefix)
        ? parseInt(id.replace(prefix, "")) || 0
        : 0;
    });

  const maxNumber = speciesNumbers.length > 0 ? Math.max(...speciesNumbers) : 0;
  const nextNumber = (maxNumber + 1).toString().padStart(3, "0");

  return `${prefix}${nextNumber}`;
};
