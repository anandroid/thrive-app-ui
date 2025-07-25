'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { Thriving, NotificationSettings } from '@/src/types/thriving';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import bridge from '@/src/lib/react-native-bridge';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import { notificationPermissionManager } from '@/src/utils/notificationPermissionManager';

interface ThrivingNotificationCardProps {
  thriving: Thriving;
  onSettingsUpdate?: (settings: NotificationSettings) => void;
}

export const ThrivingNotificationCard: React.FC<ThrivingNotificationCardProps> = ({
  thriving,
  onSettingsUpdate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(true); // Default to true
  const [isLoadingPermission, setIsLoadingPermission] = useState(true);

  useEffect(() => {
    // Check permission status on mount
    const checkPermissionStatus = async () => {
      if (!bridge.isInReactNative()) {
        setPermissionsGranted(true);
        setIsLoadingPermission(false);
        return;
      }

      try {
        const granted = await notificationPermissionManager.getPermissionStatus();
        console.log('[ThrivingNotificationCard] Initial permission status:', granted);
        setPermissionsGranted(granted);
      } catch (error) {
        console.error('[ThrivingNotificationCard] Error checking permission:', error);
        setPermissionsGranted(false);
      } finally {
        setIsLoadingPermission(false);
      }
    };

    checkPermissionStatus();
  }, []);

  // Get all step times from the thriving
  const stepTimes = thriving.steps
    .filter(step => step.time)
    .map(step => ({
      id: step.id,
      time: step.time!,
      title: step.title,
      enabled: step.reminderEnabled !== false
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Get notification settings with defaults
  const settings = thriving.notificationSettings || {
    enabledWeekdays: true,
    enabledWeekends: true,
    stepNotifications: {}
  };

  // Count enabled notifications
  const enabledCount = stepTimes.filter(st => 
    settings.stepNotifications?.[st.id] !== false && st.enabled
  ).length;

  const handleSettingsUpdate = (newSettings: NotificationSettings) => {
    onSettingsUpdate?.(newSettings);
    setIsModalOpen(false);
  };

  if (stepTimes.length === 0) {
    return null; // Don't show card if no step times
  }

  // Don't show anything while loading permission status
  if (isLoadingPermission && bridge.isInReactNative()) {
    return null;
  }

  // Show permission request card if in React Native and permissions not granted
  if (bridge.isInReactNative() && !permissionsGranted) {
    return (
      <div
        onClick={async () => {
          try {
            // Request notification permission using the manager
            const granted = await notificationPermissionManager.requestPermission();
            console.log('[ThrivingNotificationCard] Permission result:', granted);
            
            if (granted) {
              // Update state immediately
              setPermissionsGranted(true);
              
              // Schedule notifications for this thriving
              try {
                await NotificationHelper.scheduleStepNotifications(thriving);
                console.log('[ThrivingNotificationCard] Notifications scheduled successfully');
              } catch (error) {
                console.error('[ThrivingNotificationCard] Error scheduling notifications:', error);
              }
            } else {
              // Permission denied, but check again in case
              const currentStatus = await notificationPermissionManager.getPermissionStatus(true);
              if (currentStatus) {
                setPermissionsGranted(true);
              }
            }
          } catch (error) {
            console.error('[ThrivingNotificationCard] Error requesting permission:', error);
            // Force refresh permission status
            const currentStatus = await notificationPermissionManager.getPermissionStatus(true);
            setPermissionsGranted(currentStatus);
          }
        }}
        className="bg-gradient-to-br from-orange-50 to-amber-100/70 rounded-[4vw] max-rounded-[1rem] p-[4vw] max-p-[1rem] mb-[4vw] max-mb-[1rem] cursor-pointer hover:shadow-md transition-shadow touch-feedback border border-orange-200/50"
      >
        <div className="flex items-center justify-between mb-[3vw] max-mb-[0.75rem]">
          <div className="flex items-center gap-[3vw] max-gap-[0.75rem]">
            <div className="w-[10vw] h-[10vw] max-w-[2.5rem] max-h-[2.5rem] bg-white rounded-[2.5vw] max-rounded-[0.625rem] flex items-center justify-center">
              <AlertCircle className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-orange-600" />
            </div>
            <div>
              <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-900">
                Notifications Disabled
              </h3>
              <p className="text-[min(3.5vw,0.875rem)] text-gray-600">
                Enable to get reminders
              </p>
            </div>
          </div>
          <ChevronRight className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-gray-400" />
        </div>

        <p className="text-[min(3.5vw,0.875rem)] text-gray-700 px-[1vw]">
          Tap to enable notifications and never miss your wellness routine steps.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group bg-gradient-to-br from-sage-50 to-sage-100/70 rounded-[4vw] max-rounded-[1rem] p-[4vw] max-p-[1rem] mb-[4vw] max-mb-[1rem] cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:from-sage-100 hover:to-sage-50 active:scale-[0.98] transition-all duration-200 border border-sage-200/50 shadow-lg touch-feedback"
      >
        <div className="flex items-center justify-between mb-[3vw] max-mb-[0.75rem]">
          <div className="flex items-center gap-[3vw] max-gap-[0.75rem]">
            <div className="w-[10vw] h-[10vw] max-w-[2.5rem] max-h-[2.5rem] bg-white rounded-[2.5vw] max-rounded-[0.625rem] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Bell className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-sage-600 fill-sage-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-[min(4.5vw,1.125rem)] font-semibold text-gray-800">
                Reminders
              </h3>
              <p className="text-[min(3.5vw,0.875rem)] text-gray-500">
                {enabledCount} of {stepTimes.length} active
              </p>
            </div>
          </div>
          <ChevronRight className="w-[5vw] h-[5vw] max-w-[1.25rem] max-h-[1.25rem] text-gray-400 group-hover:text-gray-600 group-hover:translate-x-[0.5vw] transition-all" />
        </div>

        {/* Time pills */}
        <div className="flex flex-wrap gap-[2vw] max-gap-[0.5rem]">
          {stepTimes.slice(0, 4).map((stepTime) => {
            const isEnabled = settings.stepNotifications?.[stepTime.id] !== false && stepTime.enabled;
            return (
              <div
                key={stepTime.id}
                className={`flex items-center gap-[1.5vw] max-gap-[0.375rem] px-[3vw] max-px-[0.75rem] py-[1.5vw] max-py-[0.375rem] rounded-full text-[min(3.5vw,0.875rem)] ${
                  isEnabled
                    ? 'bg-sage-100 text-sage-600'
                    : 'bg-gray-100 text-gray-500 line-through'
                }`}
              >
                <Clock className="w-[3.5vw] h-[3.5vw] max-w-[0.875rem] max-h-[0.875rem]" />
                <span>{stepTime.time}</span>
              </div>
            );
          })}
          {stepTimes.length > 4 && (
            <div className="px-[3vw] max-px-[0.75rem] py-[1.5vw] max-py-[0.375rem] rounded-full bg-gray-200 text-gray-700 text-[min(3.5vw,0.875rem)]">
              +{stepTimes.length - 4} more
            </div>
          )}
        </div>

        {/* Weekday settings preview */}
        <div className="flex items-center gap-[3vw] max-gap-[0.75rem] mt-[3vw] max-mt-[0.75rem] pt-[3vw] max-pt-[0.75rem] border-t border-gray-200">
          <Calendar className="w-[3.5vw] h-[3.5vw] max-w-[0.875rem] max-h-[0.875rem] text-sage-600" />
          <span className="text-[min(3.5vw,0.875rem)] text-gray-600">
            {settings.enabledWeekdays && settings.enabledWeekends && 'Every day'}
            {settings.enabledWeekdays && !settings.enabledWeekends && 'Weekdays only'}
            {!settings.enabledWeekdays && settings.enabledWeekends && 'Weekends only'}
            {!settings.enabledWeekdays && !settings.enabledWeekends && 'Notifications paused'}
          </span>
        </div>
      </div>

      {/* Settings Modal */}
      <NotificationSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        thriving={thriving}
        onSettingsUpdate={handleSettingsUpdate}
      />
    </>
  );
};