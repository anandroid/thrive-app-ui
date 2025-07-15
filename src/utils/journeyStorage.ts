import { WellnessJourney, JourneyEntry } from '@/src/services/openai/types/journey';

const STORAGE_KEY = 'wellness-journeys';

/**
 * Save a new journey to localStorage
 */
export const saveJourneyToStorage = (journey: WellnessJourney): void => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      throw new Error('localStorage is not available');
    }
    
    const existingJourneys = getJourneysFromStorage();
    const updatedJourneys = [...existingJourneys, journey];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJourneys));
  } catch (error) {
    console.error('Error saving journey to storage:', error);
    throw new Error('Failed to save journey');
  }
};

/**
 * Get all journeys from localStorage
 */
export const getJourneysFromStorage = (): WellnessJourney[] => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    
    const journeysJson = localStorage.getItem(STORAGE_KEY);
    if (!journeysJson) return [];
    
    const journeys = JSON.parse(journeysJson);
    // Convert date strings back to Date objects
    return journeys.map((journey: WellnessJourney) => ({
      ...journey,
      createdAt: new Date(journey.createdAt),
      updatedAt: new Date(journey.updatedAt),
      entries: journey.entries.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error reading journeys from storage:', error);
    return [];
  }
};

/**
 * Get a specific journey by ID
 */
export const getJourneyById = (journeyId: string): WellnessJourney | null => {
  const journeys = getJourneysFromStorage();
  return journeys.find(j => j.id === journeyId) || null;
};

/**
 * Check if a journey exists for a specific type
 */
export const getJourneyByType = (journeyType: string): WellnessJourney | null => {
  const journeys = getJourneysFromStorage();
  return journeys.find(j => j.type === journeyType && j.isActive) || null;
};

/**
 * Add an entry to a journey
 */
export const addJourneyEntry = (journeyId: string, entry: JourneyEntry): boolean => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    
    const journeys = getJourneysFromStorage();
    const journeyIndex = journeys.findIndex(j => j.id === journeyId);
    
    if (journeyIndex === -1) {
      console.warn(`Journey with id ${journeyId} not found`);
      return false;
    }
    
    journeys[journeyIndex].entries.push(entry);
    journeys[journeyIndex].updatedAt = new Date();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
    return true;
  } catch (error) {
    console.error('Error adding journey entry:', error);
    return false;
  }
};

/**
 * Update a journey
 */
export const updateJourneyInStorage = (updatedJourney: WellnessJourney): boolean => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    
    const journeys = getJourneysFromStorage();
    const index = journeys.findIndex(j => j.id === updatedJourney.id);
    
    if (index === -1) {
      console.warn(`Journey with id ${updatedJourney.id} not found`);
      return false;
    }
    
    journeys[index] = updatedJourney;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
    return true;
  } catch (error) {
    console.error('Error updating journey in storage:', error);
    return false;
  }
};

/**
 * Get recent entries from a journey
 */
export const getRecentEntries = (journeyId: string, days: number = 7): JourneyEntry[] => {
  const journey = getJourneyById(journeyId);
  if (!journey) return [];
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return journey.entries
    .filter(entry => new Date(entry.timestamp) >= cutoffDate)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

/**
 * Get active journeys
 */
export const getActiveJourneys = (): WellnessJourney[] => {
  return getJourneysFromStorage().filter(j => j.isActive);
};

/**
 * Calculate days since last entry
 */
export const getDaysSinceLastEntry = (journeyId: string): number | null => {
  const journey = getJourneyById(journeyId);
  if (!journey || journey.entries.length === 0) return null;
  
  const lastEntry = journey.entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
  
  const daysDiff = Math.floor(
    (Date.now() - new Date(lastEntry.timestamp).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysDiff;
};