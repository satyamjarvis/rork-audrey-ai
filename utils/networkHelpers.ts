export type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
};

export function useNetworkState(): NetworkState {
  return {
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  };
}

export async function waitForNetwork(timeout: number = 30000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (Date.now() - startTime >= timeout) {
      return false;
    }
  }

  return true;
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed:`, error);

      if (attempt === maxRetries - 1 || !shouldRetry(lastError)) {
        throw lastError;
      }

      console.log('[Retry] Waiting before next attempt...');
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

export function isNetworkError(error: Error): boolean {
  const networkErrorPatterns = [
    /network/i,
    /timeout/i,
    /connection/i,
    /fetch/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
  ];

  return networkErrorPatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.name)
  );
}

export async function safeNetworkRequest<T>(
  request: () => Promise<T>,
  fallback: T,
  options: {
    timeout?: number;
    retries?: number;
    onError?: (error: Error) => void;
  } = {}
): Promise<T> {
  const { timeout = 15000, retries = 3, onError } = options;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    );

    const result = await retryWithBackoff(
      () => Promise.race([request(), timeoutPromise]),
      {
        maxRetries: retries,
        shouldRetry: (error) => isNetworkError(error),
      }
    );

    return result;
  } catch (error) {
    console.error('[SafeNetworkRequest] Error:', error);
    onError?.(error as Error);
    return fallback;
  }
}
