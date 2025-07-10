/**
 * Thread Metadata Service
 * Updates OpenAI thread metadata when user data changes
 */

import OpenAI from 'openai';
import { ThreadContextManager, UserContext } from '../context/ThreadContextManager';

export class ThreadMetadataService {
  private static instance: ThreadMetadataService;
  private openai: OpenAI;
  private contextManager: ThreadContextManager;

  private constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.THRIVE_OPENAI_API_KEY! 
    });
    this.contextManager = ThreadContextManager.getInstance();
  }

  static getInstance(): ThreadMetadataService {
    if (!ThreadMetadataService.instance) {
      ThreadMetadataService.instance = new ThreadMetadataService();
    }
    return ThreadMetadataService.instance;
  }

  /**
   * Update thread metadata with user context summary
   */
  async updateThreadMetadata(threadId: string, userId?: string) {
    try {
      const context = await this.contextManager.buildUserContext(userId);
      
      // Create a summary of user context for metadata
      const metadata = {
        lastUpdated: new Date().toISOString(),
        pantryItemCount: context.pantryItems.length.toString(),
        activeThrivings: context.activeThrivings.length.toString(),
        healthConditions: context.healthProfile.conditions.join(', ') || 'none',
        // Metadata values must be strings
        contextSummary: this.createContextSummary(context)
      };

      // Update the thread
      await this.openai.beta.threads.update(threadId, {
        metadata
      });

      console.log(`Updated thread ${threadId} metadata:`, metadata);
    } catch (error) {
      console.error('Error updating thread metadata:', error);
    }
  }

  /**
   * Create a concise summary of user context
   */
  private createContextSummary(context: UserContext): string {
    const parts = [];
    
    if (context.pantryItems.length > 0) {
      parts.push(`${context.pantryItems.length} pantry items`);
    }
    
    if (context.activeThrivings.length > 0) {
      parts.push(`${context.activeThrivings.length} active routines`);
    }
    
    if (context.healthProfile.conditions.length > 0) {
      parts.push(`tracking ${context.healthProfile.conditions.length} conditions`);
    }
    
    return parts.join(', ') || 'New user';
  }

  /**
   * Get thread metadata
   */
  async getThreadMetadata(threadId: string): Promise<Record<string, string> | null> {
    try {
      const thread = await this.openai.beta.threads.retrieve(threadId);
      return thread.metadata as Record<string, string>;
    } catch (error) {
      console.error('Error retrieving thread metadata:', error);
      return null;
    }
  }

  /**
   * Update metadata when pantry changes
   */
  async onPantryChange(threadIds: string[], userId?: string) {
    // Update all active threads
    for (const threadId of threadIds) {
      await this.updateThreadMetadata(threadId, userId);
    }
    
    // Clear context cache so next message gets fresh data
    this.contextManager.clearCache(userId);
  }

  /**
   * Update metadata when thrivings change
   */
  async onThrivingChange(threadIds: string[], userId?: string) {
    // Update all active threads
    for (const threadId of threadIds) {
      await this.updateThreadMetadata(threadId, userId);
    }
    
    // Clear context cache
    this.contextManager.clearCache(userId);
  }
}

// Export singleton instance
export const threadMetadataService = ThreadMetadataService.getInstance();