/**
 * Thread Metadata Service
 * Manages context cache clearing when user data changes
 * Note: In our privacy-first architecture, we don't send user data to OpenAI servers
 */

import { ThreadContextManager, UserContext } from '../context/ThreadContextManager';

export class ThreadMetadataService {
  private static instance: ThreadMetadataService;
  private contextManager: ThreadContextManager;

  private constructor() {
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
   * Note: In our privacy-first architecture, we don't actually update OpenAI's thread metadata
   * This method is kept for API compatibility but does nothing on the client
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateThreadMetadata(threadId: string, userId?: string) {
    // In our privacy-first approach, we don't send user data to OpenAI
    // Thread metadata updates would need to happen server-side
    // For now, we just clear the cache to ensure fresh data on next request
    console.log(`Thread metadata update requested for ${threadId} (no-op on client)`);
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
   * Note: Returns null on client side as we don't store metadata
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getThreadMetadata(threadId: string): Promise<Record<string, string> | null> {
    // In our privacy-first approach, metadata is not available on client
    return null;
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