/**
 * JSON Schema for Routine Assistant responses
 */

export const ROUTINE_RESPONSE_SCHEMA = {
  name: "routine_response",
  schema: {
    type: "object",
    properties: {
      greeting: { type: "string" },
      attentionRequired: { type: ["string", "null"] },
      emergencyReasoning: { type: ["string", "null"] },
      actionItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" }
          },
          required: ["title", "content"],
          additionalProperties: false
        }
      },
      additionalInformation: { type: ["string", "null"] },
      actionableItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            thrivingType: { type: "string" },
            duration: { type: "string" },
            frequency: { type: "string" },
            modalTitle: { type: "string" },
            modalDescription: { type: "string" },
            customInstructionsPlaceholder: { type: "string" },
            routineId: { type: "string" },
            adjustmentInstructions: { type: "string" }
          },
          required: ["type", "title"],
          additionalProperties: false
        }
      },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string" },
            prompt: { type: "string" },
            userVoice: { type: "string" },
            quickOptions: { type: "array", items: { type: "string" } }
          },
          required: ["id", "type", "prompt", "userVoice"],
          additionalProperties: false
        }
      }
    },
    required: ["greeting", "actionItems", "actionableItems", "questions"],
    additionalProperties: false
  },
  strict: true
};