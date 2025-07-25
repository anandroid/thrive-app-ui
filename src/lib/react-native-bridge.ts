// React Native Bridge utilities for communication between WebView and native app

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    ReactNativeBridge?: {
      postMessage: (message: unknown) => void;
      requestCameraPermission: () => void;
      requestNotificationPermission: () => void;
      checkNotificationPermission: () => Promise<boolean>;  // Now implemented!
      notifyThrivingCreated: () => void;
      openExternalUrl: (url: string) => void;
      scheduleStepReminders: (stepNotifications: Array<{
        id: string;
        routineId: string;
        routineName: string;
        title: string;
        time: string;
        reminderText?: string;
        frequency: string;
        enabledWeekdays: boolean;
        enabledWeekends: boolean;
      }>) => void;
      cancelStepReminders: (routineId: string) => void;
      getScheduledNotifications?: () => Promise<Array<{
        id: string;
        title: string;
        body: string;
        data?: Record<string, unknown>;
        scheduledTime: string;
        isRepeating: boolean;
      }>>;
      checkHealthPermission: () => Promise<boolean>;  // Now implemented!
      requestHealthPermission: () => Promise<boolean>;  // Now implemented!
      getHealthData: (params: {  // Now implemented!
        metrics: string[];
        timeRange: 'day' | 'week' | 'month';
      }) => Promise<{
        metrics: Array<{
          type: 'steps' | 'heart_rate' | 'sleep' | 'water' | 'calories' | 'mindfulness';
          value: number;
          unit: string;
          trend: 'up' | 'down' | 'stable';
          changePercent: number;
          goal?: number;
          lastUpdated: Date;
        }>;
        weeklyTrends: {
          labels: string[];
          datasets: Array<{
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
          }>;
        };
        correlations: Array<{
          thriving: string;
          metric: string;
          correlation: number;
          insight: string;
        }>;
      }>;
    };
    onReactNativeMessage?: (message: unknown) => void;
    onReactNativeBridgeReady?: () => void;
  }
}

export interface ReactNativeMessage {
  type: string;
  payload?: unknown;
}

class ReactNativeBridgeManager {
  private isReactNative: boolean = false;
  private messageHandlers: Map<string, (payload: unknown) => void> = new Map();
  private bridgeReadyCallbacks: Array<() => void> = [];

  constructor() {
    // Try immediate detection
    this.detectReactNative();
    this.setupMessageListener();
    this.setupBridgeReadyListener();
    
    // Also try detection after a short delay (for cases where bridge is injected late)
    if (typeof window !== 'undefined') {
      // Try multiple times with increasing delays
      [50, 100, 250, 500, 1000].forEach(delay => {
        setTimeout(() => {
          if (!this.isReactNative) {
            this.detectReactNative();
          }
        }, delay);
      });
      
      // And after DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.detectReactNative();
        });
      }
      
      // Listen for custom event from native app
      window.addEventListener('ReactNativeBridgeReady', () => {
        console.log('Received ReactNativeBridgeReady event');
        this.detectReactNative();
        this.bridgeReadyCallbacks.forEach(callback => callback());
        this.bridgeReadyCallbacks = [];
      });
    }
  }

  private detectReactNative() {
    // Check if we're running in React Native WebView
    const hasNativeBridge = !!(
      typeof window !== 'undefined' &&
      window.ReactNativeWebView &&
      window.ReactNativeBridge
    );
    
    // Check for ReactNativeWebView only (some implementations only have this)
    const hasWebViewOnly = !!(
      typeof window !== 'undefined' &&
      window.ReactNativeWebView &&
      !window.ReactNativeBridge
    );
    
    // Also check for URL parameter override for testing
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forceReactNative = urlParams?.get('reactNative') === 'true';
    
    // Check user agent for React Native
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    const hasReactNativeUserAgent = userAgent.includes('ReactNative') || userAgent.includes('thrive-app');
    
    // Check for custom property that native app might set
    const hasCustomProperty = typeof window !== 'undefined' && 
      ((window as unknown as { __REACT_NATIVE_ENV__?: boolean }).__REACT_NATIVE_ENV__ === true || 
       (window as unknown as { isReactNativeWebView?: boolean }).isReactNativeWebView === true);
    
    const wasReactNative = this.isReactNative;
    this.isReactNative = hasNativeBridge || hasWebViewOnly || forceReactNative || hasReactNativeUserAgent || hasCustomProperty;
    
    // If status changed, log it
    if (wasReactNative !== this.isReactNative) {
      console.log('React Native Bridge status changed:', wasReactNative, '->', this.isReactNative);
    }
    
    // Debug logging
    if (typeof window !== 'undefined') {
      console.log('React Native Bridge Detection:', JSON.stringify({
        timestamp: new Date().toISOString(),
        hasWindow: true,
        hasReactNativeWebView: !!window.ReactNativeWebView,
        hasReactNativeBridge: !!window.ReactNativeBridge,
        hasWebViewOnly,
        forceReactNative,
        userAgent: userAgent.substring(0, 100), // Truncate for readability
        hasReactNativeUserAgent,
        hasCustomProperty,
        isReactNative: this.isReactNative,
        windowKeys: Object.keys(window).filter(k => 
          k.toLowerCase().includes('react') || 
          k.toLowerCase().includes('native') ||
          k.toLowerCase().includes('bridge')
        )
      }, null, 2));
    }
  }

  private setupMessageListener() {
    if (typeof window !== 'undefined') {
      window.onReactNativeMessage = (message: unknown) => {
        console.log('[Bridge] onReactNativeMessage received:', message);
        const msg = message as ReactNativeMessage;
        const handler = this.messageHandlers.get(msg.type);
        if (handler) {
          console.log('[Bridge] Found handler for message type:', msg.type);
          handler(msg.payload);
        } else {
          console.log('[Bridge] No handler for message type:', msg.type);
        }
      };
      
      // Also listen for regular message events
      window.addEventListener('message', (event) => {
        try {
          // Skip Firebase internal messages that start with !_
          if (typeof event.data === 'string' && event.data.startsWith('!_')) {
            return; // Ignore Firebase internal iframe messages
          }
          
          let data: unknown;
          if (typeof event.data === 'string' && (event.data.startsWith('{') || event.data.startsWith('['))) {
            data = JSON.parse(event.data);
          } else {
            data = event.data; // Not JSON, treat as raw data
          }

          if (data && typeof data === 'object' && 'type' in data && typeof data.type === 'string') {
            const msg = data as ReactNativeMessage;
            console.log('[Bridge] Message event received:', msg);
            // Special logging for health permission messages
            if (msg.type === 'health_permission_result' || msg.type === 'health_permission_status') {
              console.log('[Bridge] Got ' + msg.type + ':', JSON.stringify(msg.payload));
            }
            const handler = this.messageHandlers.get(msg.type);
            if (handler) {
              console.log('[Bridge] Found handler for message type:', msg.type);
              handler(msg.payload);
            } else {
              // Only log unknown messages if they might be from React Native
              if (msg.type && !['pantry-data', 'request-pantry-data', 'resize-iframe'].includes(msg.type)) {
                console.log('[Bridge] No handler found for message type:', msg.type);
              }
            }
          } else if (typeof data === 'string') {
            // Handle specific non-JSON string messages
            if (data === 'recaptcha-setup') {
              console.log('[Bridge] Received non-JSON recaptcha-setup message.');
              // You might want to trigger a specific action here if needed
            } else {
              console.log('[Bridge] Received unknown non-JSON message:', data);
            }
          }
        } catch (e) {
          // Only log parse errors for non-Firebase messages
          if (typeof event.data === 'string' && !event.data.startsWith('!_')) {
            console.log('[Bridge] Raw message event data:', event.data);
            console.log('[Bridge] Parse error:', e);
          }
        }
      });
    }
  }

  private setupBridgeReadyListener() {
    if (typeof window !== 'undefined') {
      window.onReactNativeBridgeReady = () => {
        this.bridgeReadyCallbacks.forEach(callback => callback());
        this.bridgeReadyCallbacks = [];
      };
    }
  }

  public isInReactNative(): boolean {
    return this.isReactNative;
  }

  public onBridgeReady(callback: () => void) {
    if (this.isReactNative && window.ReactNativeBridge) {
      // Bridge is already ready
      callback();
    } else {
      // Wait for bridge to be ready
      this.bridgeReadyCallbacks.push(callback);
    }
  }

  public onMessage(type: string, handler: (payload: unknown) => void) {
    this.messageHandlers.set(type, handler);
  }

  public async requestCameraPermission(): Promise<boolean> {
    if (!this.isReactNative || !window.ReactNativeBridge) {
      // Fallback for web - return true as browser will handle permissions
      return true;
    }

    return new Promise((resolve) => {
      // Set up one-time handler for permission result
      const handler = (payload: unknown) => {
        const result = payload as { granted: boolean };
        this.messageHandlers.delete('camera_permission_result');
        resolve(result.granted);
      };
      
      this.onMessage('camera_permission_result', handler);
      window.ReactNativeBridge?.requestCameraPermission();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        this.messageHandlers.delete('camera_permission_result');
        resolve(false);
      }, 10000);
    });
  }

  public async requestNotificationPermission(): Promise<boolean> {
    console.log('[Bridge] requestNotificationPermission called');
    console.log('[Bridge] isReactNative:', this.isReactNative);
    console.log('[Bridge] ReactNativeBridge exists:', !!window.ReactNativeBridge);
    
    if (!this.isReactNative || !window.ReactNativeBridge) {
      console.log('[Bridge] Not in React Native, using fallback');
      // Fallback for web - use browser notification API
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }

    return new Promise((resolve) => {
      console.log('[Bridge] Setting up notification permission handler');
      
      // Set up one-time handler for permission result
      const handler = (payload: unknown) => {
        console.log('[Bridge] Received notification_permission_result:', payload);
        const result = payload as { granted: boolean };
        this.messageHandlers.delete('notification_permission_result');
        
        // Update localStorage immediately when we get the result
        if (result.granted) {
          console.log('[Bridge] Permission granted, updating localStorage');
          localStorage.setItem('notificationPermissionGranted', 'true');
        }
        
        resolve(result.granted);
      };
      
      this.onMessage('notification_permission_result', handler);
      
      console.log('[Bridge] Calling ReactNativeBridge.requestNotificationPermission()');
      window.ReactNativeBridge?.requestNotificationPermission();
      
      // Timeout after 15 seconds (increased from 10s to handle permission dialog delays)
      setTimeout(() => {
        console.log('[Bridge] Notification permission request timed out after 15s');
        this.messageHandlers.delete('notification_permission_result');
        // On timeout, assume permission was not granted
        resolve(false);
      }, 15000);
    });
  }

  public async checkNotificationPermission(): Promise<boolean> {
    console.log('[Bridge] checkNotificationPermission called');
    
    if (!this.isReactNative || !window.ReactNativeBridge) {
      console.log('[Bridge] Not in React Native, returning false');
      return false;
    }

    // Check if the method exists before calling it
    if (typeof window.ReactNativeBridge.checkNotificationPermission !== 'function') {
      console.log('[Bridge] checkNotificationPermission method not implemented in native app');
      throw new Error('checkNotificationPermission method not implemented in native app');
    }

    return new Promise((resolve) => {
      console.log('[Bridge] Setting up notification permission check handler');
      
      // Set up one-time handler for permission status
      const handler = (payload: unknown) => {
        console.log('[Bridge] Received notification_permission_status:', payload);
        const result = payload as { granted: boolean };
        this.messageHandlers.delete('notification_permission_status');
        resolve(result.granted);
      };
      
      this.onMessage('notification_permission_status', handler);
      
      // Call the native app's checkNotificationPermission method  
      console.log('[Bridge] Calling ReactNativeBridge.checkNotificationPermission()');
      window.ReactNativeBridge?.checkNotificationPermission!();
      
      // Timeout after 2 seconds for status check
      setTimeout(() => {
        console.log('[Bridge] Notification permission check timed out after 2s');
        this.messageHandlers.delete('notification_permission_status');
        resolve(false);
      }, 2000);
    });
  }

  public notifyThrivingCreated() {
    if (this.isReactNative && window.ReactNativeBridge) {
      window.ReactNativeBridge?.notifyThrivingCreated();
    }
  }

  public openExternalUrl(url: string) {
    if (this.isReactNative && window.ReactNativeBridge) {
      // Use React Native bridge to open URL
      window.ReactNativeBridge?.openExternalUrl(url);
    } else {
      // Fallback for web
      window.open(url, '_blank');
    }
  }

  public saveFCMToken(token: string) {
    // Store FCM token received from React Native
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('fcm_token', token);
    }
  }

  public getFCMToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('fcm_token');
    }
    return null;
  }

  public sendNotification(title: string, body: string, data?: Record<string, unknown>) {
    if (this.isReactNative && window.ReactNativeBridge) {
      window.ReactNativeBridge.postMessage({
        type: 'send_notification',
        payload: {
          title,
          body,
          data
        }
      });
    }
  }

  public postMessage(message: ReactNativeMessage) {
    if (this.isReactNative && window.ReactNativeBridge) {
      window.ReactNativeBridge.postMessage(message);
    } else if (this.isReactNative && window.ReactNativeWebView) {
      // Fallback for older React Native WebView versions
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  public signInWithGoogle() {
    console.log('[Bridge] Requesting Google Sign-In from native app...');
    this.postMessage({ type: 'SIGN_IN_GOOGLE' });
  }

  public signInWithApple() {
    console.log('[Bridge] Requesting Apple Sign-In from native app...');
    this.postMessage({ type: 'SIGN_IN_APPLE' });
  }

  public async scheduleStepReminders(stepNotifications: Array<{
    id: string;
    routineId: string;
    routineName: string;
    title: string;
    time: string;
    reminderText?: string;
    frequency: string;
    enabledWeekdays: boolean;
    enabledWeekends: boolean;
  }>): Promise<boolean> {
    console.log('[Bridge] scheduleStepReminders called with', stepNotifications.length, 'steps');
    
    if (!this.isReactNative || !window.ReactNativeBridge) {
      console.log('[Bridge] Not in React Native, cannot schedule step reminders');
      return false;
    }

    return new Promise((resolve) => {
      // Set up one-time handler for result
      const handler = (payload: unknown) => {
        console.log('[Bridge] Received step_reminders_scheduled:', payload);
        const result = payload as { success: boolean; notificationIds?: string[] };
        this.messageHandlers.delete('step_reminders_scheduled');
        resolve(result.success);
      };
      
      this.onMessage('step_reminders_scheduled', handler);
      window.ReactNativeBridge?.scheduleStepReminders(stepNotifications);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('[Bridge] Step reminders scheduling timed out after 5s');
        this.messageHandlers.delete('step_reminders_scheduled');
        resolve(false);
      }, 5000);
    });
  }

  public cancelStepReminders(routineId: string) {
    console.log('[Bridge] cancelStepReminders called for routine:', routineId);
    
    if (this.isReactNative && window.ReactNativeBridge) {
      window.ReactNativeBridge.cancelStepReminders(routineId);
    }
  }

  public async getScheduledNotifications(): Promise<Array<{
    id: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    scheduledTime: string;
    isRepeating: boolean;
  }>> {
    console.log('[Bridge] getScheduledNotifications called');
    
    if (!this.isReactNative || !window.ReactNativeBridge) {
      console.log('[Bridge] Not in React Native, returning empty notifications list');
      return [];
    }

    // Check if the method exists before calling it
    if (typeof window.ReactNativeBridge.getScheduledNotifications !== 'function') {
      console.log('[Bridge] getScheduledNotifications method not implemented in native app');
      return [];
    }

    return new Promise((resolve) => {
      console.log('[Bridge] Setting up scheduled notifications handler');
      
      // Set up one-time handler for notification list
      const handler = (payload: unknown) => {
        console.log('[Bridge] Received scheduled_notifications_list:', payload);
        const result = payload as { notifications: Array<{
          id: string;
          title: string;
          body: string;
          data?: Record<string, unknown>;
          scheduledTime: string;
          isRepeating: boolean;
        }> };
        this.messageHandlers.delete('scheduled_notifications_list');
        resolve(result.notifications || []);
      };
      
      this.onMessage('scheduled_notifications_list', handler);
      
      // Call the native app's getScheduledNotifications method  
      console.log('[Bridge] Calling ReactNativeBridge.getScheduledNotifications()');
      window.ReactNativeBridge?.getScheduledNotifications!();
      
      // Timeout after 3 seconds for list retrieval
      setTimeout(() => {
        console.log('[Bridge] Scheduled notifications request timed out after 3s');
        this.messageHandlers.delete('scheduled_notifications_list');
        resolve([]);
      }, 3000);
    });
  }
  
  public async checkHealthPermission(): Promise<boolean> {
    console.log('[Bridge] checkHealthPermission called');
    
    if (!this.isReactNative || !window.ReactNativeBridge) {
      console.log('[Bridge] Not in React Native, returning false');
      return false;
    }

    // Check if the method exists before calling it
    if (typeof window.ReactNativeBridge.checkHealthPermission !== 'function') {
      console.log('[Bridge] checkHealthPermission method not implemented in native app');
      throw new Error('checkHealthPermission method not implemented in native app');
    }

    return new Promise((resolve) => {
      console.log('[Bridge] Setting up health permission check handler');
      
      // Set up handlers for both possible message types
      // Native app might send either health_permission_status or health_permission_result
      const handler = (payload: unknown) => {
        console.log('[Bridge] Received health permission check result:', JSON.stringify(payload));
        const result = payload as { granted: boolean };
        console.log('[Bridge] Parsed granted value:', result.granted, 'type:', typeof result.granted);
        // Remove both handlers
        this.messageHandlers.delete('health_permission_status');
        this.messageHandlers.delete('health_permission_result');
        resolve(result.granted);
      };
      
      this.onMessage('health_permission_status', handler);
      this.onMessage('health_permission_result', handler);
      
      // Call the native app's checkHealthPermission method  
      console.log('[Bridge] Calling ReactNativeBridge.checkHealthPermission()');
      window.ReactNativeBridge?.checkHealthPermission!();
      
      // Timeout after 2 seconds for status check
      setTimeout(() => {
        console.log('[Bridge] Health permission check timed out after 2s');
        this.messageHandlers.delete('health_permission_status');
        this.messageHandlers.delete('health_permission_result');
        resolve(false);
      }, 2000);
    });
  }

  public async requestHealthPermission(): Promise<boolean> {
    console.log('[Bridge] requestHealthPermission called');
    console.log('[Bridge] isReactNative:', this.isReactNative);
    console.log('[Bridge] ReactNativeBridge exists:', !!window.ReactNativeBridge);
    
    if (!this.isReactNative || !window.ReactNativeBridge) {
      console.log('[Bridge] Not in React Native, returning false');
      return false;
    }

    return new Promise((resolve) => {
      console.log('[Bridge] Setting up health permission handler');
      
      // Set up one-time handler for permission result
      const handler = (payload: unknown) => {
        console.log('[Bridge] Received health_permission_result:', payload);
        const result = payload as { granted: boolean };
        this.messageHandlers.delete('health_permission_result');
        
        // Update localStorage immediately when we get the result
        if (result.granted) {
          console.log('[Bridge] Health permission granted, updating localStorage');
          localStorage.setItem('healthDataConnected', 'true');
        }
        
        resolve(result.granted);
      };
      
      this.onMessage('health_permission_result', handler);
      
      console.log('[Bridge] Calling ReactNativeBridge.requestHealthPermission()');
      window.ReactNativeBridge?.requestHealthPermission();
      
      // Timeout after 15 seconds (to handle permission dialog delays)
      setTimeout(() => {
        console.log('[Bridge] Health permission request timed out after 15s');
        this.messageHandlers.delete('health_permission_result');
        // On timeout, assume permission was not granted
        resolve(false);
      }, 15000);
    });
  }
  
  public forceDetection() {
    console.log('Forcing React Native bridge detection...');
    this.detectReactNative();
    return this.isReactNative;
  }
  
  public getBridgeStatus() {
    return {
      isReactNative: this.isReactNative,
      hasReactNativeWebView: typeof window !== 'undefined' && !!window.ReactNativeWebView,
      hasReactNativeBridge: typeof window !== 'undefined' && !!window.ReactNativeBridge,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
      customProperties: {
        __REACT_NATIVE_ENV__: typeof window !== 'undefined' && (window as unknown as { __REACT_NATIVE_ENV__?: boolean }).__REACT_NATIVE_ENV__,
        isReactNativeWebView: typeof window !== 'undefined' && (window as unknown as { isReactNativeWebView?: boolean }).isReactNativeWebView
      }
    };
  }
}

// Create singleton instance
const bridge = new ReactNativeBridgeManager();

// Set up FCM token handler
if (typeof window !== 'undefined') {
  bridge.onMessage('fcm_token', (payload) => {
    const tokenPayload = payload as { token?: string };
    if (tokenPayload?.token) {
      bridge.saveFCMToken(tokenPayload.token);
    }
  });
}

export default bridge;