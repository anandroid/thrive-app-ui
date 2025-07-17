/**
 * Streaming parser for routine creation
 * Handles real-time parsing of routine data as it streams in
 */

import { Thriving } from '@/src/types/thriving';

export interface StreamingRoutineData {
  type: 'start' | 'routine_info' | 'step' | 'partial_step' | 'recommendations' | 'outcomes' | 'tips' | 'safety' | 'journalTemplate' | 'complete' | 'error' | 'streaming' | 'heartbeat';
  stepIndex?: number;
  data?: unknown;
  routine?: Thriving;
  error?: string;
  id?: string;
  timestamp?: string;
  chunk?: string;
}

export interface PartialRoutineData {
  id?: string;
  title?: string;
  description?: string;
  healthConcern?: string;
  duration?: number;
  frequency?: string;
  steps?: unknown[];
  additionalRecommendations?: unknown[];
  expectedOutcomes?: string[];
  proTips?: string[];
  safetyNotes?: string[];
  journalTemplate?: unknown;
  isComplete?: boolean;
}

export class StreamingRoutineParser {
  private partialData: PartialRoutineData = {};
  private onUpdate: (data: PartialRoutineData) => void;
  private onComplete: (routine: Thriving) => void;
  private onError: (error: string) => void;

  constructor(
    onUpdate: (data: PartialRoutineData) => void,
    onComplete: (routine: Thriving) => void,
    onError: (error: string) => void
  ) {
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  parseChunk(chunk: string): void {
    const lines = chunk.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const data: StreamingRoutineData = JSON.parse(line);
        this.processStreamingData(data);
      } catch (error) {
        console.warn('Failed to parse streaming chunk:', line, error);
      }
    }
  }

  private processStreamingData(data: StreamingRoutineData): void {
    switch (data.type) {
      case 'start':
        this.partialData = {
          id: data.id
        };
        this.onUpdate(this.partialData);
        break;

      case 'routine_info':
        this.partialData = {
          ...this.partialData,
          ...(data.data as Record<string, unknown>)
        };
        this.onUpdate(this.partialData);
        break;

      case 'step':
      case 'partial_step':
        if (!this.partialData.steps) {
          this.partialData.steps = [];
        }
        
        // Insert or merge step at the correct index
        if (data.stepIndex !== undefined) {
          const existingStep = this.partialData.steps[data.stepIndex];
          const newStepData = data.data as Record<string, unknown>;
          
          if (existingStep && (data.type === 'partial_step' || data.type === 'step')) {
            // Always merge new data with existing step data to allow progressive updates
            // Prioritize new data over placeholder text
            const mergedStep = { ...existingStep } as Record<string, unknown>;
            
            // Update each field, but prefer real data over placeholder text
            Object.keys(newStepData).forEach(key => {
              const newValue = newStepData[key];
              const existingValue = (existingStep as Record<string, unknown>)[key];
              
              // Always update if the existing value is a placeholder or if new value is more complete
              if (!existingValue || 
                  existingValue === 'Loading step details...' || 
                  (typeof newValue === 'string' && newValue.length > 0)) {
                mergedStep[key] = newValue;
              }
            });
            
            this.partialData.steps[data.stepIndex] = mergedStep;
          } else {
            // Set new step
            this.partialData.steps[data.stepIndex] = data.data;
          }
        } else {
          this.partialData.steps.push(data.data);
        }
        
        this.onUpdate(this.partialData);
        break;

      case 'recommendations':
        this.partialData.additionalRecommendations = data.data as unknown[];
        this.onUpdate(this.partialData);
        break;

      case 'outcomes':
        this.partialData.expectedOutcomes = data.data as string[];
        this.onUpdate(this.partialData);
        break;

      case 'tips':
        this.partialData.proTips = data.data as string[];
        this.onUpdate(this.partialData);
        break;

      case 'safety':
        this.partialData.safetyNotes = data.data as string[];
        this.onUpdate(this.partialData);
        break;

      case 'journalTemplate':
        console.log('Received journal template:', data.data);
        this.partialData.journalTemplate = data.data;
        this.onUpdate(this.partialData);
        break;

      case 'complete':
        this.partialData.isComplete = true;
        this.onUpdate(this.partialData);
        
        if (data.routine) {
          this.onComplete(data.routine);
        }
        break;

      case 'error':
        this.onError(data.error || 'Unknown error occurred');
        break;
        
      case 'streaming':
      case 'heartbeat':
        // Just a progress indicator - could be used to show streaming animation
        // The actual data updates come through other event types
        break;
    }
  }

  getPartialData(): PartialRoutineData {
    return this.partialData;
  }

  reset(): void {
    this.partialData = {};
  }
}

/**
 * Hook for managing streaming routine creation
 */
export const useStreamingRoutineParser = (
  onUpdate: (data: PartialRoutineData) => void,
  onComplete: (routine: Thriving) => void,
  onError: (error: string) => void
) => {
  const parser = new StreamingRoutineParser(onUpdate, onComplete, onError);

  const startStreaming = async (routineData: unknown) => {
    try {
      const response = await fetch('/api/routine/create-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routineData)
      });

      if (!response.ok) {
        throw new Error('Failed to start routine creation');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let lastActivity = Date.now();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lastActivity = Date.now();
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            parser.parseChunk(line);
          }
        }
        
        // Check for stalled connection (no data for 60 seconds)
        if (Date.now() - lastActivity > 60000) {
          console.warn('Stream appears stalled, timing out');
          throw new Error('Stream stalled - no data received for 60 seconds');
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        parser.parseChunk(buffer);
      }

    } catch (error) {
      console.error('Streaming error:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return {
    startStreaming,
    parser
  };
};