/**
 * @fileoverview Sliding Window Context Manager
 * @module services/openai/context/slidingWindowManager
 * 
 * Manages conversation context using a sliding window approach
 * to optimize token usage and API costs
 */

import { ChatMessage } from '../types';

export interface SlidingWindowConfig {
  maxMessages: number;  // Maximum number of messages to include
  maxTokens?: number;   // Optional: Maximum token limit
  includeSystemContext?: boolean; // Include system context in count
}

export class SlidingWindowManager {
  private config: SlidingWindowConfig;
  
  constructor(config: SlidingWindowConfig = { maxMessages: 10 }) {
    this.config = config;
  }
  
  /**
   * Get the last N messages for context
   * @param messages Full message history
   * @returns Sliding window of messages
   */
  getContextWindow(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length <= this.config.maxMessages) {
      return messages;
    }
    
    // Since ChatMessage doesn't support system role, just return last N messages
    return messages.slice(-this.config.maxMessages);
  }
  
  /**
   * Prepare messages for API with sliding window
   * @param threadMessages All messages in thread
   * @param newMessage New message to add
   * @returns Messages formatted for API
   */
  prepareContextMessages(
    threadMessages: Array<{role: string; content: string}>,
    newMessage: string
  ): Array<{role: string; content: string}> {
    // Convert to ChatMessage format
    const messages: ChatMessage[] = threadMessages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date()
      }));
    
    // Get sliding window
    const contextMessages = this.getContextWindow(messages);
    
    // Add the new message
    return [
      ...contextMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: newMessage }
    ];
  }
  
  /**
   * Estimate token count for messages (rough estimation)
   * @param messages Messages to count
   * @returns Estimated token count
   */
  estimateTokenCount(messages: ChatMessage[]): number {
    // Rough estimation: ~4 characters per token
    const totalChars = messages.reduce((sum, msg) => {
      return sum + msg.content.length + 10; // +10 for role/formatting
    }, 0);
    
    return Math.ceil(totalChars / 4);
  }
  
  /**
   * Get context summary for transitions
   * Useful when switching between assistants
   */
  getContextSummary(messages: ChatMessage[]): string {
    const recentMessages = this.getContextWindow(messages);
    
    // Extract key topics from recent messages
    const topics = new Set<string>();
    const concerns = new Set<string>();
    
    recentMessages.forEach(msg => {
      if (msg.role === 'user') {
        // Extract health-related keywords
        const healthKeywords = msg.content.match(
          /\b(sleep|stress|pain|energy|anxiety|supplement|routine|medication)\b/gi
        );
        healthKeywords?.forEach(keyword => topics.add(keyword.toLowerCase()));
        
        // Check for specific concerns
        if (msg.content.toLowerCase().includes('help with')) {
          const concern = msg.content.split('help with')[1]?.split(/[.,!?]/)[0]?.trim();
          if (concern) concerns.add(concern);
        }
      }
    });
    
    return `Recent topics: ${Array.from(topics).join(', ')}. ` +
           `Concerns: ${Array.from(concerns).join(', ') || 'general wellness'}`;
  }
}