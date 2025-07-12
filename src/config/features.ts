/**
 * @fileoverview Feature flags configuration
 * @module config/features
 * 
 * Centralized feature flag management for enabling/disabling features
 */

/**
 * Feature flags interface
 */
export interface FeatureFlags {
  /**
   * Enable/disable assistant function calling
   * When disabled, assistants will rely on basicContext instead of calling functions
   * @default false
   */
  assistantFunctions: boolean;
}

/**
 * Default feature flags
 */
export const defaultFeatureFlags: FeatureFlags = {
  assistantFunctions: false, // Disabled by default
};

/**
 * Get feature flags from environment or use defaults
 */
export const getFeatureFlags = (): FeatureFlags => {
  return {
    assistantFunctions: process.env.NEXT_PUBLIC_ENABLE_ASSISTANT_FUNCTIONS === 'true' || 
                       process.env.ENABLE_ASSISTANT_FUNCTIONS === 'true' ||
                       defaultFeatureFlags.assistantFunctions,
  };
};

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[feature];
};