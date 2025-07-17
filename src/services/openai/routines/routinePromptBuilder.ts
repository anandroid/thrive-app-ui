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

IMPORTANT REQUIREMENTS:
1. The routine MUST directly address ALL specific concerns, symptoms, preferences, and circumstances mentioned above
2. If the user accepted any supplements (like magnesium, melatonin, etc.), they MUST be included as specific steps with exact dosages and timing
3. If specific exercises or techniques were recommended (like shoulder exercises), include them EXACTLY as described
4. NEVER create a generic routine - every element must tie back to the conversation
5. For specialty conditions (chronic pain, autoimmune, etc.), include condition-specific management strategies

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
  "progressTracking": "How to track progress",
  "journalTemplate": {
    "journalType": "sleep_tracking|pain_monitoring|mood_wellness|stress_management|medication_tracking|general_wellness",
    "customFields": [
      {
        "id": "field_1", // Use simple sequential IDs like field_1, field_2, etc.
        "type": "slider|emoji_picker|tag_selector|time_picker|magnitude_input|multiple_choice",
        "label": "User-friendly label",
        "description": "Optional helpful text",
        "required": true|false,
        "sliderConfig": {
          "min": 1, "max": 10, "step": 1,
          "labels": {"1": "Label1", "10": "Label2"},
          "showValue": true, "gradient": true
        },
        "emojiConfig": {
          "emojiSet": ["😊", "😐", "😔"],
          "columns": 5
        },
        "tagConfig": {
          "options": ["Option1", "Option2"],
          "maxSelections": 5,
          "allowCustom": true
        },
        "timeConfig": {
          "format": "12h",
          "defaultValue": "10:00 PM"
        },
        "magnitudeConfig": {
          "min": 0, "max": 12, "step": 0.5,
          "unit": "hours",
          "showTrend": true
        },
        "multipleChoiceConfig": {
          "options": ["Option1", "Option2"],
          "layout": "vertical"
        }
      }
    ],
    "prompts": [
      {
        "id": "prompt_1", // Use simple sequential IDs
        "question": "Personalized question based on user's specific context",
        "type": "reflection|tracking|troubleshooting|celebration",
        "priority": 1 // Number between 1-10
      }
    ],
    "trackingFocus": ["sleep_quality", "supplement_effectiveness", "pain_levels"]
  }
}

Include 3-7 daily routine steps that need reminders, and 2-5 additional steps for one-time setup, weekly maintenance, or as-needed activities. Additional steps are things like "Buy a humidifier", "Clean equipment weekly", "Replace filters monthly", etc.`;
  }

  getSystemPrompt(): string {
    return `You are a wellness routine expert who creates HIGHLY PERSONALIZED routines based on user conversations. 

CRITICAL INSTRUCTIONS FOR NON-GENERIC ROUTINES:
1. When conversation context is provided, it is YOUR PRIMARY SOURCE OF TRUTH
2. Extract and address EVERY specific detail the user mentioned:
   - Specific symptoms they're experiencing
   - Times of day when issues occur
   - What they've already tried
   - Their lifestyle constraints
   - Personal preferences
   - Medical conditions mentioned
   - Emotional state and concerns
3. INCORPORATE ALL SUPPLEMENTS AND MEDICATIONS:
   - If user accepted specific supplements (magnesium, melatonin, etc.), create dedicated steps
   - Include exact dosages and timing mentioned in conversation
   - Reference their pantry items if mentioned
   - Never use generic "take your supplements" - specify WHICH ones
4. INCORPORATE ALL ASSISTANT'S RECOMMENDATIONS:
   - If specific exercises were shown (e.g., shoulder strengthening), include them EXACTLY
   - If techniques were explained, make them part of the daily steps
   - Build upon the foundation already established in the conversation
5. The routine MUST feel like a direct response to their conversation, not a generic template
6. Reference specific things they said AND specific recommendations given to show continuity
7. For specialty conditions (pain management, autoimmune, hormonal issues):
   - Include condition-specific strategies
   - Address their exact symptoms, not general wellness
   - Use medical terminology they used

For timing: Always consider the user's sleep schedule when suggesting activity times. Schedule activities appropriately based on their wake and sleep times. For each routine step, provide a specific reminderTime in 24-hour format (HH:MM) that aligns with the bestTime description and the user's sleep schedule.

Technical requirements:
- Separate regular daily routine steps (that need reminders) from additional one-time or as-needed steps
- For will_video_tutorial_help: true for visual demonstrations (exercises, techniques), false for simple activities (medication, water, journaling)
- Always return valid JSON with the exact structure specified

JOURNAL TEMPLATE REQUIREMENTS:
1. ALWAYS include a personalized journalTemplate that matches the routine type
2. For sleep routines: Include sleep quality tracking, morning mood, actual sleep times, supplement effectiveness
3. For pain routines: Include pain level sliders for each specific area mentioned, pain character emojis, what helped
4. For stress routines: Include stress level slider, coping strategies used, effectiveness tracking
5. For medication routines: Include medication adherence tracking, side effects, effectiveness
6. Use smart input types that make mobile tracking effortless:
   - Sliders for ratings/levels with contextual labels
   - Emoji pickers for mood/feelings
   - Tag selectors for symptoms/strategies with user's specific items
   - Time pickers for sleep/activity times
   - Magnitude inputs for durations with appropriate units
   - Multiple choice for single selections
7. Reference the user's EXACT context in prompts and field labels
8. If user mentioned specific supplements, create effectiveness tracking fields for each
9. If user mentioned specific symptoms/areas, create dedicated tracking for each`;
  }
}