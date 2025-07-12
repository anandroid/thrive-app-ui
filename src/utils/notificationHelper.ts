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

import bridge from '@/src/lib/react-native-bridge';

// Check if running in React Native WebView
export const isReactNative = (): boolean => {
  // Use the centralized bridge detection
  const result = bridge.isInReactNative();
  
  console.log('NotificationHelper isReactNative check:', {
    hasWindow: typeof window !== 'undefined',
    bridgeStatus: bridge.getBridgeStatus(),
    result
  });
  
  return result;
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

  // Send a test notification with a random step
  testNotification: async () => {
    if (!isReactNative()) return;
    
    // Get thrivings from storage
    const thrivings = JSON.parse(localStorage.getItem('thrive_thrivings') || '[]');
    if (thrivings.length === 0) {
      console.log('No thrivings found for test notification');
      return;
    }
    
    // Pick a random thriving
    const randomThriving = thrivings[Math.floor(Math.random() * thrivings.length)];
    if (!randomThriving.steps || randomThriving.steps.length === 0) {
      console.log('No steps found in thriving for test notification');
      return;
    }
    
    // Pick a random step
    const randomStep = randomThriving.steps[Math.floor(Math.random() * randomThriving.steps.length)];
    
    // Send notification with step details
    if (window.ReactNativeBridge?.postMessage) {
      window.ReactNativeBridge.postMessage({
        type: 'send_notification',
        payload: {
          title: `Time for: ${randomStep.title}`,
          body: randomStep.description || `It's time for your ${randomThriving.title} routine step`,
          data: {
            thrivingId: randomThriving.id,
            stepId: randomStep.id,
            type: 'step_reminder'
          }
        }
      });
    }
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