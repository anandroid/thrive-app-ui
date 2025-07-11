export class RoutinePromptBuilder {
  buildRoutineCreationPrompt(params: {
    healthConcern: string;
    routineType: string;
    duration: string;
    frequency: string;
    sleepTime?: string;
    wakeTime?: string;
    customInstructions?: string;
    conversationContext?: string;
  }): string {
    const {
      healthConcern,
      routineType,
      duration,
      frequency,
      sleepTime,
      wakeTime,
      customInstructions,
      conversationContext,
    } = params;

    return `${conversationContext ? `CRITICAL CONTEXT - This routine MUST be based on the following conversation where the user shared specific details about their situation:

${conversationContext}

IMPORTANT: The routine you create MUST directly address ALL specific concerns, symptoms, preferences, and circumstances mentioned in the conversation above. Do not create a generic routine - it must be highly personalized to what the user shared.

` : ''}Create a detailed wellness routine for: ${healthConcern}

Routine Type: ${routineType}
Duration: ${duration}
Frequency: ${frequency}
Sleep Schedule: Bedtime at ${sleepTime || '22:00'}, Wake time at ${wakeTime || '06:00'}
${customInstructions ? `Custom Instructions: ${customInstructions}` : ''}

Return a JSON object with this EXACT structure:
{
  "routineTitle": "Clear, motivating title with emoji",
  "routineDescription": "Brief overview of what this routine will achieve",
  "totalSteps": number (count only the daily routine steps, not additional steps),
  "reminderFrequency": "${frequency}",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title with emoji",
      "description": "Detailed instructions for this step",
      "duration": "e.g., 5 minutes",
      "bestTime": "e.g., Morning (07:00), After meals, Before bed - consider user's sleep schedule: bed at ${sleepTime || '22:00'}, wake at ${wakeTime || '06:00'}",
      "tips": ["Tip 1", "Tip 2"],
      "videoSearchQuery": "Specific search query for relevant video",
      "will_video_tutorial_help": boolean (true if visual demonstration would be helpful for this step, false for simple activities like taking medication or drinking water),
      "reminderText": "Short reminder message",
      "reminderTime": "Specific time in 24h format (e.g., 07:30, 14:00, 21:30) based on user's sleep schedule and the best time for this activity"
    }
  ],
  "additionalSteps": [
    {
      "id": "unique_id",
      "title": "Additional step title with emoji",
      "description": "Detailed instructions for one-time or as-needed activities",
      "frequency": "one_time" | "as_needed" | "weekly" | "monthly",
      "tips": ["Optional tip 1", "Optional tip 2"],
      "videoSearchQuery": "Optional search query",
      "will_video_tutorial_help": boolean
    }
  ],
  "expectedOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3"],
  "safetyNotes": ["Important safety consideration"],
  "progressTracking": "How to track progress"
}

Include 3-7 daily routine steps that need reminders, and 2-5 additional steps for one-time setup, weekly maintenance, or as-needed activities. Additional steps are things like "Buy a humidifier", "Clean equipment weekly", "Replace filters monthly", etc.`;
  }

  getSystemPrompt(): string {
    return `You are a wellness routine expert who creates HIGHLY PERSONALIZED routines based on user conversations. 

CRITICAL INSTRUCTIONS:
1. When conversation context is provided, it is YOUR PRIMARY SOURCE OF TRUTH
2. Extract and address EVERY specific detail the user mentioned:
   - Specific symptoms they're experiencing
   - Times of day when issues occur
   - What they've already tried
   - Their lifestyle constraints
   - Personal preferences
   - Medical conditions mentioned
   - Emotional state and concerns
3. INCORPORATE ALL ASSISTANT'S RECOMMENDATIONS:
   - If specific exercises were shown (e.g., shoulder strengthening), include them in the routine
   - If techniques were explained, make them part of the daily steps
   - Build upon the foundation already established in the conversation
4. The routine MUST feel like a direct response to their conversation, not a generic template
5. Reference specific things they said AND specific recommendations given to show continuity

For timing: Always consider the user's sleep schedule when suggesting activity times. Schedule activities appropriately based on their wake and sleep times. For each routine step, provide a specific reminderTime in 24-hour format (HH:MM) that aligns with the bestTime description and the user's sleep schedule.

Technical requirements:
- Separate regular daily routine steps (that need reminders) from additional one-time or as-needed steps
- For will_video_tutorial_help: true for visual demonstrations (exercises, techniques), false for simple activities (medication, water, journaling)
- Always return valid JSON with the exact structure specified`;
  }
}