// Chat Services
export { StreamingChatService } from './chat/streamingService';

// Routine Services
export { RoutineCreationService } from './routines/routineCreationService';
export { RoutineAdjustmentService } from './routines/routineAdjustmentService';
export { RoutineOptimizer } from './routines/routineOptimizer';
export { RoutinePromptBuilder } from './routines/routinePromptBuilder';

// Assistant Services
export { AssistantConfigService } from './assistant/assistantConfigService';
export { ASSISTANT_INSTRUCTIONS } from './assistant/assistantInstructions';

// Types
export * from './types';

// Utilities
export * from './utils';

// Re-export for convenience
export type { RoutineCreationParams } from './routines/routineCreationService';
export type { AdjustmentParams } from './routines/routineAdjustmentService';
export type { AssistantConfig } from './assistant/assistantConfigService';