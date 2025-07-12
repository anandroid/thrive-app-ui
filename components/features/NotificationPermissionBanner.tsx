'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import bridge from '@/src/lib/react-native-bridge';

export const NotificationPermissionBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (!bridge.isInReactNative()) {
      setShowBanner(false);
      return;
    }

    // Check if permission already granted
    if (localStorage.getItem('notificationPermissionGranted') === 'true') {
      setShowBanner(false);
      return;
    }

    // Check ask count and session
    const notificationAskCount = parseInt(localStorage.getItem('notificationAskCount') || '0');
    const lastAskSession = localStorage.getItem('notificationLastAskSession');
    const currentSession = sessionStorage.getItem('sessionId') || Date.now().toString();
    
    // Set session ID if not exists
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', currentSession);
    }

    // Don't show if we've asked 3 times or in the same session
    if (notificationAskCount >= 3 || lastAskSession === currentSession) {
      setShowBanner(false);
      return;
    }

    // Check if thrivings exist
    const thrivings = localStorage.getItem('thrive_thrivings');
    if (!thrivings || JSON.parse(thrivings).length === 0) {
      setShowBanner(false);
      return;
    }

    // Show banner if conditions are met
    setShowBanner(true);
  };

  const handleDismiss = () => {
    // Update ask count and session when banner is dismissed
    const currentSession = sessionStorage.getItem('sessionId') || Date.now().toString();
    const notificationAskCount = parseInt(localStorage.getItem('notificationAskCount') || '0');
    
    localStorage.setItem('notificationAskCount', (notificationAskCount + 1).toString());
    localStorage.setItem('notificationLastAskSession', currentSession);
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-4 z-40">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            Enable Wellness Reminders
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Get timely notifications for your wellness thrivings and never miss a step.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={async () => {
                // Request notification permission using React Native bridge
                const granted = await bridge.requestNotificationPermission();
                if (granted) {
                  localStorage.setItem('notificationPermissionGranted', 'true');
                  // Reset ask count since they granted permission
                  localStorage.setItem('notificationAskCount', '0');
                  // Schedule notifications for existing thrivings
                  const thrivings = JSON.parse(localStorage.getItem('thrive_thrivings') || '[]');
                  if (thrivings.length > 0) {
                    await NotificationHelper.scheduleRoutineReminders(thrivings);
                  }
                } else {
                  // Still update the ask count
                  handleDismiss();
                }
                router.push('/thrivings');
              }}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
            >
              Enable & View Thrivings
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-100 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};