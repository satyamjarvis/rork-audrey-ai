import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

export type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  lastChecked: number;
};

const networkState: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  type: 'unknown',
  lastChecked: Date.now(),
};

const listeners: Set<(state: NetworkState) => void> = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener({ ...networkState }));
}

export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return navigator.onLine;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok || response.status === 204;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  } catch {
    return true;
  }
}

export function useNetworkState(): NetworkState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<NetworkState>(networkState);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const isConnected = await checkNetworkConnectivity();
    const newState: NetworkState = {
      ...networkState,
      isConnected,
      isInternetReachable: isConnected,
      lastChecked: Date.now(),
    };
    
    Object.assign(networkState, newState);
    
    if (mountedRef.current) {
      setState(newState);
    }
    
    notifyListeners();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    const listener = (newState: NetworkState) => {
      if (mountedRef.current) {
        setState(newState);
      }
    };
    
    listeners.add(listener);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        Object.assign(networkState, { isConnected: true, isInternetReachable: true });
        notifyListeners();
      };
      const handleOffline = () => {
        Object.assign(networkState, { isConnected: false, isInternetReachable: false });
        notifyListeners();
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        mountedRef.current = false;
        listeners.delete(listener);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refresh();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    refresh();

    return () => {
      mountedRef.current = false;
      listeners.delete(listener);
      subscription?.remove();
    };
  }, [refresh]);

  return { ...state, refresh };
}

export async function waitForNetwork(timeout: number = 30000): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 2000;

  while (Date.now() - startTime < timeout) {
    const isConnected = await checkNetworkConnectivity();
    if (isConnected) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  return false;
}

export interface RetryWithBackoffOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  abortSignal?: AbortSignal;
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryWithBackoffOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
    abortSignal,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (abortSignal?.aborted) {
      throw new Error('Operation aborted');
    }
    
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);

      if (attempt === maxRetries - 1 || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      const jitter = Math.random() * 500;
      const actualDelay = Math.min(delay + jitter, maxDelay);
      
      onRetry?.(lastError, attempt, actualDelay);
      
      console.log(`[Retry] Waiting ${Math.round(actualDelay)}ms before attempt ${attempt + 2}...`);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
      
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

export function isNetworkError(error: Error | unknown): boolean {
  if (!error) return false;
  
  const errorObj = error instanceof Error ? error : { message: String(error), name: '' };
  const message = errorObj.message || '';
  const name = errorObj.name || '';
  
  const networkErrorPatterns = [
    /network/i,
    /timeout/i,
    /connection/i,
    /fetch/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
    /ENETUNREACH/i,
    /EHOSTUNREACH/i,
    /abort/i,
    /cancelled/i,
    /canceled/i,
    /offline/i,
  ];

  return networkErrorPatterns.some(pattern => 
    pattern.test(message) || pattern.test(name)
  );
}

export function isTimeoutError(error: Error | unknown): boolean {
  if (!error) return false;
  
  const message = error instanceof Error ? error.message : String(error);
  return /timeout/i.test(message) || /ETIMEDOUT/i.test(message);
}

export function isAbortError(error: Error | unknown): boolean {
  if (!error) return false;
  
  const errorObj = error instanceof Error ? error : { name: '', message: String(error) };
  return errorObj.name === 'AbortError' || /abort/i.test(errorObj.message);
}

export function categorizeError(error: Error | unknown): 'network' | 'timeout' | 'abort' | 'server' | 'client' | 'unknown' {
  if (isAbortError(error)) return 'abort';
  if (isTimeoutError(error)) return 'timeout';
  if (isNetworkError(error)) return 'network';
  
  const message = error instanceof Error ? error.message : String(error);
  
  if (/5\d{2}/i.test(message)) return 'server';
  if (/4\d{2}/i.test(message)) return 'client';
  
  return 'unknown';
}

export interface SafeNetworkRequestOptions<T> {
  timeout?: number;
  retries?: number;
  onError?: (error: Error) => void;
  onRetry?: (error: Error, attempt: number) => void;
  abortSignal?: AbortSignal;
  validateResponse?: (data: T) => boolean;
  fallbackOnValidationFail?: boolean;
}

export interface SafeNetworkResult<T> {
  data: T;
  success: boolean;
  error?: Error;
  retries: number;
}

export async function safeNetworkRequest<T>(
  request: () => Promise<T>,
  fallback: T,
  options: SafeNetworkRequestOptions<T> = {}
): Promise<T> {
  const { 
    timeout = 15000, 
    retries = 3, 
    onError, 
    onRetry,
    abortSignal,
    validateResponse,
    fallbackOnValidationFail = true,
  } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }

    const result = await retryWithBackoff(
      async () => {
        if (controller.signal.aborted) {
          throw new Error('Request timeout');
        }
        
        const response = await request();
        
        if (validateResponse && !validateResponse(response)) {
          if (fallbackOnValidationFail) {
            console.warn('[SafeNetworkRequest] Response validation failed, using fallback');
            return fallback;
          }
          throw new Error('Response validation failed');
        }
        
        return response;
      },
      {
        maxRetries: retries,
        shouldRetry: (error) => isNetworkError(error) && !isAbortError(error),
        onRetry: onRetry,
        abortSignal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[SafeNetworkRequest] Error:', err.message);
    onError?.(err);
    return fallback;
  }
}

export async function safeNetworkRequestWithResult<T>(
  request: () => Promise<T>,
  fallback: T,
  options: SafeNetworkRequestOptions<T> = {}
): Promise<SafeNetworkResult<T>> {
  let retriesCount = 0;
  
  const enhancedOptions = {
    ...options,
    onRetry: (error: Error, attempt: number) => {
      retriesCount = attempt + 1;
      options.onRetry?.(error, attempt);
    },
  };

  try {
    const data = await safeNetworkRequest(request, fallback, enhancedOptions);
    return {
      data,
      success: data !== fallback,
      retries: retriesCount,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      data: fallback,
      success: false,
      error: err,
      retries: retriesCount,
    };
  }
}

export function createFetchWithTimeout(
  baseTimeout: number = 10000
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), baseTimeout);
    
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit & RetryWithBackoffOptions = {}
): Promise<Response> {
  const { maxRetries, initialDelay, maxDelay, backoffMultiplier, shouldRetry, onRetry, ...fetchOptions } = options;
  
  return retryWithBackoff(
    () => fetch(url, fetchOptions),
    {
      maxRetries,
      initialDelay,
      maxDelay,
      backoffMultiplier,
      shouldRetry: shouldRetry || ((error) => isNetworkError(error)),
      onRetry,
    }
  );
}
