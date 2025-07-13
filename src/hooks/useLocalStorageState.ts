import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing state that's backed by localStorage
 * Prevents flash of empty state by initializing from localStorage immediately
 * 
 * @param key - The localStorage key
 * @param initialValue - Default value if nothing in localStorage
 * @param loadFunction - Function to load data from localStorage
 * @returns [value, setValue, reload] - Current value, setter, and reload function
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T | (() => T),
  loadFunction: () => T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  // Initialize state with data from localStorage to prevent flash
  const [value, setValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      try {
        return loadFunction();
      } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
      }
    }
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
  });

  // Reload function to manually refresh from localStorage
  const reload = useCallback(() => {
    try {
      const newValue = loadFunction();
      setValue(newValue);
    } catch (error) {
      console.error(`Error reloading ${key} from localStorage:`, error);
    }
  }, [key, loadFunction]);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, reload]);

  return [value, setValue, reload];
}

/**
 * Example usage:
 * 
 * const [thrivings, setThrivings, reloadThrivings] = useLocalStorageState(
 *   'thrivings',
 *   [],
 *   getThrivingsFromStorage
 * );
 */