import OpenAI from 'openai';
import { RoutinePromptBuilder } from './routinePromptBuilder';
import { RoutineOptimizer } from './routineOptimizer';

export interface RoutineCreationParams {
  routineType: string;
  duration: string;
  frequency: string;
  healthConcern: string;
  customInstructions?: string;
  sleepTime?: string;
  wakeTime?: string;
  conversationContext?: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (routine: Record<string, unknown>) => void;
  onError: (error: Error) => void;
}

export class RoutineCreationService {
  private openai: OpenAI;
  private optimizer: RoutineOptimizer;
  private promptBuilder: RoutinePromptBuilder;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ 
      apiKey,
      timeout: 180000 // 2 minute timeout for streaming
    });
    this.optimizer = new RoutineOptimizer();
    this.promptBuilder = new RoutinePromptBuilder();
  }

  async createRoutine(params: RoutineCreationParams) {
    // Determine AI routine type if needed
    const aiRoutineType =
      params.routineType === 'ai_determined'
        ? this.optimizer.determineOptimalRoutineType(params.healthConcern)
        : params.routineType;

    // Determine AI frequency based on routine type and duration
    const aiFrequency =
      params.frequency === 'ai_determined'
        ? this.optimizer.determineOptimalFrequency(aiRoutineType, params.duration)
        : params.frequency;

    const prompt = this.promptBuilder.buildRoutineCreationPrompt({
      ...params,
      routineType: aiRoutineType,
      frequency: aiFrequency,
    });

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        {
          role: 'system',
          content: this.promptBuilder.getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: params.conversationContext ? 0.8 : 0.7, // Higher temperature when context is provided for more creative personalization
    });

    const routineData = JSON.parse(
      completion.choices[0].message.content || '{}',
    );

    // Add metadata
    const routine = {
      id: Date.now().toString(), // Keep existing format for routine IDs (not used directly for notifications)
      createdAt: new Date().toISOString(),
      routineType: aiRoutineType,
      duration: params.duration,
      frequency: aiFrequency,
      healthConcern: params.healthConcern,
      ...routineData,
    };

    return routine;
  }

  async createRoutineStream(params: RoutineCreationParams, callbacks: StreamCallbacks) {
    try {
      // Determine AI routine type if needed
      const aiRoutineType =
        params.routineType === 'ai_determined'
          ? this.optimizer.determineOptimalRoutineType(params.healthConcern)
          : params.routineType;

      // Determine AI frequency based on routine type and duration
      const aiFrequency =
        params.frequency === 'ai_determined'
          ? this.optimizer.determineOptimalFrequency(aiRoutineType, params.duration)
          : params.frequency;

      const prompt = this.promptBuilder.buildRoutineCreationPrompt({
        ...params,
        routineType: aiRoutineType,
        frequency: aiFrequency,
      });

      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          {
            role: 'system',
            content: this.promptBuilder.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: params.conversationContext ? 0.8 : 0.7,
        stream: true,
      });

      let accumulatedContent = '';
      let chunkCount = 0;

      try {
        for await (const chunk of stream) {
          chunkCount++;
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            accumulatedContent += content;
            callbacks.onChunk(content);
          }
          
          // Log every 50 chunks to track progress
          if (chunkCount % 50 === 0) {
            console.log(`OpenAI chunk ${chunkCount}, accumulated length: ${accumulatedContent.length}`);
          }
          
          // Check for finish reason
          if (chunk.choices[0]?.finish_reason) {
            console.log('Stream finished with reason:', chunk.choices[0].finish_reason);
            if (chunk.choices[0].finish_reason === 'length') {
              console.warn('Stream was truncated due to max_tokens limit');
            }
          }
        }
        
        console.log(`OpenAI streaming completed. Total chunks: ${chunkCount}, final content length: ${accumulatedContent.length}`);
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        callbacks.onError(streamError instanceof Error ? streamError : new Error('Streaming failed'));
        return;
      }

      // Parse the complete JSON response
      try {
        console.log('Attempting to parse final JSON, length:', accumulatedContent.length);
        const routineData = JSON.parse(accumulatedContent);
        
        // Add metadata
        const routine = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          routineType: aiRoutineType,
          duration: params.duration,
          frequency: aiFrequency,
          healthConcern: params.healthConcern,
          ...routineData,
        };

        callbacks.onComplete(routine);
      } catch (parseError) {
        callbacks.onError(new Error('Failed to parse routine data: ' + parseError));
      }
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}