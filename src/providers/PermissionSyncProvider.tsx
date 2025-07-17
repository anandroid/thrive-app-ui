'use client';

import { useEffect } from 'react';
import { notificationPermissionManager } from '@/src/utils/notificationPermissionManager';
import { healthPermissionManager } from '@/src/utils/healthPermissionManager';

/**
 * Unified Permission Sync Provider
 * Checks all permissions at app startup/session and caches them
 */
export function PermissionSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[PermissionSyncProvider] Initializing permission checks on app load');
    
    // Check notification permissions
    const checkNotifications = async () => {
      try {
        const notificationStatus = await notificationPermissionManager.getPermissionStatus();
        console.log('[PermissionSyncProvider] Notification permission status:', notificationStatus);
      } catch (error) {
        console.error('[PermissionSyncProvider] Error checking notification permissions:', error);
      }
    };
    
    // Check health permissions
    const checkHealth = async () => {
      try {
        const healthStatus = await healthPermissionManager.getPermissionStatus();
        console.log('[PermissionSyncProvider] Health permission status:', healthStatus);
      } catch (error) {
        console.error('[PermissionSyncProvider] Error checking health permissions:', error);
      }
    };
    
    // Run both checks in parallel
    Promise.all([checkNotifications(), checkHealth()]).then(() => {
      console.log('[PermissionSyncProvider] All permission checks completed');
    });
  }, []); // Only run on mount

  return <>{children}</>;
}