import { useState, useEffect, useCallback } from 'react';

export type ContextState<T> = {
  data: T;
  isLoading: boolean;
  error: Error | null;
};

export function useResilientContext<T>(
  initialValue: T,
  loadFunction: () => Promise<T>,
  options: {
    timeout?: number;
    retries?: number;
    onError?: (error: Error) => void;
  } = {}
): {
  data: T;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
} {
  const { timeout = 10000, retries = 3, onError } = options;
  
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadWithTimeout = useCallback(
    async (attempt: number = 0): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Context initialization timeout')), timeout)
        );

        const result = await Promise.race([
          loadFunction(),
          timeoutPromise,
        ]);

        setData(result);
        console.log('[ContextHelper] Data loaded successfully');
      } catch (err) {
        const error = err as Error;
        console.error('[ContextHelper] Load error:', error);

        if (attempt < retries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`[ContextHelper] Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return loadWithTimeout(attempt + 1);
        }

        setError(error);
        setData(initialValue);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [loadFunction, timeout, retries, initialValue, onError]
  );

  const reload = useCallback(async () => {
    await loadWithTimeout(0);
  }, [loadWithTimeout]);

  useEffect(() => {
    loadWithTimeout(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, isLoading, error, reload };
}

export function createSafeContext<T>(
  defaultValue: T,
  contextName: string = 'Context'
): {
  data: T;
  error: Error | null;
} {
  try {
    return {
      data: defaultValue,
      error: null,
    };
  } catch (err) {
    console.error(`[${contextName}] Initialization error:`, err);
    return {
      data: defaultValue,
      error: err as Error,
    };
  }
}
