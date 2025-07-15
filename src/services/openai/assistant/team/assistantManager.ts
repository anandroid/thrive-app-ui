/**
 * @fileoverview Assistant Manager for multi-assistant architecture
 * @module services/openai/assistant/team/assistantManager
 * 
 * Manages creation, selection, and coordination of specialized assistants.
 */

import { CHAT_ASSISTANT_CONFIG } from './chatAssistant';
import { ROUTINE_ASSISTANT_CONFIG } from './routineAssistant';
import { PANTRY_ASSISTANT_CONFIG } from './pantryAssistant';
import { RECOMMENDATION_ASSISTANT_CONFIG } from './recommendationAssistant';
import { getFunctionsForRole } from './sharedFunctions';
import { isFeatureEnabled } from '@/src/config/features';
import { buildAssistantInstructions } from './instructionBuilder';
import { checkForEmergency } from './commonInstructions';

/**
 * Assistant types
 */
export type AssistantRole = 'chat' | 'routine' | 'pantry' | 'recommendation';

/**
 * Assistant configuration with IDs
 */
export interface AssistantInfo {
  role: AssistantRole;
  id: string;
  name: string;
  description: string;
}

/**
 * Intent detection patterns
 */
const INTENT_PATTERNS = {
  routine: {
    create: [
      /create.*routine/i,
      /build.*routine/i,
      /design.*routine/i,
      /start.*thriving/i,
      /wellness.*plan/i,
      /daily.*schedule/i,
      /habit.*formation/i,
      /suggest.*creating.*routine/i,
      /add.*to.*routine/i,
      /routine.*includes/i
    ],
    adjust: [
      /adjust.*routine/i,
      /modify.*routine/i,
      /change.*routine/i,
      /update.*thriving/i,
      /routine.*not.*working/i
    ]
  },
  pantry: {
    supplement: [
      /supplement.*recommend/i,
      /what.*supplement/i,
      /vitamin.*for/i,
      /mineral.*help/i,
      /natural.*remedy/i,
      /herb.*for/i
    ],
    medication: [
      /medication.*track/i,
      /drug.*interaction/i,
      /medicine.*manage/i,
      /prescription.*organize/i
    ],
    pantry: [
      /pantry.*add/i,
      /track.*supplement/i,
      /organize.*vitamin/i,
      /what.*have/i
    ]
  }
};

/**
 * Determine which assistant should handle a user message
 * @param {string} message - User's message
 * @param {Object} context - Current context
 * @returns {AssistantRole} The appropriate assistant role
 */
export const selectAssistant = (
  message: string, 
  context?: {
    currentAssistant?: AssistantRole;
    isCreatingRoutine?: boolean;
    isManagingPantry?: boolean;
  }
): AssistantRole => {
  // Check for emergency first
  const emergency = checkForEmergency(message);
  if (emergency.isEmergency) {
    // Chat assistant handles emergencies
    return 'chat';
  }

  // If user is in a specific flow, keep them with the same assistant
  if (context?.isCreatingRoutine) {
    return 'routine';
  }
  if (context?.isManagingPantry) {
    return 'pantry';
  }

  const lowerMessage = message.toLowerCase();

  // Check routine patterns
  for (const pattern of [...INTENT_PATTERNS.routine.create, ...INTENT_PATTERNS.routine.adjust]) {
    if (pattern.test(lowerMessage)) {
      return 'routine';
    }
  }

  // Check pantry patterns
  for (const patterns of Object.values(INTENT_PATTERNS.pantry)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return 'pantry';
      }
    }
  }

  // Default to chat for general conversations
  return 'chat';
};

/**
 * Get assistant configuration by role
 * @param {AssistantRole} role - The assistant role
 * @returns {Object} Assistant configuration
 */
export const getAssistantConfig = (role: AssistantRole) => {
  switch (role) {
    case 'chat':
      return CHAT_ASSISTANT_CONFIG;
    case 'routine':
      return ROUTINE_ASSISTANT_CONFIG;
    case 'pantry':
      return PANTRY_ASSISTANT_CONFIG;
    case 'recommendation':
      return RECOMMENDATION_ASSISTANT_CONFIG;
    default:
      return CHAT_ASSISTANT_CONFIG;
  }
};

/**
 * Create assistant configuration for OpenAI API
 * @param {AssistantRole} role - The assistant role
 * @returns {Object} Configuration object for assistant creation
 */
export const createAssistantConfiguration = (role: AssistantRole) => {
  const config = getAssistantConfig(role);
  
  // Conditionally include functions based on feature flag
  const tools = isFeatureEnabled('assistantFunctions') 
    ? getFunctionsForRole(role).map(func => ({ type: 'function' as const, function: func }))
    : [];

  // Build instructions dynamically based on feature flags
  const instructions = buildAssistantInstructions(config.instructions, role);

  return {
    name: config.name,
    description: config.description,
    model: config.model,
    instructions,
    tools,
    response_format: config.response_format,
    temperature: config.temperature,
    metadata: {
      role,
      version: '2.0',
      team: 'thrive-wellness',
      functionsEnabled: isFeatureEnabled('assistantFunctions') ? 'true' : 'false'
    }
  };
};

/**
 * Message to show when switching assistants
 * @param {AssistantRole} fromRole - Current assistant
 * @param {AssistantRole} toRole - Target assistant
 * @returns {string} Handoff message
 */
export const getHandoffMessage = (fromRole: AssistantRole, toRole: AssistantRole): string => {
  const transitions: Record<string, string> = {
    'chat-routine': "I'll connect you with our Routine Specialist who can create a personalized wellness plan for you.",
    'chat-pantry': "Let me bring in our Pantry Specialist to help with supplement recommendations.",
    'routine-chat': "I'll hand you back to our Chat Specialist for general wellness guidance.",
    'routine-pantry': "Our Pantry Specialist can help you with the supplements for your routine.",
    'pantry-chat': "I'll reconnect you with our Chat Specialist for broader wellness support.",
    'pantry-routine': "Our Routine Specialist can help you build a routine around these supplements."
  };

  const key = `${fromRole}-${toRole}`;
  return transitions[key] || "I'll connect you with the right specialist for your needs.";
};

/**
 * Environment variable names for assistant IDs
 */
export const ASSISTANT_ENV_KEYS = {
  chat: 'THRIVE_CHAT_ASSISTANT_ID',
  routine: 'THRIVE_ROUTINE_ASSISTANT_ID',
  pantry: 'THRIVE_PANTRY_ASSISTANT_ID',
  recommendation: 'THRIVE_RECOMMENDATION_ASSISTANT_ID'
} as const;

/**
 * Get assistant ID from environment
 * @param {AssistantRole} role - The assistant role
 * @returns {string | undefined} Assistant ID
 */
export const getAssistantId = (role: AssistantRole): string | undefined => {
  const key = ASSISTANT_ENV_KEYS[role];
  return process.env[key];
};

/**
 * Check if all assistants are configured
 * @returns {boolean} True if all assistant IDs are available
 */
export const areAllAssistantsConfigured = (): boolean => {
  return Object.values(ASSISTANT_ENV_KEYS).every(key => !!process.env[key]);
};

/**
 * Get assistant role from assistant ID
 * @param {string} assistantId - The assistant ID
 * @returns {AssistantRole | undefined} Assistant role
 */
export const getRoleFromAssistantId = (assistantId: string): AssistantRole | undefined => {
  for (const [role, envKey] of Object.entries(ASSISTANT_ENV_KEYS)) {
    if (process.env[envKey] === assistantId) {
      return role as AssistantRole;
    }
  }
  return undefined;
};

