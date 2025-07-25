'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, TestTube2 } from 'lucide-react';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import { NotificationPermissionModal } from './NotificationPermissionModal';
import toast from 'react-hot-toast';

export const NotificationSettingsCard: React.FC = () => {
  const [isReactNative, setIsReactNative] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Check if we're in React Native
    const isNative = NotificationHelper.isSupported();
    setIsReactNative(isNative);
    
    if (isNative) {
      // Check if we have permission
      const permissionGranted = localStorage.getItem('notificationPermissionGranted') === 'true';
      setHasPermission(permissionGranted);
    }
  }, []);

  const handleEnableNotifications = () => {
    setShowPermissionModal(true);
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      console.log('[NotificationSettings] Testing notification...');
      await NotificationHelper.testNotification();
      toast.success('Test notification sent! Check your notifications.');
    } catch (error) {
      console.error('[NotificationSettings] Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setIsTesting(false);
    }
  };

  const handlePermissionGranted = () => {
    setHasPermission(true);
    toast.success('Notifications enabled! You\'ll receive reminders for your routines.');
  };

  // Don't show notification settings if not in React Native
  if (!isReactNative) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-[4vw] max-rounded-[1rem] shadow-sm border border-gray-100 p-[4vw] max-p-[1rem] mb-[4vw] max-mb-[1rem]">
        <div className="flex items-center justify-between mb-[3vw] max-mb-[0.75rem]">
          <h3 className="text-[min(5vw,1.25rem)] font-semibold text-gray-900 flex items-center">
            <Bell className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] mr-[2vw] max-mr-[0.5rem] text-rose-500" />
            Reminder Notifications
          </h3>
        </div>

        {hasPermission ? (
          <div className="space-y-[3vw] max-space-y-[0.75rem]">
            <div className="flex items-center justify-between p-[3vw] max-p-[0.75rem] bg-green-50 rounded-[3vw] max-rounded-[0.75rem]">
              <div className="flex items-center">
                <Check className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-green-600 mr-[2vw] max-mr-[0.5rem]" />
                <span className="text-[min(4vw,1rem)] text-green-700">Notifications Enabled</span>
              </div>
            </div>
            
            <button
              onClick={handleTestNotification}
              disabled={isTesting}
              className="w-full py-[3vw] max-py-[0.75rem] px-[4vw] max-px-[1rem] rounded-[3vw] max-rounded-[0.75rem] 
                       bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300
                       text-purple-700 text-[min(4vw,1rem)] font-medium
                       transition-all touch-feedback touch-manipulation disabled:opacity-50
                       flex items-center justify-center shadow-sm"
            >
              {isTesting ? (
                <>
                  <span className="animate-spin rounded-full h-[4vw] w-[4vw] max-h-[1rem] max-w-[1rem] border-b-2 border-purple-600 mr-[2vw] max-mr-[0.5rem]" />
                  Sending Test...
                </>
              ) : (
                <>
                  <TestTube2 className="w-[min(4vw,1rem)] h-[min(4vw,1rem)] mr-[2vw] max-mr-[0.5rem]" />
                  Send Test Notification
                </>
              )}
            </button>
            
            <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mt-[2vw] max-mt-[0.5rem]">
              You&apos;ll receive notifications at the scheduled times for each routine step. 
              The test button will send a random step reminder from your active routines.
            </p>
          </div>
        ) : (
          <div className="space-y-[3vw] max-space-y-[0.75rem]">
            <div className="flex items-center justify-between p-[3vw] max-p-[0.75rem] bg-gray-50 rounded-[3vw] max-rounded-[0.75rem]">
              <div className="flex items-center">
                <BellOff className="w-[min(5vw,1.25rem)] h-[min(5vw,1.25rem)] text-gray-500 mr-[2vw] max-mr-[0.5rem]" />
                <span className="text-[min(4vw,1rem)] text-gray-600">Notifications Disabled</span>
              </div>
            </div>
            
            <button
              onClick={handleEnableNotifications}
              className="w-full py-[3vw] max-py-[0.75rem] px-[4vw] max-px-[1rem] rounded-[3vw] max-rounded-[0.75rem] 
                       bg-gradient-to-r from-rose to-burgundy text-white text-[min(4vw,1rem)] font-medium
                       hover:shadow-lg transition-all touch-feedback touch-manipulation"
            >
              Enable Notifications
            </button>
            
            <p className="text-[min(3.5vw,0.875rem)] text-gray-600 mt-[2vw] max-mt-[0.5rem]">
              Get timely reminders for your wellness routines. Never miss a step in your journey to better health.
            </p>
          </div>
        )}
      </div>

      <NotificationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionGranted={handlePermissionGranted}
      />
    </>
  );
};