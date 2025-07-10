/**
 * Client-side function handler for OpenAI Assistant function calls
 * Executes functions with access to local storage data
 */

import { getPantryItems } from '@/src/utils/pantryStorage';
import { getRoutinesFromStorage } from '@/src/utils/routineStorage';
import { getJourneysFromStorage, getRecentEntries } from '@/src/utils/journeyStorage';

// Type definitions for function arguments
interface FunctionCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface FunctionResult {
  tool_call_id: string;
  output: string;
}

/**
 * Execute function calls on the client side with access to local storage
 */
export async function executeClientSideFunctions(
  functionCalls: FunctionCall[]
): Promise<FunctionResult[]> {
  const results: FunctionResult[] = [];

  for (const call of functionCalls) {
    try {
      const args = JSON.parse(call.function.arguments);
      let result: Record<string, unknown>;

      switch (call.function.name) {
        case 'get_pantry_items':
          result = await handleGetPantryItems(args);
          break;
        case 'get_thriving_progress':
          result = await handleGetThrivingProgress(args);
          break;
        case 'search_health_history':
          result = await handleSearchHealthHistory(args);
          break;
        case 'get_supplement_recommendations':
          result = await handleGetSupplementRecommendations(args);
          break;
        default:
          result = { error: `Unknown function: ${call.function.name}` };
      }

      results.push({
        tool_call_id: call.id,
        output: JSON.stringify(result)
      });
    } catch (error) {
      results.push({
        tool_call_id: call.id,
        output: JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Function execution failed' 
        })
      });
    }
  }

  return results;
}

async function handleGetPantryItems(args: {
  category?: string;
  search?: string;
  limit?: number;
}) {
  const items = getPantryItems(); // Direct access to localStorage
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
  
  // Apply limit
  const limit = args.limit || 10;
  const limited = filtered.slice(0, limit);
  
  return {
    total: filtered.length,
    items: limited.map(item => ({
      id: item.id,
      name: item.name,
      tags: item.tags || [],
      notes: item.notes || '',
      dateAdded: item.dateAdded
    }))
  };
}

async function handleGetThrivingProgress(args: {
  thriving_id: string;
  include_steps?: boolean;
}) {
  const routines = getRoutinesFromStorage();
  
  if (args.thriving_id === 'all') {
    const activeRoutines = routines.filter(r => r.isActive);
    return {
      total: activeRoutines.length,
      thrivings: activeRoutines.map(r => ({
        id: r.id,
        title: r.name,
        type: r.type,
        progress: 50, // Simplified for now
        duration: r.duration,
        frequency: r.frequency,
        startDate: r.createdAt,
        isActive: r.isActive
      }))
    };
  }
  
  const routine = routines.find(r => r.id === args.thriving_id);
  if (!routine) {
    return { error: true, message: 'Routine not found' };
  }
  
  const response: Record<string, unknown> = {
    id: routine.id,
    title: routine.name,
    description: routine.description,
    type: routine.type,
    progress: 50, // Simplified
    duration: routine.duration,
    frequency: routine.frequency,
    startDate: routine.createdAt,
    isActive: routine.isActive
  };
  
  if (args.include_steps) {
    response.steps = routine.steps;
    response.expectedOutcomes = routine.expectedOutcomes;
    response.safetyNotes = routine.safetyNotes;
  }
  
  return response;
}

async function handleSearchHealthHistory(args: {
  query: string;
  days_back?: number;
  journey_type?: string;
}) {
  const journeys = getJourneysFromStorage();
  const daysBack = args.days_back || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  let filteredJourneys = journeys;
  if (args.journey_type && args.journey_type !== 'all') {
    filteredJourneys = journeys.filter(j => j.type === args.journey_type);
  }
  
  const searchLower = args.query.toLowerCase();
  const results: Record<string, unknown>[] = [];
  
  for (const journey of filteredJourneys) {
    if (journey.id) {
      const entries = getRecentEntries(journey.id, daysBack);
      
      for (const entry of entries) {
        const entryDate = new Date(entry.timestamp);
        if (entryDate < cutoffDate) continue;
        
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
  
  results.sort((a, b) => {
    const dateA = a.date as string | Date;
    const dateB = b.date as string | Date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  
  return {
    total: results.length,
    entries: results.slice(0, 20)
  };
}

async function handleGetSupplementRecommendations(args: {
  health_concern?: string;
  exclude_existing?: boolean;
}) {
  // Basic recommendations - in production, this could use local ML models
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
      category: "fatty acid"
    }
  ];

  let filtered = recommendations;

  // Filter by health concern
  if (args.health_concern) {
    // Simple keyword matching for demo
    const concern = args.health_concern.toLowerCase();
    if (concern.includes('sleep')) {
      filtered = filtered.filter(r => 
        r.name.includes('Magnesium') || r.reason.toLowerCase().includes('sleep')
      );
    }
  }

  // Exclude existing if requested
  if (args.exclude_existing !== false) {
    const pantryItems = getPantryItems();
    const pantryNames = pantryItems.map(i => i.name.toLowerCase());
    filtered = filtered.filter(r => 
      !pantryNames.includes(r.name.toLowerCase())
    );
  }

  return {
    recommendations: filtered,
    total: filtered.length,
    basedOn: args.health_concern || "general wellness"
  };
}