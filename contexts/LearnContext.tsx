import { isValidJSON } from "@/utils/asyncStorageHelpers";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

type VideoItem = {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  isLocked: boolean;
  description?: string;
  previewType?: 'still' | 'loop' | 'custom';
  customThumbnail?: string;
  isUrlVideo?: boolean;
  originalUrl?: string;
};

type CourseCategory = {
  id: string;
  title: string;
  icon: string; // Store icon name as string for persistence
  color: string;
  videos: VideoItem[];
  isSubscriptionRequired: boolean;
};

type MainPageMediaSection = {
  url?: string;
  title?: string;
  description?: string;
};

type MainPageMedia = {
  hero?: MainPageMediaSection;
  intro?: MainPageMediaSection;
  featured?: MainPageMediaSection;
};

const STORAGE_KEY = "@learn_data";
const MAIN_MEDIA_KEY = "@learn_main_media";
const STORAGE_VERSION = "1.1";

export const [LearnContext, useLearn] = createContextHook(() => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [mainPageMedia, setMainPageMedia] = useState<MainPageMedia>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());

  // Load data from AsyncStorage with validation
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        
        // Check for corrupted data before processing
        if (stored) {
          const trimmed = stored.trim();
          
          // Detect common corruption patterns
          if (trimmed === 'object' || 
              trimmed === 'undefined' || 
              trimmed === '[object Object]' || 
              trimmed.startsWith('o') && trimmed.length < 10) {
            console.error('[LearnContext] Corrupted data detected, clearing:', trimmed.substring(0, 50));
            await AsyncStorage.removeItem(STORAGE_KEY);
            setCategories([]);
            setHasInitialized(true);
            setIsLoading(false);
            return;
          }
        }
        
        if (stored && isValidJSON(stored)) {
          try {
            const parsedData = JSON.parse(stored);
            // Validate data structure
            if (parsedData && parsedData.categories && Array.isArray(parsedData.categories)) {
              // Ensure each category has required fields
              const validCategories = parsedData.categories.filter((cat: any) => 
                cat && typeof cat === 'object' && cat.id && cat.title && Array.isArray(cat.videos)
              );
              setCategories(validCategories);
              console.log(`Loaded ${validCategories.length} categories from storage`);
            } else {
              console.warn("Invalid data structure in storage, using empty state");
              setCategories([]);
            }
          } catch (parseError) {
            console.error("Failed to parse stored data:", parseError);
            // Clear corrupt data
            await AsyncStorage.removeItem(STORAGE_KEY);
            setCategories([]);
          }
        } else if (stored) {
          // Data exists but is not valid JSON - corruption detected
          console.error('[LearnContext] Invalid JSON in storage, clearing corrupted data');
          await AsyncStorage.removeItem(STORAGE_KEY);
          setCategories([]);
        } else {
          console.log("No stored data found, starting fresh");
        }

        const mediaStored = await AsyncStorage.getItem(MAIN_MEDIA_KEY);
        
        // Check for corrupted media data
        if (mediaStored) {
          const trimmedMedia = mediaStored.trim();
          if (trimmedMedia === 'object' || 
              trimmedMedia === 'undefined' || 
              trimmedMedia === '[object Object]' || 
              trimmedMedia.startsWith('o') && trimmedMedia.length < 10) {
            console.error('[LearnContext] Corrupted media data detected, clearing');
            await AsyncStorage.removeItem(MAIN_MEDIA_KEY);
            setMainPageMedia({});
          } else if (isValidJSON(mediaStored)) {
            try {
              const parsedMedia = JSON.parse(mediaStored);
              // Validate media structure
              if (parsedMedia && typeof parsedMedia === 'object') {
                const validMedia: MainPageMedia = {};
                
                if (parsedMedia.hero && typeof parsedMedia.hero === 'object') {
                  validMedia.hero = {
                    url: parsedMedia.hero.url || undefined,
                    title: parsedMedia.hero.title || undefined,
                    description: parsedMedia.hero.description || undefined,
                  };
                }
                
                if (parsedMedia.intro && typeof parsedMedia.intro === 'object') {
                  validMedia.intro = {
                    url: parsedMedia.intro.url || undefined,
                    title: parsedMedia.intro.title || undefined,
                    description: parsedMedia.intro.description || undefined,
                  };
                }
                
                if (parsedMedia.featured && typeof parsedMedia.featured === 'object') {
                  validMedia.featured = {
                    url: parsedMedia.featured.url || undefined,
                    title: parsedMedia.featured.title || undefined,
                    description: parsedMedia.featured.description || undefined,
                  };
                }
                
                setMainPageMedia(validMedia);
                console.log(`[LearnContext] Loaded main page media from storage:`, Object.keys(validMedia));
              } else {
                console.warn('[LearnContext] Invalid media structure, using empty state');
                setMainPageMedia({});
              }
            } catch (parseError) {
              console.error("Failed to parse media data:", parseError);
              await AsyncStorage.removeItem(MAIN_MEDIA_KEY);
              setMainPageMedia({});
            }
          } else {
            console.error('[LearnContext] Invalid media JSON, clearing');
            await AsyncStorage.removeItem(MAIN_MEDIA_KEY);
            setMainPageMedia({});
          }
        } else {
          console.log('[LearnContext] No main page media found in storage');
        }

        setHasInitialized(true);
      } catch (error) {
        console.error("Failed to load learn data:", error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data to AsyncStorage with debouncing and error recovery
  useEffect(() => {
    if (!hasInitialized) return;

    const saveData = async () => {
      try {
        const dataToSave = { 
          categories,
          lastUpdated: Date.now(),
          version: "1.0"
        };
        
        const jsonData = JSON.stringify(dataToSave);
        
        // Check if data is too large (AsyncStorage has a limit)
        if (jsonData.length > 2000000) { // 2MB limit safety
          console.warn("Data size is large, consider optimization");
        }
        
        await AsyncStorage.setItem(STORAGE_KEY, jsonData);
        setLastSaveTime(Date.now());
        console.log(`Successfully saved ${categories.length} categories`);
      } catch (error) {
        console.error("Failed to save learn data:", error);
        
        // Try to recover by clearing and re-saving
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
          const minimalData = { categories: categories.slice(0, 10) }; // Save first 10 categories as fallback
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(minimalData));
          console.warn("Saved partial data due to storage issues");
        } catch (recoveryError) {
          console.error("Failed to recover storage:", recoveryError);
        }
      }
    };

    // Debounce saves to avoid too frequent writes
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [categories, hasInitialized]);

  const updateCategory = useCallback(async (categoryId: string, updatedCategory: Partial<CourseCategory>) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, ...updatedCategory } : cat
      )
    );
  }, []);

  const updateVideo = useCallback(async (categoryId: string, videoId: string, updatedVideo: Partial<VideoItem>) => {
    console.log(`[LearnContext] Updating video ${videoId} in category ${categoryId}:`, updatedVideo);
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              videos: cat.videos.map((vid) =>
                vid.id === videoId ? { ...vid, ...updatedVideo } : vid
              ),
            }
          : cat
      )
    );
  }, []);

  const addVideo = useCallback(async (categoryId: string, video: VideoItem) => {
    console.log(`[LearnContext] Adding video to category ${categoryId}:`, video.title);
    setCategories((prev) => {
      const updated = prev.map((cat) =>
        cat.id === categoryId ? { ...cat, videos: [...cat.videos, video] } : cat
      );
      console.log(`[LearnContext] Category ${categoryId} now has ${updated.find(c => c.id === categoryId)?.videos.length || 0} videos`);
      return updated;
    });
  }, []);

  const removeVideo = useCallback(async (categoryId: string, videoId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, videos: cat.videos.filter((vid) => vid.id !== videoId) }
          : cat
      )
    );
  }, []);

  const initializeDefaultCategories = useCallback((defaultCategories: CourseCategory[]) => {
    // Only initialize if no categories exist
    if (categories.length === 0) {
      setCategories(defaultCategories);
    }
  }, [categories.length]);

  // Save main page media with immediate persistence
  const updateMainPageMedia = useCallback(async (section: 'hero' | 'intro' | 'featured', data: MainPageMediaSection) => {
    try {
      setMainPageMedia((prev) => {
        const updated = { 
          ...prev, 
          [section]: data,
          _lastUpdated: Date.now(),
          _version: STORAGE_VERSION
        };
        
        // Immediate async save with retry logic
        const saveMedia = async () => {
          try {
            const jsonData = JSON.stringify(updated);
            await AsyncStorage.setItem(MAIN_MEDIA_KEY, jsonData);
            console.log(`[LearnContext] Successfully saved main page media for section: ${section}`);
          } catch (saveError) {
            console.error("[LearnContext] Failed to save main page media:", saveError);
            // Retry once after a short delay
            setTimeout(async () => {
              try {
                await AsyncStorage.setItem(MAIN_MEDIA_KEY, JSON.stringify(updated));
                console.log(`[LearnContext] Retry successful for main page media`);
              } catch (retryError) {
                console.error("[LearnContext] Retry failed for main page media:", retryError);
              }
            }, 1000);
          }
        };
        
        saveMedia();
        return updated;
      });
    } catch (error) {
      console.error("[LearnContext] Error in updateMainPageMedia:", error);
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(MAIN_MEDIA_KEY);
      setCategories([]);
      setMainPageMedia({});
      console.log("Cleared all learn data");
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  }, []);

  return useMemo(
    () => ({
      categories,
      mainPageMedia,
      isLoading,
      updateCategory,
      updateVideo,
      addVideo,
      removeVideo,
      initializeDefaultCategories,
      setCategories,
      updateMainPageMedia,
      lastSaveTime,
      clearAllData,
    }),
    [
      categories,
      mainPageMedia,
      isLoading,
      updateCategory,
      updateVideo,
      addVideo,
      removeVideo,
      initializeDefaultCategories,
      updateMainPageMedia,
      lastSaveTime,
      clearAllData,
    ]
  );
});