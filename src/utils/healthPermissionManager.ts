import bridge from '@/src/lib/react-native-bridge';

class HealthPermissionManager {
  private static instance: HealthPermissionManager;
  private permissionStatus: boolean | null = null;
  private isChecking: boolean = false;
  private checkPromise: Promise<boolean> | null = null;
  private hasShownPermissionPromptThisSession: boolean = false;

  private constructor() {}

  public static getInstance(): HealthPermissionManager {
    if (!HealthPermissionManager.instance) {
      HealthPermissionManager.instance = new HealthPermissionManager();
    }
    return HealthPermissionManager.instance;
  }

  /**
   * Get health permission status
   * - Fetches from bridge once per session
   * - Returns cached value on subsequent calls
   * - Re-fetches if forceRefresh is true
   */
  public async getPermissionStatus(forceRefresh: boolean = false): Promise<boolean> {
    console.log('[HealthPermissionManager] getPermissionStatus called, forceRefresh:', forceRefresh);

    // If not in React Native, always return false (health data not available)
    if (!bridge.isInReactNative()) {
      console.log('[HealthPermissionManager] Not in React Native, returning false');
      return false;
    }

    // If we have a cached value and not forcing refresh, return it
    if (this.permissionStatus !== null && !forceRefresh) {
      console.log('[HealthPermissionManager] Returning cached status:', this.permissionStatus);
      return this.permissionStatus;
    }

    // If already checking, wait for the existing check to complete
    if (this.isChecking && this.checkPromise) {
      console.log('[HealthPermissionManager] Already checking, waiting for existing check');
      return this.checkPromise;
    }

    // Start a new check
    this.isChecking = true;
    this.checkPromise = this.fetchPermissionStatus();

    try {
      const status = await this.checkPromise;
      this.permissionStatus = status;
      console.log('[HealthPermissionManager] Permission status fetched:', status);
      return status;
    } finally {
      this.isChecking = false;
      this.checkPromise = null;
    }
  }

  /**
   * Request health permission
   * - Requests permission via bridge
   * - Updates cached status on success
   * - Forces refresh check after request
   */
  public async requestPermission(): Promise<boolean> {
    console.log('[HealthPermissionManager] requestPermission called');

    if (!bridge.isInReactNative()) {
      console.log('[HealthPermissionManager] Cannot request permission - not in React Native');
      return false;
    }

    try {
      const granted = await bridge.requestHealthPermission();
      console.log('[HealthPermissionManager] Permission request result:', granted);
      
      // Update cached status
      this.permissionStatus = granted;
      
      // Update localStorage for backward compatibility
      if (granted) {
        localStorage.setItem('healthDataConnected', 'true');
      } else {
        localStorage.removeItem('healthDataConnected');
      }
      
      return granted;
    } catch (error) {
      console.error('[HealthPermissionManager] Error requesting permission:', error);
      // On error, try to refresh the status
      return this.getPermissionStatus(true);
    }
  }

  /**
   * Clear cached permission status
   * Useful when app resumes or on certain navigation events
   */
  public clearCache(): void {
    console.log('[HealthPermissionManager] Clearing cached permission status');
    this.permissionStatus = null;
    this.hasShownPermissionPromptThisSession = false;
  }

  private async fetchPermissionStatus(): Promise<boolean> {
    try {
      // Check if we're in React Native environment
      if (bridge.isInReactNative()) {
        console.log('[HealthPermissionManager] In React Native, checking permission via bridge');
        
        try {
          // Try to use the bridge's checkHealthPermission method
          const granted = await bridge.checkHealthPermission();
          console.log('[HealthPermissionManager] Bridge permission check result:', granted);
          
          // Update localStorage to match
          if (granted) {
            localStorage.setItem('healthDataConnected', 'true');
          } else {
            localStorage.removeItem('healthDataConnected');
          }
          
          return granted;
        } catch (bridgeError) {
          console.log('[HealthPermissionManager] Bridge method not available:', (bridgeError as Error).message);
          
          // Fallback to localStorage
          const storedValue = localStorage.getItem('healthDataConnected');
          console.log('[HealthPermissionManager] Fallback to localStorage:', storedValue);
          return storedValue === 'true';
        }
      }
      
      // Not in React Native, health data not available
      console.log('[HealthPermissionManager] Not in React Native, health data not available');
      return false;
    } catch (error) {
      console.error('[HealthPermissionManager] Error fetching permission status:', error);
      
      // On error, try localStorage as last resort
      const storedValue = localStorage.getItem('healthDataConnected');
      console.log('[HealthPermissionManager] Error fallback to localStorage:', storedValue);
      return storedValue === 'true';
    }
  }

  // Check if we should show permission prompt
  public shouldShowPermissionPrompt(): boolean {
    // Don't show if already shown this session
    if (this.hasShownPermissionPromptThisSession) {
      console.log('[HealthPermissionManager] Already shown permission prompt this session');
      return false;
    }

    // Don't show if permission already granted
    if (this.permissionStatus === true) {
      console.log('[HealthPermissionManager] Permission already granted');
      return false;
    }

    // Don't show if user has connected before
    const hasConnected = localStorage.getItem('healthDataConnected') === 'true';
    
    if (hasConnected) {
      console.log('[HealthPermissionManager] User has already connected health data');
      return false;
    }

    return true;
  }

  public markPermissionPromptShown(): void {
    this.hasShownPermissionPromptThisSession = true;
  }
}

export const healthPermissionManager = HealthPermissionManager.getInstance();