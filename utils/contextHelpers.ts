import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export type ContextState<T> = {
  data: T;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
};

export interface ResilientContextOptions<T> {
  timeout?: number;
  retries?: number;
  staleTime?: number;
  refetchOnFocus?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
  validateData?: (data: T) => boolean;
}

export interface ResilientContextResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  reload: () => Promise<void>;
  reset: () => void;
}

export function useResilientContext<T>(
  initialValue: T,
  loadFunction: () => Promise<T>,
  options: ResilientContextOptions<T> = {}
): ResilientContextResult<T> {
  const { 
    timeout = 10000, 
    retries = 3, 
    staleTime = 5 * 60 * 1000,
    refetchOnFocus = false,
    onError,
    onSuccess,
    validateData,
  } = options;
  
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const mountedRef = useRef(true);
  const lastFetchTimeRef = useRef<number>(0);
  const initialValueRef = useRef(initialValue);

  const loadWithTimeout = useCallback(
    async (attempt: number = 0): Promise<void> => {
      try {
        if (mountedRef.current) {
          setIsLoading(true);
          setError(null);
        }

        const timeoutId = setTimeout(() => {
          if (mountedRef.current) {
            setError(new Error('Context initialization timeout'));
            setIsLoading(false);
          }
        }, timeout);

        try {
          const result = await loadFunction();
          clearTimeout(timeoutId);
          
          if (!mountedRef.current) return;

          if (validateData && !validateData(result)) {
            throw new Error('Data validation failed');
          }

          setData(result);
          setIsStale(false);
          lastFetchTimeRef.current = Date.now();
          
          console.log('[ContextHelper] Data loaded successfully');
          onSuccess?.(result);
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      } catch (err) {
        const loadError = err instanceof Error ? err : new Error(String(err));
        console.error('[ContextHelper] Load error:', loadError.message);

        if (!mountedRef.current) return;

        if (attempt < retries - 1) {
          const delay = Math.min(500 * Math.pow(2, attempt), 5000);
          console.log(`[ContextHelper] Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return loadWithTimeout(attempt + 1);
        }

        setError(loadError);
        setData(initialValueRef.current);
        onError?.(loadError);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [loadFunction, timeout, retries, onError, onSuccess, validateData]
  );

  const reload = useCallback(async () => {
    lastFetchTimeRef.current = 0;
    await loadWithTimeout(0);
  }, [loadWithTimeout]);

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setData(initialValueRef.current);
      setError(null);
      setIsStale(true);
    }
    lastFetchTimeRef.current = 0;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadWithTimeout(0);
    
    return () => {
      mountedRef.current = false;
    };
  }, [loadWithTimeout]);

  useEffect(() => {
    const staleCheckInterval = setInterval(() => {
      if (lastFetchTimeRef.current > 0 && Date.now() - lastFetchTimeRef.current > staleTime) {
        if (mountedRef.current) {
          setIsStale(true);
        }
      }
    }, 60000);

    return () => clearInterval(staleCheckInterval);
  }, [staleTime]);

  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isStale && mountedRef.current) {
        console.log('[ContextHelper] App became active with stale data, refetching...');
        loadWithTimeout(0);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [refetchOnFocus, isStale, loadWithTimeout]);

  return { data, isLoading, error, isStale, reload, reset };
}

export interface SafeContextResult<T> {
  data: T;
  error: Error | null;
  isValid: boolean;
}

export function createSafeContext<T>(
  defaultValue: T,
  contextName: string = 'Context'
): SafeContextResult<T> {
  try {
    return {
      data: defaultValue,
      error: null,
      isValid: true,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[${contextName}] Initialization error:`, error.message);
    return {
      data: defaultValue,
      error,
      isValid: false,
    };
  }
}

export function useContextWithFallback<T>(contextValue: T | undefined, fallback: T): T {
  return contextValue ?? fallback;
}

export function useDeferredValue<T>(value: T, delay: number = 100): T {
  const [deferredValue, setDeferredValue] = useState(value);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDeferredValue(value);
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [value, delay]);
  
  return deferredValue;
}

export function useSafeCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  options?: { onError?: (error: Error) => void; context?: string }
): T {
  const { onError, context = 'callback' } = options || {};
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  return useCallback(
    ((...args: Parameters<T>) => {
      try {
        const result = callbackRef.current(...args);
        
        if (result instanceof Promise) {
          return result.catch((err: unknown) => {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(`[SafeCallback:${context}] Async error:`, error.message);
            onError?.(error);
            return undefined;
          });
        }
        
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[SafeCallback:${context}] Sync error:`, error.message);
        onError?.(error);
        return undefined;
      }
    }) as T,
    [context, onError]
  );
}

export function useMemoWithFallback<T>(
  factory: () => T,
  fallback: T
): T {
  const factoryRef = useRef(factory);
  factoryRef.current = factory;
  
  return useMemo(() => {
    try {
      return factoryRef.current();
    } catch (err) {
      console.error('[MemoWithFallback] Error:', err instanceof Error ? err.message : err);
      return fallback;
    }
  }, [fallback]);
}

export function validateContextData<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  defaultValue: T
): T {
  try {
    if (validator(data)) {
      return data;
    }
    console.warn('[ValidateContextData] Data validation failed, using default');
    return defaultValue;
  } catch (err) {
    console.error('[ValidateContextData] Error:', err instanceof Error ? err.message : err);
    return defaultValue;
  }
}

export function useSafeState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((value: T | ((prev: T) => T)) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, safeSetState];
}

export function useIsMounted(): () => boolean {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
}
