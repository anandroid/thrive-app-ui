/**
 * JSON Schema for Pantry Assistant responses
 */

export const PANTRY_RESPONSE_SCHEMA = {
  name: "pantry_response",
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
            productName: { type: "string" },
            dosage: { type: "string" },
            timing: { type: "string" },
            searchQuery: { type: "string" },
            suggestedNotes: { type: "string" }
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
            placeholder: { type: "string" },
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