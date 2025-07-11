// Multi-Assistant Services
export { MultiAssistantService, getMultiAssistantService } from './multiAssistantService';

// Routine Services
export { RoutineCreationService } from './routines/routineCreationService';
export { RoutineAdjustmentService } from './routines/routineAdjustmentService';
export { RoutineOptimizer } from './routines/routineOptimizer';
export { RoutinePromptBuilder } from './routines/routinePromptBuilder';

// Assistant Team Services
export * from './assistant/team/assistantManager';
export * from './assistant/team/sharedFunctions';

// Types
export * from './types';

// Utilities
export * from './utils';

// Re-export for convenience
export type { RoutineCreationParams } from './routines/routineCreationService';
export type { AdjustmentParams } from './routines/routineAdjustmentService';