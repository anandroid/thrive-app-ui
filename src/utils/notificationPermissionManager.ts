import bridge from '@/src/lib/react-native-bridge';

class NotificationPermissionManager {
  private static instance: NotificationPermissionManager;
  private permissionStatus: boolean | null = null;
  private isChecking: boolean = false;
  private checkPromise: Promise<boolean> | null = null;

  private constructor() {}

  public static getInstance(): NotificationPermissionManager {
    if (!NotificationPermissionManager.instance) {
      NotificationPermissionManager.instance = new NotificationPermissionManager();
    }
    return NotificationPermissionManager.instance;
  }

  /**
   * Get notification permission status
   * - Fetches from bridge once per session
   * - Returns cached value on subsequent calls
   * - Re-fetches if forceRefresh is true
   */
  public async getPermissionStatus(forceRefresh: boolean = false): Promise<boolean> {
    console.log('[PermissionManager] getPermissionStatus called, forceRefresh:', forceRefresh);

    // If not in React Native, always return true (no permissions needed)
    if (!bridge.isInReactNative()) {
      return true;
    }

    // If we have a cached value and not forcing refresh, return it
    if (this.permissionStatus !== null && !forceRefresh) {
      console.log('[PermissionManager] Returning cached status:', this.permissionStatus);
      return this.permissionStatus;
    }

    // If already checking, wait for the existing check to complete
    if (this.isChecking && this.checkPromise) {
      console.log('[PermissionManager] Already checking, waiting for existing check');
      return this.checkPromise;
    }

    // Start a new check
    this.isChecking = true;
    this.checkPromise = this.fetchPermissionStatus();

    try {
      const status = await this.checkPromise;
      this.permissionStatus = status;
      console.log('[PermissionManager] Permission status fetched:', status);
      return status;
    } finally {
      this.isChecking = false;
      this.checkPromise = null;
    }
  }

  /**
   * Request notification permission
   * - Requests permission via bridge
   * - Updates cached status on success
   */
  public async requestPermission(): Promise<boolean> {
    console.log('[PermissionManager] requestPermission called');

    try {
      const granted = await bridge.requestNotificationPermission();
      console.log('[PermissionManager] Permission request result:', granted);
      
      // Update cached status
      this.permissionStatus = granted;
      
      // Also update localStorage for backward compatibility
      if (granted) {
        localStorage.setItem('notificationPermissionGranted', 'true');
      }
      
      return granted;
    } catch (error) {
      console.error('[PermissionManager] Error requesting permission:', error);
      // On error, try to refresh the status
      return this.getPermissionStatus(true);
    }
  }

  /**
   * Clear cached permission status
   * Useful when app resumes or on certain navigation events
   */
  public clearCache(): void {
    console.log('[PermissionManager] Clearing cached permission status');
    this.permissionStatus = null;
  }

  private async fetchPermissionStatus(): Promise<boolean> {
    try {
      // Check if we're in React Native environment
      if (bridge.isInReactNative()) {
        console.log('[PermissionManager] In React Native, checking permission via bridge');
        
        try {
          // Try to use the native app's checkNotificationPermission method
          const granted = await bridge.checkNotificationPermission();
          console.log('[PermissionManager] Bridge permission check result:', granted);
          return granted;
        } catch (bridgeError) {
          console.log('[PermissionManager] Bridge method not available:', (bridgeError as Error).message);
          
          // If bridge method doesn't exist, use intelligent fallback
          // Since the logs show notifications are being scheduled and working,
          // we can infer that permissions are likely granted
          console.log('[PermissionManager] Using intelligent fallback for React Native');
          
          // Check if there are existing notifications or evidence of permission
          const hasEvidence = this.hasEvidenceOfNotificationPermission();
          console.log('[PermissionManager] Evidence of notification permission:', hasEvidence);
          
          return hasEvidence;
        }
      }
      
      console.log('[PermissionManager] Not in React Native, checking web permissions');
      
      // For web environment, check browser notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = Notification.permission === 'granted';
        console.log('[PermissionManager] Web notification permission:', permission);
        return permission;
      }
      
      // Final fallback to localStorage for compatibility
      const storedValue = localStorage.getItem('notificationPermissionGranted');
      console.log('[PermissionManager] Fallback to localStorage:', storedValue);
      return storedValue === 'true';
    } catch (error) {
      console.error('[PermissionManager] Error fetching permission status:', error);
      
      // On error, try localStorage as last resort
      const storedValue = localStorage.getItem('notificationPermissionGranted');
      console.log('[PermissionManager] Error fallback to localStorage:', storedValue);
      return storedValue === 'true';
    }
  }

  /**
   * Check for evidence that notification permissions are granted
   * This is used as a fallback when the bridge method is not available
   */
  private hasEvidenceOfNotificationPermission(): boolean {
    try {
      // Check if there are any existing thrivings with notifications
      const thrivings = localStorage.getItem('thrive_thrivings');
      if (thrivings) {
        const parsedThrivings = JSON.parse(thrivings);
        const hasActiveThrivings = Array.isArray(parsedThrivings) && parsedThrivings.length > 0;
        
        if (hasActiveThrivings) {
          console.log('[PermissionManager] Found active thrivings, likely have permissions');
          return true;
        }
      }
      
      // Check if there's any evidence in localStorage
      const permissionGranted = localStorage.getItem('notificationPermissionGranted') === 'true';
      if (permissionGranted) {
        console.log('[PermissionManager] localStorage indicates permissions granted');
        return true;
      }
      
      // No evidence found
      console.log('[PermissionManager] No evidence of notification permissions found');
      return false;
    } catch (error) {
      console.error('[PermissionManager] Error checking evidence:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationPermissionManager = NotificationPermissionManager.getInstance();