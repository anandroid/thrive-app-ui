'use client';

import React, { useEffect, ReactNode } from 'react';
import { syncRoutinesWithNativeApp } from '@/src/utils/routineStorage';
import { NotificationHelper } from '@/src/utils/notificationHelper';

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  useEffect(() => {
    // Sync routines when app loads in React Native
    if (NotificationHelper.isSupported()) {
      syncRoutinesWithNativeApp().then(() => {
        console.log('Routines synced with native app');
      }).catch((error) => {
        console.error('Failed to sync routines:', error);
      });
    }
  }, []);

  return <>{children}</>;
};