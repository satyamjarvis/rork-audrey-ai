import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, isCorruptedData } from './storageKeys';
import { populateStorageCache } from './storageCache';

/**
 * Storage restoration and validation utilities
 */

export interface StorageHealthReport {
  totalKeys: number;
  validKeys: string[];
  corruptedKeys: string[];
  missingKeys: string[];
  restoredKeys: string[];
}

/**
 * Check the health of all storage keys
 */
export async function checkStorageHealth(): Promise<StorageHealthReport> {
  const report: StorageHealthReport = {
    totalKeys: Object.keys(STORAGE_KEYS).length,
    validKeys: [],
    corruptedKeys: [],
    missingKeys: [],
    restoredKeys: [],
  };

  console.log('🔍 Starting storage health check...');

  const allStorageKeys = Object.entries(STORAGE_KEYS);
  const keysToFetch = allStorageKeys.map(([_, key]) => key);

  try {
    // Optimization: Fetch all keys at once using multiGet
    const results = await AsyncStorage.multiGet(keysToFetch);
    
    // Populate the cache with the fetched results to speed up initial load
    // Convert readonly array to mutable array
    const mutableResults: [string, string | null][] = results.map(([key, value]) => [key, value]);
    populateStorageCache(mutableResults);
    
    const keysToRemove: string[] = [];

    results.forEach(([key, value], index) => {
      const keyName = allStorageKeys[index][0];
      
      if (value === null) {
        report.missingKeys.push(key);
        // console.log(`⚠️ Missing key: ${keyName} (${key})`);
      } else if (isCorruptedData(value)) {
        report.corruptedKeys.push(key);
        console.error(`❌ Corrupted key: ${keyName} (${key})`);
        keysToRemove.push(key);
      } else {
        report.validKeys.push(key);
        // console.log(`✅ Valid key: ${keyName} (${key})`);
      }
    });

    // Bulk remove corrupted keys
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`🧹 Cleaned ${keysToRemove.length} corrupted keys`);
    }

  } catch (error) {
    console.error('Error checking storage health:', error);
    // Fallback or just report error
  }

  console.log('📊 Storage Health Report:', {
    valid: report.validKeys.length,
    corrupted: report.corruptedKeys.length,
    missing: report.missingKeys.length,
    total: report.totalKeys,
  });

  return report;
}

/**
 * Initialize default values for missing storage keys
 */
export async function initializeMissingKeys(): Promise<string[]> {
  const initializedKeys: string[] = [];
  
  const defaultValues: Partial<Record<keyof typeof STORAGE_KEYS, any>> = {
    NOTES_DATA: [],
    TODO_ITEMS: [],
    PLANNER_TASKS: [],
    PASSWORDS_STORAGE: [],
    SECURITY_SETTINGS: JSON.stringify({
      method: 'passcode',
      biometricEnabled: false,
    }),
    MORNING_HABITS: [],
    MORNING_AFFIRMATIONS: [],
    FAVORITE_AFFIRMATIONS: [],
    MEDITATION_SESSIONS: [],
    MEDITATION_STREAK: '0',
    WELLNESS_ENTRIES: [],
    GRATITUDE_MOMENTS: [],
    DREAM_JOURNAL: [],
    FEELINGS_LOG: [],
    SCHEDULE_EVENTS: [],
    CALENDAR_EVENTS: [],
    LEARN_DATA: JSON.stringify({
      categories: [],
      lastUpdated: Date.now(),
      version: '1.0',
    }),
    PHONEBOOK_CONTACTS: [],
    CHAT_MESSAGES: [],
    CHAT_HISTORY: [],
    USER_PROFILE: JSON.stringify({
      preferences: [],
      lastUpdated: Date.now(),
    }),
    THEME_SETTINGS: JSON.stringify({
      mode: 'dark',
    }),
    LANGUAGE_SETTINGS: JSON.stringify({
      language: 'en',
    }),
    FONT_SIZE_SETTINGS: JSON.stringify({
      size: 'medium',
    }),
    NOTIFICATION_SETTINGS: JSON.stringify({
      enabled: true,
      morning: true,
      night: true,
      reminders: true,
    }),
    AUDREY_MEMORY: [],
    MUSIC_SETTINGS: JSON.stringify({
      enabled: true,
      volume: 0.5,
    }),
    AUDIO_STYLE_SETTINGS: JSON.stringify({
      style: 'default',
    }),
    FINANCE_TRANSACTIONS: [],
    WEALTH_GOALS: [],
    WEALTH_MANIFESTING: [],
    STATISTICS_DATA: JSON.stringify({
      metrics: {},
      lastUpdated: Date.now(),
    }),
    SHARED_ITEMS: [],
    UNIVERSE_MODE_SETTINGS: JSON.stringify({
      enabled: false,
    }),
    ONBOARDING_COMPLETE: 'false',
    SUBSCRIPTION_STATUS: JSON.stringify({
      active: false,
      plan: 'free',
    }),
  };

  try {
    const allStorageKeys = Object.entries(STORAGE_KEYS);
    const keysToFetch = allStorageKeys.map(([_, key]) => key);
    
    // Check what we have
    const results = await AsyncStorage.multiGet(keysToFetch);
    const pairsToSet: [string, string][] = [];

    results.forEach(([key, value], index) => {
      const keyName = allStorageKeys[index][0];
      
      // Initialize if missing or corrupted
      if (value === null || isCorruptedData(value)) {
        const defaultValue = defaultValues[keyName as keyof typeof defaultValues];
        if (defaultValue !== undefined) {
          const valueToStore = typeof defaultValue === 'string' 
            ? defaultValue 
            : JSON.stringify(defaultValue);
          
          pairsToSet.push([key, valueToStore]);
          initializedKeys.push(key);
        }
      }
    });

    if (pairsToSet.length > 0) {
      await AsyncStorage.multiSet(pairsToSet);
      console.log(`✨ Bulk initialized ${pairsToSet.length} storage keys`);
    }
  } catch (error) {
    console.error('Error initializing missing keys:', error);
  }

  return initializedKeys;
}

/**
 * Clean up orphaned storage keys (keys not in our STORAGE_KEYS list)
 */
export async function cleanupOrphanedKeys(): Promise<string[]> {
  const cleanedKeys: string[] = [];
  
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const validKeys = Object.values(STORAGE_KEYS) as string[];
    const keysToRemove: string[] = [];
    
    for (const key of allKeys) {
      if (!validKeys.includes(key) && key.startsWith('@')) {
        // This key is not in our official list
        console.log(`🗑️ Found orphaned key: ${key}`);
        keysToRemove.push(key);
        cleanedKeys.push(key);
      }
    }
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`🧹 Cleaned up ${cleanedKeys.length} orphaned keys`);
    }
  } catch (error) {
    console.error('Error cleaning up orphaned keys:', error);
  }
  
  return cleanedKeys;
}

/**
 * Full storage restoration process
 */
export async function restoreStorage(): Promise<{
  healthReport: StorageHealthReport;
  orphanedKeysRemoved: string[];
}> {
  console.log('🚀 Starting full storage restoration...');
  
  // 1. Check storage health
  const healthReport = await checkStorageHealth();
  
  // 2. Initialize missing or corrupted keys with defaults
  const restoredKeys = await initializeMissingKeys();
  healthReport.restoredKeys = restoredKeys;
  
  // 3. Clean up orphaned keys - DISABLED per user request to restore original store locations
  // const orphanedKeysRemoved = await cleanupOrphanedKeys();
  console.log('ℹ️ Orphaned key cleanup skipped to preserve data');
  const orphanedKeysRemoved: string[] = [];
  
  console.log('✅ Storage restoration complete!');
  
  return {
    healthReport,
    orphanedKeysRemoved,
  };
}

/**
 * Export all app data for backup
 */
export async function exportAppData(): Promise<Record<string, any>> {
  const exportData: Record<string, any> = {};
  
  try {
    const allStorageKeys = Object.entries(STORAGE_KEYS);
    const keysToFetch = allStorageKeys.map(([_, key]) => key);
    
    const results = await AsyncStorage.multiGet(keysToFetch);
    
    results.forEach(([key, value], index) => {
      const keyName = allStorageKeys[index][0];
      if (value && !isCorruptedData(value)) {
        exportData[keyName] = value;
      }
    });
  } catch (error) {
    console.error('Error exporting app data:', error);
  }
  
  return {
    version: '1.0',
    timestamp: Date.now(),
    data: exportData,
  };
}

/**
 * Import app data from backup
 */
export async function importAppData(backupData: {
  version: string;
  timestamp: number;
  data: Record<string, any>;
}): Promise<boolean> {
  try {
    if (!backupData.data) {
      throw new Error('Invalid backup data format');
    }
    
    const pairsToSet: [string, string][] = [];
    
    for (const [keyName, value] of Object.entries(backupData.data)) {
      const storageKey = STORAGE_KEYS[keyName as keyof typeof STORAGE_KEYS];
      if (storageKey && typeof value === 'string') {
        pairsToSet.push([storageKey, value]);
      }
    }
    
    if (pairsToSet.length > 0) {
      await AsyncStorage.multiSet(pairsToSet);
      console.log(`📥 Imported ${pairsToSet.length} keys`);
    }
    
    console.log('✅ Data import successful');
    return true;
  } catch (error) {
    console.error('Error importing app data:', error);
    return false;
  }
}
