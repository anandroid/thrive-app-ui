/**
 * Function definitions and handlers for OpenAI Assistant
 * Provides real-time data access for personalized responses
 */

import { getPantryItems } from '@/src/utils/pantryStorage';
import { getRoutinesFromStorage } from '@/src/utils/routineStorage';
import { 
  getJourneysFromStorage,
  getRecentEntries 
} from '@/src/utils/journeyStorage';

// Type definitions for function arguments
interface PantryItemsArgs {
  category?: string;
  search?: string;
  limit?: number;
}

interface ThrivingProgressArgs {
  thriving_id: string;
  include_steps?: boolean;
}

interface HealthHistoryArgs {
  query: string;
  days_back?: number;
  journey_type?: string;
}

interface SupplementRecommendationArgs {
  health_concern?: string;
  exclude_existing?: boolean;
}

type FunctionArgs = PantryItemsArgs | ThrivingProgressArgs | HealthHistoryArgs | SupplementRecommendationArgs;

// Function definitions for the assistant
export const assistantFunctions = [
  {
    type: "function" as const,
    function: {
      name: "get_pantry_items",
      description: "Get user's current pantry items with details",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["all", "supplement", "medicine", "food", "herb", "remedy"],
            description: "Filter by category"
          },
          search: {
            type: "string",
            description: "Search term for specific items"
          },
          limit: {
            type: "number",
            description: "Maximum number of items to return",
            default: 10
          }
        },
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_thriving_progress",
      description: "Get progress on user's active wellness routines (thrivings)",
      parameters: {
        type: "object",
        properties: {
          thriving_id: {
            type: "string",
            description: "Specific thriving ID or 'all' for summary"
          },
          include_steps: {
            type: "boolean",
            description: "Include detailed steps in response",
            default: false
          }
        },
        required: ["thriving_id"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "search_health_history",
      description: "Search user's health journal and history",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query (symptoms, conditions, etc.)"
          },
          days_back: {
            type: "number",
            description: "Number of days to search back",
            default: 30
          },
          journey_type: {
            type: "string",
            enum: ["all", "pain_journey", "mental_health_journey", "chronic_condition_journey", "wellness_journey"],
            description: "Filter by journey type"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_supplement_recommendations",
      description: "Get AI-generated supplement recommendations based on user's health profile",
      parameters: {
        type: "object",
        properties: {
          health_concern: {
            type: "string",
            description: "Specific health concern to address"
          },
          exclude_existing: {
            type: "boolean",
            description: "Exclude items already in pantry",
            default: true
          }
        },
        required: []
      }
    }
  }
];

// Function handler
export async function handleFunctionCall(
  functionName: string, 
  args: FunctionArgs
): Promise<Record<string, unknown>> {
  console.log(`Handling function call: ${functionName}`, args);
  
  try {
    switch (functionName) {
      case 'get_pantry_items':
        return await handleGetPantryItems(args as PantryItemsArgs);
        
      case 'get_thriving_progress':
        return await handleGetThrivingProgress(args as ThrivingProgressArgs);
        
      case 'search_health_history':
        return await handleSearchHealthHistory(args as HealthHistoryArgs);
        
      case 'get_supplement_recommendations':
        return await handleGetSupplementRecommendations(args as SupplementRecommendationArgs);
        
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  } catch (error) {
    console.error(`Error in function ${functionName}:`, error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Function execution failed'
    };
  }
}

async function handleGetPantryItems(args: PantryItemsArgs) {
  const items = await getPantryItems();
  let filtered = items;
  
  // Filter by category
  if (args.category && args.category !== 'all') {
    filtered = filtered.filter(item => 
      item.tags?.includes(args.category!)
    );
  }
  
  // Search filter
  if (args.search) {
    const searchLower = args.search.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  // Limit results
  const limit = args.limit || 10;
  const results = filtered.slice(0, limit);
  
  return {
    total: filtered.length,
    items: results.map(item => ({
      id: item.id,
      name: item.name,
      tags: item.tags || [],
      notes: item.notes || '',
      dateAdded: item.dateAdded,
      lastUsed: item.lastUsed
    }))
  };
}

async function handleGetThrivingProgress(args: ThrivingProgressArgs) {
  const thrivings = await getRoutinesFromStorage();
  
  if (args.thriving_id === 'all') {
    const activeThrivings = thrivings.filter(t => t.isActive);
    return {
      total: activeThrivings.length,
      thrivings: activeThrivings.map(r => ({
        id: r.id,
        title: r.name,
        type: r.type,
        progress: calculateProgress(),
        duration: r.duration,
        frequency: r.frequency,
        startDate: r.createdAt,
        completedDates: 0 // WellnessRoutine doesn't track this
      }))
    };
  }
  
  const thriving = thrivings.find(t => t.id === args.thriving_id);
  if (!thriving) {
    return { error: true, message: 'Thriving not found' };
  }
  
  const response: Record<string, unknown> = {
    id: thriving.id,
    title: thriving.name,
    description: thriving.description,
    type: thriving.type,
    progress: calculateProgress(),
    duration: thriving.duration,
    frequency: thriving.frequency,
    startDate: thriving.createdAt,
    completedDates: [],
    isActive: thriving.isActive
  };
  
  if (args.include_steps) {
    response.steps = thriving.steps;
    response.expectedOutcomes = thriving.expectedOutcomes;
    response.safetyNotes = thriving.safetyNotes;
  }
  
  return response;
}

async function handleSearchHealthHistory(args: HealthHistoryArgs) {
  const journeys = await getJourneysFromStorage();
  const daysBack = args.days_back || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  // Filter journeys by type if specified
  let filteredJourneys = journeys;
  if (args.journey_type && args.journey_type !== 'all') {
    filteredJourneys = journeys.filter(j => j.type === args.journey_type);
  }
  
  const searchLower = args.query.toLowerCase();
  const results: Record<string, unknown>[] = [];
  
  // Search through journey entries
  for (const journey of filteredJourneys) {
    if (journey.id) {
      const entries = await getRecentEntries(journey.id, daysBack);
      
      for (const entry of entries) {
        const entryDate = new Date(entry.timestamp);
        if (entryDate < cutoffDate) continue;
        
        // Search in various fields
        const matchFound = 
          entry.notes?.toLowerCase().includes(searchLower) ||
          entry.symptoms?.some(s => s.toLowerCase().includes(searchLower)) ||
          entry.tags?.some(t => t.toLowerCase().includes(searchLower));
        
        if (matchFound) {
          results.push({
            journeyId: journey.id,
            journeyTitle: journey.title,
            journeyType: journey.type,
            entryId: entry.id,
            date: entry.timestamp,
            painLevel: entry.painLevel,
            mood: entry.mood,
            symptoms: entry.symptoms || [],
            tags: entry.tags || [],
            notes: entry.notes || ''
          });
        }
      }
    }
  }
  
  // Sort by date (most recent first)
  results.sort((a, b) => {
    const dateA = a.date as string | Date;
    const dateB = b.date as string | Date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  
  return {
    total: results.length,
    entries: results.slice(0, 20) // Limit to 20 most recent
  };
}

async function handleGetSupplementRecommendations(args: SupplementRecommendationArgs) {
  // For now, return a simple response
  // In a full implementation, this could call an AI service or use a recommendation engine
  const recommendations = [
    {
      name: "Vitamin D3",
      reason: "Supports immune system and bone health",
      dosage: "1000-2000 IU daily",
      category: "vitamin"
    },
    {
      name: "Magnesium Glycinate",
      reason: "Helps with sleep and muscle relaxation",
      dosage: "200-400mg before bed",
      category: "mineral"
    },
    {
      name: "Omega-3 Fish Oil",
      reason: "Supports heart and brain health",
      dosage: "1-2g daily with food",
      category: "supplement"
    }
  ];
  
  // Filter based on health concern if provided
  let filtered = recommendations;
  if (args.health_concern) {
    // Simple keyword matching - could be enhanced
    const concern = args.health_concern.toLowerCase();
    if (concern.includes('sleep')) {
      filtered = filtered.filter(r => 
        r.reason.toLowerCase().includes('sleep') ||
        r.name.toLowerCase().includes('magnesium')
      );
    } else if (concern.includes('immune')) {
      filtered = filtered.filter(r => 
        r.reason.toLowerCase().includes('immune') ||
        r.name.toLowerCase().includes('vitamin')
      );
    }
  }
  
  // Exclude existing if requested
  if (args.exclude_existing !== false) {
    const pantryItems = await getPantryItems();
    const pantryNames = pantryItems.map(i => i.name.toLowerCase());
    filtered = filtered.filter(r => 
      !pantryNames.includes(r.name.toLowerCase())
    );
  }
  
  return {
    recommendations: filtered,
    basedOn: args.health_concern || "general wellness"
  };
}

function calculateProgress(): number {
  // Since WellnessRoutine doesn't have completedDates, return a default progress
  // In a real implementation, this would track actual completion
  return 50; // Default to 50% for now
}