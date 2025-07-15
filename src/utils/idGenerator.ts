/**
 * Utility functions for generating IDs that are compatible with various systems
 * 
 * IMPORTANT: Android notification IDs must be within 32-bit signed integer range
 * Maximum value: 2,147,483,647 (0x7FFFFFFF)
 * 
 * Issue: React Native push notification library tries to parse notification IDs as integers
 * Error: "java.lang.NumberFormatException: For input string: '1752545791738'"
 * 
 * Fix: Use this utility to generate safe notification IDs that don't exceed integer limits
 */

/**
 * Generates a safe notification ID that fits within Android's integer constraints
 * Android notification IDs must be within the range of a 32-bit signed integer
 * Maximum value: 2,147,483,647 (0x7FFFFFFF)
 */
export function generateSafeNotificationId(): string {
  // Use current timestamp modulo the maximum safe integer value
  // This ensures the ID is unique but within Android's integer range
  const maxSafeInt = 2147483647; // 2^31 - 1
  const timestamp = Date.now();
  
  // Use modulo to keep within range, add random component for uniqueness
  const safeId = (timestamp % maxSafeInt) + Math.floor(Math.random() * 1000);
  
  // Ensure we don't exceed the maximum
  return Math.min(safeId, maxSafeInt).toString();
}

/**
 * Generates a regular ID using timestamp (for non-notification purposes)
 * This is the existing pattern used throughout the app
 */
export function generateTimestampId(): string {
  return Date.now().toString();
}

/**
 * Generates a safe integer from a string ID
 * Used when we need to convert existing string IDs to notification-safe integers
 */
export function toSafeNotificationId(stringId: string): string {
  // Extract numbers from the string ID
  const numericPart = parseInt(stringId.replace(/\D/g, ''), 10);
  
  if (isNaN(numericPart)) {
    // Fallback to a safe random ID
    return generateSafeNotificationId();
  }
  
  const maxSafeInt = 2147483647;
  return Math.min(numericPart % maxSafeInt, maxSafeInt).toString();
}

/**
 * Generates a safe notification ID for step reminders
 * Creates a unique integer ID that fits within Android's 32-bit signed integer range
 * 
 * IMPORTANT: This generates SIMPLE NUMERIC IDs only, no compound strings!
 * Android notification system cannot parse IDs like "1234_step_5678" - they must be pure integers
 */
export function generateStepNotificationId(routineId: string, stepId: string): string {
  // Extract numeric parts from both IDs
  const routineNum = parseInt(routineId.replace(/\D/g, ''), 10) || 0;
  const stepNum = parseInt(stepId.replace(/\D/g, ''), 10) || 0;
  
  // Create a hash-based approach for better uniqueness while staying within integer limits
  const maxSafeInt = 2147483647; // 2^31 - 1
  
  // Use a simple hash function to combine the IDs
  let hash = 0;
  const combined = `${routineNum}-${stepNum}`;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive integer within safe range
  const safeId = Math.abs(hash) % maxSafeInt;
  
  // Add a small offset to avoid collisions with other notification types
  const finalId = (safeId + 1000000) % maxSafeInt;
  
  console.log(`[IDGenerator] Generated step notification ID: ${finalId} (from routine: ${routineId}, step: ${stepId})`);
  
  return finalId.toString();
}

/**
 * Checks if a notification ID is in the old compound format
 * Old format: "1752526197137_step_step-1"
 * New format: "123456789" (pure integer)
 */
export function isLegacyNotificationId(id: string): boolean {
  return id.includes('_step_') || id.includes('_') || !/^\d+$/.test(id);
}

/**
 * Migrates a legacy notification ID to the new safe format
 * Used when we encounter old compound IDs that need to be converted
 */
export function migrateLegacyNotificationId(legacyId: string, routineId: string, stepId: string): string {
  console.log(`[IDGenerator] Migrating legacy notification ID: ${legacyId} -> new format`);
  return generateStepNotificationId(routineId, stepId);
}