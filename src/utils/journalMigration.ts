/**
 * @fileoverview Journal Migration Utilities
 * @module utils/journalMigration
 * 
 * Utilities for migrating existing routines to use dynamic journal templates
 */

import { Thriving, DynamicJournalTemplate } from '@/src/types/thriving';
import { JournalInsightsEngine } from '@/src/lib/journalInsights';
import { UserLearningProfileManager } from '@/src/lib/userLearningProfile';
import { getThrivingsFromStorage, updateThrivingInStorage } from './thrivingStorage';

/**
 * Migrate all existing routines to include dynamic journal templates
 */
export function migrateExistingRoutinesToDynamicJournals(): void {
  try {
    const existingThrivings = getThrivingsFromStorage();
    let migrationCount = 0;

    existingThrivings.forEach(thriving => {
      // Skip if already has a journal template
      if (thriving.journalTemplate) {
        return;
      }

      // Get user profile for personalization
      const userProfile = UserLearningProfileManager.getUserProfile();

      // Create dynamic template for this routine
      const journalTemplate = JournalInsightsEngine.createDynamicTemplate(
        thriving,
        userProfile.dataPoints > 0 ? userProfile : undefined
      );

      // Update the thriving with the new template
      const updatedThriving: Thriving = {
        ...thriving,
        journalTemplate,
        version: thriving.version || '1.0'
      };

      // Save the updated thriving
      updateThrivingInStorage(thriving.id, updatedThriving);
      migrationCount++;
    });

    if (migrationCount > 0) {
      console.log(`✅ Migrated ${migrationCount} routines to dynamic journals`);
      
      // Mark migration as complete
      localStorage.setItem('dynamic_journal_migration_complete', 'true');
      localStorage.setItem('dynamic_journal_migration_date', new Date().toISOString());
    }

  } catch (error) {
    console.error('❌ Error migrating routines to dynamic journals:', error);
  }
}

/**
 * Check if migration has been completed
 */
export function isDynamicJournalMigrationComplete(): boolean {
  return localStorage.getItem('dynamic_journal_migration_complete') === 'true';
}

/**
 * Run migration if needed (called from app startup)
 */
export function runMigrationIfNeeded(): void {
  if (!isDynamicJournalMigrationComplete()) {
    migrateExistingRoutinesToDynamicJournals();
  }
}

/**
 * Upgrade specific routine to latest journal template version
 */
export function upgradeRoutineJournalTemplate(thrivingId: string): boolean {
  try {
    const existingThrivings = getThrivingsFromStorage();
    const thriving = existingThrivings.find(t => t.id === thrivingId);
    
    if (!thriving) {
      console.warn(`Routine ${thrivingId} not found for journal template upgrade`);
      return false;
    }

    // Get current user profile
    const userProfile = UserLearningProfileManager.getUserProfile();

    // Create new template with latest insights
    const newTemplate = JournalInsightsEngine.createDynamicTemplate(
      thriving,
      userProfile.dataPoints > 5 ? userProfile : undefined
    );

    // Update version number
    const currentVersion = parseFloat(thriving.journalTemplate?.version || '1.0');
    const newVersion = (currentVersion + 0.1).toFixed(1);
    newTemplate.version = newVersion;

    // Update the routine
    const updatedThriving: Thriving = {
      ...thriving,
      journalTemplate: newTemplate,
      version: newVersion
    };

    updateThrivingInStorage(thrivingId, updatedThriving);
    
    console.log(`✅ Upgraded routine ${thrivingId} journal template to v${newVersion}`);
    return true;

  } catch (error) {
    console.error(`❌ Error upgrading routine ${thrivingId} journal template:`, error);
    return false;
  }
}

/**
 * Get migration statistics
 */
export function getMigrationStats(): {
  totalRoutines: number;
  migratedRoutines: number;
  migrationDate: string | null;
  isComplete: boolean;
} {
  const existingThrivings = getThrivingsFromStorage();
  const totalRoutines = existingThrivings.length;
  const migratedRoutines = existingThrivings.filter(t => t.journalTemplate).length;
  const migrationDate = localStorage.getItem('dynamic_journal_migration_date');
  const isComplete = isDynamicJournalMigrationComplete();

  return {
    totalRoutines,
    migratedRoutines,
    migrationDate,
    isComplete
  };
}

/**
 * Reset migration (for testing purposes)
 */
export function resetMigration(): void {
  localStorage.removeItem('dynamic_journal_migration_complete');
  localStorage.removeItem('dynamic_journal_migration_date');
  
  // Remove journal templates from all routines
  const existingThrivings = getThrivingsFromStorage();
  existingThrivings.forEach(thriving => {
    const updatedThriving = { ...thriving };
    delete updatedThriving.journalTemplate;
    updateThrivingInStorage(thriving.id, updatedThriving);
  });

  console.log('🔄 Migration reset complete');
}