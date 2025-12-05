import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export interface SafeExecuteResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 5000,
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_OPTIONS.maxRetries,
    initialDelay = DEFAULT_RETRY_OPTIONS.initialDelay,
    maxDelay = DEFAULT_RETRY_OPTIONS.maxDelay,
    backoffMultiplier = DEFAULT_RETRY_OPTIONS.backoffMultiplier,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);

      if (attempt === maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      onRetry?.(lastError, attempt);

      const jitter = Math.random() * 200;
      const actualDelay = Math.min(delay + jitter, maxDelay);
      
      console.log(`[Retry] Waiting ${Math.round(actualDelay)}ms before retry...`);
      await sleep(actualDelay);
      
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  options?: { logError?: boolean; context?: string }
): Promise<SafeExecuteResult<T>> {
  const { logError = true, context = 'unknown' } = options || {};
  
  try {
    const data = await operation();
    return { success: true, data };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    
    if (logError) {
      console.error(`[SafeExecute:${context}] Error:`, error.message);
    }
    
    return { success: false, data: fallback, error };
  }
}

export function safeExecuteSync<T>(
  operation: () => T,
  fallback: T,
  options?: { logError?: boolean; context?: string }
): T {
  const { logError = true, context = 'unknown' } = options || {};
  
  try {
    return operation();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    
    if (logError) {
      console.error(`[SafeExecuteSync:${context}] Error:`, error.message);
    }
    
    return fallback;
  }
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(timeoutMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([operation, timeoutPromise]);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

export function safeJsonParse<T>(
  json: string | null | undefined,
  fallback: T,
  options?: { logError?: boolean; context?: string }
): T {
  const { logError = false, context = 'unknown' } = options || {};
  
  if (json === null || json === undefined || json === '') {
    return fallback;
  }

  const trimmed = json.trim();
  
  if (trimmed === 'undefined' || trimmed === 'null' || trimmed === 'NaN') {
    return fallback;
  }

  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(trimmed)) {
    if (logError) {
      console.warn(`[SafeJsonParse:${context}] Binary data detected`);
    }
    return fallback;
  }

  if (trimmed.includes('[object') || trimmed.startsWith('object')) {
    if (logError) {
      console.warn(`[SafeJsonParse:${context}] Object toString detected`);
    }
    return fallback;
  }

  try {
    return JSON.parse(json);
  } catch (err) {
    if (logError) {
      console.warn(`[SafeJsonParse:${context}] Parse failed:`, (err as Error).message);
    }
    return fallback;
  }
}

export function safeJsonStringify(
  value: unknown,
  fallback: string = '{}',
  options?: { logError?: boolean; context?: string }
): string {
  const { logError = false, context = 'unknown' } = options || {};
  
  try {
    return JSON.stringify(value);
  } catch (err) {
    if (logError) {
      console.warn(`[SafeJsonStringify:${context}] Stringify failed:`, (err as Error).message);
    }
    return fallback;
  }
}

export function safeAccess<T, D>(
  accessor: () => T,
  defaultValue: D
): T | D {
  try {
    const result = accessor();
    return result === undefined || result === null ? defaultValue : result;
  } catch {
    return defaultValue;
  }
}

export function createSafeHandler<T extends (...args: any[]) => any>(
  handler: T,
  options?: { 
    onError?: (error: Error) => void;
    context?: string;
    fallbackReturn?: ReturnType<T>;
  }
): T {
  const { onError, context = 'handler', fallbackReturn } = options || {};
  
  return ((...args: Parameters<T>) => {
    try {
      const result = handler(...args);
      
      if (result instanceof Promise) {
        return result.catch((err: unknown) => {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error(`[SafeHandler:${context}] Async error:`, error.message);
          onError?.(error);
          return fallbackReturn;
        });
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[SafeHandler:${context}] Sync error:`, error.message);
      onError?.(error);
      return fallbackReturn;
    }
  }) as T;
}

export function isValidArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isValidObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function validateData<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  fallback: T
): T {
  return validator(data) ? data : fallback;
}

export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
}

export function useSafeState<T>(
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const mountedRef = useRef(true);

  const safeSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, safeSetState];
}

export function createCircuitBreaker(options: {
  failureThreshold?: number;
  resetTimeout?: number;
  onStateChange?: (state: 'closed' | 'open' | 'half-open') => void;
}) {
  const { failureThreshold = 5, resetTimeout = 30000, onStateChange } = options;
  
  let failures = 0;
  let state: 'closed' | 'open' | 'half-open' = 'closed';
  let lastFailureTime = 0;

  const changeState = (newState: 'closed' | 'open' | 'half-open') => {
    if (state !== newState) {
      console.log(`[CircuitBreaker] State change: ${state} -> ${newState}`);
      state = newState;
      onStateChange?.(newState);
    }
  };

  return {
    async execute<T>(operation: () => Promise<T>): Promise<T> {
      if (state === 'open') {
        if (Date.now() - lastFailureTime >= resetTimeout) {
          changeState('half-open');
        } else {
          throw new Error('Circuit breaker is open');
        }
      }

      try {
        const result = await operation();
        
        if (state === 'half-open') {
          changeState('closed');
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        if (failures >= failureThreshold) {
          changeState('open');
        }

        throw error;
      }
    },
    
    getState: () => state,
    reset: () => {
      failures = 0;
      changeState('closed');
    },
  };
}

export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function isPlatformWeb(): boolean {
  return Platform.OS === 'web';
}

export function isPlatformIOS(): boolean {
  return Platform.OS === 'ios';
}

export function isPlatformAndroid(): boolean {
  return Platform.OS === 'android';
}

export function runOnPlatform<T>(handlers: {
  ios?: () => T;
  android?: () => T;
  web?: () => T;
  default?: () => T;
}): T | undefined {
  const platform = Platform.OS;
  
  if (platform === 'ios' && handlers.ios) {
    return handlers.ios();
  }
  if (platform === 'android' && handlers.android) {
    return handlers.android();
  }
  if (platform === 'web' && handlers.web) {
    return handlers.web();
  }
  if (handlers.default) {
    return handlers.default();
  }
  
  return undefined;
}
