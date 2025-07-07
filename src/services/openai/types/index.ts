export interface StreamEvent {
  type: 'delta' | 'completed' | 'error';
  content?: string;
  threadId?: string;
  error?: string;
}

export interface AssistantResponse {
  greeting: string;
  attentionRequired: string | null;
  emergencyReasoning: string | null;
  actionItems: ActionItem[];
  additionalInformation: string;
  actionableItems: ActionableItem[];
  questions: string[];
}

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
  type: 'appointment' | 'medicine' | 'routine' | 'create_routine' | 'prescription' | 'resource' | 'link' | string;
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
  icon?: string;
  action?: string;
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
  parsedContent?: AssistantResponse;
  isStreaming?: boolean;
}