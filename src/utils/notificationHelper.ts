import { WellnessRoutine } from '@/src/services/openai/types';
import { Thriving } from '@/src/types/thriving';
import { generateStepNotificationId } from './idGenerator';

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
  scheduleStepReminders?: (stepNotifications: Array<{
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
  cancelStepReminders?: (routineId: string) => void;
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
  
  console.log('NotificationHelper isReactNative check:', JSON.stringify({
    hasWindow: typeof window !== 'undefined',
    bridgeStatus: bridge.getBridgeStatus(),
    result
  }, null, 2));
  
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

  // NEW: Schedule step notifications for a thriving
  scheduleStepNotifications: async (thriving: Thriving): Promise<{ success: boolean; count?: number; error?: string }> => {
    console.log('[NotificationHelper] scheduleStepNotifications called for:', thriving.title);
    
    if (!isReactNative()) {
      console.log('[NotificationHelper] Not in React Native, skipping step notifications');
      return { success: false, error: 'Not in React Native environment' };
    }

    // Get notification settings with defaults
    const settings = thriving.notificationSettings || {
      enabledWeekdays: true,
      enabledWeekends: true,
      stepNotifications: {}
    };

    // Extract step notifications from thriving
    const stepNotifications = thriving.steps
      .filter(step => {
        // Must have time set
        if (!step.time) return false;
        
        // Check if step notifications are enabled (default to true if not specified)
        const stepEnabled = step.reminderEnabled !== false;
        
        // Check if this specific step is enabled in settings (default to true)
        const settingsEnabled = settings.stepNotifications?.[step.id] !== false;
        
        return stepEnabled && settingsEnabled;
      })
      .map(step => ({
        id: generateStepNotificationId(thriving.id, step.id), // Use safe notification ID
        routineId: thriving.id,
        routineName: thriving.title,
        title: step.title,
        time: step.time!,
        reminderText: step.reminderText,
        frequency: thriving.frequency,
        enabledWeekdays: settings.enabledWeekdays,
        enabledWeekends: settings.enabledWeekends,
      }));

    console.log(`[NotificationHelper] Found ${stepNotifications.length} enabled steps with time for notifications`);

    if (stepNotifications.length === 0) {
      return { success: true, count: 0 };
    }

    // Use the bridge to schedule step notifications
    const success = await bridge.scheduleStepReminders(stepNotifications);
    
    return { 
      success, 
      count: stepNotifications.length,
      error: success ? undefined : 'Failed to schedule step notifications'
    };
  },

  // NEW: Cancel all step notifications for a thriving
  cancelStepNotifications: async (thrivingId: string): Promise<void> => {
    console.log('[NotificationHelper] cancelStepNotifications called for:', thrivingId);
    
    if (!isReactNative()) return;
    
    bridge.cancelStepReminders(thrivingId);
  },

  // NEW: Schedule all notifications for a thriving (step-level only)
  scheduleAllNotifications: async (thriving: Thriving): Promise<{ 
    success: boolean; 
    stepCount: number;
    errors: string[];
  }> => {
    console.log('[NotificationHelper] scheduleAllNotifications called for:', thriving.title);
    
    const errors: string[] = [];
    let success = true;
    let stepCount = 0;

    // Schedule step-level notifications only
    try {
      const stepResult = await NotificationHelper.scheduleStepNotifications(thriving);
      success = stepResult.success;
      stepCount = stepResult.count || 0;
      if (!success && stepResult.error) {
        errors.push(`Step notifications: ${stepResult.error}`);
      }
    } catch (error) {
      success = false;
      errors.push(`Step notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('[NotificationHelper] Step notifications scheduled:', {
      success,
      stepCount,
      errors
    });

    return {
      success,
      stepCount,
      errors
    };
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
          title: randomThriving.title,
          body: randomStep.reminderText || `Time for: ${randomStep.title}`,
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