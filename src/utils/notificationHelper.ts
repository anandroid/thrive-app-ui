import { WellnessRoutine } from '@/src/services/openai/types';

// Type for notification-specific methods
interface NotificationBridge {
  postMessage: (message: unknown) => void;
  requestCameraPermission: () => void;
  requestNotificationPermission: () => void;
  notifyThrivingCreated: () => void;
  openExternalUrl: (url: string) => void;
  scheduleRoutineReminders?: (routines: WellnessRoutine[]) => void;
  cancelRoutineReminders?: (routineId: string) => void;
  updateRoutine?: (routine: WellnessRoutine) => void;
  syncRoutines?: (routines: WellnessRoutine[]) => void;
  testNotification?: () => void;
}

// Extend window interface for notification support flag
declare global {
  interface Window {
    hasNotificationSupport?: boolean;
  }
}

// Check if running in React Native WebView
export const isReactNative = (): boolean => {
  return typeof window !== 'undefined' && 
         window.ReactNativeBridge !== undefined &&
         window.hasNotificationSupport === true;
};

// Notification helper functions for React Native integration
export const NotificationHelper = {
  // Request permission for notifications
  requestPermission: async (): Promise<boolean> => {
    if (!isReactNative()) return false;
    
    return new Promise((resolve) => {
      window.ReactNativeBridge?.requestNotificationPermission();
      
      // Listen for the response
      const handler = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.type === 'notification_permission_result') {
            window.removeEventListener('message', handler);
            resolve(data.payload.granted);
          }
        } catch (e) {
          console.error('Error parsing notification permission response:', e);
        }
      };
      
      window.addEventListener('message', handler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(false);
      }, 5000);
    });
  },

  // Schedule reminders for routines
  scheduleRoutineReminders: async (routines: WellnessRoutine[]): Promise<{ success: boolean; count?: number; error?: string }> => {
    if (!isReactNative()) return { success: false, error: 'Not in React Native environment' };
    
    return new Promise((resolve) => {
      const bridge = window.ReactNativeBridge as NotificationBridge;
      bridge?.scheduleRoutineReminders?.(routines);
      
      // Listen for the response
      const handler = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.type === 'reminders_scheduled') {
            window.removeEventListener('message', handler);
            resolve(data.payload);
          }
        } catch (e) {
          console.error('Error parsing reminders scheduled response:', e);
        }
      };
      
      window.addEventListener('message', handler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve({ success: false, error: 'Timeout waiting for response' });
      }, 5000);
    });
  },

  // Cancel reminders for a specific routine
  cancelRoutineReminders: async (routineId: string): Promise<void> => {
    if (!isReactNative()) return;
    
    const bridge = window.ReactNativeBridge as NotificationBridge;
    bridge?.cancelRoutineReminders?.(routineId);
  },

  // Update a routine (will reschedule notifications if active)
  updateRoutine: async (routine: WellnessRoutine): Promise<void> => {
    if (!isReactNative()) return;
    
    const bridge = window.ReactNativeBridge as NotificationBridge;
    bridge?.updateRoutine?.(routine);
  },

  // Sync all routines (useful when app loads)
  syncRoutines: async (routines: WellnessRoutine[]): Promise<void> => {
    if (!isReactNative()) return;
    
    const bridge = window.ReactNativeBridge as NotificationBridge;
    bridge?.syncRoutines?.(routines);
  },

  // Send a test notification
  testNotification: () => {
    if (!isReactNative()) return;
    
    const bridge = window.ReactNativeBridge as NotificationBridge;
    bridge?.testNotification?.();
  },

  // Check if notifications are supported
  isSupported: (): boolean => {
    return isReactNative();
  }
};

// Initialize message listener for React Native responses
if (typeof window !== 'undefined') {
  window.onReactNativeMessage = (message: unknown) => {
    const typedMessage = message as { type: string; payload?: { token?: string } };
    console.log('Received message from React Native:', typedMessage);
    
    switch (typedMessage.type) {
      case 'fcm_token':
        // Store FCM token if needed for server-side push notifications
        console.log('Received FCM token:', typedMessage.payload?.token);
        // You can store this in your user profile or send to your backend
        break;
        
      default:
        console.log('Unknown message type from React Native:', typedMessage.type);
    }
  };
}

// Helper to format routine for notifications (ensure all required fields are present)
export const prepareRoutineForNotification = (routine: WellnessRoutine): WellnessRoutine => {
  return {
    ...routine,
    isActive: routine.isActive ?? true,
    reminderTimes: routine.reminderTimes || [],
    steps: routine.steps || [],
    createdAt: routine.createdAt || new Date(),
    updatedAt: routine.updatedAt || new Date(),
  };
};