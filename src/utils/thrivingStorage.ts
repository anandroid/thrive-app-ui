import { Thriving, ThrivingJournal, JournalEntry, ThrivingStep } from '@/src/types/thriving';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import { prepareRoutineForNotification } from '@/src/utils/notificationHelper';
import { WellnessRoutine } from '@/src/services/openai/types';

const THRIVINGS_STORAGE_KEY = 'thrive_thrivings';
const JOURNALS_STORAGE_KEY = 'thrive_journals';

// Thriving Functions
export const getThrivingsFromStorage = (): Thriving[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(THRIVINGS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveThrivingToStorage = async (thriving: Thriving): Promise<void> => {
  const thrivings = getThrivingsFromStorage();
  const updatedThrivings = [...thrivings, thriving];
  localStorage.setItem(THRIVINGS_STORAGE_KEY, JSON.stringify(updatedThrivings));
  
  // Set flag that user has created a thriving
  localStorage.setItem('hasCreatedThriving', 'true');
  
  // Schedule ALL notifications (routine + steps) if in React Native and thriving is active
  if (NotificationHelper.isSupported() && thriving.isActive) {
    console.log('[ThrivingStorage] Scheduling comprehensive notifications for new thriving:', thriving.id);
    try {
      const result = await NotificationHelper.scheduleAllNotifications(thriving);
      console.log('[ThrivingStorage] Notification scheduling result:', {
        success: result.success,
        stepCount: result.stepCount,
        errors: result.errors
      });
      
      if (result.errors.length > 0) {
        console.warn('[ThrivingStorage] Some notifications failed to schedule:', result.errors);
      } else {
        console.log(`[ThrivingStorage] Successfully scheduled ${result.stepCount} step notifications`);
      }
    } catch (error) {
      console.error('[ThrivingStorage] Error scheduling comprehensive notifications:', error);
    }
  }
};

export const updateThrivingInStorage = async (thrivingId: string, updates: Partial<Thriving>): Promise<void> => {
  const thrivings = getThrivingsFromStorage();
  const updatedThrivings = thrivings.map(t => 
    t.id === thrivingId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
  );
  localStorage.setItem(THRIVINGS_STORAGE_KEY, JSON.stringify(updatedThrivings));
  
  // Handle comprehensive notification updates if in React Native
  if (NotificationHelper.isSupported()) {
    const updatedThriving = updatedThrivings.find(t => t.id === thrivingId);
    if (updatedThriving) {
      console.log('[ThrivingStorage] Updating comprehensive notifications for thriving:', thrivingId);
      
      // Cancel ALL existing notifications (routine + steps)
      await NotificationHelper.cancelRoutineReminders(thrivingId);
      await NotificationHelper.cancelStepNotifications(thrivingId);
      
      // Reschedule if still active
      if (updatedThriving.isActive) {
        try {
          const result = await NotificationHelper.scheduleAllNotifications(updatedThriving);
          console.log('[ThrivingStorage] Notification rescheduling result:', {
            success: result.success,
            stepCount: result.stepCount,
            errors: result.errors
          });
        } catch (error) {
          console.error('[ThrivingStorage] Error rescheduling comprehensive notifications:', error);
        }
      }
    }
  }
};

export const deleteThrivingFromStorage = async (thrivingId: string): Promise<void> => {
  const thrivings = getThrivingsFromStorage();
  const filteredThrivings = thrivings.filter(t => t.id !== thrivingId);
  localStorage.setItem(THRIVINGS_STORAGE_KEY, JSON.stringify(filteredThrivings));
  
  // Cancel ALL scheduled notifications (routine + steps)
  if (NotificationHelper.isSupported()) {
    console.log('[ThrivingStorage] Canceling all notifications for deleted thriving:', thrivingId);
    await NotificationHelper.cancelRoutineReminders(thrivingId);
    await NotificationHelper.cancelStepNotifications(thrivingId);
  }
  
  // Also delete associated journal
  deleteJournalByThrivingId(thrivingId);
};

export const getActiveThrivings = (): Thriving[] => {
  const thrivings = getThrivingsFromStorage();
  return thrivings.filter(t => t.isActive);
};

export const getThrivingById = (thrivingId: string): Thriving | null => {
  const thrivings = getThrivingsFromStorage();
  return thrivings.find(t => t.id === thrivingId) || null;
};

export const markThrivingCompleted = (thrivingId: string, date: string): void => {
  const thrivings = getThrivingsFromStorage();
  const updatedThrivings = thrivings.map(t => {
    if (t.id === thrivingId) {
      const completedDates = t.completedDates || [];
      if (!completedDates.includes(date)) {
        completedDates.push(date);
      }
      return { ...t, completedDates, updatedAt: new Date().toISOString() };
    }
    return t;
  });
  localStorage.setItem(THRIVINGS_STORAGE_KEY, JSON.stringify(updatedThrivings));
};

// Journal Functions
export const getJournalsFromStorage = (): ThrivingJournal[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(JOURNALS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getJournalByThrivingId = (thrivingId: string): ThrivingJournal | null => {
  const journals = getJournalsFromStorage();
  return journals.find(j => j.thrivingId === thrivingId) || null;
};

export const createJournalForThriving = (thrivingId: string): ThrivingJournal => {
  const journal: ThrivingJournal = {
    id: Date.now().toString(),
    thrivingId,
    entries: [],
    totalEntries: 0,
    createdAt: new Date().toISOString()
  };
  
  const journals = getJournalsFromStorage();
  journals.push(journal);
  localStorage.setItem(JOURNALS_STORAGE_KEY, JSON.stringify(journals));
  
  // Update thriving with journal ID
  updateThrivingInStorage(thrivingId, { journalId: journal.id });
  
  return journal;
};

export const addJournalEntry = (thrivingId: string, entry: Omit<JournalEntry, 'id' | 'thrivingId' | 'createdAt' | 'updatedAt'>): JournalEntry => {
  let journal = getJournalByThrivingId(thrivingId);
  
  // Create journal if it doesn't exist
  if (!journal) {
    journal = createJournalForThriving(thrivingId);
  }
  
  const newEntry: JournalEntry = {
    ...entry,
    id: Date.now().toString(),
    thrivingId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const journals = getJournalsFromStorage();
  const updatedJournals = journals.map(j => {
    if (j.id === journal!.id) {
      return {
        ...j,
        entries: [...j.entries, newEntry],
        lastEntryDate: newEntry.date,
        totalEntries: j.totalEntries + 1
      };
    }
    return j;
  });
  
  localStorage.setItem(JOURNALS_STORAGE_KEY, JSON.stringify(updatedJournals));
  return newEntry;
};

export const updateJournalEntry = (entryId: string, updates: Partial<JournalEntry>): void => {
  const journals = getJournalsFromStorage();
  const updatedJournals = journals.map(journal => ({
    ...journal,
    entries: journal.entries.map(entry => 
      entry.id === entryId 
        ? { ...entry, ...updates, updatedAt: new Date().toISOString() } 
        : entry
    )
  }));
  localStorage.setItem(JOURNALS_STORAGE_KEY, JSON.stringify(updatedJournals));
};

export const deleteJournalEntry = (entryId: string): void => {
  const journals = getJournalsFromStorage();
  const updatedJournals = journals.map(journal => ({
    ...journal,
    entries: journal.entries.filter(entry => entry.id !== entryId),
    totalEntries: journal.entries.filter(entry => entry.id !== entryId).length
  }));
  localStorage.setItem(JOURNALS_STORAGE_KEY, JSON.stringify(updatedJournals));
};

export const deleteJournalByThrivingId = (thrivingId: string): void => {
  const journals = getJournalsFromStorage();
  const filteredJournals = journals.filter(j => j.thrivingId !== thrivingId);
  localStorage.setItem(JOURNALS_STORAGE_KEY, JSON.stringify(filteredJournals));
};

export const getRecentJournalEntries = (thrivingId: string, limit: number = 5): JournalEntry[] => {
  const journal = getJournalByThrivingId(thrivingId);
  if (!journal) return [];
  
  return journal.entries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

// Migration function to convert existing routines to thrivings
export const migrateRoutinesToThrivings = (): void => {
  const oldRoutinesKey = 'thrive_wellness_routines';
  const existingRoutines = localStorage.getItem(oldRoutinesKey);
  
  if (existingRoutines) {
    const routines = JSON.parse(existingRoutines);
    const thrivings: Thriving[] = routines.map((routine: {
      id: string;
      routineTitle?: string;
      name?: string;
      routineDescription?: string;
      description?: string;
      routineType?: string;
      type?: string;
      duration?: number | string;
      frequency?: string;
      steps?: Array<{ title?: string; name?: string; description?: string; reminderTime?: string; time?: string; icon?: string; completed?: boolean; reminderEnabled?: boolean }>;
      additionalSteps?: Array<{ title?: string } | string>;
      proTips?: string[];
      reminderTimes?: string[];
      healthConcern?: string;
      customInstructions?: string;
      createdAt?: string;
    }) => ({
      id: routine.id,
      title: routine.routineTitle || routine.name || 'Wellness Thriving',
      description: routine.routineDescription || routine.description || '',
      type: mapRoutineTypeToThrivingType(routine.routineType || routine.type || 'wellness'),
      duration: mapDuration(routine.duration),
      frequency: routine.frequency || 'daily',
      steps: mapSteps(routine.steps || []),
      additionalRecommendations: routine.additionalSteps?.map((s: { title?: string } | string) => typeof s === 'string' ? s : s.title || '') || [],
      proTips: routine.proTips || [],
      reminderTimes: routine.reminderTimes || extractReminderTimes(routine.steps || []),
      healthConcern: routine.healthConcern,
      customInstructions: routine.customInstructions,
      createdAt: routine.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedDates: [],
      isActive: true,
      startDate: routine.createdAt || new Date().toISOString()
    }));
    
    localStorage.setItem(THRIVINGS_STORAGE_KEY, JSON.stringify(thrivings));
    localStorage.removeItem(oldRoutinesKey); // Clean up old data
  }
  
  // Also check for any thrivings with old structure
  const currentThrivings = localStorage.getItem(THRIVINGS_STORAGE_KEY);
  if (currentThrivings) {
    const thrivings = JSON.parse(currentThrivings);
    const updatedThrivings = thrivings.map((thriving: {
      id: string;
      routineTitle?: string;
      title?: string;
      routineDescription?: string;
      description?: string;
      routineType?: string;
      type?: string;
      duration?: number | string;
      frequency?: string;
      steps?: Array<{ title?: string; name?: string; description?: string; reminderTime?: string; time?: string; icon?: string; completed?: boolean; reminderEnabled?: boolean }>;
      additionalSteps?: Array<{ title?: string } | string>;
      proTips?: string[];
      reminderTimes?: string[];
      healthConcern?: string;
      customInstructions?: string;
      createdAt?: string;
      updatedAt?: string;
      completedDates?: string[];
      isActive?: boolean;
      startDate?: string;
    }) => {
      // If it has routineTitle, it's an old format
      if (thriving.routineTitle || !thriving.title) {
        return {
          id: thriving.id,
          title: thriving.routineTitle || thriving.title || 'Wellness Thriving',
          description: thriving.routineDescription || thriving.description || '',
          type: mapRoutineTypeToThrivingType(thriving.routineType || thriving.type || 'wellness'),
          duration: mapDuration(thriving.duration),
          frequency: thriving.frequency || 'daily',
          steps: mapSteps(thriving.steps || []),
          additionalRecommendations: thriving.additionalSteps?.map((s: { title?: string } | string) => typeof s === 'string' ? s : s.title || '') || [],
          proTips: thriving.proTips || [],
          reminderTimes: thriving.reminderTimes || extractReminderTimes(thriving.steps || []),
          healthConcern: thriving.healthConcern,
          customInstructions: thriving.customInstructions,
          createdAt: thriving.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedDates: thriving.completedDates || [],
          isActive: thriving.isActive !== undefined ? thriving.isActive : true,
          startDate: thriving.startDate || thriving.createdAt || new Date().toISOString()
        };
      }
      return thriving;
    });
    
    localStorage.setItem(THRIVINGS_STORAGE_KEY, JSON.stringify(updatedThrivings));
  }
};

// Helper functions for migration
const mapRoutineTypeToThrivingType = (routineType: string): Thriving['type'] => {
  const typeMap: Record<string, Thriving['type']> = {
    'wellness': 'general_wellness',
    'wellness_routine': 'general_wellness',
    'sleep_routine': 'sleep_wellness',
    'stress_management': 'stress_management',
    'pain_relief': 'pain_management',
    'meditation': 'mental_wellness',
    'exercise': 'exercise',
    'nutrition': 'nutrition'
  };
  return typeMap[routineType] || 'general_wellness';
};

const mapDuration = (duration: number | string | undefined): Thriving['duration'] => {
  if (typeof duration === 'number') {
    if (duration <= 7) return '7_days';
    if (duration <= 14) return '14_days';
    if (duration <= 30) return '30_days';
    return 'ongoing';
  }
  if (typeof duration === 'string') {
    if (duration.includes('7')) return '7_days';
    if (duration.includes('14')) return '14_days';
    if (duration.includes('30')) return '30_days';
    if (duration === 'until_better' || duration === 'ongoing') return 'ongoing';
  }
  return '7_days';
};

interface StepInput {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  reminderTime?: string;
  time?: string;
  icon?: string;
  completed?: boolean;
  reminderEnabled?: boolean;
}

const mapSteps = (steps: StepInput[]): ThrivingStep[] => {
  return steps.map((step, index) => ({
    id: step.id || `step-${index + 1}`,
    title: step.title || step.name || `Step ${index + 1}`,
    description: step.description,
    time: step.reminderTime || step.time,
    icon: step.icon,
    completed: step.completed || false,
    reminderEnabled: step.reminderEnabled !== undefined ? step.reminderEnabled : true,
    order: index + 1,
    tips: [],
    duration: 5
  }));
};

const extractReminderTimes = (steps: Array<{ reminderTime?: string; time?: string }>): string[] => {
  return steps
    .filter(step => step.reminderTime || step.time)
    .map(step => (step.reminderTime || step.time)!)
    .filter(Boolean);
};

// Sync all active thrivings with notification system
export const syncThrivingsWithNotifications = async (): Promise<void> => {
  if (!NotificationHelper.isSupported()) return;
  
  console.log('[ThrivingStorage] Syncing all thrivings with notification system');
  const thrivings = getThrivingsFromStorage();
  const activeThrivings = thrivings.filter(t => t.isActive && t.reminderTimes && t.reminderTimes.length > 0);
  
  if (activeThrivings.length > 0) {
    try {
      // Convert thrivings to routine format for notification scheduling
      const routines = activeThrivings.map(thriving => prepareRoutineForNotification({
        ...thriving,
        id: thriving.id,
        name: thriving.title,
        steps: thriving.steps || [],
        isActive: thriving.isActive,
        reminderTimes: thriving.reminderTimes || [],
        frequency: thriving.frequency,
        createdAt: new Date(thriving.createdAt),
        updatedAt: new Date(thriving.updatedAt || thriving.createdAt)
      } as unknown as WellnessRoutine));
      
      await NotificationHelper.syncRoutines(routines);
      console.log(`[ThrivingStorage] Synced ${activeThrivings.length} active thrivings`);
    } catch (error) {
      console.error('[ThrivingStorage] Error syncing notifications:', error);
    }
  }
};