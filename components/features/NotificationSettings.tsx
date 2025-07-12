'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import bridge from '@/src/lib/react-native-bridge';
import { WellnessRoutine } from '@/src/services/openai/types';
import { Thriving } from '@/src/types/thriving';
import toast from 'react-hot-toast';

interface NotificationSettingsProps {
  thriving?: Thriving;
  routine?: WellnessRoutine;
  onToggle?: (enabled: boolean) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  thriving,
  routine, 
  onToggle 
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Use either thriving or routine
  const item = thriving || routine;
  const reminderTimes = useMemo(() => 
    thriving?.reminderTimes || routine?.reminderTimes || []
  , [thriving?.reminderTimes, routine?.reminderTimes]);
  const isActive = thriving?.isActive || routine?.isActive || false;
  const itemId = thriving?.id || routine?.id || '';

  useEffect(() => {
    // Check if notifications are supported and enabled for this item
    if (bridge.isInReactNative() && item) {
      setIsEnabled(isActive && reminderTimes.length > 0);
      checkPermission();
    }
  }, [item, isActive, reminderTimes]);

  const checkPermission = async () => {
    const granted = await NotificationHelper.requestPermission();
    setHasPermission(granted);
  };

  const handleToggle = async () => {
    if (!bridge.isInReactNative()) {
      toast.error('Notifications are only available in the mobile app');
      return;
    }

    setIsLoading(true);
    
    try {
      if (!hasPermission) {
        const granted = await NotificationHelper.requestPermission();
        if (!granted) {
          toast.error('Please enable notifications to receive reminders');
          setIsLoading(false);
          return;
        }
        setHasPermission(true);
      }

      const newState = !isEnabled;
      
      if (newState) {
        // Convert thriving to routine format if needed
        const routineToSchedule: WellnessRoutine = routine || {
          id: thriving!.id,
          name: thriving!.title,
          description: thriving!.description,
          type: thriving!.type || 'general_wellness',
          duration: 30, // default duration
          frequency: thriving!.frequency || 'daily',
          reminderTimes: thriving!.reminderTimes || [],
          healthConcern: thriving!.healthConcern || '',
          steps: thriving!.steps.map((step, index) => ({
            order: index + 1,
            title: step.title,
            description: step.description || '',
            duration: step.duration || 5,
            videoUrl: step.videoUrl,
            reminderTime: undefined,
            reminderText: undefined,
          })),
          expectedOutcomes: [],
          safetyNotes: [],
          createdAt: new Date(thriving!.createdAt),
          updatedAt: new Date(thriving!.updatedAt),
          isActive: true
        };
        
        // Schedule notifications
        const result = await NotificationHelper.scheduleRoutineReminders([routineToSchedule]);
        
        if (result.success) {
          setIsEnabled(true);
          toast.success('Reminder notifications enabled');
          onToggle?.(true);
        } else {
          toast.error(result.error || 'Failed to enable notifications');
        }
      } else {
        // Cancel notifications
        await NotificationHelper.cancelRoutineReminders(itemId);
        setIsEnabled(false);
        toast.success('Reminder notifications disabled');
        onToggle?.(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!bridge.isInReactNative()) {
      toast.error('Notifications are only available in the mobile app');
      return;
    }
    
    // Get the current thriving's steps for a more relevant test
    if (thriving && thriving.steps && thriving.steps.length > 0) {
      // Pick a random step from current thriving
      const randomStep = thriving.steps[Math.floor(Math.random() * thriving.steps.length)];
      
      // Send notification with step details using bridge
      bridge.sendNotification(
        `Time for: ${randomStep.title}`,
        randomStep.description || `It's time for your ${thriving.title} routine step`,
        {
          thrivingId: thriving.id,
          stepId: randomStep.id,
          type: 'step_reminder'
        }
      );
      
      toast.success(`Test notification sent for: ${randomStep.title}`);
    } else {
      // Fallback to generic test notification
      await NotificationHelper.testNotification();
      toast.success('Test notification sent!');
    }
  };

  if (!bridge.isInReactNative()) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <button
        onClick={handleToggle}
        disabled={isLoading || !reminderTimes.length}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
          ${isEnabled 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          ${!reminderTimes.length ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        {isLoading ? 'Updating...' : isEnabled ? 'Reminders On' : 'Reminders Off'}
      </button>

      {isEnabled && (
        <button
          onClick={handleTestNotification}
          className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
          title="Send test notification"
        >
          <TestTube className="w-3 h-3" />
          Test
        </button>
      )}

      {!reminderTimes.length && (
        <span className="text-xs text-gray-500 ml-2">
          No reminder times set
        </span>
      )}
    </div>
  );
};