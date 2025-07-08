'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useServiceWorker } from '@/src/providers/ServiceWorkerProvider';

export function OfflineIndicator() {
  const { isOffline } = useServiceWorker();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2 text-center animate-slide-down safe-area-top">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <WifiOff className="w-4 h-4" />
        <span>You&apos;re offline - Changes will sync when reconnected</span>
      </div>
    </div>
  );
}