export type JourneyType = 'pain' | 'mental_health' | 'chronic_condition' | 'wellness_general';

export type MoodType = 'great' | 'good' | 'okay' | 'not_great' | 'struggling';

export interface MoodOption {
  type: MoodType;
  emoji: string;
  label: string;
  color: string;
}

export interface JourneyEntry {
  id: string;
  timestamp: Date;
  mood: MoodType;
  painLevel?: number; // 1-10 for pain journeys
  symptoms?: string[];
  notes: string;
  aiInsights?: string;
  tags?: string[];
}

export interface WellnessJourney {
  id: string;
  type: JourneyType;
  title: string;
  description: string;
  condition?: string; // For chronic conditions
  createdAt: Date;
  updatedAt: Date;
  entries: JourneyEntry[];
  isActive: boolean;
  goals?: string[];
  triggers?: string[];
  copingStrategies?: string[];
}

export interface JourneyPromptResponse {
  openingMessage: string;
  moodOptions: MoodOption[];
  followUpQuestions: string[];
  contextualPrompts?: string[];
}

export interface JourneyCreationRequest {
  type: JourneyType;
  healthConcern: string;
  previousContext?: string;
  specificCondition?: string;
  goals?: string[];
}

// Note: ActionableItem interface in index.ts already includes journey-related fields
// No need for a separate ActionableJourneyItem interface