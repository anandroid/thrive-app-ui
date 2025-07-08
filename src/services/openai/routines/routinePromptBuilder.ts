export class RoutinePromptBuilder {
  buildRoutineCreationPrompt(params: {
    healthConcern: string;
    routineType: string;
    duration: string;
    frequency: string;
    sleepTime?: string;
    wakeTime?: string;
    customInstructions?: string;
  }): string {
    const {
      healthConcern,
      routineType,
      duration,
      frequency,
      sleepTime,
      wakeTime,
      customInstructions,
    } = params;

    return `Create a detailed wellness routine for: ${healthConcern}

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
    return "You are a wellness routine expert. Create detailed, practical, and safe wellness routines. Always consider the user's sleep schedule when suggesting activity times. Schedule activities appropriately based on their wake and sleep times. For each routine step, provide a specific reminderTime in 24-hour format (HH:MM) that aligns with the bestTime description and the user's sleep schedule. For example, if wake time is 06:00 and a step is best done 'in the morning', set reminderTime to something like '07:00' or '08:00'. Separate regular daily routine steps (that need reminders) from additional one-time or as-needed steps. For the will_video_tutorial_help field: set to true for activities that benefit from visual demonstration (exercises, stretches, breathing techniques, massage techniques, cooking/preparation methods), and false for simple activities (taking medication, drinking water, going for a walk, journaling, sleeping). Always return valid JSON.";
  }
}