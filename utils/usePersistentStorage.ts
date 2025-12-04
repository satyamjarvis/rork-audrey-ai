import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encrypt, decrypt } from '@/utils/encryption';
import { getStorageCache, hasStorageCache } from './storageCache';

export interface StorageOptions<T> {
  key: string;
  initialValue: T;
  encryption?: boolean;
  backup?: boolean;
  backupInterval?: number; // default 60000ms (1 min)
  debounce?: number; // default 1000ms
  version?: number; // for future migrations
}

export interface StorageResult<T> {
  data: T;
  isLoading: boolean;
  saveData: (newData: T | ((prev: T) => T)) => Promise<void>;
  error: Error | null;
  resetData: () => Promise<void>;
  forceSync: () => Promise<void>; // force save immediately (bypass debounce)
}

/**
 * A robust hook for persistent storage with:
 * - Encryption support
 * - Debounced writes
 * - Automatic backups
 * - Error handling and recovery
 * - Type safety
 */
export function usePersistentStorage<T>(options: StorageOptions<T>): StorageResult<T> {
  const {
    key,
    initialValue,
    encryption = false,
    backup = false,
    backupInterval = 60000,
    debounce = 1000
  } = options;

  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs to track state for async operations
  const dataRef = useRef<T>(initialValue);
  const initialValueRef = useRef<T>(initialValue);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const backupKey = `${key}_backup`;

  // Update refs when state/props changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  // Load data on mount
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      // Check cache first
      if (hasStorageCache(key)) {
        const cached = getStorageCache(key);
        if (cached) {
          try {
             // Logic similar to successful AsyncStorage.getItem
             let parsed: T;
             if (encryption) {
                try {
                  const decrypted = await decrypt(cached);
                  parsed = JSON.parse(decrypted);
                } catch (err) {
                  // Fallback
                  parsed = JSON.parse(cached);
                }
             } else {
                parsed = JSON.parse(cached);
             }

             if (parsed !== null && parsed !== undefined) {
               setData(parsed);
               dataRef.current = parsed;
               setIsLoading(false);
               return; // Exit if cache hit and valid
             }
          } catch (e) {
            console.warn(`[Storage] Cache parse failed for ${key}, falling back to async load`);
          }
        } else {
           // Cache has explicit null, meaning no data
           setData(initialValueRef.current);
           setIsLoading(false);
           return;
        }
      }

      const loadTimeout = setTimeout(() => {
        if (mounted) {
          console.warn(`[Storage] Load timeout for ${key}, using initial value`);
          setData(initialValueRef.current);
          setIsLoading(false);
        }
      }, 10000);

      try {
        setIsLoading(true);
        setError(null);
        
        const stored = await Promise.race([
          AsyncStorage.getItem(key),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Storage read timeout')), 8000)
          )
        ]);

        clearTimeout(loadTimeout);
        
        if (!mounted) return;

        if (stored) {
          // Try to parse/decrypt
          try {
            let parsed: T;
            
            if (encryption) {
              // Try to decrypt first
              try {
                const decrypted = await decrypt(stored);
                parsed = JSON.parse(decrypted);
              } catch (err) {
                // Fallback: try parsing as plain JSON (migration scenario)
                console.log(`[Storage] Decrypt failed for ${key}, trying plain JSON fallback`, err);
                parsed = JSON.parse(stored);
              }
            } else {
              parsed = JSON.parse(stored);
            }
            
            // Basic validation: verify it's not null/undefined if we expect an object/array
            if (parsed !== null && parsed !== undefined) {
              setData(parsed);
              dataRef.current = parsed;
            } else {
              console.warn(`[Storage] Loaded null/undefined for ${key}, using initial value`);
              setData(initialValueRef.current);
              dataRef.current = initialValueRef.current;
            }
          } catch (parseError) {
            console.error(`[Storage] Parse error for ${key}:`, parseError);
            
            // Try to recover from backup if main fails
            if (backup) {
              console.log(`[Storage] Attempting backup recovery for ${key}`);
              try {
                const backupStored = await AsyncStorage.getItem(backupKey);
                if (backupStored) {
                  const backupParsed = JSON.parse(backupStored);
                  setData(backupParsed);
                  dataRef.current = backupParsed;
                  console.log(`[Storage] Recovered ${key} from backup`);
                  
                  // Heal the main storage immediately
                  const stringified = JSON.stringify(backupParsed);
                  const toStore = encryption ? await encrypt(stringified) : stringified;
                  await AsyncStorage.setItem(key, toStore);
                } else {
                  throw new Error('No backup available');
                }
              } catch (backupError) {
                console.error(`[Storage] Backup recovery failed for ${key}:`, backupError);
                // Last resort: reset
                setData(initialValueRef.current);
              }
            } else {
              setData(initialValueRef.current);
            }
          }
        } else {
          // No data found, use initial
          setData(initialValueRef.current);
        }
      } catch (err) {
        console.error(`[Storage] Load error for ${key}:`, err);
        setError(err instanceof Error ? err : new Error('Unknown storage error'));
        setData(initialValueRef.current);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (backupIntervalRef.current) clearInterval(backupIntervalRef.current);
    };
  }, [key, encryption, backup, backupKey]); // Removed initialValue from dependency to prevent loops

  // Setup periodic backup
  useEffect(() => {
    if (!backup) return;

    backupIntervalRef.current = setInterval(async () => {
      try {
        const currentData = dataRef.current;
        // Only backup if we have valid data (basic check)
        if (currentData && (Array.isArray(currentData) ? currentData.length > 0 : true)) {
          await AsyncStorage.setItem(backupKey, JSON.stringify(currentData));
          // console.log(`[Storage] Backup saved for ${key}`); 
          // Commented out to reduce noise, enable for debugging
        }
      } catch (e) {
        console.error(`[Storage] Backup failed for ${key}:`, e);
      }
    }, backupInterval);

    return () => {
      if (backupIntervalRef.current) clearInterval(backupIntervalRef.current);
    };
  }, [backup, backupKey, backupInterval, key]);

  // Internal save function
  const _persist = useCallback(async (newData: T) => {
    try {
      const stringified = JSON.stringify(newData);
      const toStore = encryption ? await encrypt(stringified) : stringified;
      await AsyncStorage.setItem(key, toStore);
    } catch (e) {
      console.error(`[Storage] Save failed for ${key}:`, e);
      setError(e instanceof Error ? e : new Error('Save failed'));
      
      // Retry logic could go here, but maybe overkill for now since we have backup
    }
  }, [encryption, key]);

  const saveData = useCallback(async (newData: T | ((prev: T) => T)) => {
    // 1. Update React state immediately
    const actualNewData = typeof newData === 'function' ? (newData as (prev: T) => T)(dataRef.current) : newData;
    setData(actualNewData);
    dataRef.current = actualNewData;

    // 2. Debounce storage write
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      _persist(actualNewData);
    }, debounce);
  }, [debounce, _persist]);

  const forceSync = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await _persist(dataRef.current);
  }, [_persist]);

  const resetData = useCallback(async () => {
    try {
      setData(initialValueRef.current);
      dataRef.current = initialValueRef.current;
      await AsyncStorage.removeItem(key);
      if (backup) {
        await AsyncStorage.removeItem(backupKey);
      }
    } catch (e) {
      console.error(`[Storage] Reset failed for ${key}:`, e);
      setError(e instanceof Error ? e : new Error('Reset failed'));
    }
  }, [key, backup, backupKey]);

  return {
    data,
    isLoading,
    saveData,
    error,
    resetData,
    forceSync
  };
}
