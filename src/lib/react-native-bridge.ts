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
      notifyThrivingCreated: () => void;
      openExternalUrl: (url: string) => void;
      checkHealthPermission?: () => Promise<boolean>;
      requestHealthPermission?: () => Promise<boolean>;
      getHealthData?: (params: {
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
      console.log('React Native Bridge Detection:', {
        timestamp: new Date().toISOString(),
        hasWindow: true,
        hasReactNativeWebView: !!window.ReactNativeWebView,
        hasReactNativeBridge: !!window.ReactNativeBridge,
        hasWebViewOnly,
        forceReactNative,
        userAgent,
        hasReactNativeUserAgent,
        hasCustomProperty,
        isReactNative: this.isReactNative,
        windowKeys: Object.keys(window).filter(k => 
          k.toLowerCase().includes('react') || 
          k.toLowerCase().includes('native') ||
          k.toLowerCase().includes('bridge')
        )
      });
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
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && typeof data === 'object' && 'type' in data) {
            console.log('[Bridge] Message event received:', data);
            const handler = this.messageHandlers.get(data.type);
            if (handler) {
              console.log('[Bridge] Found handler for message type:', data.type);
              handler(data.payload);
            }
          }
        } catch {
          // Not a JSON message, ignore
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
        resolve(result.granted);
      };
      
      this.onMessage('notification_permission_result', handler);
      
      console.log('[Bridge] Calling ReactNativeBridge.requestNotificationPermission()');
      window.ReactNativeBridge?.requestNotificationPermission();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        console.log('[Bridge] Notification permission request timed out after 10s');
        this.messageHandlers.delete('notification_permission_result');
        resolve(false);
      }, 10000);
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

  public postMessage(message: unknown) {
    if (this.isReactNative && window.ReactNativeBridge) {
      window.ReactNativeBridge.postMessage(message);
    }
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