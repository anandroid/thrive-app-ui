import { RecommendedSupplement } from '@/src/types/pantry';
import { WellnessRoutine } from '@/src/services/openai/types';
import { WellnessJourney } from '@/src/services/openai/types/journey';
import { getRoutinesFromStorage } from '@/src/utils/routineStorage';
import { getJourneysFromStorage } from '@/src/utils/journeyStorage';

// Mock recommendations based on conditions and routines
// In a real app, this would call OpenAI API with user's data
export const generateSupplementRecommendations = async (): Promise<RecommendedSupplement[]> => {
  const routines = getRoutinesFromStorage();
  const journeys = getJourneysFromStorage();
  
  const recommendations: RecommendedSupplement[] = [];
  const timestamp = new Date().toISOString();
  
  // Analyze routines for conditions
  routines.forEach(routine => {
    // Sleep-related routines
    if (routine.name.toLowerCase().includes('sleep') || 
        routine.description.toLowerCase().includes('sleep')) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        name: 'Magnesium Glycinate',
        description: 'A highly absorbable form of magnesium that promotes relaxation and better sleep',
        benefits: ['Improves sleep quality', 'Reduces muscle tension', 'Calms nervous system'],
        recommendationReason: `Based on your ${routine.name} routine, magnesium can help improve sleep quality and relaxation`,
        category: 'mineral',
        dosage: '200-400mg before bed',
        warnings: ['May cause digestive upset in some people', 'Consult doctor if taking medications'],
        relatedConditions: ['insomnia', 'sleep issues', 'anxiety'],
        sourceRoutines: [routine.id],
        dateRecommended: timestamp,
        confidence: 'high'
      });
      
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        name: 'L-Theanine',
        description: 'An amino acid that promotes calm alertness and better sleep',
        benefits: ['Reduces anxiety', 'Improves sleep quality', 'No drowsiness'],
        recommendationReason: `Complements your ${routine.name} routine by promoting relaxation without sedation`,
        category: 'supplement',
        dosage: '100-200mg',
        relatedConditions: ['anxiety', 'sleep issues', 'stress'],
        sourceRoutines: [routine.id],
        dateRecommended: timestamp,
        confidence: 'medium'
      });
    }
    
    // Stress/anxiety routines
    if (routine.name.toLowerCase().includes('stress') || 
        routine.name.toLowerCase().includes('anxiety')) {
      recommendations.push({
        id: `rec-${Date.now()}-3`,
        name: 'Ashwagandha',
        description: 'An adaptogenic herb that helps manage stress and anxiety',
        benefits: ['Reduces cortisol', 'Improves stress response', 'Supports mood'],
        recommendationReason: `Your ${routine.name} routine could benefit from this stress-reducing adaptogen`,
        category: 'herb',
        dosage: '300-600mg daily',
        warnings: ['May interact with thyroid medications', 'Not for pregnant women'],
        relatedConditions: ['stress', 'anxiety', 'fatigue'],
        sourceRoutines: [routine.id],
        dateRecommended: timestamp,
        confidence: 'high'
      });
    }
    
    // Pain management routines
    if (routine.name.toLowerCase().includes('pain') || 
        routine.description.toLowerCase().includes('pain')) {
      recommendations.push({
        id: `rec-${Date.now()}-4`,
        name: 'Turmeric Curcumin',
        description: 'A powerful anti-inflammatory compound from turmeric root',
        benefits: ['Reduces inflammation', 'Eases joint pain', 'Antioxidant properties'],
        recommendationReason: `Natural anti-inflammatory support for your ${routine.name} routine`,
        category: 'herb',
        dosage: '500-1000mg with black pepper',
        warnings: ['May interact with blood thinners', 'Take with food'],
        relatedConditions: ['chronic pain', 'arthritis', 'inflammation'],
        sourceRoutines: [routine.id],
        dateRecommended: timestamp,
        confidence: 'high'
      });
    }
  });
  
  // Analyze journeys for patterns
  journeys.forEach(journey => {
    if (journey.type === 'mental_health' && 
        !recommendations.find(r => r.name === 'Vitamin D3')) {
      recommendations.push({
        id: `rec-${Date.now()}-5`,
        name: 'Vitamin D3',
        description: 'Essential vitamin for mood regulation and overall health',
        benefits: ['Supports mood', 'Immune function', 'Bone health'],
        recommendationReason: 'Mental health journeys often benefit from adequate vitamin D levels',
        category: 'vitamin',
        dosage: '1000-2000 IU daily',
        warnings: ['Get levels tested', 'Can build up in system'],
        relatedConditions: ['depression', 'seasonal affective disorder', 'mood'],
        sourceJourneys: [journey.id],
        dateRecommended: timestamp,
        confidence: 'medium'
      });
    }
  });
  
  // Remove duplicates
  const uniqueRecommendations = recommendations.filter((rec, index, self) =>
    index === self.findIndex((r) => r.name === rec.name)
  );
  
  return uniqueRecommendations.slice(0, 5); // Return top 5 recommendations
};

// Function to be called by OpenAI when user asks about supplements
export const getSupplementSuggestionsPrompt = (pantryItems: string[]): string => {
  return `Based on the user's wellness routines and journeys, suggest appropriate supplements.
  
  The user already has these items in their pantry: ${pantryItems.join(', ')}
  
  Provide recommendations that:
  1. Don't duplicate what they already have
  2. Are evidence-based and safe
  3. Match their specific health conditions
  4. Include dosage and timing suggestions
  5. Mention any interactions or warnings
  
  Format as actionable items with clear benefits and usage instructions.`;
};