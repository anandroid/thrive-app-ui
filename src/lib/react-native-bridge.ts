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
    this.detectReactNative();
    this.setupMessageListener();
    this.setupBridgeReadyListener();
  }

  private detectReactNative() {
    // Check if we're running in React Native WebView
    this.isReactNative = !!(
      typeof window !== 'undefined' &&
      window.ReactNativeWebView &&
      window.ReactNativeBridge
    );
  }

  private setupMessageListener() {
    if (typeof window !== 'undefined') {
      window.onReactNativeMessage = (message: unknown) => {
        const msg = message as ReactNativeMessage;
        const handler = this.messageHandlers.get(msg.type);
        if (handler) {
          handler(msg.payload);
        }
      };
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
    if (!this.isReactNative || !window.ReactNativeBridge) {
      // Fallback for web - use browser notification API
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }

    return new Promise((resolve) => {
      // Set up one-time handler for permission result
      const handler = (payload: unknown) => {
        const result = payload as { granted: boolean };
        this.messageHandlers.delete('notification_permission_result');
        resolve(result.granted);
      };
      
      this.onMessage('notification_permission_result', handler);
      window.ReactNativeBridge?.requestNotificationPermission();
      
      // Timeout after 10 seconds
      setTimeout(() => {
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