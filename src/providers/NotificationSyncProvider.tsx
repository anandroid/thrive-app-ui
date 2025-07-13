'use client';

import { useEffect } from 'react';
import { syncThrivingsWithNotifications } from '@/src/utils/thrivingStorage';
import { NotificationHelper } from '@/src/utils/notificationHelper';

export function NotificationSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only sync if we're in React Native and have notification support
    if (NotificationHelper.isSupported()) {
      console.log('[NotificationSyncProvider] Syncing notifications on app load');
      
      // Check if user has granted notification permission
      const permissionGranted = localStorage.getItem('notificationPermissionGranted') === 'true';
      
      if (permissionGranted) {
        // Sync all active thrivings with the notification system
        syncThrivingsWithNotifications().catch(error => {
          console.error('[NotificationSyncProvider] Error syncing notifications:', error);
        });
      } else {
        console.log('[NotificationSyncProvider] Notification permission not granted, skipping sync');
      }
    }
  }, []); // Only run on mount

  return <>{children}</>;
}