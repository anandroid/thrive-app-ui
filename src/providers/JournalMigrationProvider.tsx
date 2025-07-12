'use client';

import { useEffect } from 'react';
import { runMigrationIfNeeded } from '@/src/utils/journalMigration';

/**
 * Provider that handles dynamic journal migration on app startup
 */
export function JournalMigrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Run migration check on app startup
    try {
      runMigrationIfNeeded();
    } catch (error) {
      console.error('Migration provider error:', error);
    }
  }, []);

  return <>{children}</>;
}