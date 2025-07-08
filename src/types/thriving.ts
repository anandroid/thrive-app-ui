// Thriving types - replacing the old routine system
// A Thriving combines daily routines with journal tracking

export interface JournalEntry {
  id: string;
  thrivingId: string;
  date: string;
  mood?: 'great' | 'good' | 'okay' | 'difficult' | 'challenging';
  moodEmoji?: string;
  content: string;
  tags?: string[];
  painLevel?: number; // 1-10 for pain tracking
  symptoms?: string[];
  gratitude?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ThrivingStep {
  id: string;
  title: string;
  description?: string;
  time?: string;
  icon?: string;
  completed?: boolean;
  reminderEnabled?: boolean;
  order: number;
  tips?: string[];
  duration?: number;
  videoUrl?: string;
  will_video_tutorial_help?: boolean;
}

export interface ThrivingJournal {
  id: string;
  thrivingId: string;
  entries: JournalEntry[];
  lastEntryDate?: string;
  totalEntries: number;
  createdAt: string;
}

export interface Thriving {
  id: string;
  title: string;
  description: string;
  type: 'sleep_wellness' | 'stress_management' | 'pain_management' | 'mental_wellness' | 'nutrition' | 'exercise' | 'general_wellness';
  icon?: string;
  color?: string;
  duration: '7_days' | '14_days' | '30_days' | 'ongoing';
  frequency: 'daily' | 'twice_daily' | 'weekly';
  steps: ThrivingStep[];
  additionalRecommendations?: string[];
  proTips?: string[];
  reminderTimes?: string[];
  journalId?: string; // Reference to attached journal
  healthConcern?: string;
  customInstructions?: string;
  createdAt: string;
  updatedAt: string;
  completedDates?: string[]; // Track completion history
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

// Helper type for creating a new thriving
export interface CreateThrivingInput {
  title: string;
  description: string;
  type: Thriving['type'];
  duration: Thriving['duration'];
  frequency: Thriving['frequency'];
  healthConcern?: string;
  customInstructions?: string;
  steps?: Omit<ThrivingStep, 'id'>[];
  additionalRecommendations?: string[];
  proTips?: string[];
  reminderTimes?: string[];
}