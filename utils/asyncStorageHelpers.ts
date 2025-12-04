import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;

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
      trimmed.startsWith('o') && trimmed.length < 10) {
    console.error('[AsyncStorage] Detected object stringification issue:', trimmed.substring(0, 50));
    return false;
  }
  
  // Check for SHA256 hash (64 hex characters) which was used erroneously for encryption
  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    console.error('[AsyncStorage] Detected SHA256 hash (corrupted data), cannot parse as JSON');
    return false;
  }
  
  // Check for hex strings that look like numbers but aren't valid JSON numbers
  // Valid JSON number: -?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?
  // If it starts with a digit but has letters other than e/E, it's corrupted (likely a hash)
  if (/^[0-9]/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && !/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    console.error('[AsyncStorage] Detected invalid number format (likely hex/hash):', trimmed.substring(0, 50));
    return false;
  }
  
  // Check for other common non-JSON strings
  if (trimmed === 'NaN' || trimmed === 'Infinity' || trimmed === '-Infinity') {
    return false;
  }
  
  // Check if it starts with a lowercase letter followed by non-JSON chars (like "object")
  if (/^[a-z]/.test(trimmed) && !trimmed.startsWith('true') && !trimmed.startsWith('false') && !trimmed.startsWith('null')) {
    console.error('[AsyncStorage] Detected non-JSON string starting with lowercase:', trimmed.substring(0, 50));
    return false;
  }
  
  // Must start with valid JSON characters
  const firstChar = trimmed[0];
  if (!firstChar || (firstChar !== '{' && firstChar !== '[' && firstChar !== '"' && !/[0-9\-tf]/.test(firstChar))) {
    console.error('[AsyncStorage] Invalid first character:', firstChar, 'Full:', trimmed.substring(0, 50));
    return false;
  }
  
  // Additional check: valid JSON must also end with proper characters
  const lastChar = trimmed[trimmed.length - 1];
  if (!lastChar || (lastChar !== '}' && lastChar !== ']' && lastChar !== '"' && !/[0-9esE]/.test(lastChar))) {
    console.error('[AsyncStorage] Invalid last character:', lastChar, 'Full:', trimmed.substring(0, 50));
    return false;
  }
  
  try {
    JSON.parse(str);
    return true;
  } catch (e: any) {
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
  maxRetries: number = MAX_RETRIES,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[AsyncStorage] Retry attempt ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`[AsyncStorage] Attempt ${attempt + 1} failed:`, error);
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
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
    
    return await retryOperation(operation);
  } catch (error) {
    console.error(`[AsyncStorage] Error reading ${key}:`, error);
    return defaultValue;
  }
}

export async function safeAsyncStorageSet<T>(key: string, value: T): Promise<void> {
  try {
    const operation = async () => {
      await withTimeout(
        AsyncStorage.setItem(key, JSON.stringify(value)),
        DEFAULT_TIMEOUT,
        'AsyncStorage.setItem'
      );
    };
    
    await retryOperation(operation);
  } catch (error) {
    console.error(`[AsyncStorage] Error writing ${key}:`, error);
    throw error;
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
          // Check for various corruption patterns
          const trimmedValue = value.trim();
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
            // Check if starts with lowercase letter (like "object") but not json keywords
            (/^[a-z]/.test(trimmedValue) && !trimmedValue.startsWith('true') && !trimmedValue.startsWith('false') && !trimmedValue.startsWith('null')) ||
            // Check for strings that are too short to be valid JSON
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

export async function clearAllStorage(): Promise<void> {
  try {
    console.log('[AsyncStorage] Clearing ALL storage...');
    await AsyncStorage.clear();
    console.log('[AsyncStorage] All storage cleared successfully');
  } catch (error) {
    console.error('[AsyncStorage] Error clearing all storage:', error);
  }
}
