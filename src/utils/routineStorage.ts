import { WellnessRoutine } from '@/src/services/openai/types';
import { NotificationHelper } from './notificationHelper';

const STORAGE_KEY = 'wellness-routines';

/**
 * Save a new routine to localStorage and sync with native app
 */
export const saveRoutineToStorage = async (routine: WellnessRoutine): Promise<void> => {
  try {
    const existingRoutines = getRoutinesFromStorage();
    const updatedRoutines = [...existingRoutines, routine];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRoutines));
    
    // Sync with native app if available
    if (NotificationHelper.isSupported() && routine.isActive && routine.reminderTimes?.length > 0) {
      await NotificationHelper.scheduleRoutineReminders([routine]);
    }
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
 * Update an existing routine in localStorage and sync with native app
 */
export const updateRoutineInStorage = async (updatedRoutine: WellnessRoutine): Promise<boolean> => {
  try {
    const routines = getRoutinesFromStorage();
    const index = routines.findIndex(r => r.id === updatedRoutine.id);
    
    if (index === -1) {
      console.warn(`Routine with id ${updatedRoutine.id} not found`);
      return false;
    }
    
    routines[index] = updatedRoutine;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
    
    // Update in native app if available
    if (NotificationHelper.isSupported()) {
      await NotificationHelper.updateRoutine(updatedRoutine);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating routine in storage:', error);
    return false;
  }
};

/**
 * Delete a routine from localStorage and cancel notifications
 */
export const deleteRoutineFromStorage = async (routineId: string): Promise<boolean> => {
  try {
    const routines = getRoutinesFromStorage();
    const filteredRoutines = routines.filter(r => r.id !== routineId);
    
    if (filteredRoutines.length === routines.length) {
      console.warn(`Routine with id ${routineId} not found`);
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRoutines));
    
    // Cancel notifications in native app if available
    if (NotificationHelper.isSupported()) {
      await NotificationHelper.cancelRoutineReminders(routineId);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting routine from storage:', error);
    return false;
  }
};

/**
 * Toggle routine active status and update notifications
 */
export const toggleRoutineStatus = async (routineId: string): Promise<boolean> => {
  try {
    const routines = getRoutinesFromStorage();
    const routine = routines.find(r => r.id === routineId);
    
    if (!routine) {
      console.warn(`Routine with id ${routineId} not found`);
      return false;
    }
    
    routine.isActive = !routine.isActive;
    routine.updatedAt = new Date();
    
    return await updateRoutineInStorage(routine);
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

/**
 * Sync all routines with native app (called on app load)
 */
export const syncRoutinesWithNativeApp = async (): Promise<void> => {
  if (!NotificationHelper.isSupported()) return;
  
  try {
    const routines = getRoutinesFromStorage();
    await NotificationHelper.syncRoutines(routines);
  } catch (error) {
    console.error('Error syncing routines with native app:', error);
  }
};