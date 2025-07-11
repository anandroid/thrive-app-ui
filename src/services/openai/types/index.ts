export interface StreamEvent {
  type: 'delta' | 'completed' | 'error';
  content?: string;
  threadId?: string;
  error?: string;
}

export interface BasicContext {
  // Arrays provide actual content - empty arrays if no items
  pantryItems: string[]; // e.g., ["Magnesium 400mg - for sleep", "Vitamin D 2000IU"]
  activeRoutines: {
    id: string;
    name: string;
    type: string;
    reminderTimes: string[]; // e.g., ["8:00 AM", "9:00 PM"]
    steps: string[]; // e.g., ["Take magnesium (30 min before bed)", "Meditation 10min (9:00 PM)", "Journaling"]
  }[];
}

export interface QuestionField {
  type: 'text' | 'time' | 'select' | 'checkbox';
  name: string;
  label?: string;
  placeholder?: string;
  options?: string[];
  default?: string;
}

export interface EnhancedQuestion {
  id: string;
  type: 'simple' | 'time_input' | 'multi_select' | 'text_input' | 'quick_reply' | 'time_picker';
  prompt: string;
  userVoice: string;
  fields?: QuestionField[];
  quickOptions?: string[];
  options?: string[];
  placeholder?: string;
}

export interface AssistantResponse {
  greeting: string;
  attentionRequired: string | null;
  emergencyReasoning: string | null;
  actionItems: ActionItem[];
  additionalInformation: string;
  actionableItems: ActionableItem[];
  questions: EnhancedQuestion[];
}

// Partial type for progressive rendering during streaming
export type PartialAssistantResponse = Partial<AssistantResponse>;

// Runtime helper: list of keys in AssistantResponse used for quick presence checks
export const ASSISTANT_RESPONSE_KEYS: (keyof AssistantResponse)[] = [
  'greeting',
  'attentionRequired',
  'emergencyReasoning',
  'actionItems',
  'additionalInformation',
  'actionableItems',
  'questions',
];

export interface ActionItem {
  title: string;
  content: string;
  description?: string;
}

export interface ActionableItem {
  type: 'appointment' | 'medicine' | 'routine' | 'create_routine' | 'prescription' | 'resource' | 'link' | 'start_journey' | 'continue_journey' | 'buy' | 'add_to_pantry' | 'already_have' | 'adjust_routine' | 'supplement_choice' | string;
  title: string;
  description: string;
  details?: string;
  category?: string;
  link?: string;
  pharmacy_link?: string;
  amazon_link?: string;
  routineType?: string;
  duration?: string;
  frequency?: string;
  modalTitle?: string;
  modalDescription?: string;
  customInstructionsPlaceholder?: string;
  icon?: 'calendar' | 'pill' | 'heart' | 'sparkles' | 'moon' | 'brain' | 'activity' | 'file-text' | 'globe' | 'book-open' | 'edit' | 'shopping-cart' | 'plus-circle' | string;
  journeyType?: 'pain' | 'mental_health' | 'chronic_condition' | 'wellness_general';
  journey_type?: string; // For compatibility with assistant responses
  journeyId?: string;
  journeyTitle?: string;
  isExisting?: boolean;
  emoji?: string;
  action?: string;
  // Buy-specific fields
  productName?: string;
  searchQuery?: string;
  reason?: string;
  dosage?: string;
  timing?: string;
  price_range?: string;
  // Add to pantry fields
  suggestedNotes?: string;
  // Adjust routine fields
  routineId?: string;
  adjustmentInstructions?: string;
  // Already have fields
  contextMessage?: string;
}

export interface WellnessRoutine {
  id: string;
  name: string;
  description: string;
  type: string;
  duration: number;
  frequency: string;
  reminderTimes: string[];
  healthConcern: string;
  steps: RoutineStep[];
  expectedOutcomes: string[];
  safetyNotes: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  routineType?: string;
  routineTitle?: string;
  routineDescription?: string;
  totalSteps?: number;
  reminderFrequency?: string;
  additionalSteps?: AdditionalStep[];
  lastCompleted?: string;
  completionStreak?: number;
  progressTracking?: string;
  adjustmentHistory?: AdjustmentHistoryItem[];
}

export interface RoutineStep {
  order: number;
  title: string;
  description: string;
  duration: number;
  videoUrl?: string;
  stepNumber?: number;
  bestTime?: string;
  tips?: string[];
  videoSearchQuery?: string;
  reminderText?: string;
  reminderTime?: string;
  will_video_tutorial_help?: boolean;
}

export interface AdditionalStep {
  id: string;
  title: string;
  description: string;
  frequency: 'one_time' | 'as_needed' | 'weekly' | 'monthly';
  tips?: string[];
  videoSearchQuery?: string;
}

export interface AdjustmentHistoryItem {
  date: string;
  request: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  parsedContent?: AssistantResponse | PartialAssistantResponse;
  isStreaming?: boolean;
}