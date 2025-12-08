import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIDEO_STORAGE_KEY = '@learn_video_cache';
const THUMBNAIL_STORAGE_KEY = '@learn_thumbnail_cache';

type MediaCacheEntry = {
  originalUri: string;
  cachedUri: string;
  timestamp: number;
  size?: number;
};

type MediaCache = {
  [id: string]: MediaCacheEntry;
};



export const initializeVideoStorage = async () => {
  console.log('[VideoStorage] Using URL-based storage for all platforms');
  return;
};

const loadMediaCache = async (key: string): Promise<MediaCache> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('[VideoStorage] Error loading cache:', error);
  }
  return {};
};

const saveMediaCache = async (key: string, cache: MediaCache) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(cache));
  } catch (error) {
    console.error('[VideoStorage] Error saving cache:', error);
  }
};

export const saveVideoToFileSystem = async (
  videoUri: string,
  videoId: string
): Promise<string | null> => {
  try {
    console.log(`[VideoStorage] Saving video ${videoId} from ${videoUri.substring(0, 50)}...`);

    if (Platform.OS === 'web') {
      const cache = await loadMediaCache(VIDEO_STORAGE_KEY);
      cache[videoId] = {
        originalUri: videoUri,
        cachedUri: videoUri,
        timestamp: Date.now(),
      };
      await saveMediaCache(VIDEO_STORAGE_KEY, cache);
      console.log(`[VideoStorage] Web: Stored video reference for ${videoId}`);
      return videoUri;
    }

    if (videoUri.startsWith('http://') || videoUri.startsWith('https://')) {
      const cache = await loadMediaCache(VIDEO_STORAGE_KEY);
      cache[videoId] = {
        originalUri: videoUri,
        cachedUri: videoUri,
        timestamp: Date.now(),
      };
      await saveMediaCache(VIDEO_STORAGE_KEY, cache);
      console.log(`[VideoStorage] Stored URL video reference for ${videoId}`);
      return videoUri;
    }

    const cache = await loadMediaCache(VIDEO_STORAGE_KEY);
    cache[videoId] = {
      originalUri: videoUri,
      cachedUri: videoUri,
      timestamp: Date.now(),
    };
    await saveMediaCache(VIDEO_STORAGE_KEY, cache);
    console.log(`[VideoStorage] Stored local video reference for ${videoId}`);
    return videoUri;
  } catch (error) {
    console.error('[VideoStorage] Error saving video:', error);
    const cache = await loadMediaCache(VIDEO_STORAGE_KEY);
    cache[videoId] = {
      originalUri: videoUri,
      cachedUri: videoUri,
      timestamp: Date.now(),
    };
    await saveMediaCache(VIDEO_STORAGE_KEY, cache);
    return videoUri;
  }
};

export const saveThumbnailToFileSystem = async (
  thumbnailUri: string,
  videoId: string
): Promise<string | null> => {
  try {
    console.log(`[VideoStorage] Saving thumbnail for ${videoId}`);

    if (Platform.OS === 'web') {
      const cache = await loadMediaCache(THUMBNAIL_STORAGE_KEY);
      cache[videoId] = {
        originalUri: thumbnailUri,
        cachedUri: thumbnailUri,
        timestamp: Date.now(),
      };
      await saveMediaCache(THUMBNAIL_STORAGE_KEY, cache);
      return thumbnailUri;
    }

    if (thumbnailUri.startsWith('http://') || thumbnailUri.startsWith('https://')) {
      const cache = await loadMediaCache(THUMBNAIL_STORAGE_KEY);
      cache[videoId] = {
        originalUri: thumbnailUri,
        cachedUri: thumbnailUri,
        timestamp: Date.now(),
      };
      await saveMediaCache(THUMBNAIL_STORAGE_KEY, cache);
      return thumbnailUri;
    }

    const cache = await loadMediaCache(THUMBNAIL_STORAGE_KEY);
    cache[videoId] = {
      originalUri: thumbnailUri,
      cachedUri: thumbnailUri,
      timestamp: Date.now(),
    };
    await saveMediaCache(THUMBNAIL_STORAGE_KEY, cache);
    console.log(`[VideoStorage] Stored local thumbnail reference for ${videoId}`);
    return thumbnailUri;
  } catch (error) {
    console.error('[VideoStorage] Error saving thumbnail:', error);
    const cache = await loadMediaCache(THUMBNAIL_STORAGE_KEY);
    cache[videoId] = {
      originalUri: thumbnailUri,
      cachedUri: thumbnailUri,
      timestamp: Date.now(),
    };
    await saveMediaCache(THUMBNAIL_STORAGE_KEY, cache);
    return thumbnailUri;
  }
};

export const deleteVideoFromFileSystem = async (videoUri: string) => {
  try {
    console.log('[VideoStorage] Delete request for video:', videoUri.substring(0, 50));
  } catch (error) {
    console.error('[VideoStorage] Error deleting video:', error);
  }
};

export const deleteThumbnailFromFileSystem = async (thumbnailUri: string) => {
  try {
    console.log('[VideoStorage] Delete request for thumbnail:', thumbnailUri.substring(0, 50));
  } catch (error) {
    console.error('[VideoStorage] Error deleting thumbnail:', error);
  }
};

export const checkVideoExists = async (videoUri: string): Promise<boolean> => {
  try {
    if (!videoUri) return false;

    if (videoUri.startsWith('http://') || videoUri.startsWith('https://')) {
      return true;
    }

    if (Platform.OS === 'web') {
      return true;
    }

    return true;
  } catch (error) {
    console.error('[VideoStorage] Error checking video:', error);
    return false;
  }
};

export const getVideoFromCache = async (videoId: string): Promise<string | null> => {
  try {
    const cache = await loadMediaCache(VIDEO_STORAGE_KEY);
    const entry = cache[videoId];
    if (entry) {
      const exists = await checkVideoExists(entry.cachedUri);
      if (exists) {
        return entry.cachedUri;
      }
      if (entry.originalUri !== entry.cachedUri) {
        return entry.originalUri;
      }
    }
    return null;
  } catch (error) {
    console.error('[VideoStorage] Error getting video from cache:', error);
    return null;
  }
};

export const getThumbnailFromCache = async (videoId: string): Promise<string | null> => {
  try {
    const cache = await loadMediaCache(THUMBNAIL_STORAGE_KEY);
    const entry = cache[videoId];
    if (entry) {
      return entry.cachedUri;
    }
    return null;
  } catch (error) {
    console.error('[VideoStorage] Error getting thumbnail from cache:', error);
    return null;
  }
};

export const cleanupOrphanedVideos = async (activeVideoIds: string[]) => {
  try {
    if (Platform.OS === 'web') {
      console.log('[VideoStorage] Web platform - skipping cleanup');
      return;
    }

    const videoCache = await loadMediaCache(VIDEO_STORAGE_KEY);
    const thumbnailCache = await loadMediaCache(THUMBNAIL_STORAGE_KEY);

    const activeSet = new Set(activeVideoIds);

    for (const [id, entry] of Object.entries(videoCache)) {
      if (!activeSet.has(id)) {
        await deleteVideoFromFileSystem(entry.cachedUri);
        delete videoCache[id];
        console.log(`[VideoStorage] Cleaned up orphaned video: ${id}`);
      }
    }

    for (const [id, entry] of Object.entries(thumbnailCache)) {
      if (!activeSet.has(id)) {
        await deleteThumbnailFromFileSystem(entry.cachedUri);
        delete thumbnailCache[id];
        console.log(`[VideoStorage] Cleaned up orphaned thumbnail: ${id}`);
      }
    }

    await saveMediaCache(VIDEO_STORAGE_KEY, videoCache);
    await saveMediaCache(THUMBNAIL_STORAGE_KEY, thumbnailCache);
  } catch (error) {
    console.error('[VideoStorage] Error cleaning up videos:', error);
  }
};

export const getStorageStats = async (): Promise<{ videoCount: number; thumbnailCount: number }> => {
  try {
    const videoCache = await loadMediaCache(VIDEO_STORAGE_KEY);
    const thumbnailCache = await loadMediaCache(THUMBNAIL_STORAGE_KEY);
    
    return {
      videoCount: Object.keys(videoCache).length,
      thumbnailCount: Object.keys(thumbnailCache).length,
    };
  } catch (error) {
    console.error('[VideoStorage] Error getting storage stats:', error);
    return { videoCount: 0, thumbnailCount: 0 };
  }
};
