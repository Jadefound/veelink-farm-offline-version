import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animal, Farm, Transaction, HealthRecord } from '../types';

// Simple hash function that works across all platforms
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Mock Farms Data
const mockFarms: Farm[] = [
  {
    id: 'farm-1',
    name: 'Green Valley Farm',
    location: 'California, USA',
    size: 150,
    sizeUnit: 'acres',
    type: 'Mixed Farming',
    createdAt: new Date('2023-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'farm-2',
    name: 'Sunrise Ranch',
    location: 'Texas, USA',
    size: 200,
    sizeUnit: 'acres',
    type: 'Cattle Ranch',
    createdAt: new Date('2023-03-20').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
];

// Mock Animals Data
const mockAnimals: Animal[] = [
  {
    id: 'animal-1',
    farmId: 'farm-1',
    identificationNumber: 'COW-001',
    species: 'Cattle',
    breed: 'Holstein',
    gender: 'Female',
    birthDate: '2022-05-15',
    acquisitionDate: '2022-06-01',
    status: 'Healthy',
    weight: 450,
    weightUnit: 'kg',
    price: 1200,
    acquisitionPrice: 1000,
    notes: 'High milk production cow',
    createdAt: new Date('2022-06-01').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'animal-2',
    farmId: 'farm-1',
    identificationNumber: 'COW-002',
    species: 'Cattle',
    breed: 'Angus',
    gender: 'Male',
    birthDate: '2021-08-20',
    acquisitionDate: '2021-09-10',
    status: 'Healthy',
    weight: 600,
    weightUnit: 'kg',
    price: 1800,
    acquisitionPrice: 1500,
    notes: 'Prime breeding bull',
    createdAt: new Date('2021-09-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'animal-3',
    farmId: 'farm-1',
    identificationNumber: 'GOAT-001',
    species: 'Goat',
    breed: 'Boer',
    gender: 'Female',
    birthDate: '2023-02-10',
    acquisitionDate: '2023-03-01',
    status: 'Healthy',
    weight: 45,
    weightUnit: 'kg',
    price: 300,
    acquisitionPrice: 250,
    notes: 'Good for meat production',
    createdAt: new Date('2023-03-01').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString(),
  },
  {
    id: 'animal-4',
    farmId: 'farm-2',
    identificationNumber: 'BULL-001',
    species: 'Cattle',
    breed: 'Brahman',
    gender: 'Male',
    birthDate: '2020-11-05',
    acquisitionDate: '2021-01-15',
    status: 'Healthy',
    weight: 750,
    weightUnit: 'kg',
    price: 2500,
    acquisitionPrice: 2000,
    notes: 'Excellent breeding stock',
    createdAt: new Date('2021-01-15').toISOString(),
    updatedAt: new Date('2024-01-12').toISOString(),
  },
  {
    id: 'animal-5',
    farmId: 'farm-1',
    identificationNumber: 'SHEEP-001',
    species: 'Sheep',
    breed: 'Merino',
    gender: 'Female',
    birthDate: '2023-04-12',
    acquisitionDate: '2023-05-01',
    status: 'Healthy',
    weight: 60,
    weightUnit: 'kg',
    price: 200,
    acquisitionPrice: 180,
    notes: 'High quality wool producer',
    createdAt: new Date('2023-05-01').toISOString(),
    updatedAt: new Date('2024-01-08').toISOString(),
  },
];

// Mock Transactions Data
const mockTransactions: Transaction[] = [
  {
    id: 'trans-1',
    farmId: 'farm-1',
    type: 'Income',
    category: 'Sales',
    amount: 2500,
    description: 'Milk sales - weekly',
    date: '2024-01-15',
    paymentMethod: 'Bank Transfer',
    reference: 'REF-001',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'trans-2',
    farmId: 'farm-1',
    type: 'Expense',
    category: 'Feed',
    amount: 800,
    description: 'Cattle feed purchase',
    date: '2024-01-10',
    paymentMethod: 'Cash',
    reference: 'REF-002',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'trans-3',
    farmId: 'farm-1',
    type: 'Expense',
    category: 'Medication',
    amount: 150,
    description: 'Vaccination supplies',
    date: '2024-01-08',
    paymentMethod: 'Credit Card',
    reference: 'REF-003',
    createdAt: new Date('2024-01-08').toISOString(),
    updatedAt: new Date('2024-01-08').toISOString(),
  },
  {
    id: 'trans-4',
    farmId: 'farm-2',
    type: 'Income',
    category: 'Sales',
    amount: 5000,
    description: 'Cattle sale - 2 head',
    date: '2024-01-12',
    paymentMethod: 'Bank Transfer',
    reference: 'REF-004',
    createdAt: new Date('2024-01-12').toISOString(),
    updatedAt: new Date('2024-01-12').toISOString(),
  },
  {
    id: 'trans-5',
    farmId: 'farm-1',
    type: 'Income',
    category: 'Sales',
    amount: 1200,
    description: 'Wool sales',
    date: '2024-01-05',
    paymentMethod: 'Cash',
    reference: 'REF-005',
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString(),
  },
];

// Mock Health Records Data
const mockHealthRecords: HealthRecord[] = [
  {
    id: 'health-1',
    description: 'Annual vaccination checkup',
    diagnosis: 'Healthy, due for routine vaccination',
    dosage: '2ml subcutaneous injection',
    farmId: 'farm-1',
    animalId: 'animal-1',
    type: 'Vaccination',
    date: '2024-01-10',
    treatment: 'Annual vaccination',
    medication: 'Bovine vaccine',
    cost: 25,
    veterinarian: 'Dr. Smith',
    notes: 'Routine annual vaccination',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'health-2',
    description: 'Routine hoof maintenance',
    diagnosis: 'Overgrown hooves requiring trimming',
    dosage: 'Topical application',
    farmId: 'farm-1',
    animalId: 'animal-2',
    type: 'Treatment',
    date: '2024-01-08',
    treatment: 'Hoof trimming',
    medication: 'Antiseptic spray',
    cost: 40,
    veterinarian: 'Dr. Johnson',
    notes: 'Preventive hoof care',
    createdAt: new Date('2024-01-08').toISOString(),
    updatedAt: new Date('2024-01-08').toISOString(),
  },
  {
    id: 'health-3',
    description: 'Routine health examination',
    diagnosis: 'Animal in excellent health',
    dosage: 'N/A',
    farmId: 'farm-2',
    animalId: 'animal-4',
    type: 'Checkup',
    date: '2024-01-12',
    treatment: 'General health check',
    medication: 'None',
    cost: 60,
    veterinarian: 'Dr. Williams',
    notes: 'Excellent health condition',
    createdAt: new Date('2024-01-12').toISOString(),
    updatedAt: new Date('2024-01-12').toISOString(),
  },
];

// Mock User Data
const mockUsers = [
  {
    id: 'user-1',
    email: 'demo@veelink.com',
    password: simpleHash('demo123'),
    name: 'Demo User',
    createdAt: new Date('2023-01-01').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
];

export const loadMockData = async () => {
  try {
    console.log('Loading mock data...');

    // Load farms
    await AsyncStorage.setItem('farms', JSON.stringify(mockFarms));
    console.log('Mock farms loaded');

    // Load animals
    await AsyncStorage.setItem('animals', JSON.stringify(mockAnimals));
    console.log('Mock animals loaded');

    // Load transactions
    await AsyncStorage.setItem('transactions', JSON.stringify(mockTransactions));
    console.log('Mock transactions loaded');

    // Load health records
    await AsyncStorage.setItem('healthRecords', JSON.stringify(mockHealthRecords));
    console.log('Mock health records loaded');

    // Load users
    await AsyncStorage.setItem('users', JSON.stringify(mockUsers));
    console.log('Mock users loaded');

    console.log('All mock data loaded successfully!');
    return true;
  } catch (error) {
    console.error('Failed to load mock data:', error);
    return false;
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      'farms',
      'animals',
      'transactions',
      'healthRecords',
      'users',
      'currentUser'
    ]);
    console.log('All data cleared successfully!');
    return true;
  } catch (error) {
    console.error('Failed to clear data:', error);
    return false;
  }
};