# OpenAI Assistant Context Management Improvements

## Current Limitations

The current implementation uses OpenAI's thread API but has several gaps:
- Context is appended to each message rather than maintained at thread level
- No persistent user profile or preferences across threads
- Thread metadata is not utilized
- No dynamic context injection based on conversation
- Missing function calling for real-time data access

## Proposed Solution

### 1. Enhanced Thread Context Manager

```typescript
// src/services/openai/context/ThreadContextManager.ts
import { openai } from '@/src/lib/openai';
import { dbOperations } from '@/src/utils/dbStorage';

export interface UserContext {
  pantryItems: string[];
  activeThrivings: Array<{
    id: string;
    title: string;
    type: string;
    progress: number;
    nextStep?: string;
  }>;
  recentJournalEntries: Array<{
    date: string;
    summary: string;
    mood?: string;
  }>;
  healthProfile: {
    conditions: string[];
    allergies: string[];
    preferences: string[];
  };
}

export class ThreadContextManager {
  private static instance: ThreadContextManager;
  private userContextCache = new Map<string, UserContext>();

  static getInstance() {
    if (!ThreadContextManager.instance) {
      ThreadContextManager.instance = new ThreadContextManager();
    }
    return ThreadContextManager.instance;
  }

  /**
   * Build comprehensive user context from local storage
   */
  async buildUserContext(userId: string): Promise<UserContext> {
    // Check cache first
    if (this.userContextCache.has(userId)) {
      return this.userContextCache.get(userId)!;
    }

    // Fetch from IndexedDB
    const [pantryItems, thrivings, journeys] = await Promise.all([
      dbOperations.getPantryItemsFromStorage(),
      dbOperations.getThrivingsFromStorage(),
      dbOperations.getJourneysFromStorage()
    ]);

    // Build context
    const context: UserContext = {
      pantryItems: pantryItems.slice(0, 20).map(item => 
        `${item.name}${item.tags?.length ? ` (${item.tags.join(', ')})` : ''}`
      ),
      activeThrivings: thrivings
        .filter(t => t.isActive)
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          title: t.title,
          type: t.type,
          progress: this.calculateProgress(t),
          nextStep: this.getNextStep(t)
        })),
      recentJournalEntries: this.getRecentJournalEntries(journeys, 5),
      healthProfile: this.extractHealthProfile(thrivings, journeys)
    };

    // Cache for 5 minutes
    this.userContextCache.set(userId, context);
    setTimeout(() => this.userContextCache.delete(userId), 5 * 60 * 1000);

    return context;
  }

  /**
   * Create context-aware run instructions
   */
  async createRunInstructions(userId: string, intent?: string): Promise<string> {
    const context = await this.buildUserContext(userId);
    
    let instructions = `Current user context:
    
Pantry Items (${context.pantryItems.length} total):
${context.pantryItems.join(', ')}

Active Wellness Routines:
${context.activeThrivings.map(t => 
  `- ${t.title} (${t.type}) - ${t.progress}% complete${t.nextStep ? `, Next: ${t.nextStep}` : ''}`
).join('\n')}

Recent Health Journal:
${context.recentJournalEntries.map(e => 
  `- ${e.date}: ${e.summary}${e.mood ? ` (Mood: ${e.mood})` : ''}`
).join('\n')}

Health Profile:
- Conditions: ${context.healthProfile.conditions.join(', ') || 'None reported'}
- Allergies: ${context.healthProfile.allergies.join(', ') || 'None reported'}
- Preferences: ${context.healthProfile.preferences.join(', ') || 'None specified'}

IMPORTANT: Use this context to provide personalized health recommendations. Reference specific pantry items when suggesting remedies. Consider active routines when giving advice.`;

    // Add intent-specific instructions
    if (intent === 'create_routine') {
      instructions += '\n\nUser wants to create a new wellness routine. Consider their existing routines to avoid conflicts.';
    } else if (intent === 'pantry_check') {
      instructions += '\n\nUser is asking about their pantry. Be specific about items they have and suggest how to use them.';
    }

    return instructions;
  }

  private calculateProgress(thriving: any): number {
    if (!thriving.completedDates?.length) return 0;
    const totalDays = this.getTotalDays(thriving.duration);
    return Math.round((thriving.completedDates.length / totalDays) * 100);
  }

  private getNextStep(thriving: any): string | undefined {
    const now = new Date();
    const todaySteps = thriving.steps?.filter((step: any) => 
      this.isStepForToday(step, now)
    );
    return todaySteps?.[0]?.title;
  }

  private getTotalDays(duration: string): number {
    const durationMap: Record<string, number> = {
      '7_days': 7,
      '14_days': 14,
      '30_days': 30,
      'ongoing': 30
    };
    return durationMap[duration] || 30;
  }

  private isStepForToday(step: any, date: Date): boolean {
    const hour = date.getHours();
    const timeSlots: Record<string, [number, number]> = {
      'morning': [5, 12],
      'afternoon': [12, 17],
      'evening': [17, 21],
      'night': [21, 24]
    };
    
    const [start, end] = timeSlots[step.timeOfDay] || [0, 24];
    return hour >= start && hour < end;
  }

  private getRecentJournalEntries(journeys: any[], limit: number) {
    // Extract recent entries from all journeys
    const allEntries: any[] = [];
    journeys.forEach(journey => {
      if (journey.entries) {
        allEntries.push(...journey.entries);
      }
    });

    return allEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map(entry => ({
        date: new Date(entry.date).toLocaleDateString(),
        summary: this.summarizeEntry(entry),
        mood: entry.mood
      }));
  }

  private summarizeEntry(entry: any): string {
    // Simple summarization - in production, could use AI
    const parts = [];
    if (entry.symptoms) parts.push(`Symptoms: ${entry.symptoms}`);
    if (entry.notes) parts.push(entry.notes.slice(0, 50) + '...');
    return parts.join('. ') || 'Journal entry';
  }

  private extractHealthProfile(thrivings: any[], journeys: any[]) {
    const conditions = new Set<string>();
    const allergies = new Set<string>();
    const preferences = new Set<string>();

    // Extract from thrivings
    thrivings.forEach(t => {
      if (t.healthConcern) conditions.add(t.healthConcern);
      if (t.customInstructions?.includes('allerg')) {
        // Simple allergy detection - could be improved
        allergies.add('Check custom instructions');
      }
    });

    // Extract from journeys
    journeys.forEach(j => {
      if (j.type?.includes('allergy')) allergies.add(j.title);
      if (j.condition) conditions.add(j.condition);
    });

    return {
      conditions: Array.from(conditions),
      allergies: Array.from(allergies),
      preferences: Array.from(preferences)
    };
  }
}
```

### 2. Enhanced Streaming Service with Context

```typescript
// Update src/services/openai/chat/streamingService.ts
import { ThreadContextManager } from '../context/ThreadContextManager';

export class StreamingChatService {
  private contextManager = ThreadContextManager.getInstance();
  
  async sendMessage(threadId: string, message: string, chatIntent?: string) {
    try {
      // Add the message to the thread
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message
      });

      // Get dynamic context instructions
      const userId = this.getCurrentUserId(); // Implement based on your auth
      const contextInstructions = await this.contextManager.createRunInstructions(
        userId, 
        chatIntent
      );

      // Create and execute the run with context
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId,
        instructions: contextInstructions,
        max_prompt_tokens: 10000, // Limit context to manage costs
        metadata: {
          intent: chatIntent || 'general',
          timestamp: new Date().toISOString()
        }
      });

      return run;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}
```

### 3. Function Calling for Real-Time Data

```typescript
// src/services/openai/functions/assistantFunctions.ts
export const assistantFunctions = [
  {
    type: "function",
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
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_thriving_progress",
      description: "Get progress on user's active wellness routines",
      parameters: {
        type: "object",
        properties: {
          thriving_id: {
            type: "string",
            description: "Specific thriving ID or 'all' for summary"
          }
        }
      }
    }
  },
  {
    type: "function",
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
            description: "Number of days to search back"
          }
        }
      }
    }
  }
];

// Function handler
export async function handleFunctionCall(functionName: string, args: any) {
  switch (functionName) {
    case 'get_pantry_items':
      const items = await dbOperations.getPantryItemsFromStorage();
      const filtered = args.category !== 'all' 
        ? items.filter(i => i.tags?.includes(args.category))
        : items;
      return filtered.filter(i => 
        !args.search || i.name.toLowerCase().includes(args.search.toLowerCase())
      );
      
    case 'get_thriving_progress':
      const thrivings = await dbOperations.getThrivingsFromStorage();
      if (args.thriving_id === 'all') {
        return thrivings.filter(t => t.isActive).map(t => ({
          id: t.id,
          title: t.title,
          progress: calculateProgress(t),
          nextStep: getNextStep(t)
        }));
      }
      return thrivings.find(t => t.id === args.thriving_id);
      
    case 'search_health_history':
      // Search implementation
      const journeys = await dbOperations.getJourneysFromStorage();
      // ... search logic
      return results;
      
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}
```

### 4. Implementation Steps

1. **Create the ThreadContextManager** service
2. **Update StreamingChatService** to use dynamic context
3. **Add function calling** to the assistant configuration
4. **Update the API route** to handle function calls
5. **Add context refresh** on important user actions

### 5. Usage Example

```typescript
// In your API route
export async function POST(request: NextRequest) {
  const { message, threadId, chatIntent } = await request.json();
  
  // Enhanced streaming service automatically handles context
  const streamingService = new StreamingChatService(
    process.env.THRIVE_OPENAI_API_KEY!,
    process.env.THRIVE_OPENAI_ASSISTANT_ID!,
    chatIntent
  );
  
  // Context is now automatically injected based on user data
  await streamingService.sendMessage(threadId, message, chatIntent);
  
  // Stream response handles function calls automatically
  const stream = streamingService.createStreamingResponse(threadId);
  
  return new Response(stream, {
    headers: streamingService.getStreamHeaders()
  });
}
```

## Benefits

1. **Personalized Responses**: Assistant knows user's pantry items and active routines
2. **Contextual Awareness**: Each message considers user's health journey
3. **Real-time Data**: Function calling provides up-to-date information
4. **Cost Optimization**: Max tokens limit prevents runaway costs
5. **Better Continuity**: Context persists across conversation turns

## Implementation Priority

1. **High**: ThreadContextManager and dynamic instructions
2. **High**: Update streaming service to use context
3. **Medium**: Add function calling for real-time data
4. **Low**: Advanced features like thread summarization

This solution leverages OpenAI's existing features while providing the context awareness your users need for a personalized health assistant experience.