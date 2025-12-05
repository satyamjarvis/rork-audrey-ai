import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

export interface StorageStats {
  totalKeys: number;
  corruptedKeys: number;
  totalSize: number;
  lastChecked: number;
}

function isValidBase64(str: string): boolean {
  if (!str || str.length === 0) return false;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str) && str.length % 4 === 0;
}

export function isValidJSON(str: string | null): boolean {
  if (!str || str.trim() === '' || str === 'undefined' || str === 'null') {
    return false;
  }
  
  const trimmed = str.trim();
  
  // Check for binary data - look for non-printable characters
  // Binary data often contains special characters like �
  // Also check for question marks which indicate corrupted encoding
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\xFF]/.test(trimmed) || 
      trimmed.includes('�') || 
      (trimmed === '?' || trimmed.trim() === '?') ||
      /^[?\s]+$/.test(trimmed)) {
    console.error('[AsyncStorage] Detected binary/corrupted data, cannot parse as JSON');
    return false;
  }
  
  // Check for object stringification issues - this catches the "o" from "object"
  // This is the most common cause of "Unexpected character: o" errors
  if (trimmed.includes('[object') || 
      trimmed.startsWith('object') || 
      trimmed === 'object' || 
      /^object\s*Object/.test(trimmed) ||
      (trimmed.startsWith('o') && trimmed.length < 10)) {
    console.error('[AsyncStorage] Detected object stringification issue:', trimmed.substring(0, 50));
    return false;
  }
  
  // Check for SHA256 hash (64 hex characters) which was used erroneously for encryption
  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    console.error('[AsyncStorage] Detected SHA256 hash (corrupted data), cannot parse as JSON');
    return false;
  }
  
  // Check for other common non-JSON strings
  if (trimmed === 'NaN' || trimmed === 'Infinity' || trimmed === '-Infinity') {
    return false;
  }
  
  // Must start with valid JSON characters OR be valid base64 (encrypted data)
  const firstChar = trimmed[0];
  const isJsonStart = firstChar === '{' || firstChar === '[' || firstChar === '"' || /[0-9\-tf]/.test(firstChar);
  
  if (!isJsonStart) {
    // Check if it's valid base64 (encrypted data)
    if (isValidBase64(trimmed)) {
      console.log('[AsyncStorage] Detected valid base64 encoded data');
      return true;
    }
    console.error('[AsyncStorage] Invalid first character:', firstChar, 'Full:', trimmed.substring(0, 50));
    return false;
  }
  
  // Additional check: valid JSON must also end with proper characters
  const lastChar = trimmed[trimmed.length - 1];
  if (!lastChar || (lastChar !== '}' && lastChar !== ']' && lastChar !== '"' && lastChar !== '=' && !/[0-9esE]/.test(lastChar))) {
    // Check if it might be valid base64 ending with padding
    if (isValidBase64(trimmed)) {
      console.log('[AsyncStorage] Detected valid base64 encoded data');
      return true;
    }
    console.error('[AsyncStorage] Invalid last character:', lastChar, 'Full:', trimmed.substring(0, 50));
    return false;
  }
  
  try {
    JSON.parse(str);
    return true;
  } catch (e: any) {
    // JSON parse failed, but check if it's valid base64 (encrypted data)
    if (isValidBase64(trimmed)) {
      console.log('[AsyncStorage] Not valid JSON but valid base64, likely encrypted data');
      return true;
    }
    console.error('[AsyncStorage] JSON.parse failed:', e?.message || e, 'Data preview:', trimmed.substring(0, 100).replace(/[\x00-\x1F\x80-\xFF]/g, '?'));
    return false;
  }
}

export function safeJSONParse<T>(str: string | null, defaultValue: T): T {
  if (!str || str.trim() === '') {
    console.log('[AsyncStorage] No data to parse, using default');
    return defaultValue;
  }
  
  // Handle special case of literal "null" string
  if (str === 'null') {
    console.log('[AsyncStorage] Found "null" string, using default');
    return defaultValue;
  }
  
  // Try to detect and handle corrupted data
  if (!isValidJSON(str)) {
    const preview = str.substring(0, 50).replace(/[\x00-\x1F\x80-\xFF]/g, '?');
    
    // Only show error if there's actual content that failed to parse
    if (str.trim().length > 0) {
      console.error('[JSON.parse] Error parsing JSON: SyntaxError: JSON Parse error: Unexpected EOF');
      console.error('[JSON.parse] Attempted to parse:', preview || '(empty)');
      
      // Check if it looks like binary data
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\xFF]/.test(str) || str.includes('�')) {
        console.error('[AsyncStorage] Binary data detected, cannot parse as JSON');
      }
    }
    
    return defaultValue;
  }
  
  try {
    return JSON.parse(str) as T;
  } catch (e: any) {
    console.error('[JSON.parse] Error parsing JSON:', e);
    console.error('[JSON.parse] Attempted to parse:', str === 'null' ? 'null' : str.substring(0, 100).replace(/[\x00-\x1F\x80-\xFF]/g, '?'));
    return defaultValue;
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    context?: string;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const { 
    maxRetries = MAX_RETRIES, 
    initialDelay = 500,
    context = 'operation',
    shouldRetry = () => true,
  } = options;
  
  let lastError: Error | null = null;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[AsyncStorage:${context}] Retry attempt ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 5000);
      }
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[AsyncStorage:${context}] Attempt ${attempt + 1} failed:`, lastError.message);
      
      if (!shouldRetry(lastError)) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error(`${context} failed after ${maxRetries} retries`);
}

export async function safeAsyncStorageGet<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const operation = async () => {
      const stored = await withTimeout(
        AsyncStorage.getItem(key),
        DEFAULT_TIMEOUT,
        'AsyncStorage.getItem'
      );
      return safeJSONParse(stored, defaultValue);
    };
    
    return await retryOperation(operation, { context: `get(${key})` });
  } catch (error) {
    console.error(`[AsyncStorage] Error reading ${key}:`, error instanceof Error ? error.message : error);
    return defaultValue;
  }
}

export async function safeAsyncStorageGetMultiple<T>(
  keys: string[],
  defaultValue: T
): Promise<Record<string, T>> {
  const results: Record<string, T> = {};
  
  try {
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      const batchResults = await withTimeout(
        AsyncStorage.multiGet(batch),
        DEFAULT_TIMEOUT * 2,
        'AsyncStorage.multiGet'
      );
      
      for (const [key, value] of batchResults) {
        results[key] = safeJSONParse(value, defaultValue);
      }
    }
  } catch (error) {
    console.error('[AsyncStorage] Error in multiGet:', error instanceof Error ? error.message : error);
    keys.forEach(key => {
      if (!(key in results)) {
        results[key] = defaultValue;
      }
    });
  }
  
  return results;
}

export async function safeAsyncStorageSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const stringValue = safeStringify(value);
    if (stringValue === null) {
      console.error(`[AsyncStorage] Failed to stringify value for key ${key}`);
      return false;
    }
    
    const operation = async () => {
      await withTimeout(
        AsyncStorage.setItem(key, stringValue),
        DEFAULT_TIMEOUT,
        'AsyncStorage.setItem'
      );
    };
    
    await retryOperation(operation, { context: `set(${key})` });
    return true;
  } catch (error) {
    console.error(`[AsyncStorage] Error writing ${key}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

export async function safeAsyncStorageSetMultiple(
  items: { key: string; value: unknown }[]
): Promise<{ success: boolean; failedKeys: string[] }> {
  const failedKeys: string[] = [];
  
  try {
    const pairs: [string, string][] = [];
    
    for (const { key, value } of items) {
      const stringValue = safeStringify(value);
      if (stringValue !== null) {
        pairs.push([key, stringValue]);
      } else {
        failedKeys.push(key);
      }
    }
    
    for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
      const batch = pairs.slice(i, i + BATCH_SIZE);
      await withTimeout(
        AsyncStorage.multiSet(batch),
        DEFAULT_TIMEOUT * 2,
        'AsyncStorage.multiSet'
      );
    }
    
    return { success: failedKeys.length === 0, failedKeys };
  } catch (error) {
    console.error('[AsyncStorage] Error in multiSet:', error instanceof Error ? error.message : error);
    return { success: false, failedKeys: items.map(i => i.key) };
  }
}

export async function safeAsyncStorageRemove(key: string): Promise<boolean> {
  try {
    await withTimeout(
      AsyncStorage.removeItem(key),
      DEFAULT_TIMEOUT,
      'AsyncStorage.removeItem'
    );
    return true;
  } catch (error) {
    console.error(`[AsyncStorage] Error removing ${key}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

export async function safeAsyncStorageRemoveMultiple(keys: string[]): Promise<{ success: boolean; failedKeys: string[] }> {
  try {
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      await withTimeout(
        AsyncStorage.multiRemove(batch),
        DEFAULT_TIMEOUT,
        'AsyncStorage.multiRemove'
      );
    }
    return { success: true, failedKeys: [] };
  } catch (error) {
    console.error('[AsyncStorage] Error in multiRemove:', error instanceof Error ? error.message : error);
    return { success: false, failedKeys: keys };
  }
}

function safeStringify(value: unknown): string | null {
  try {
    if (value === undefined) {
      return null;
    }
    return JSON.stringify(value);
  } catch (error) {
    console.error('[AsyncStorage] Stringify error:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function clearCorruptedKeys(): Promise<void> {
  try {
    console.log('[AsyncStorage] Starting corruption check...');
    const keys = await withTimeout(
      AsyncStorage.getAllKeys(),
      DEFAULT_TIMEOUT,
      'AsyncStorage.getAllKeys'
    );
    console.log(`[AsyncStorage] Checking ${keys.length} keys`);
    const keysToRemove: string[] = [];
    
    for (const key of keys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const trimmedValue = value.trim();
          
          // Skip if it's valid base64 (encrypted data)
          if (isValidBase64(trimmedValue)) {
            console.log(`[AsyncStorage] Key ${key} is valid base64 (encrypted), skipping`);
            continue;
          }
          
          // Check for various corruption patterns
          const isCorrupted = 
            // Check for binary data and question mark corruption
            (/[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\xFF]/.test(value) || value.includes('�') || 
            (trimmedValue === '?' || /^[?\s]+$/.test(trimmedValue))) ||
            value.includes('[object') || 
            value.startsWith('object') || 
            trimmedValue === 'object' ||
            trimmedValue === 'undefined' ||
            trimmedValue === 'null' ||
            trimmedValue === 'NaN' ||
            trimmedValue === 'Infinity' ||
            trimmedValue === '-Infinity' ||
            (trimmedValue.startsWith('o') && trimmedValue.length < 10) ||
            // Check for SHA256 hash
            /^[a-f0-9]{64}$/i.test(trimmedValue) ||
            // Check for strings that are too short to be valid JSON or base64
            (trimmedValue.length > 0 && trimmedValue.length < 2 && trimmedValue !== '0' && trimmedValue !== '1') ||
            // Check for empty or EOF
            (trimmedValue === '');
            
          if (isCorrupted) {
            const preview = value.substring(0, 50).replace(/[\x00-\x1F\x80-\xFF]/g, '?');
            console.log(`[AsyncStorage] Found corrupted key: ${key}, value preview: ${preview}`);
            keysToRemove.push(key);
          }
        } else if (value === null) {
          // Remove keys with null values
          console.log(`[AsyncStorage] Found null value for key: ${key}`);
          keysToRemove.push(key);
        }
      } catch (e) {
        console.error(`[AsyncStorage] Error checking key ${key}:`, e);
        keysToRemove.push(key);
      }
    }
    
    if (keysToRemove.length > 0) {
      console.log(`[AsyncStorage] Removing ${keysToRemove.length} corrupted keys:`, keysToRemove);
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('[AsyncStorage] Corrupted keys removed successfully');
    } else {
      console.log('[AsyncStorage] No corrupted keys found');
    }
  } catch (error) {
    console.error('[AsyncStorage] Error clearing corrupted keys:', error);
    // If clearing fails, try to clear all storage as last resort
    console.error('[AsyncStorage] Attempting emergency storage clear...');
    try {
      await AsyncStorage.clear();
      console.log('[AsyncStorage] Emergency clear successful');
    } catch (clearError) {
      console.error('[AsyncStorage] Emergency clear failed:', clearError);
    }
  }
}

export async function clearAllStorage(): Promise<boolean> {
  try {
    console.log('[AsyncStorage] Clearing ALL storage...');
    await withTimeout(AsyncStorage.clear(), DEFAULT_TIMEOUT * 2, 'AsyncStorage.clear');
    console.log('[AsyncStorage] All storage cleared successfully');
    return true;
  } catch (error) {
    console.error('[AsyncStorage] Error clearing all storage:', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function getStorageStats(): Promise<StorageStats> {
  const stats: StorageStats = {
    totalKeys: 0,
    corruptedKeys: 0,
    totalSize: 0,
    lastChecked: Date.now(),
  };
  
  try {
    const keys = await AsyncStorage.getAllKeys();
    stats.totalKeys = keys.length;
    
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      const results = await AsyncStorage.multiGet(batch);
      
      for (const [, value] of results) {
        if (value) {
          stats.totalSize += value.length * 2;
          
          if (!isValidJSON(value)) {
            stats.corruptedKeys++;
          }
        }
      }
    }
  } catch (error) {
    console.error('[AsyncStorage] Error getting stats:', error instanceof Error ? error.message : error);
  }
  
  return stats;
}

export async function getAllKeys(): Promise<string[]> {
  try {
    return await withTimeout(
      AsyncStorage.getAllKeys() as Promise<string[]>,
      DEFAULT_TIMEOUT,
      'AsyncStorage.getAllKeys'
    );
  } catch (error) {
    console.error('[AsyncStorage] Error getting all keys:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function keyExists(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch {
    return false;
  }
}

export async function mergeItem<T extends object>(key: string, value: Partial<T>): Promise<boolean> {
  try {
    const existing = await safeAsyncStorageGet<T | null>(key, null);
    if (existing === null) {
      return await safeAsyncStorageSet(key, value);
    }
    
    const merged = { ...existing, ...value };
    return await safeAsyncStorageSet(key, merged);
  } catch (error) {
    console.error(`[AsyncStorage] Error merging ${key}:`, error instanceof Error ? error.message : error);
    return false;
  }
}
