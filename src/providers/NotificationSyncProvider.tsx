'use client';

import { useEffect } from 'react';
import { syncThrivingsWithNotifications, migrateNotificationIds, isNotificationIdMigrationCompleted } from '@/src/utils/thrivingStorage';
import { NotificationHelper } from '@/src/utils/notificationHelper';
import { notificationPermissionManager } from '@/src/utils/notificationPermissionManager';

export function NotificationSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only sync if we're in React Native and have notification support
    if (NotificationHelper.isSupported()) {
      console.log('[NotificationSyncProvider] Initializing notifications on app load');
      
      // Use the permission manager to check current permission status
      notificationPermissionManager.getPermissionStatus().then(async (permissionGranted) => {
        console.log('[NotificationSyncProvider] Permission status:', permissionGranted);
        
        if (permissionGranted) {
          console.log('[NotificationSyncProvider] Permission granted, checking for migration needs...');
          
          // Check if we need to migrate notification IDs
          if (!isNotificationIdMigrationCompleted()) {
            console.log('[NotificationSyncProvider] Running notification ID migration...');
            try {
              await migrateNotificationIds();
              console.log('[NotificationSyncProvider] Notification ID migration completed successfully');
            } catch (error) {
              console.error('[NotificationSyncProvider] Error during notification ID migration:', error);
              // Continue with regular sync even if migration fails
            }
          } else {
            console.log('[NotificationSyncProvider] Notification ID migration already completed, syncing notifications...');
            // Sync all active thrivings with the notification system
            syncThrivingsWithNotifications().catch(error => {
              console.error('[NotificationSyncProvider] Error syncing notifications:', error);
            });
          }
        } else {
          console.log('[NotificationSyncProvider] Notification permission not granted, skipping sync');
        }
      }).catch(error => {
        console.error('[NotificationSyncProvider] Error checking permission status:', error);
      });
    }
  }, []); // Only run on mount

  return <>{children}</>;
}