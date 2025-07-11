/**
 * @fileoverview Shared OpenAI function definitions used by all assistants
 * @module services/openai/assistant/team/sharedFunctions
 * 
 * These functions are registered with each assistant to provide
 * consistent data access across the team.
 */

/**
 * Function definition type for assistant functions
 */
interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Shared function definitions that all assistants can use
 */
export const SHARED_FUNCTIONS: FunctionDefinition[] = [
  {
    name: 'get_pantry_items',
    description: 'Get the current pantry items (supplements, medicines, foods, remedies) the user has at home',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['all', 'supplements', 'medicines', 'foods', 'remedies'],
          description: 'Filter items by category'
        }
      }
    }
  },
  {
    name: 'get_thriving_progress',
    description: 'Get the current progress on all active thrivings (routines and journals)',
    parameters: {
      type: 'object',
      properties: {
        thriving_type: {
          type: 'string',
          enum: ['all', 'sleep_wellness', 'stress_management', 'pain_management', 'mental_wellness', 'nutrition', 'exercise', 'general_wellness', 'medication_management'],
          description: 'Filter by thriving type'
        },
        include_inactive: {
          type: 'boolean',
          description: 'Include inactive thrivings',
          default: false
        }
      }
    }
  },
  {
    name: 'search_health_history',
    description: 'Search through journal entries and health history for specific topics or symptoms',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for health history'
        },
        days_back: {
          type: 'number',
          description: 'Number of days to search back',
          default: 30
        },
        entry_type: {
          type: 'string',
          enum: ['all', 'pain', 'mood', 'symptoms', 'medications', 'supplements'],
          description: 'Filter by entry type'
        }
      },
      required: ['query']
    }
  }
];

/**
 * Function specific to supplement recommendations
 */
export const SUPPLEMENT_RECOMMENDATION_FUNCTION: FunctionDefinition = {
  name: 'get_supplement_recommendations',
  description: 'Get personalized supplement recommendations based on user health goals and conditions',
  parameters: {
    type: 'object',
    properties: {
      health_concern: {
        type: 'string',
        description: 'The primary health concern to address'
      },
      existing_medications: {
        type: 'array',
        items: { type: 'string' },
        description: 'Current medications to check for interactions'
      },
      preferences: {
        type: 'object',
        properties: {
          form: {
            type: 'string',
            enum: ['any', 'capsule', 'tablet', 'liquid', 'powder', 'gummy'],
            description: 'Preferred supplement form'
          },
          natural_only: {
            type: 'boolean',
            description: 'Prefer natural/herbal supplements only'
          }
        }
      }
    },
    required: ['health_concern']
  }
};

/**
 * Function specific to routine management
 */
export const ROUTINE_MANAGEMENT_FUNCTIONS: FunctionDefinition[] = [
  {
    name: 'analyze_schedule',
    description: 'Analyze user\'s daily schedule to find optimal times for routine activities',
    parameters: {
      type: 'object',
      properties: {
        wake_time: {
          type: 'string',
          description: 'Usual wake up time (e.g., "6:30 AM")'
        },
        sleep_time: {
          type: 'string',
          description: 'Usual sleep time (e.g., "10:30 PM")'
        },
        work_schedule: {
          type: 'string',
          description: 'Work schedule description'
        },
        fixed_commitments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string' },
              duration: { type: 'string' },
              description: { type: 'string' }
            }
          },
          description: 'Fixed daily commitments'
        }
      }
    }
  },
  {
    name: 'get_routine_templates',
    description: 'Get pre-built routine templates based on health goals',
    parameters: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          enum: ['better_sleep', 'stress_relief', 'pain_management', 'energy_boost', 'mental_clarity', 'weight_management'],
          description: 'Primary health goal'
        },
        duration_preference: {
          type: 'string',
          enum: ['5_minutes', '15_minutes', '30_minutes', '1_hour'],
          description: 'Preferred routine duration'
        }
      },
      required: ['goal']
    }
  }
];

/**
 * Get functions for a specific assistant role
 * @param {string} role - The assistant role
 * @returns {FunctionDefinition[]} Array of function definitions
 */
export const getFunctionsForRole = (role: 'chat' | 'routine' | 'pantry'): FunctionDefinition[] => {
  const baseFunctions = [...SHARED_FUNCTIONS];
  
  switch (role) {
    case 'chat':
      // Chat assistant gets all shared functions
      return baseFunctions;
      
    case 'routine':
      // Routine assistant gets shared + routine-specific functions
      return [...baseFunctions, ...ROUTINE_MANAGEMENT_FUNCTIONS];
      
    case 'pantry':
      // Pantry assistant gets shared + supplement recommendation function
      return [...baseFunctions, SUPPLEMENT_RECOMMENDATION_FUNCTION];
      
    default:
      return baseFunctions;
  }
};

/**
 * Function response formatters to ensure consistency
 */
export const formatFunctionResponse = {
  /**
   * Format pantry items response
   */
  pantryItems: (items: Array<{name: string; category: string; notes: string; dateAdded: string; tags?: string[]}>) => ({
    count: items.length,
    items: items.map(item => ({
      name: item.name,
      category: item.category,
      notes: item.notes,
      dateAdded: item.dateAdded,
      tags: item.tags || []
    }))
  }),
  
  /**
   * Format thriving progress response
   */
  thrivingProgress: (thrivings: Array<{id: string; name: string; type: string; isActive: boolean; progress?: number; nextStep?: string; streakDays?: number}>) => ({
    count: thrivings.length,
    thrivings: thrivings.map(thriving => ({
      id: thriving.id,
      name: thriving.name,
      type: thriving.type,
      isActive: thriving.isActive,
      progress: thriving.progress || 0,
      nextStep: thriving.nextStep,
      streakDays: thriving.streakDays || 0
    }))
  }),
  
  /**
   * Format health history search results
   */
  healthHistory: (entries: Array<{date: string; type: string; content: string; tags?: string[]; relevanceScore?: number}>) => ({
    count: entries.length,
    entries: entries.map(entry => ({
      date: entry.date,
      type: entry.type,
      content: entry.content,
      tags: entry.tags || [],
      relevanceScore: entry.relevanceScore || 0
    }))
  })
};