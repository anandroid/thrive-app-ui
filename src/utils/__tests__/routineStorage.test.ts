import { WellnessRoutine } from '@/src/services/openai/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Utility functions for routine storage
export const saveRoutineToStorage = (routine: WellnessRoutine): void => {
  const existingRoutines = localStorage.getItem('wellness-routines');
  const routines = existingRoutines ? JSON.parse(existingRoutines) : [];
  routines.push(routine);
  localStorage.setItem('wellness-routines', JSON.stringify(routines));
};

export const getRoutinesFromStorage = (): WellnessRoutine[] => {
  const routines = localStorage.getItem('wellness-routines');
  return routines ? JSON.parse(routines) : [];
};

export const updateRoutineInStorage = (updatedRoutine: WellnessRoutine): void => {
  const routines = getRoutinesFromStorage();
  const index = routines.findIndex(r => r.id === updatedRoutine.id);
  if (index !== -1) {
    routines[index] = updatedRoutine;
    localStorage.setItem('wellness-routines', JSON.stringify(routines));
  }
};

export const deleteRoutineFromStorage = (routineId: string): void => {
  const routines = getRoutinesFromStorage();
  const filtered = routines.filter(r => r.id !== routineId);
  localStorage.setItem('wellness-routines', JSON.stringify(filtered));
};

// Tests
describe('Routine Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockRoutine: WellnessRoutine = {
    id: '1751860385484',
    name: 'Sustainable Weight Loss Journey 🥗',
    description: 'This routine will guide you through daily activities',
    type: 'weight_loss',
    duration: 20,
    frequency: 'daily',
    reminderTimes: ['07:10', '08:00', '08:30', '12:30', '21:30'],
    healthConcern: 'Help me lose weight sustainably',
    steps: [
      {
        order: 1,
        title: 'Hydrate First Thing 💧',
        description: 'Start your day by drinking water',
        duration: 5,
        stepNumber: 1,
        bestTime: 'Morning (07:00)',
        tips: ['Keep a water bottle by your bed'],
        videoSearchQuery: 'benefits of drinking water',
        reminderText: 'Don\'t forget to hydrate!',
        reminderTime: '07:10'
      }
    ],
    expectedOutcomes: ['Improved hydration'],
    safetyNotes: ['Consult healthcare provider'],
    createdAt: new Date('2025-07-07T03:53:05.485Z'),
    updatedAt: new Date('2025-07-07T03:53:05.485Z'),
    isActive: true,
    routineType: 'weight_loss',
    routineTitle: 'Sustainable Weight Loss Journey 🥗',
    routineDescription: 'This routine will guide you through daily activities',
    totalSteps: 5,
    reminderFrequency: 'daily'
  };

  test('should save a routine to localStorage', () => {
    saveRoutineToStorage(mockRoutine);
    
    const stored = localStorage.getItem('wellness-routines');
    expect(stored).not.toBeNull();
    
    const routines = JSON.parse(stored!);
    expect(routines).toHaveLength(1);
    expect(routines[0].id).toBe(mockRoutine.id);
  });

  test('should append to existing routines', () => {
    const routine1 = { ...mockRoutine, id: '1' };
    const routine2 = { ...mockRoutine, id: '2' };
    
    saveRoutineToStorage(routine1);
    saveRoutineToStorage(routine2);
    
    const routines = getRoutinesFromStorage();
    expect(routines).toHaveLength(2);
    expect(routines[0].id).toBe('1');
    expect(routines[1].id).toBe('2');
  });

  test('should get empty array when no routines exist', () => {
    const routines = getRoutinesFromStorage();
    expect(routines).toEqual([]);
  });

  test('should update an existing routine', () => {
    saveRoutineToStorage(mockRoutine);
    
    const updatedRoutine = {
      ...mockRoutine,
      name: 'Updated Routine Name'
    };
    
    updateRoutineInStorage(updatedRoutine);
    
    const routines = getRoutinesFromStorage();
    expect(routines).toHaveLength(1);
    expect(routines[0].name).toBe('Updated Routine Name');
  });

  test('should delete a routine by id', () => {
    const routine1 = { ...mockRoutine, id: '1' };
    const routine2 = { ...mockRoutine, id: '2' };
    
    saveRoutineToStorage(routine1);
    saveRoutineToStorage(routine2);
    
    deleteRoutineFromStorage('1');
    
    const routines = getRoutinesFromStorage();
    expect(routines).toHaveLength(1);
    expect(routines[0].id).toBe('2');
  });

  test('should handle malformed localStorage data gracefully', () => {
    localStorage.setItem('wellness-routines', 'invalid json');
    
    expect(() => getRoutinesFromStorage()).toThrow();
  });
});