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

export class RoutineCreationService {
  private openai: OpenAI;
  private optimizer: RoutineOptimizer;
  private promptBuilder: RoutinePromptBuilder;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
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
      model: 'gpt-4o-mini',
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
      temperature: 0.7,
    });

    const routineData = JSON.parse(
      completion.choices[0].message.content || '{}',
    );

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

    return routine;
  }
}