/**
 * Thread Context Manager for OpenAI Assistant
 * Manages user context injection for personalized conversations
 */

import { 
  getRecentEntries 
} from '@/src/utils/journeyStorage';
import { PantryItem } from '@/src/types/pantry';
import { WellnessJourney, JourneyEntry } from '@/src/services/openai/types/journey';
import { WellnessRoutine, BasicContext } from '@/src/services/openai/types';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async buildUserContext(userId?: string): Promise<UserContext> {
    // Always return empty context on server
    // The assistant will use function calls to get actual data from client
    console.log('ThreadContextManager: Building empty context for server-side execution');
    
    const context: UserContext = {
      pantryItems: [],
      activeThrivings: [],
      recentJournalEntries: [],
      healthProfile: {
        conditions: [],
        allergies: [],
        preferences: []
      }
    };

    return context;
  }

  /**
   * Create context-aware run instructions with hybrid approach
   */
  async createRunInstructions(userId?: string, intent?: string, clientBasicContext?: BasicContext): Promise<string> {
    console.log('ThreadContextManager: Creating run instructions with intent:', intent, 'and basic context:', clientBasicContext);
    
    // Use enhanced basic context passed from client
    let basicContext = '';
    if (clientBasicContext) {
      basicContext = `
CURRENT USER DATA:
- Pantry items: ${clientBasicContext.pantryCount} items stored
${clientBasicContext.pantryItems && clientBasicContext.pantryItems.length > 0 ? 
  `  Items:\n    ${clientBasicContext.pantryItems.join('\n    ')}` : 
  '  No items in pantry'}

- Active routines: ${clientBasicContext.activeRoutineCount} (${clientBasicContext.routineTypes})
${clientBasicContext.activeRoutines && clientBasicContext.activeRoutines.length > 0 ?
  clientBasicContext.activeRoutines.map(r => {
    let routineStr = `  • ${r.name} (${r.type})`;
    if (r.reminderTimes && r.reminderTimes.length > 0) {
      routineStr += ` - Scheduled: ${r.reminderTimes.join(', ')}`;
    }
    routineStr += `\n    Steps: ${r.steps.join(' → ')}`;
    return routineStr;
  }).join('\n') :
  '  No active routines'}

`;
    }
    
    // Instructions must contain "json" for JSON response format
    let instructions = `CRITICAL: You MUST respond with valid JSON format as specified in your system instructions. Your response MUST be a JSON object with these fields: greeting, attentionRequired, emergencyReasoning, actionItems, additionalInformation, actionableItems, and questions.

${basicContext}
CONTEXT USAGE GUIDELINES:
- You now have detailed pantry items with dosages and routine information with scheduled times
- For questions like "What supplements do I have?", use the context data instead of calling functions
- For questions like "What's in my sleep routine?" or "When should I take my supplements?", use the context data
- The context shows:
  * Pantry items with dosages and notes
  * Routine names, types, and scheduled reminder times
  * Individual steps with their specific times (if set)
- Only call get_pantry_items if you need:
  * Full item details (expiration dates, purchase dates, categories)
  * Items beyond the 20 shown in context
- Only call get_thriving_progress if you need:
  * Complete progress tracking data
  * Completion history
  * All steps (context shows first 5)
- If user asks about timing, check both routine reminder times AND individual step times
- The context gives you enough information for most common queries without function calls

CRITICAL ROUTINE REMINDERS:
- If activeRoutineCount is 0 and user mentions: medication management, pain, sleep issues, stress → IMMEDIATELY suggest creating a routine
- If pantryCount is 0 and user asks about supplements → IMMEDIATELY suggest buy actions without calling get_pantry_items

After using functions (if needed), format your response as JSON with:
- greeting: A warm greeting acknowledging their concern
- actionItems: Array of remedy/suggestion objects with title and content
- questions: Array of follow-up questions
- actionableItems: Array of actionable items (routine creation, buy supplements, add to pantry, etc.)

Example JSON response:
{
  "greeting": "I'd be happy to help you with sleep recommendations! 💤",
  "attentionRequired": null,
  "emergencyReasoning": null,
  "actionItems": [
    {
      "title": "Magnesium for Better Sleep 🌙",
      "content": "<p>Take <strong>200-400mg of Magnesium Glycinate</strong> 30 minutes before bed. This form is gentle on the stomach and promotes relaxation.</p>"
    }
  ],
  "additionalInformation": "<p><em>Creating a consistent bedtime routine can significantly improve sleep quality.</em></p>",
  "actionableItems": [
    {
      "type": "thriving",
      "title": "Create Sleep Wellness Routine",
      "thrivingType": "sleep_wellness",
      "duration": "7_days",
      "frequency": "daily"
    },
    {
      "type": "supplement_choice",
      "title": "Consider Magnesium for Better Sleep 🌙",
      "description": "Magnesium Glycinate helps promote relaxation and improve sleep quality",
      "productName": "Magnesium Glycinate 400mg",
      "dosage": "400mg",
      "timing": "30 minutes before bed",
      "searchQuery": "magnesium glycinate 400mg capsules",
      "suggestedNotes": "400mg, 30 minutes before bed"
    }
  ],
  "questions": [
    {
      "id": "bedtime",
      "type": "time_input",
      "prompt": "What time do you usually go to bed?",
      "userVoice": "I usually go to bed at",
      "quickOptions": ["9:00 PM", "10:00 PM", "11:00 PM", "After midnight"]
    },
    {
      "id": "supplements_tried",
      "type": "quick_reply", 
      "prompt": "Have you tried any sleep supplements before?",
      "userVoice": "Yes, I have tried",
      "quickOptions": ["Yes", "No", "Not sure"]
    }
  ]
}\n\n`;

    // Add intent-specific instructions
    if (intent === 'create_routine') {
      instructions += 'User wants to create a new wellness routine. If they have no routines, immediately suggest routine creation without calling functions. Respond with actionableItems for routine creation.';
    } else if (intent === 'create_journey') {
      instructions += 'User wants to create a new wellness journey. Respond with actionableItems for journey creation.';
    } else if (intent?.includes('pantry')) {
      instructions += 'User is asking about their pantry. Only call get_pantry_items if they need specific item details. Otherwise use the quick context.';
    }

    return instructions;
  }

  private formatPantryItems(items: PantryItem[]): string[] {
    // Take up to 20 most recently added items
    return items
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 20)
      .map(item => {
        let formatted = item.name;
        if (item.tags?.length) {
          formatted += ` (${item.tags.join(', ')})`;
        }
        if (item.notes) {
          formatted += ` - ${item.notes.slice(0, 30)}...`;
        }
        return formatted;
      });
  }

  private formatActiveRoutines(routines: WellnessRoutine[]): UserContext['activeThrivings'] {
    return routines
      .filter(r => r.isActive)
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        title: r.name, // WellnessRoutine uses 'name' instead of 'title'
        type: r.type,
        progress: this.calculateRoutineProgress(),
        nextStep: this.getNextRoutineStep(r)
      }));
  }

  private calculateRoutineProgress(): number {
    // For routines, we'll estimate progress based on duration
    // This is a simplified calculation
    return 50; // Default to 50% for now
  }

  private getNextRoutineStep(routine: WellnessRoutine): string | undefined {
    if (!routine.steps?.length) return undefined;
    
    // Return the first step as the next step
    return routine.steps[0]?.title;
  }

  private getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
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

  private async getRecentJournalEntries(journeys: WellnessJourney[]): Promise<UserContext['recentJournalEntries']> {
    const entries: Array<{ entry: JourneyEntry; journeyTitle: string }> = [];
    
    // Collect all entries from all journeys
    for (const journey of journeys) {
      if (journey.id) {
        const journeyEntries = await getRecentEntries(journey.id, 30);
        journeyEntries.forEach(entry => {
          entries.push({ entry, journeyTitle: journey.title });
        });
      }
    }

    // Sort by date and take most recent
    return entries
      .sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime())
      .slice(0, 5)
      .map(({ entry, journeyTitle }) => ({
        date: new Date(entry.timestamp).toLocaleDateString(),
        summary: this.summarizeEntry(entry, journeyTitle),
        mood: entry.mood
      }));
  }

  private summarizeEntry(entry: JourneyEntry, journeyTitle: string): string {
    const parts = [`${journeyTitle} entry`];
    
    if (entry.painLevel !== undefined) {
      parts.push(`Pain: ${entry.painLevel}/10`);
    }
    if (entry.symptoms && entry.symptoms.length > 0) {
      parts.push(`Symptoms: ${entry.symptoms.slice(0, 2).join(', ')}`);
    }
    if (entry.notes) {
      parts.push(entry.notes.slice(0, 30) + '...');
    }
    
    return parts.join('. ');
  }

  private extractHealthProfileFromRoutines(routines: WellnessRoutine[], journeys: WellnessJourney[]) {
    const conditions = new Set<string>();
    const allergies = new Set<string>();
    const preferences = new Set<string>();

    // Extract from routines
    routines.forEach(r => {
      if (r.healthConcern) {
        conditions.add(r.healthConcern);
      }
      
      // Extract from routine description
      if (r.description) {
        const lower = r.description.toLowerCase();
        
        // Look for allergy mentions
        const allergyKeywords = ['allerg', 'sensitive to', 'avoid'];
        allergyKeywords.forEach(keyword => {
          if (lower.includes(keyword)) {
            // Extract the context around the keyword
            const index = lower.indexOf(keyword);
            const extract = r.description.slice(
              Math.max(0, index - 20), 
              Math.min(r.description.length, index + 50)
            );
            allergies.add(extract.trim());
          }
        });
        
        // Look for preferences
        const preferenceKeywords = ['prefer', 'like', 'enjoy', 'morning person', 'night owl'];
        preferenceKeywords.forEach(keyword => {
          if (lower.includes(keyword)) {
            preferences.add(keyword);
          }
        });
      }
    });

    // Extract from journeys
    journeys.forEach(j => {
      if (j.condition) {
        conditions.add(j.condition);
      }
      if (j.type === 'pain' && j.title) {
        conditions.add(j.title);
      }
    });

    return {
      conditions: Array.from(conditions),
      allergies: Array.from(allergies),
      preferences: Array.from(preferences)
    };
  }

  /**
   * Clear context cache (useful when user data changes)
   */
  clearCache(userId?: string) {
    if (userId) {
      this.userContextCache.delete(userId);
    } else {
      this.userContextCache.clear();
    }
  }
}