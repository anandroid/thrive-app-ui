export interface PantryItem {
  id: string;
  name: string;
  imageUrl?: string;
  notes?: string;
  dateAdded: string;
  lastUsed?: string;
  tags?: string[]; // Tags can include: supplement, medicine, food, remedy, vitamin, herb, etc.
}

export interface RecommendedSupplement {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  recommendationReason: string;
  category: 'vitamin' | 'mineral' | 'herb' | 'supplement' | 'other';
  dosage?: string;
  warnings?: string[];
  relatedConditions: string[];
  sourceRoutines?: string[]; // IDs of routines this was recommended from
  sourceJourneys?: string[]; // IDs of journeys this was recommended from
  dateRecommended: string;
  confidence: 'high' | 'medium' | 'low';
}