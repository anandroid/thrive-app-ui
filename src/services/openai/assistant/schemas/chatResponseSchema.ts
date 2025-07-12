/**
 * JSON Schema for Chat Assistant responses
 * This defines the exact structure the assistant must follow
 */

export const CHAT_RESPONSE_SCHEMA = {
  name: "chat_response",
  schema: {
    type: "object",
    properties: {
      greeting: {
        type: "string",
        description: "Warm acknowledgment of user's concern"
      },
      attentionRequired: {
        type: ["string", "null"],
        description: "Emergency information if urgent care is needed"
      },
      emergencyReasoning: {
        type: ["string", "null"],
        description: "Explanation of why emergency attention is needed"
      },
      actionItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { 
              type: "string",
              description: "HTML formatted content with <p>, <strong>, <em> tags"
            },
            description: { type: "string" }
          },
          required: ["title", "content"],
          additionalProperties: false
        },
        description: "Educational content and natural remedies"
      },
      additionalInformation: {
        type: ["string", "null"],
        description: "Brief tip or quote (1-2 sentences max) in HTML format"
      },
      actionableItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "appointment", "medicine", "routine", "create_routine", 
                "prescription", "resource", "link", "start_journey", 
                "continue_journey", "buy", "add_to_pantry", "already_have", 
                "adjust_routine", "supplement_choice", "thriving"
              ]
            },
            title: { type: "string" },
            description: { type: "string" },
            details: { type: "string" },
            category: { type: "string" },
            link: { type: "string" },
            thrivingId: { type: "string" },
            thrivingType: { type: "string" },
            duration: { type: "string" },
            frequency: { type: "string" },
            customInstructions: { type: "string" },
            modalTitle: { type: "string" },
            modalDescription: { type: "string" },
            customInstructionsPlaceholder: { type: "string" },
            journeyType: { type: "string" },
            journey_type: { type: "string" },
            journeyId: { type: "string" },
            journeyTitle: { type: "string" },
            isExisting: { type: "boolean" },
            emoji: { type: "string" },
            action: { type: "string" },
            productName: { type: "string" },
            searchQuery: { type: "string" },
            reason: { type: "string" },
            dosage: { type: "string" },
            timing: { type: "string" },
            price_range: { type: "string" },
            suggestedNotes: { type: "string" },
            routineId: { type: "string" },
            adjustmentInstructions: { type: "string" },
            contextMessage: { type: "string" }
          },
          required: ["type", "title"],
          additionalProperties: false
        },
        description: "Actionable recommendations like supplements, routines, appointments"
      },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { 
              type: "string",
              description: "Unique identifier for the question"
            },
            type: { 
              type: "string",
              enum: ["quick_reply", "text_input", "multi_select", "time_picker"]
            },
            prompt: { type: "string" },
            userVoice: { 
              type: "string",
              description: "Natural language prefix for the answer"
            },
            quickOptions: {
              type: "array",
              items: { type: "string" },
              description: "Options for quick_reply type"
            },
            options: {
              type: "array",
              items: { type: "string" },
              description: "Options for multi_select type"
            },
            placeholder: {
              type: "string",
              description: "Hint text for text_input type"
            }
          },
          required: ["id", "type", "prompt", "userVoice"],
          additionalProperties: false
        },
        description: "Questions to gather more information from user"
      }
    },
    required: ["greeting", "actionItems", "actionableItems", "questions"],
    additionalProperties: false
  },
  strict: true
};