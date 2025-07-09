// IndexedDB wrapper for offline-first data storage
import Dexie, { Table } from 'dexie';
import { Thriving } from '@/src/types/thriving';
import { PantryItem } from '@/src/types/pantry';
import { ChatThread } from '@/src/types/chat';
import { WellnessJourney, JourneyEntry } from '@/src/services/openai/types/journey';

// Define the database schema
export interface ThriveDB extends Dexie {
  thrivings: Table<Thriving>;
  pantryItems: Table<PantryItem>;
  chatThreads: Table<ChatThread>;
  journeys: Table<WellnessJourney>;
  journeyEntries: Table<JourneyEntry & { journeyId: string }>;
  syncQueue: Table<SyncQueueItem>;
  settings: Table<SettingItem>;
}

export interface SyncQueueItem {
  id?: string;
  type: 'thriving' | 'pantry' | 'journal' | 'chat';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: string;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface SettingItem {
  key: string;
  value: unknown;
}

// Create the database instance
export const db = new Dexie('ThriveDB') as ThriveDB;

// Define the schema
db.version(1).stores({
  thrivings: 'id, title, createdAt, updatedAt',
  pantryItems: 'id, name, createdAt, *tags',
  chatThreads: 'id, title, createdAt, updatedAt',
  journeys: 'id, title, createdAt',
  journeyEntries: 'id, journeyId, timestamp',
  syncQueue: '++id, type, status, timestamp',
  settings: 'key'
});

// Migration helper to move from localStorage to IndexedDB
export async function migrateFromLocalStorage() {
  try {
    // Check if migration has already been done
    const migrated = await db.settings.get('migrated');
    if (migrated?.value) return;

    // Migrate thrivings
    const thrivingsData = localStorage.getItem('thrivings');
    if (thrivingsData) {
      const thrivings = JSON.parse(thrivingsData);
      await db.thrivings.bulkPut(thrivings);
      localStorage.removeItem('thrivings');
    }

    // Migrate routines (legacy) to thrivings
    const routinesData = localStorage.getItem('routines');
    if (routinesData) {
      const routines = JSON.parse(routinesData);
      const thrivings = routines.map((routine: Thriving) => ({
        ...routine,
        isThrivingJournal: false
      }));
      await db.thrivings.bulkPut(thrivings);
      localStorage.removeItem('routines');
    }

    // Migrate pantry items
    const pantryData = localStorage.getItem('pantryItems');
    if (pantryData) {
      const items = JSON.parse(pantryData);
      await db.pantryItems.bulkPut(items);
      localStorage.removeItem('pantryItems');
    }

    // Migrate chat threads
    const threadsData = localStorage.getItem('thrive_chat_threads');
    if (threadsData) {
      const threads = JSON.parse(threadsData);
      await db.chatThreads.bulkPut(threads);
      localStorage.removeItem('thrive_chat_threads');
    }

    // Migrate wellness journeys
    const journeysData = localStorage.getItem('wellnessJourneys');
    if (journeysData) {
      const journeys = JSON.parse(journeysData);
      await db.journeys.bulkPut(journeys);
      
      // Extract and store entries separately
      for (const journey of journeys) {
        if (journey.entries && journey.entries.length > 0) {
          const entries = journey.entries.map((entry: JourneyEntry) => ({
            ...entry,
            journeyId: journey.id
          }));
          await db.journeyEntries.bulkPut(entries);
        }
      }
      
      localStorage.removeItem('wellnessJourneys');
    }

    // Mark migration as complete
    await db.settings.put({ key: 'migrated', value: true });
    console.log('[DB] Migration from localStorage completed');
  } catch (error) {
    console.error('[DB] Migration failed:', error);
  }
}

// Sync queue management
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'status'>) {
  return db.syncQueue.add({
    ...item,
    timestamp: new Date().toISOString(),
    retries: 0,
    status: 'pending'
  });
}

export async function processSyncQueue() {
  const items = await db.syncQueue.where('status').equals('pending').toArray();
  
  for (const item of items) {
    try {
      // Update status to syncing
      await db.syncQueue.update(item.id!, { status: 'syncing' });
      
      // Process based on type and action
      // This would integrate with your API when online
      // For now, we'll just mark as synced since we're offline-first
      
      // Remove from queue if successful
      await db.syncQueue.delete(item.id!);
    } catch {
      // Update retry count and status
      await db.syncQueue.update(item.id!, {
        status: 'failed',
        retries: item.retries + 1
      });
    }
  }
}

// Utility functions for data operations
export const dbOperations = {
  // Thrivings
  async getThrivings() {
    return db.thrivings.toArray();
  },
  
  async getThriving(id: string) {
    return db.thrivings.get(id);
  },
  
  async saveThriving(thriving: Thriving) {
    await db.thrivings.put(thriving);
    await addToSyncQueue({ type: 'thriving', action: 'update', data: thriving });
  },
  
  async deleteThriving(id: string) {
    await db.thrivings.delete(id);
    await addToSyncQueue({ type: 'thriving', action: 'delete', data: { id } });
  },

  // Pantry Items
  async getPantryItems() {
    return db.pantryItems.toArray();
  },
  
  async savePantryItem(item: PantryItem) {
    await db.pantryItems.put(item);
    await addToSyncQueue({ type: 'pantry', action: 'update', data: item });
  },
  
  async deletePantryItem(id: string) {
    await db.pantryItems.delete(id);
    await addToSyncQueue({ type: 'pantry', action: 'delete', data: { id } });
  },

  // Chat Threads
  async getChatThreads() {
    return db.chatThreads.orderBy('updatedAt').reverse().toArray();
  },
  
  async getChatThread(id: string) {
    return db.chatThreads.get(id);
  },
  
  async saveChatThread(thread: ChatThread) {
    await db.chatThreads.put(thread);
    await addToSyncQueue({ type: 'chat', action: 'update', data: thread });
  },

  // Journeys
  async getJourneys() {
    const journeys = await db.journeys.toArray();
    // Attach entries to each journey
    for (const journey of journeys) {
      journey.entries = await db.journeyEntries
        .where('journeyId')
        .equals(journey.id)
        .toArray();
    }
    return journeys;
  },
  
  async saveJourney(journey: WellnessJourney) {
    const { entries, ...journeyData } = journey;
    await db.journeys.put({ ...journeyData, entries: entries || [] });
    
    if (entries && entries.length > 0) {
      const entriesWithJourneyId = entries.map(entry => ({
        ...entry,
        journeyId: journey.id
      }));
      await db.journeyEntries.bulkPut(entriesWithJourneyId);
    }
    
    await addToSyncQueue({ type: 'journal', action: 'update', data: journey });
  },

  // Settings
  async getSetting(key: string) {
    const setting = await db.settings.get(key);
    return setting?.value;
  },
  
  async setSetting(key: string, value: unknown) {
    await db.settings.put({ key, value });
  }
};

// Initialize database on load
if (typeof window !== 'undefined') {
  migrateFromLocalStorage();
}