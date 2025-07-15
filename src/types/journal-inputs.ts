/**
 * Smart Journal Input Types
 * Defines the various input types for dynamic journal creation
 */

// Smart input types that the AI can choose from
export type SmartInputType = 
  | 'slider'          // For scales (pain, energy, mood, etc)
  | 'emoji_picker'    // For quick emotional states
  | 'tag_selector'    // For multiple selections (symptoms, triggers)
  | 'time_picker'     // For time inputs (bedtime, duration)
  | 'magnitude_input' // For numeric values with units
  | 'multiple_choice' // For single selection from options
  | 'text_input'      // For free text (used sparingly)
  | 'number_input'    // For simple numbers (used sparingly)
  | 'body_map'        // For pain location selection
  | 'color_picker';   // For visual states (mood colors)

// Enhanced Custom Journal Field with smart input options
export interface SmartJournalField {
  id: string;
  type: SmartInputType;
  label: string;
  description?: string;
  required: boolean;
  
  // Input-specific configurations
  sliderConfig?: {
    min: number;
    max: number;
    step?: number;
    labels?: Record<number, string>;
    showValue?: boolean;
    gradient?: boolean; // Show color gradient
  };
  
  emojiConfig?: {
    emojiSet: string[]; // Array of emoji options
    columns?: number;   // Grid columns for display
    allowCustom?: boolean; // Allow custom emoji input
  };
  
  tagConfig?: {
    options: string[];
    maxSelections?: number;
    allowCustom?: boolean;
    placeholder?: string;
  };
  
  timeConfig?: {
    format?: '12h' | '24h';
    defaultValue?: string;
    minTime?: string;
    maxTime?: string;
  };
  
  magnitudeConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string; // 'hours', 'mg', 'glasses', 'steps', etc
    showTrend?: boolean;
  };
  
  multipleChoiceConfig?: {
    options: string[];
    layout?: 'vertical' | 'horizontal' | 'grid';
    showIcons?: boolean;
  };
  
  // Smart features
  showPreviousValue?: boolean;  // Show last entry value
  linkedTo?: string;            // Conditional display based on another field
  condition?: {
    fieldId: string;
    operator: 'equals' | 'greater' | 'less' | 'contains';
    value: unknown;
  };
  
  // Validation
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
  };
}

// Common emoji sets for quick reference
export const EMOJI_SETS = {
  mood: ['😊', '😐', '😔', '😰', '😴'],
  energy: ['⚡', '🔋', '🪫', '😴'],
  pain: ['😌', '😣', '😖', '😭'],
  feeling: ['💚', '💛', '🧡', '❤️'],
  sleep: ['😴', '🛌', '😪', '🥱', '😵'],
  stress: ['😌', '😟', '😰', '🤯', '😤'],
  symptoms: ['🤕', '🤧', '🤒', '😷', '🥵']
};

// Common tag options for different contexts
export const TAG_OPTIONS = {
  symptoms: [
    'Headache', 'Fatigue', 'Nausea', 'Dizziness', 
    'Brain fog', 'Joint pain', 'Muscle aches'
  ],
  stressTriggers: [
    'Work', 'Family', 'Health', 'Finances', 
    'Relationships', 'News', 'Social media'
  ],
  sleepDisruptors: [
    'Noise', 'Light', 'Temperature', 'Anxiety', 
    'Pain', 'Bathroom visits', 'Partner snoring'
  ],
  painTriggers: [
    'Sitting', 'Standing', 'Walking', 'Lifting',
    'Weather', 'Stress', 'Poor sleep'
  ],
  copingStrategies: [
    'Deep breathing', 'Meditation', 'Exercise', 'Music',
    'Nature walk', 'Journaling', 'Calling friend'
  ]
};

// Helper type for field values
export type JournalFieldValue = 
  | number           // For sliders, magnitude inputs
  | string           // For text, time, emoji, multiple choice
  | string[]         // For tag selectors
  | boolean          // For yes/no questions
  | { x: number; y: number }[]; // For body map

// Journal entry with dynamic field values
export interface SmartJournalEntry {
  id: string;
  thrivingId: string;
  date: string;
  
  // Dynamic field values
  fieldValues: Record<string, JournalFieldValue>;
  
  // AI-generated insights based on the entry
  aiInsight?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  
  // Optional fixed fields for backward compatibility
  mood?: string;
  moodEmoji?: string;
  content?: string;
  tags?: string[];
}