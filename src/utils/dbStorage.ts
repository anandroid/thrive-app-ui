// New storage utilities using IndexedDB
import { dbOperations } from '@/src/lib/db';
import { Thriving } from '@/src/types/thriving';
import { PantryItem } from '@/src/types/pantry';
import { ChatThread } from '@/src/types/chat';
import { WellnessJourney } from '@/src/services/openai/types/journey';

// Thriving storage functions
export async function getThrivingsFromStorage(): Promise<Thriving[]> {
  try {
    return await dbOperations.getThrivings();
  } catch (error) {
    console.error('Error reading thrivings from DB:', error);
    return [];
  }
}

export async function saveThrivingToStorage(thriving: Thriving): Promise<void> {
  try {
    await dbOperations.saveThriving(thriving);
  } catch (error) {
    console.error('Error saving thriving to DB:', error);
  }
}

export async function deleteThrivingFromStorage(id: string): Promise<void> {
  try {
    await dbOperations.deleteThriving(id);
  } catch (error) {
    console.error('Error deleting thriving from DB:', error);
  }
}

// Pantry storage functions
export async function getPantryItemsFromStorage(): Promise<PantryItem[]> {
  try {
    return await dbOperations.getPantryItems();
  } catch (error) {
    console.error('Error reading pantry items from DB:', error);
    return [];
  }
}

export async function savePantryItemToStorage(item: PantryItem): Promise<void> {
  try {
    await dbOperations.savePantryItem(item);
  } catch (error) {
    console.error('Error saving pantry item to DB:', error);
  }
}

export async function deletePantryItemFromStorage(id: string): Promise<void> {
  try {
    await dbOperations.deletePantryItem(id);
  } catch (error) {
    console.error('Error deleting pantry item from DB:', error);
  }
}

// Chat storage functions
export async function getChatThreadsFromStorage(): Promise<ChatThread[]> {
  try {
    return await dbOperations.getChatThreads();
  } catch (error) {
    console.error('Error reading chat threads from DB:', error);
    return [];
  }
}

export async function getChatThreadFromStorage(id: string): Promise<ChatThread | undefined> {
  try {
    return await dbOperations.getChatThread(id);
  } catch (error) {
    console.error('Error reading chat thread from DB:', error);
    return undefined;
  }
}

export async function saveChatThreadToStorage(thread: ChatThread): Promise<void> {
  try {
    await dbOperations.saveChatThread(thread);
  } catch (error) {
    console.error('Error saving chat thread to DB:', error);
  }
}

// Journey storage functions
export async function getJourneysFromStorage(): Promise<WellnessJourney[]> {
  try {
    return await dbOperations.getJourneys();
  } catch (error) {
    console.error('Error reading journeys from DB:', error);
    return [];
  }
}

export async function saveJourneyToStorage(journey: WellnessJourney): Promise<void> {
  try {
    await dbOperations.saveJourney(journey);
  } catch (error) {
    console.error('Error saving journey to DB:', error);
  }
}

// Settings storage functions
export async function getSettingFromStorage<T = unknown>(key: string): Promise<T | null> {
  try {
    return await dbOperations.getSetting(key) as T | null;
  } catch (error) {
    console.error('Error reading setting from DB:', error);
    return null;
  }
}

export async function saveSettingToStorage(key: string, value: unknown): Promise<void> {
  try {
    await dbOperations.setSetting(key, value);
  } catch (error) {
    console.error('Error saving setting to DB:', error);
  }
}

// Migration completed check
export async function isStorageMigrated(): Promise<boolean> {
  const migrated = await getSettingFromStorage<boolean>('migrated');
  return migrated || false;
}