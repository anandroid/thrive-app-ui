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
  
  /**
   * Enable/disable expert consultation feature
   * Allows users to book consultations with wellness experts
   * @default false
   */
  expertConsultation: boolean;
}

/**
 * Expert consultation configuration
 */
export interface ExpertConsultationConfig {
  enabled: boolean;
  shopifyBookingUrl: string;
  consultationApiUrl: string;
  webhookSecret: string;
}

/**
 * Default feature flags
 */
export const defaultFeatureFlags: FeatureFlags = {
  assistantFunctions: false, // Disabled by default
  expertConsultation: false, // Disabled by default
};

/**
 * Get feature flags from environment or use defaults
 */
export const getFeatureFlags = (): FeatureFlags => {
  return {
    assistantFunctions: process.env.NEXT_PUBLIC_ENABLE_ASSISTANT_FUNCTIONS === 'true' || 
                       process.env.ENABLE_ASSISTANT_FUNCTIONS === 'true' ||
                       defaultFeatureFlags.assistantFunctions,
    expertConsultation: process.env.NEXT_PUBLIC_ENABLE_EXPERT_CONSULTATION === 'true' ||
                       defaultFeatureFlags.expertConsultation,
  };
};

/**
 * Get expert consultation configuration
 */
export const getExpertConsultationConfig = (): ExpertConsultationConfig => {
  return {
    enabled: isFeatureEnabled('expertConsultation'),
    shopifyBookingUrl: process.env.NEXT_PUBLIC_SHOPIFY_BOOKING_URL || '',
    consultationApiUrl: process.env.NEXT_PUBLIC_CONSULTATION_API_URL || '',
    webhookSecret: process.env.CONSULTATION_WEBHOOK_SECRET || '',
  };
};

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[feature];
};