'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NotificationHelper } from '@/src/utils/notificationHelper';

export const NotificationPermissionBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (!NotificationHelper.isSupported()) {
      setShowBanner(false);
      return;
    }

    // Check if we've already asked for permission
    const permissionAsked = localStorage.getItem('notificationPermissionAsked');
    if (permissionAsked === 'true') {
      setShowBanner(false);
      return;
    }

    // Check if thrivings exist
    const thrivings = localStorage.getItem('thrive_thrivings');
    if (!thrivings || JSON.parse(thrivings).length === 0) {
      setShowBanner(false);
      return;
    }

    // Show banner if we haven't asked and have routines
    setShowBanner(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('notificationPermissionAsked', 'true');
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
              onClick={() => {
                handleDismiss();
                router.push('/thrivings');
              }}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
            >
              Go to Thrivings
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