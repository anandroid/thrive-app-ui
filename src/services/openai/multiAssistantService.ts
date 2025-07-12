/**
 * @fileoverview Multi-Assistant Service for handling specialized assistants
 * @module services/openai/multiAssistantService
 * 
 * This service manages communication with multiple specialized assistants
 * and handles routing based on user intent.
 */

import OpenAI from 'openai';
import { 
  getAssistantId, 
  areAllAssistantsConfigured,
  getHandoffMessage,
  AssistantRole 
} from './assistant/team/assistantManager';
import { ThreadContextManager } from './context/ThreadContextManager';
import { SlidingWindowManager } from './context/slidingWindowManager';
import { ContextCache } from './context/contextCache';
import { BasicContext } from './types';

/**
 * Multi-assistant service configuration
 */
interface MultiAssistantConfig {
  apiKey: string;
}

/**
 * Thread state to track current assistant
 */
interface ThreadState {
  currentAssistant?: AssistantRole;
  isCreatingRoutine?: boolean;
  isManagingPantry?: boolean;
}

/**
 * Multi-Assistant Service Class
 */
export class MultiAssistantService {
  private openai: OpenAI;
  private threadStates: Map<string, ThreadState> = new Map();
  private contextManager: ThreadContextManager;
  private slidingWindow: SlidingWindowManager;
  private contextCache: ContextCache;

  constructor(config: MultiAssistantConfig) {
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.contextManager = ThreadContextManager.getInstance();
    this.slidingWindow = new SlidingWindowManager({ 
      maxMessages: 10,
      includeSystemContext: true 
    });
    this.contextCache = ContextCache.getInstance();
  }

  /**
   * Get the appropriate assistant ID for a message
   */
  private getAssistantForMessage(): { assistantId: string; role: AssistantRole; isHandoff: boolean } {
    // ALWAYS use chat assistant for streaming conversations
    // Other assistants are only used via direct API endpoints
    const selectedRole: AssistantRole = 'chat';
    const assistantId = getAssistantId(selectedRole);

    // Check if this is a handoff (not applicable anymore since we always use chat)
    const isHandoff = false;

    if (!assistantId) {
      throw new Error(`No assistant configured for role: ${selectedRole}`);
    }

    return { assistantId, role: selectedRole, isHandoff };
  }

  /**
   * Update thread state based on assistant response
   */
  private updateThreadState(threadId: string, role: AssistantRole, response: {actionableItems?: Array<{type: string}>}) {
    const state = this.threadStates.get(threadId) || {};
    
    // Update current assistant
    state.currentAssistant = role;

    // Update flow states based on response
    if (response.actionableItems) {
      const hasRoutineAction = response.actionableItems.some(
        (item) => item.type === 'thriving' || item.type === 'adjust_routine'
      );
      const hasPantryAction = response.actionableItems.some(
        (item) => item.type === 'supplement_choice' || item.type === 'add_to_pantry'
      );

      state.isCreatingRoutine = hasRoutineAction;
      state.isManagingPantry = hasPantryAction;
    }

    this.threadStates.set(threadId, state);
  }

  /**
   * Create a new thread
   */
  async createThread(): Promise<string> {
    const thread = await this.openai.beta.threads.create();
    return thread.id;
  }

  /**
   * Send a message and get streaming response
   */
  async sendMessage(
    threadId: string,
    message: string,
    basicContext?: BasicContext,
    onChunk?: (chunk: {type: string; content?: string; role?: AssistantRole; error?: string; toolCalls?: unknown; runId?: string}) => void
  ): Promise<void> {
    // Determine which assistant to use
    const { assistantId, role, isHandoff } = this.getAssistantForMessage();

    // Add user message to thread
    await this.openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });
    
    // Store user message in context cache
    this.contextCache.addMessage(threadId, {
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // If this is a handoff, add a system message
    if (isHandoff) {
      const currentRole = this.threadStates.get(threadId)?.currentAssistant;
      if (currentRole) {
        const handoffMessage = getHandoffMessage(currentRole, role);
        await this.openai.beta.threads.messages.create(threadId, {
          role: 'assistant',
          content: handoffMessage
        });
      }
    }

    // Get structured context from cache
    const contextSummary = this.contextCache.getStructuredContext(threadId);
    
    // Create run with appropriate assistant
    const instructions = await this.contextManager.createRunInstructions(
      undefined, 
      undefined, 
      basicContext
    );
    
    // Add context summary to instructions if available
    const enhancedInstructions = contextSummary 
      ? `${instructions}\n\nConversation context: ${contextSummary}`
      : instructions;

    const run = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      additional_instructions: enhancedInstructions,
      stream: true
    });

    // Handle streaming response
    for await (const chunk of run) {
      if (chunk.event === 'thread.message.delta') {
        const content = chunk.data.delta.content?.[0];
        if (content?.type === 'text' && content.text?.value) {
          onChunk?.({
            type: 'content',
            content: content.text.value,
            role
          });
        }
      } else if (chunk.event === 'thread.message.completed') {
        const messageContent = chunk.data.content[0];
        if (messageContent?.type === 'text') {
          const fullMessage = messageContent.text.value;
          
          // Store assistant response in context cache
          this.contextCache.addMessage(threadId, {
            role: 'assistant',
            content: fullMessage,
            timestamp: new Date(),
            assistantRole: role
          });
          
          try {
            const parsed = JSON.parse(fullMessage);
            this.updateThreadState(threadId, role, parsed);
          } catch {
            // Not JSON, that's okay
          }
        }
      } else if (chunk.event === 'thread.run.requires_action') {
        // Handle function calls
        if (chunk.data.required_action?.submit_tool_outputs?.tool_calls) {
          onChunk?.({
            type: 'function_call',
            toolCalls: chunk.data.required_action.submit_tool_outputs.tool_calls,
            runId: chunk.data.id,
            role
          });
        }
      } else if (chunk.event === 'thread.run.completed') {
        onChunk?.({
          type: 'done',
          role
        });
      } else if (chunk.event === 'thread.run.failed') {
        onChunk?.({
          type: 'error',
          error: chunk.data.last_error?.message || 'Run failed',
          role
        });
      }
    }
  }

  /**
   * Submit tool outputs for function calls
   */
  async submitToolOutputs(
    threadId: string,
    runId: string,
    toolOutputs: Array<{ tool_call_id: string; output: string }>,
    onChunk?: (chunk: {type: string; content?: string; error?: string}) => void
  ): Promise<void> {
    // Submit tool outputs using raw API call for compatibility
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.THRIVE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({ tool_outputs: toolOutputs })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      onChunk?.({
        type: 'error',
        error: `API error: ${response.status} - ${JSON.stringify(errorData)}`
      });
      return;
    }

    const run = await response.json();

    // Wait for run to complete
    let currentRun = run;
    while (currentRun.status === 'in_progress' || currentRun.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const runResponse = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.THRIVE_OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );
      
      if (!runResponse.ok) {
        onChunk?.({
          type: 'error',
          error: 'Failed to retrieve run status'
        });
        return;
      }
      
      currentRun = await runResponse.json();
    }

    if (currentRun.status === 'completed') {
      // Get the latest message
      const messages = await this.openai.beta.threads.messages.list(threadId, { limit: 1 });
      const lastMessage = messages.data[0];
      
      if (lastMessage && lastMessage.content[0]?.type === 'text') {
        const content = lastMessage.content[0].text.value;
        onChunk?.({
          type: 'content',
          content
        });
      }
      
      onChunk?.({
        type: 'done'
      });
    } else if (currentRun.status === 'failed') {
      onChunk?.({
        type: 'error',
        error: currentRun.last_error?.message || 'Run failed'
      });
    }
  }

  /**
   * Get thread messages
   */
  async getThreadMessages(threadId: string) {
    const messages = await this.openai.beta.threads.messages.list(threadId);
    return messages.data;
  }
  
  /**
   * Get thread messages with sliding window
   */
  async getThreadMessagesWithWindow(threadId: string) {
    // First try to get from cache
    const cachedMessages = this.contextCache.getThreadContext(threadId);
    
    if (cachedMessages.length > 0) {
      // Use cached messages with sliding window
      return this.slidingWindow.getContextWindow(cachedMessages);
    }
    
    // Fallback to API if cache is empty (e.g., on restart)
    const allMessages = await this.openai.beta.threads.messages.list(
      threadId,
      { limit: 10, order: 'desc' }
    );
    
    // Convert to our format and populate cache
    const formattedMessages = allMessages.data.reverse().map(msg => {
      const message = {
        role: msg.role as 'user' | 'assistant',
        content: msg.content[0]?.type === 'text' ? msg.content[0].text.value : '',
        timestamp: new Date(msg.created_at * 1000)
      };
      
      // Populate cache with fetched messages
      this.contextCache.addMessage(threadId, message);
      
      return message;
    });
    
    return formattedMessages;
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string): Promise<void> {
    // Use raw API call to delete thread
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.THRIVE_OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to delete thread: ${response.status}`);
    }
    
    this.threadStates.delete(threadId);
    this.contextCache.clearThread(threadId);
  }

  /**
   * Check if multi-assistant mode is available
   */
  static isMultiAssistantMode(): boolean {
    return areAllAssistantsConfigured();
  }

  /**
   * Get current assistant for a thread
   */
  getCurrentAssistant(threadId: string): AssistantRole | undefined {
    return this.threadStates.get(threadId)?.currentAssistant;
  }
}

/**
 * Singleton instance
 */
let multiAssistantService: MultiAssistantService | null = null;

/**
 * Get or create multi-assistant service instance
 */
export const getMultiAssistantService = (): MultiAssistantService => {
  if (!multiAssistantService) {
    const apiKey = process.env.THRIVE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('THRIVE_OPENAI_API_KEY not configured');
    }
    
    multiAssistantService = new MultiAssistantService({
      apiKey
    });
  }
  
  return multiAssistantService;
};