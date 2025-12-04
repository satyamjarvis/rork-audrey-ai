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
};

type CourseCategory = {
  id: string;
  title: string;
  icon: string; // Store icon name as string for persistence
  color: string;
  videos: VideoItem[];
  isSubscriptionRequired: boolean;
};

const STORAGE_KEY = "@learn_data";

export const [LearnContext, useLearn] = createContextHook(() => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());

  // Load data from AsyncStorage with validation
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
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
        } else {
          console.log("No stored data found, starting fresh");
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
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, videos: [...cat.videos, video] } : cat
      )
    );
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

  // Clear all data (for debugging)
  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setCategories([]);
      console.log("Cleared all learn data");
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  }, []);

  return useMemo(
    () => ({
      categories,
      isLoading,
      updateCategory,
      updateVideo,
      addVideo,
      removeVideo,
      initializeDefaultCategories,
      setCategories,
      lastSaveTime,
      clearAllData,
    }),
    [
      categories,
      isLoading,
      updateCategory,
      updateVideo,
      addVideo,
      removeVideo,
      initializeDefaultCategories,
      lastSaveTime,
      clearAllData,
    ]
  );
});