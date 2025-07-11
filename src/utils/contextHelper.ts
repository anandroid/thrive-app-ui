import { BasicContext } from '@/src/services/openai/types';
import { WellnessRoutine } from '@/src/services/openai/types';
import { PantryItem } from '@/src/types/pantry';
import { Thriving } from '@/src/types/thriving';

/**
 * Helper function to get BasicContext data from all possible storage locations
 * This handles the multiple storage keys that exist in the codebase
 */
export const getBasicContext = (): BasicContext => {
  try {
    // Get pantry items
    const pantryData = localStorage.getItem('thrive_pantry_items');
    const pantryItems: PantryItem[] = pantryData ? JSON.parse(pantryData) : [];
    
    // Get routines from all possible locations
    const activeRoutines = getAllActiveRoutines();
    
    // Format pantry items with key details
    const formattedPantryItems = pantryItems
      .slice(0, 20) // Limit to 20 most recent items
      .map(item => {
        let formatted = item.name;
        if (item.notes) formatted += ` - ${item.notes.substring(0, 30)}`;
        return formatted;
      });
    
    // Format routines with step names and times
    const formattedRoutines = activeRoutines
      .slice(0, 10) // Limit to 10 routines
      .map(routine => ({
        id: routine.id,
        name: routine.name,
        type: routine.type,
        reminderTimes: routine.reminderTimes || [],
        steps: routine.steps?.slice(0, 5).map(step => {
          let stepStr = step.title || step.description?.substring(0, 30) || 'Step';
          if (step.bestTime) stepStr += ` (${step.bestTime})`;
          if (step.reminderTime) stepStr += ` (${step.reminderTime})`;
          return stepStr;
        }) || []
      }));
    
    return {
      pantryItems: formattedPantryItems,
      activeRoutines: formattedRoutines
    };
  } catch (e) {
    console.log('Could not extract basic context:', e);
    return {
      pantryItems: [],
      activeRoutines: []
    };
  }
};

/**
 * Get all active routines from all possible storage locations
 * Checks multiple keys due to legacy storage patterns
 */
interface RoutineLike {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  reminderTimes?: string[];
  steps?: Array<{
    title?: string;
    description?: string;
    bestTime?: string;
    reminderTime?: string;
  }>;
}

export const getAllActiveRoutines = (): RoutineLike[] => {
  const activeRoutines: RoutineLike[] = [];
  const checkedIds = new Set<string>();
  
  // Check wellness-routines (routineStorage.ts)
  try {
    const wellnessData = localStorage.getItem('wellness-routines');
    if (wellnessData) {
      const routines: WellnessRoutine[] = JSON.parse(wellnessData);
      routines.forEach(r => {
        if (r.isActive && !checkedIds.has(r.id)) {
          activeRoutines.push(r);
          checkedIds.add(r.id);
        }
      });
    }
  } catch (e) {
    console.log('Error reading wellness-routines:', e);
  }
  
  // Check thrive_wellness_routines (legacy/migration)
  try {
    const thriveRoutinesData = localStorage.getItem('thrive_wellness_routines');
    if (thriveRoutinesData) {
      const routines: WellnessRoutine[] = JSON.parse(thriveRoutinesData);
      routines.forEach(r => {
        if (r.isActive && !checkedIds.has(r.id)) {
          activeRoutines.push(r);
          checkedIds.add(r.id);
        }
      });
    }
  } catch (e) {
    console.log('Error reading thrive_wellness_routines:', e);
  }
  
  // Check thrive_thrivings (new format)
  try {
    const thrivingsData = localStorage.getItem('thrive_thrivings');
    if (thrivingsData) {
      const thrivings: Thriving[] = JSON.parse(thrivingsData);
      thrivings.forEach(t => {
        if (t.isActive && !checkedIds.has(t.id)) {
          // Convert thriving to routine-like format for BasicContext
          activeRoutines.push({
            id: t.id,
            name: t.title,
            type: t.type,
            isActive: t.isActive,
            reminderTimes: t.reminderTimes || [],
            steps: t.steps || []
          });
          checkedIds.add(t.id);
        }
      });
    }
  } catch (e) {
    console.log('Error reading thrive_thrivings:', e);
  }
  
  return activeRoutines;
};