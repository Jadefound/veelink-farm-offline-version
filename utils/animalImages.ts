/**
 * Animal Image Helper
 * 
 * Provides local fallback images for all animal species.
 * In production offline builds, these local images work without network access.
 */

import { ImageSource } from 'expo-image';

// Local image assets - these are bundled with the app and work offline
// Using require() ensures images are bundled at build time
const LOCAL_IMAGES: Record<string, any> = {
  cattle: require('../assets/animals/cattle.png'),
  sheep: require('../assets/animals/sheep.png'),
  goat: require('../assets/animals/goat.png'),
  pig: require('../assets/animals/pig.png'),
  chicken: require('../assets/animals/chicken.png'),
  duck: require('../assets/animals/duck.png'),
  turkey: require('../assets/animals/turkey.png'),
  horse: require('../assets/animals/horse.png'),
  rabbit: require('../assets/animals/rabbit.png'),
  default: require('../assets/animals/default.png'),
  other: require('../assets/animals/default.png'),
};

// Remote images - optional enhancement for higher quality when online
const REMOTE_IMAGES: Record<string, string> = {
  cattle: "https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  sheep: "https://images.pexels.com/photos/1769279/pexels-photo-1769279.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  goat: "https://images.pexels.com/photos/751689/pexels-photo-751689.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  pig: "https://images.pexels.com/photos/1300361/pexels-photo-1300361.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  chicken: "https://images.pexels.com/photos/1300358/pexels-photo-1300358.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  duck: "https://images.pexels.com/photos/416179/pexels-photo-416179.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  turkey: "https://images.pexels.com/photos/372166/pexels-photo-372166.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  horse: "https://images.pexels.com/photos/52500/horse-herd-fog-nature-52500.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  rabbit: "https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  default: "https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
  other: "https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=200&h=150&fit=crop",
};

// Color placeholders for each species (used as background while loading)
export const SPECIES_COLORS: Record<string, string> = {
  cattle: '#8B4513',   // Brown
  sheep: '#F5F5DC',    // Beige  
  goat: '#D2691E',     // Chocolate
  pig: '#FFB6C1',      // Light Pink
  chicken: '#FFD700',  // Gold
  duck: '#90EE90',     // Light Green
  turkey: '#CD853F',   // Peru
  horse: '#2F4F4F',    // Dark Slate Gray
  rabbit: '#F5DEB3',   // Wheat
  default: '#808080',  // Gray
  other: '#808080',    // Gray
};

/**
 * Get the local image source for an animal species.
 * This is the primary image source and works offline.
 * 
 * @param species - The animal species (case-insensitive)
 * @returns Local image require() source
 */
export const getLocalAnimalImage = (species: string): any => {
  const key = species.toLowerCase();
  return LOCAL_IMAGES[key] || LOCAL_IMAGES.default;
};

/**
 * Get the remote image URL for an animal species.
 * This can be used as an optional enhancement when online.
 * 
 * @param species - The animal species (case-insensitive)
 * @returns Remote image URL string
 */
export const getRemoteAnimalImage = (species: string): string => {
  const key = species.toLowerCase();
  return REMOTE_IMAGES[key] || REMOTE_IMAGES.default;
};

/**
 * Get the placeholder color for an animal species.
 * Used as background color while images load or if they fail.
 * 
 * @param species - The animal species (case-insensitive)
 * @returns Hex color string
 */
export const getSpeciesColor = (species: string): string => {
  const key = species.toLowerCase();
  return SPECIES_COLORS[key] || SPECIES_COLORS.default;
};

/**
 * Get the animal image source (local bundled image for offline support).
 * 
 * @param species - The animal species (case-insensitive)
 * @returns Image source compatible with expo-image (local require())
 */
export const getAnimalImage = (species: string): any => {
  return getLocalAnimalImage(species);
};

/**
 * Get the animal image as a URI object (for components expecting { uri: string }).
 * This uses remote images and is suitable for online mode.
 * 
 * @param species - The animal species (case-insensitive)
 * @returns Object with uri property
 */
export const getAnimalImageUri = (species: string): { uri: string } => {
  return { uri: getRemoteAnimalImage(species) };
};

// Export list of supported species
export const SUPPORTED_SPECIES = [
  'Cattle', 'Sheep', 'Goat', 'Pig', 'Chicken',
  'Duck', 'Turkey', 'Horse', 'Rabbit', 'Other'
] as const;

export type SupportedSpecies = typeof SUPPORTED_SPECIES[number];
