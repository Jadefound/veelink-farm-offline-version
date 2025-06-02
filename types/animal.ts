export interface Animal {
  id: string;
  // ... existing properties ...
  acquisitionCost?: number;
  salePrice?: number;
  currentValue?: number;
  status: 'Healthy' | 'Sick' | 'Pregnant' | 'ForSale' | 'Sold' | 'Deceased';
} 