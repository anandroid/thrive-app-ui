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
  customData?: Record<string, unknown>; // Dynamic field values
  routineVersion?: string; // Track routine changes
  aiInsights?: string; // Assistant-generated insights
  createdAt: string;
  updatedAt: string;
}

// Dynamic Journal Field Types
export interface CustomJournalField {
  id: string;
  type: 'mood_scale' | 'pain_scale' | 'energy_level' | 'sleep_quality' | 'symptom_tracker' | 'supplement_effects' | 'custom_metric' | 'time_input' | 'text_area' | 'checkbox_list' | 'rating_scale';
  label: string;
  description?: string;
  required: boolean;
  options?: string[]; // For dropdowns/checkboxes
  scale?: { min: number; max: number; labels: Record<number, string> };
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface JournalPrompt {
  id: string;
  question: string;
  type: 'reflection' | 'tracking' | 'troubleshooting' | 'celebration';
  priority: number; // Higher number = higher priority
  conditions?: {
    daysCompleted?: number;
    painLevel?: { min?: number; max?: number };
    mood?: string[];
    customField?: { fieldId: string; value: unknown };
  };
}

export interface DynamicJournalTemplate {
  templateId: string;
  routineId: string;
  journalType: 'sleep_tracking' | 'pain_monitoring' | 'mood_wellness' | 'stress_management' | 'medication_tracking' | 'general_wellness';
  customFields: CustomJournalField[];
  prompts: JournalPrompt[];
  trackingFocus: string[];
  visualizations?: ('body_map' | 'mood_chart' | 'energy_timeline' | 'pain_heatmap')[];
  version: string;
  createdAt: string;
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
  template?: DynamicJournalTemplate;
  insights?: JournalInsights;
  createdAt: string;
}

// User Learning Profile for AI Personalization
export interface UserLearningProfile {
  userId: string;
  insights: {
    sleepOptimization: {
      optimalBedtime?: string;
      effectiveSupplements: Array<{name: string, effectiveness: number, confidence: number}>;
      environmentFactors: string[];
      averageQuality: number;
      patterns: Record<string, unknown>;
    };
    painManagement: {
      triggers: Array<{trigger: string, frequency: number, confidence: number}>;
      reliefStrategies: Array<{strategy: string, effectiveness: number, confidence: number}>;
      optimalExerciseTiming?: string;
      painPatterns: Record<string, unknown>;
    };
    stressManagement: {
      stressTriggers: string[];
      effectiveCopingStrategies: Array<{strategy: string, effectiveness: number}>;
      optimalStressRelieveTiming?: string;
      stressPatterns: Record<string, unknown>;
    };
    routinePersonalization: {
      preferredTiming: string[];
      motivationStyle: 'gentle' | 'structured' | 'flexible';
      successPatterns: string[];
      completionRates: Record<string, number>;
    };
    supplementTracking: {
      effectiveness: Record<string, {rating: number, sideEffects: string[], timing: string}>;
      interactions: string[];
      preferences: string[];
    };
  };
  dataPoints: number; // Number of journal entries analyzed
  lastUpdated: string;
  confidenceLevel: number; // 0-1, based on data quantity and consistency
  version: string;
}

// Journal Analytics and Insights
export interface JournalInsights {
  patterns: {
    sleepQuality?: {
      average: number;
      trend: 'improving' | 'declining' | 'stable';
      correlations: Array<{factor: string, correlation: number}>;
    };
    painLevels?: {
      average: number;
      trend: 'improving' | 'declining' | 'stable';
      triggers: Array<{trigger: string, impact: number}>;
    };
    moodPatterns?: {
      mostCommon: string;
      trend: 'improving' | 'declining' | 'stable';
      triggers: string[];
    };
    routineAdherence?: {
      completionRate: number;
      bestDays: string[];
      challengingTimes: string[];
    };
  };
  recommendations: Array<{
    type: 'timing' | 'supplement' | 'activity' | 'environment';
    suggestion: string;
    confidence: number;
    reasoning: string;
  }>;
  celebratoryInsights: string[];
  lastAnalyzed: string;
}

export interface AdditionalRecommendation {
  id?: string;
  title: string;
  description?: string;
  frequency?: 'one_time' | 'daily' | 'weekly' | 'as_needed';
  tips?: string[];
  videoSearchQuery?: string;
  will_video_tutorial_help?: boolean;
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
  additionalRecommendations?: (string | AdditionalRecommendation)[];
  proTips?: string[];
  reminderTimes?: string[];
  journalId?: string; // Reference to attached journal
  journalTemplate?: DynamicJournalTemplate; // Dynamic journal configuration
  healthConcern?: string;
  customInstructions?: string;
  createdAt: string;
  updatedAt: string;
  completedDates?: string[]; // Track completion history
  isActive: boolean;
  startDate: string;
  endDate?: string;
  version: string; // Track routine changes for journal insights
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