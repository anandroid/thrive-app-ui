/**
 * Environment-specific configuration
 * Centralizes all environment detection and feature flags
 */

export interface EnvConfig {
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
  projectId: string;
  openAiProject: string;
  features: {
    enableBetaFeatures: boolean;
    enableDebugLogging: boolean;
    enableMockData: boolean;
    enableAssistantFunctions: boolean;
    enableExpertConsultation: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  performance: {
    enableProfiling: boolean;
    bundleSizeLimit: number; // KB
    pageSizeLimit: number; // KB
  };
}

/**
 * Get environment-specific configuration
 * @returns {EnvConfig} Configuration object for current environment
 */
export function getEnvConfig(): EnvConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const projectId = process.env.GCLOUD_PROJECT || '';
  
  // Detect environment based on project ID or NODE_ENV
  const isDev = projectId === 'thrive-dev-465922' || nodeEnv === 'development';
  const isProd = projectId === 'thrive-465618' || nodeEnv === 'production';
  const isTest = nodeEnv === 'test';
  
  return {
    isDev,
    isProd,
    isTest,
    projectId,
    openAiProject: isDev ? 'thrive-dev' : 'thrive',
    
    features: {
      enableBetaFeatures: isDev,
      enableDebugLogging: isDev || isTest,
      enableMockData: isTest,
      enableAssistantFunctions: process.env.ENABLE_ASSISTANT_FUNCTIONS === 'true',
      enableExpertConsultation: process.env.NEXT_PUBLIC_ENABLE_EXPERT_CONSULTATION === 'true'
    },
    
    api: {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || (isDev ? 'http://localhost:3000' : 'https://thrive.com'),
      timeout: isDev ? 30000 : 15000, // 30s dev, 15s prod
      retryAttempts: isDev ? 1 : 3
    },
    
    performance: {
      enableProfiling: isDev,
      bundleSizeLimit: 500, // KB
      pageSizeLimit: 150 // KB
    }
  };
}

/**
 * Get the correct assistant ID based on environment
 */
export function getAssistantId(assistantType: 'chat' | 'routine' | 'pantry' | 'recommendation' | 'feed'): string | undefined {
  const config = getEnvConfig();
  
  switch (assistantType) {
    case 'chat':
      return process.env.THRIVE_CHAT_ASSISTANT_ID;
    case 'routine':
      return process.env.THRIVE_ROUTINE_ASSISTANT_ID;
    case 'pantry':
      return process.env.THRIVE_PANTRY_ASSISTANT_ID;
    case 'recommendation':
      return process.env.THRIVE_RECOMMENDATION_ASSISTANT_ID;
    case 'feed':
      // Feed assistant has different env var names
      return config.isDev 
        ? process.env.THRIVE_DEV_FEED_ASSISTANT_ID
        : process.env.THRIVE_FEED_ASSISTANT_ID;
    default:
      throw new Error(`Unknown assistant type: ${assistantType}`);
  }
}

/**
 * Log with appropriate level based on environment
 */
export function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
  const config = getEnvConfig();
  
  if (!config.features.enableDebugLogging && level === 'info') {
    return; // Skip info logs in production
  }
  
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  switch (level) {
    case 'info':
      console.log(prefix, message, data || '');
      break;
    case 'warn':
      console.warn(prefix, message, data || '');
      break;
    case 'error':
      console.error(prefix, message, data || '');
      break;
  }
}

/**
 * Create a trace ID for request tracking
 */
export function createTraceId(): string {
  return crypto.randomUUID();
}

/**
 * Sanitize error messages for client response
 */
export function sanitizeError(error: unknown, traceId: string): { message: string; traceId: string; statusCode: number } {
  const config = getEnvConfig();
  
  // Log full error internally
  log('error', `Error ${traceId}:`, error);
  
  // Type guard for error objects
  const errorObj = error as Record<string, unknown>;
  
  // Determine status code
  const statusCode = (errorObj.statusCode as number) || (errorObj.status as number) || 500;
  
  // Sanitize message for client
  let message = 'An error occurred';
  
  if (statusCode < 500) {
    // Client errors can be more specific
    message = (errorObj.message as string) || message;
  } else if (config.isDev) {
    // Show full errors in dev
    message = (errorObj.message as string) || message;
  } else {
    // Generic message in production for server errors
    message = 'Internal server error';
  }
  
  return {
    message,
    traceId,
    statusCode
  };
}