/**
 * @fileoverview Local Context Cache for Multi-Assistant
 * @module services/openai/context/contextCache
 * 
 * Maintains conversation context locally to avoid fetching from API
 */

export interface CachedMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  assistantRole?: string;
}

export class ContextCache {
  private static instance: ContextCache;
  private threadContexts: Map<string, CachedMessage[]> = new Map();
  private maxMessagesPerThread = 10;
  
  static getInstance(): ContextCache {
    if (!ContextCache.instance) {
      ContextCache.instance = new ContextCache();
    }
    return ContextCache.instance;
  }
  
  /**
   * Add a message to thread context
   */
  addMessage(threadId: string, message: CachedMessage) {
    const messages = this.threadContexts.get(threadId) || [];
    messages.push(message);
    
    // Maintain sliding window
    if (messages.length > this.maxMessagesPerThread) {
      messages.shift(); // Remove oldest message
    }
    
    this.threadContexts.set(threadId, messages);
  }
  
  /**
   * Get thread context
   */
  getThreadContext(threadId: string): CachedMessage[] {
    return this.threadContexts.get(threadId) || [];
  }
  
  /**
   * Get context summary for assistant instructions
   */
  getContextSummary(threadId: string): string {
    const messages = this.getThreadContext(threadId);
    if (messages.length === 0) return '';
    
    // Get all messages in the sliding window for full context
    const contextMessages = messages.map(msg => {
      const roleLabel = msg.role === 'user' ? 'User' : `Assistant (${msg.assistantRole || 'general'})`;
      
      // For assistant messages, try to extract key recommendations
      if (msg.role === 'assistant') {
        // Try to parse JSON response to extract key info
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.actionableItems && parsed.actionableItems.length > 0) {
            const items = parsed.actionableItems.map((item: {title: string}) => item.title).join(', ');
            return `${roleLabel} recommended: ${items}`;
          }
          if (parsed.additionalInformation) {
            return `${roleLabel}: ${parsed.additionalInformation.substring(0, 150)}...`;
          }
        } catch {
          // Not JSON, use raw content
          return `${roleLabel}: ${msg.content.substring(0, 150)}...`;
        }
      }
      
      // For user messages, keep them clear
      return `${roleLabel}: ${msg.content}`;
    });
    
    return `Previous conversation context (last ${messages.length} messages):\n${contextMessages.join('\n')}\n\nBased on this context, continue helping the user with their current query.`;
  }
  
  /**
   * Get structured context for assistant
   */
  getStructuredContext(threadId: string): string {
    const messages = this.getThreadContext(threadId);
    if (messages.length === 0) return '';
    
    // Group by exchange pairs
    const userTopics = new Set<string>();
    const assistantRecommendations = new Set<string>();
    
    messages.forEach((msg) => {
      if (msg.role === 'user') {
        // Extract health keywords from user messages
        const healthKeywords = msg.content.match(
          /\b(sleep|stress|pain|energy|anxiety|supplement|routine|medication|melatonin|magnesium|vitamin|exercise|diet)\b/gi
        );
        healthKeywords?.forEach(keyword => userTopics.add(keyword.toLowerCase()));
      } else if (msg.role === 'assistant') {
        // Track what the assistant has already recommended
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.actionableItems) {
            parsed.actionableItems.forEach((item: {title?: string}) => {
              if (item.title) assistantRecommendations.add(item.title);
            });
          }
        } catch {
          // Extract supplement names from text
          const supplements = msg.content.match(
            /\b(melatonin|magnesium|vitamin [a-zA-Z]\d?|omega-3|probiotics|ashwagandha|l-theanine)\b/gi
          );
          supplements?.forEach(supp => assistantRecommendations.add(supp));
        }
      }
    });
    
    let context = `CONVERSATION CONTEXT:\n`;
    context += `User has discussed: ${Array.from(userTopics).join(', ') || 'general wellness'}\n`;
    context += `You have already recommended: ${Array.from(assistantRecommendations).join(', ') || 'no specific recommendations yet'}\n`;
    
    // Highlight the most recent user input
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      context += `\nMOST RECENT USER INPUT: "${lastUserMessage.content}" - You MUST acknowledge this before proceeding.\n`;
    }
    
    context += `\nRecent exchanges:\n`;
    
    // Add last 6 messages with clear attribution
    messages.slice(-6).forEach(msg => {
      if (msg.role === 'user') {
        context += `USER SAID: "${msg.content}"\n`;
      } else {
        const specialist = msg.assistantRole ? `YOU (as ${msg.assistantRole} specialist)` : 'YOU';
        context += `${specialist} RESPONDED: "${msg.content.substring(0, 200)}..."\n`;
      }
    });
    
    return context;
  }
  
  /**
   * Clear thread context
   */
  clearThread(threadId: string) {
    this.threadContexts.delete(threadId);
  }
  
  /**
   * Get all thread IDs
   */
  getThreadIds(): string[] {
    return Array.from(this.threadContexts.keys());
  }
}