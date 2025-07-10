/**
 * Thread Context Manager for OpenAI Assistant
 * Manages user context injection for personalized conversations
 */

import { getPantryItems } from '@/src/utils/pantryStorage';
import { getRoutinesFromStorage } from '@/src/utils/routineStorage';
import { 
  getJourneysFromStorage,
  getRecentEntries 
} from '@/src/utils/journeyStorage';
import { PantryItem } from '@/src/types/pantry';
import { WellnessJourney, JourneyEntry } from '@/src/services/openai/types/journey';
import { WellnessRoutine } from '@/src/services/openai/types';

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
  async buildUserContext(userId?: string): Promise<UserContext> {
    // For now, we don't have user-specific data, so we'll use all local data
    const cacheKey = userId || 'default';
    
    // Check cache first (5 minute TTL)
    if (this.userContextCache.has(cacheKey)) {
      return this.userContextCache.get(cacheKey)!;
    }

    try {
      // Fetch from storage
      const [pantryItems, thrivings, journeys] = await Promise.all([
        getPantryItems(),
        getRoutinesFromStorage(),
        getJourneysFromStorage()
      ]);

      // Build context
      const context: UserContext = {
        pantryItems: this.formatPantryItems(pantryItems),
        activeThrivings: this.formatActiveRoutines(thrivings),
        recentJournalEntries: await this.getRecentJournalEntries(journeys),
        healthProfile: this.extractHealthProfileFromRoutines(thrivings, journeys)
      };

      // Cache for 5 minutes
      this.userContextCache.set(cacheKey, context);
      setTimeout(() => this.userContextCache.delete(cacheKey), 5 * 60 * 1000);

      return context;
    } catch (error) {
      console.error('Error building user context:', error);
      // Return empty context on error
      return {
        pantryItems: [],
        activeThrivings: [],
        recentJournalEntries: [],
        healthProfile: {
          conditions: [],
          allergies: [],
          preferences: []
        }
      };
    }
  }

  /**
   * Create context-aware run instructions
   */
  async createRunInstructions(userId?: string, intent?: string): Promise<string> {
    const context = await this.buildUserContext(userId);
    
    let instructions = `Current user context:\n\n`;

    // Add pantry context if items exist
    if (context.pantryItems.length > 0) {
      instructions += `Pantry Items (${context.pantryItems.length} total):\n`;
      instructions += context.pantryItems.join(', ') + '\n\n';
    }

    // Add active thrivings
    if (context.activeThrivings.length > 0) {
      instructions += `Active Wellness Routines:\n`;
      instructions += context.activeThrivings.map(t => 
        `- ${t.title} (${t.type}) - ${t.progress}% complete${t.nextStep ? `, Next: ${t.nextStep}` : ''}`
      ).join('\n') + '\n\n';
    }

    // Add recent journal entries
    if (context.recentJournalEntries.length > 0) {
      instructions += `Recent Health Journal:\n`;
      instructions += context.recentJournalEntries.map(e => 
        `- ${e.date}: ${e.summary}${e.mood ? ` (Mood: ${e.mood})` : ''}`
      ).join('\n') + '\n\n';
    }

    // Add health profile
    instructions += `Health Profile:\n`;
    instructions += `- Conditions: ${context.healthProfile.conditions.join(', ') || 'None reported'}\n`;
    instructions += `- Allergies: ${context.healthProfile.allergies.join(', ') || 'None reported'}\n`;
    instructions += `- Preferences: ${context.healthProfile.preferences.join(', ') || 'None specified'}\n\n`;

    instructions += `IMPORTANT: Use this context to provide personalized health recommendations. `;
    instructions += `Reference specific pantry items when suggesting remedies. `;
    instructions += `Consider active routines when giving advice. `;
    instructions += `Be aware of any reported conditions or allergies.`;

    // Add intent-specific instructions
    if (intent === 'create_routine') {
      instructions += '\n\nUser wants to create a new wellness routine. Consider their existing routines to avoid conflicts and overlap.';
    } else if (intent === 'create_journey') {
      instructions += '\n\nUser wants to create a new wellness journey. Consider their health conditions and current tracking.';
    } else if (intent?.includes('pantry')) {
      instructions += '\n\nUser is asking about their pantry. Be specific about items they have and suggest how to use them for their health concerns.';
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