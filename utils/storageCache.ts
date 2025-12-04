export const storageCache = new Map<string, string | null>();

export const setStorageCache = (key: string, value: string | null) => {
  storageCache.set(key, value);
};

export const getStorageCache = (key: string): string | null | undefined => {
  return storageCache.get(key);
};

export const hasStorageCache = (key: string): boolean => {
  return storageCache.has(key);
};

export const clearStorageCache = () => {
  storageCache.clear();
};

export const populateStorageCache = (items: readonly [string, string | null][]) => {
  items.forEach(([key, value]) => {
    storageCache.set(key, value);
  });
};
