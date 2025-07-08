import OpenAI from 'openai';
import { WellnessRoutine } from '../types';

export interface AdjustmentParams {
  routine: WellnessRoutine;
  adjustmentRequest: string;
}

export class RoutineAdjustmentService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async adjustRoutine(params: AdjustmentParams) {
    const { routine, adjustmentRequest } = params;

    const prompt = this.buildAdjustmentPrompt(routine, adjustmentRequest);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const adjustedRoutine = JSON.parse(
      completion.choices[0].message.content || '{}',
    );

    // Preserve metadata and ensure all fields are present
    const finalRoutine = {
      ...routine,
      ...adjustedRoutine,
      updatedAt: new Date().toISOString(),
      adjustmentHistory: [
        ...(routine.adjustmentHistory || []),
        {
          date: new Date().toISOString(),
          request: adjustmentRequest,
        },
      ],
    };

    return finalRoutine;
  }

  private buildAdjustmentPrompt(routine: WellnessRoutine, adjustmentRequest: string): string {
    return `You are adjusting an existing wellness routine based on user requirements.

Current Routine:
${JSON.stringify(routine, null, 2)}

User's Adjustment Request:
${adjustmentRequest}

Please modify the routine according to the user's request. Keep the same structure but adjust:
- Step timings (bestTime) based on their schedule
- Step reminder times (reminderTime) in 24-hour format (HH:MM) to match the new schedule
- Step descriptions if needed
- Tips to accommodate their preferences
- Additional steps if user mentions new equipment or preferences
- Any other relevant adjustments

Maintain all existing fields including will_video_tutorial_help for each step.

Important: 
- For each routine step, ensure the reminderTime is updated to match any changes in bestTime or user's schedule preferences.
- Keep the separation between routine steps (daily with reminders) and additional steps (one-time or as-needed).
- If adding new additional steps based on user request, use unique IDs.
- Preserve the will_video_tutorial_help field for each step. Only modify it if the user's request specifically changes the nature of the activity (e.g., from physical exercise to taking medication).

Return the complete adjusted routine in the same JSON format.`;
  }

  private getSystemPrompt(): string {
    return 'You are a wellness routine expert. Adjust existing routines based on user requirements while maintaining the routine structure and safety. When adjusting schedules, always update both bestTime descriptions and reminderTime (in 24-hour HH:MM format) to match. Keep the separation between routine steps and additional steps. Preserve all fields including will_video_tutorial_help unless the nature of the activity changes. Always return valid JSON matching the original routine structure.';
  }
}