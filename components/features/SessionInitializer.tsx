'use client';

import { useEffect } from 'react';
import { SessionTracking } from '@/src/utils/sessionTracking';

export function SessionInitializer() {
  useEffect(() => {
    // Initialize session when the app loads
    SessionTracking.initializeSession();
  }, []);

  return null;
}