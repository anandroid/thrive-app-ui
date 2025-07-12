/**
 * @fileoverview Dynamic instruction builder for assistants
 * @module services/openai/assistant/team/instructionBuilder
 * 
 * Builds assistant instructions dynamically based on feature flags
 */

import { isFeatureEnabled } from '@/src/config/features';
import { AssistantRole } from './assistantManager';

/**
 * Function-related instructions to append when functions are enabled
 */
const FUNCTION_ENABLED_INSTRUCTIONS = {
  chat: `
## Available Functions
When functions are enabled, you have access to:
- get_pantry_items: Retrieve user's pantry contents
- get_thriving_progress: Check routine progress
- get_pantry_recommendations: Get personalized supplement suggestions

Use these functions when you need detailed information beyond basicContext.`,
  
  routine: `
## Available Functions
When functions are enabled, you can:
- Access detailed pantry information
- Check current routine progress
- Get personalized recommendations

Use functions to enhance routine personalization with real-time data.`,
  
  pantry: `
## Available Functions
When functions are enabled, you can:
- Get complete pantry inventory
- Check for interactions
- Access detailed supplement information

Use functions for comprehensive pantry management.`
};

/**
 * BasicContext instructions to append when functions are disabled
 */
const BASIC_CONTEXT_INSTRUCTIONS = `
## Working with BasicContext
You receive basicContext in conversations containing:

### basicContext structure:
- pantryItems: Array of strings describing supplements/medications
  Example: ["Magnesium 400mg - for sleep", "Vitamin D 2000IU"]
- activeRoutines: Array of routine objects with:
  - id: Unique identifier
  - name: Routine name
  - type: Routine type (sleep, stress, etc.)
  - reminderTimes: Array of reminder times
  - steps: Array of routine steps

### Guidelines
- Use the provided context to understand user's current setup
- Empty arrays mean user has no items/routines
- Make personalized recommendations based on this context
- Follow all conversation flow rules as normal`;

/**
 * Build complete instructions for an assistant
 * @param baseInstructions - The base instructions for the assistant
 * @param role - The assistant role
 * @returns Complete instructions with function-related additions
 */
export const buildAssistantInstructions = (
  baseInstructions: string, 
  role: AssistantRole
): string => {
  const functionsEnabled = isFeatureEnabled('assistantFunctions');
  
  // Start with base instructions
  let instructions = baseInstructions;
  
  // Add function-specific instructions based on feature flag
  if (functionsEnabled) {
    instructions += FUNCTION_ENABLED_INSTRUCTIONS[role] || '';
  } else {
    instructions += BASIC_CONTEXT_INSTRUCTIONS;
  }
  
  return instructions;
};

/**
 * Get a description of the current mode for logging
 */
export const getAssistantModeDescription = (): string => {
  return isFeatureEnabled('assistantFunctions') 
    ? 'Functions Enabled' 
    : 'Function-Free Mode';
};