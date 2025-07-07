import { WellnessRoutine } from '@/src/services/openai/types';

const STORAGE_KEY = 'wellness-routines';

/**
 * Save a new routine to localStorage
 */
export const saveRoutineToStorage = (routine: WellnessRoutine): void => {
  try {
    const existingRoutines = getRoutinesFromStorage();
    const updatedRoutines = [...existingRoutines, routine];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRoutines));
  } catch (error) {
    console.error('Error saving routine to storage:', error);
    throw new Error('Failed to save routine');
  }
};

/**
 * Get all routines from localStorage
 */
export const getRoutinesFromStorage = (): WellnessRoutine[] => {
  try {
    const routinesJson = localStorage.getItem(STORAGE_KEY);
    if (!routinesJson) return [];
    
    const routines = JSON.parse(routinesJson);
    // Convert date strings back to Date objects
    return routines.map((routine: WellnessRoutine) => ({
      ...routine,
      createdAt: new Date(routine.createdAt),
      updatedAt: new Date(routine.updatedAt)
    }));
  } catch (error) {
    console.error('Error reading routines from storage:', error);
    return [];
  }
};

/**
 * Update an existing routine in localStorage
 */
export const updateRoutineInStorage = (updatedRoutine: WellnessRoutine): boolean => {
  try {
    const routines = getRoutinesFromStorage();
    const index = routines.findIndex(r => r.id === updatedRoutine.id);
    
    if (index === -1) {
      console.warn(`Routine with id ${updatedRoutine.id} not found`);
      return false;
    }
    
    routines[index] = updatedRoutine;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
    return true;
  } catch (error) {
    console.error('Error updating routine in storage:', error);
    return false;
  }
};

/**
 * Delete a routine from localStorage
 */
export const deleteRoutineFromStorage = (routineId: string): boolean => {
  try {
    const routines = getRoutinesFromStorage();
    const filteredRoutines = routines.filter(r => r.id !== routineId);
    
    if (filteredRoutines.length === routines.length) {
      console.warn(`Routine with id ${routineId} not found`);
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRoutines));
    return true;
  } catch (error) {
    console.error('Error deleting routine from storage:', error);
    return false;
  }
};

/**
 * Toggle routine active status
 */
export const toggleRoutineStatus = (routineId: string): boolean => {
  try {
    const routines = getRoutinesFromStorage();
    const routine = routines.find(r => r.id === routineId);
    
    if (!routine) {
      console.warn(`Routine with id ${routineId} not found`);
      return false;
    }
    
    routine.isActive = !routine.isActive;
    routine.updatedAt = new Date();
    
    return updateRoutineInStorage(routine);
  } catch (error) {
    console.error('Error toggling routine status:', error);
    return false;
  }
};

/**
 * Get active routines only
 */
export const getActiveRoutines = (): WellnessRoutine[] => {
  return getRoutinesFromStorage().filter(r => r.isActive);
};

/**
 * Clear all routines (use with caution)
 */
export const clearAllRoutines = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};