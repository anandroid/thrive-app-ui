import { PantryItem, RecommendedSupplement } from '@/src/types/pantry';

const PANTRY_STORAGE_KEY = 'thrive_pantry_items';
const RECOMMENDATIONS_STORAGE_KEY = 'thrive_recommended_supplements';

// Pantry Items Functions
export const getPantryItems = (): PantryItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PANTRY_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const savePantryItem = (item: PantryItem): void => {
  const items = getPantryItems();
  const updatedItems = [...items, item];
  localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(updatedItems));
};

export const updatePantryItem = (itemId: string, updates: Partial<PantryItem>): void => {
  const items = getPantryItems();
  const updatedItems = items.map(item => 
    item.id === itemId ? { ...item, ...updates } : item
  );
  localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(updatedItems));
};

export const deletePantryItem = (itemId: string): void => {
  const items = getPantryItems();
  const filteredItems = items.filter(item => item.id !== itemId);
  localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(filteredItems));
};

export const searchPantryItems = (query: string): PantryItem[] => {
  const items = getPantryItems();
  const lowercaseQuery = query.toLowerCase();
  return items.filter(item => 
    item.name.toLowerCase().includes(lowercaseQuery) ||
    item.notes?.toLowerCase().includes(lowercaseQuery) ||
    item.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

// Recommended Supplements Functions
export const getRecommendedSupplements = (): RecommendedSupplement[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveRecommendedSupplement = (supplement: RecommendedSupplement): void => {
  const supplements = getRecommendedSupplements();
  
  // Check if supplement already exists by name
  const existingIndex = supplements.findIndex(s => 
    s.name.toLowerCase() === supplement.name.toLowerCase()
  );
  
  let updatedSupplements;
  if (existingIndex !== -1) {
    // Replace existing supplement with same name
    updatedSupplements = [...supplements];
    updatedSupplements[existingIndex] = supplement;
  } else {
    // Add new supplement
    updatedSupplements = [...supplements, supplement];
  }
  
  localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(updatedSupplements));
};

export const deleteRecommendedSupplement = (supplementId: string): void => {
  const supplements = getRecommendedSupplements();
  const filteredSupplements = supplements.filter(s => s.id !== supplementId);
  localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(filteredSupplements));
};

export const getRecommendationsByCondition = (condition: string): RecommendedSupplement[] => {
  const supplements = getRecommendedSupplements();
  return supplements.filter(s => 
    s.relatedConditions.some(c => c.toLowerCase().includes(condition.toLowerCase()))
  );
};

// Utility function to convert image file to base64
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};