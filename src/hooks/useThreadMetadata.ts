/**
 * Hook to manage thread metadata updates
 * Updates OpenAI thread context when user data changes
 */

import { threadMetadataService } from '@/src/services/openai/thread/threadMetadataService';
import { getChatThreads } from '@/src/utils/chatStorage';

export function useThreadMetadata() {
  /**
   * Update all active thread metadata
   */
  const updateAllThreads = async () => {
    try {
      // Get all chat threads from local storage
      const threads = getChatThreads();
      
      // Get unique thread IDs
      const threadIds = [...new Set(threads.map(t => t.id).filter(Boolean))];
      
      if (threadIds.length === 0) return;
      
      console.log(`Updating metadata for ${threadIds.length} threads...`);
      
      // Update each thread's metadata
      for (const threadId of threadIds) {
        await threadMetadataService.updateThreadMetadata(threadId);
      }
    } catch (error) {
      console.error('Error updating thread metadata:', error);
    }
  };

  /**
   * Trigger metadata update when pantry changes
   */
  const onPantryChange = async () => {
    // Clear context cache
    threadMetadataService.onPantryChange([], undefined);
    // Update threads
    await updateAllThreads();
  };

  /**
   * Trigger metadata update when thrivings change
   */
  const onThrivingChange = async () => {
    // Clear context cache
    threadMetadataService.onThrivingChange([], undefined);
    // Update threads
    await updateAllThreads();
  };

  return {
    updateAllThreads,
    onPantryChange,
    onThrivingChange
  };
}