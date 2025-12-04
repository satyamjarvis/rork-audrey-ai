import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { safeJSONParse } from "@/utils/asyncStorageHelpers";

const AFFIRMATIONS_KEY = "@morning_affirmations";
const FAVORITES_KEY = "@favorite_affirmations";
const DAILY_AFFIRMATION_KEY = "@daily_affirmation";
const DAILY_AFFIRMATION_DATE_KEY = "@daily_affirmation_date";

export type Affirmation = {
  id: string;
  text: string;
  category: string;
  isFavorite: boolean;
};

const DEFAULT_AFFIRMATIONS: Affirmation[] = [
  {
    id: "1",
    text: "I am worthy of love, success, and happiness",
    category: "Self-Worth",
    isFavorite: false,
  },
  {
    id: "2",
    text: "Today, I choose to embrace positivity and growth",
    category: "Mindset",
    isFavorite: false,
  },
  {
    id: "3",
    text: "I have the power to create the life I desire",
    category: "Empowerment",
    isFavorite: false,
  },
  {
    id: "4",
    text: "Every challenge I face is an opportunity to grow stronger",
    category: "Resilience",
    isFavorite: false,
  },
  {
    id: "5",
    text: "I am grateful for all the blessings in my life",
    category: "Gratitude",
    isFavorite: false,
  },
  {
    id: "6",
    text: "I trust in my abilities and believe in my potential",
    category: "Confidence",
    isFavorite: false,
  },
  {
    id: "7",
    text: "I radiate positive energy and attract good things",
    category: "Positivity",
    isFavorite: false,
  },
  {
    id: "8",
    text: "I am in control of my thoughts and emotions",
    category: "Self-Control",
    isFavorite: false,
  },
  {
    id: "9",
    text: "I deserve peace, joy, and abundance",
    category: "Self-Worth",
    isFavorite: false,
  },
  {
    id: "10",
    text: "I am becoming the best version of myself every day",
    category: "Growth",
    isFavorite: false,
  },
  {
    id: "11",
    text: "My dreams are valid and achievable",
    category: "Motivation",
    isFavorite: false,
  },
  {
    id: "12",
    text: "I release all negativity and embrace only love",
    category: "Healing",
    isFavorite: false,
  },
  {
    id: "13",
    text: "I am surrounded by people who support and uplift me",
    category: "Relationships",
    isFavorite: false,
  },
  {
    id: "14",
    text: "I am open to receiving all the good the universe offers",
    category: "Abundance",
    isFavorite: false,
  },
  {
    id: "15",
    text: "My mind is clear, focused, and ready for success",
    category: "Focus",
    isFavorite: false,
  },
];

export const [AffirmationsProvider, useAffirmations] = createContextHook(() => {
  const [affirmations, setAffirmations] = useState<Affirmation[]>(DEFAULT_AFFIRMATIONS);
  const [dailyAffirmation, setDailyAffirmation] = useState<Affirmation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAffirmations();
  }, []);

  useEffect(() => {
    const checkAndUpdateDailyAffirmation = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const storedDate = await AsyncStorage.getItem(DAILY_AFFIRMATION_DATE_KEY);
        const parsedStoredDate = safeJSONParse<string | null>(storedDate, null);
        
        if (parsedStoredDate !== today && affirmations.length > 0) {
          const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
          if (randomAffirmation) {
            setDailyAffirmation(randomAffirmation);
            await AsyncStorage.setItem(DAILY_AFFIRMATION_KEY, JSON.stringify(randomAffirmation));
            await AsyncStorage.setItem(DAILY_AFFIRMATION_DATE_KEY, JSON.stringify(today));
          }
        }
      } catch (error) {
        console.error("Error updating daily affirmation:", error);
      }
    };

    if (affirmations.length > 0 && !isLoading) {
      checkAndUpdateDailyAffirmation();
    }
  }, [affirmations, isLoading]);

  const loadAffirmations = async () => {
    try {
      const [storedAffirmations, storedFavorites, storedDailyAffirmation, storedDate] = await Promise.all([
        AsyncStorage.getItem(AFFIRMATIONS_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(DAILY_AFFIRMATION_KEY),
        AsyncStorage.getItem(DAILY_AFFIRMATION_DATE_KEY),
      ]);

      let loadedAffirmations = DEFAULT_AFFIRMATIONS;

      if (storedAffirmations) {
        loadedAffirmations = safeJSONParse<Affirmation[]>(storedAffirmations, DEFAULT_AFFIRMATIONS);
      }

      if (loadedAffirmations.length === 0) {
        loadedAffirmations = DEFAULT_AFFIRMATIONS;
      }

      if (storedFavorites) {
        const favorites = safeJSONParse<string[]>(storedFavorites, []);
        loadedAffirmations = loadedAffirmations.map((aff) => ({
          ...aff,
          isFavorite: favorites.includes(aff.id),
        }));
      }

      setAffirmations(loadedAffirmations);
      
      const today = new Date().toISOString().split('T')[0];
      const parsedStoredDate = safeJSONParse<string | null>(storedDate, null);
      
      if (storedDailyAffirmation && parsedStoredDate === today) {
        const parsed = safeJSONParse<Affirmation | null>(storedDailyAffirmation, null);
        if (parsed) {
          setDailyAffirmation(parsed);
        } else {
          const randomAffirmation = loadedAffirmations[Math.floor(Math.random() * loadedAffirmations.length)];
          if (randomAffirmation) {
            setDailyAffirmation(randomAffirmation);
            await AsyncStorage.setItem(DAILY_AFFIRMATION_KEY, JSON.stringify(randomAffirmation));
            await AsyncStorage.setItem(DAILY_AFFIRMATION_DATE_KEY, JSON.stringify(today));
          }
        }
      } else {
        const randomAffirmation = loadedAffirmations[Math.floor(Math.random() * loadedAffirmations.length)];
        if (randomAffirmation) {
          setDailyAffirmation(randomAffirmation);
          await AsyncStorage.setItem(DAILY_AFFIRMATION_KEY, JSON.stringify(randomAffirmation));
          await AsyncStorage.setItem(DAILY_AFFIRMATION_DATE_KEY, JSON.stringify(today));
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading affirmations:", error);
      setIsLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (affirmationId: string) => {
    const updatedAffirmations = affirmations.map((aff) =>
      aff.id === affirmationId ? { ...aff, isFavorite: !aff.isFavorite } : aff
    );

    setAffirmations(updatedAffirmations);

    const favorites = updatedAffirmations
      .filter((aff) => aff.isFavorite)
      .map((aff) => aff.id);

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [affirmations]);

  const addCustomAffirmation = useCallback(async (text: string, category: string) => {
    const newAffirmation: Affirmation = {
      id: Date.now().toString(),
      text,
      category,
      isFavorite: false,
    };

    const updatedAffirmations = [...affirmations, newAffirmation];
    setAffirmations(updatedAffirmations);
    await AsyncStorage.setItem(AFFIRMATIONS_KEY, JSON.stringify(updatedAffirmations));
  }, [affirmations]);

  const deleteAffirmation = useCallback(async (affirmationId: string) => {
    const updatedAffirmations = affirmations.filter((aff) => aff.id !== affirmationId);
    setAffirmations(updatedAffirmations);
    await AsyncStorage.setItem(AFFIRMATIONS_KEY, JSON.stringify(updatedAffirmations));
  }, [affirmations]);

  const refreshDailyAffirmation = useCallback(async () => {
    if (affirmations.length === 0) return;
    
    const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
    if (randomAffirmation) {
      setDailyAffirmation(randomAffirmation);
      
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(DAILY_AFFIRMATION_KEY, JSON.stringify(randomAffirmation));
      await AsyncStorage.setItem(DAILY_AFFIRMATION_DATE_KEY, JSON.stringify(today));
    }
  }, [affirmations]);

  const updateAffirmation = useCallback(async (affirmationId: string, updates: Partial<Pick<Affirmation, 'text' | 'category'>>) => {
    const updatedAffirmations = affirmations.map((aff) => 
      aff.id === affirmationId ? { ...aff, ...updates } : aff
    );

    setAffirmations(updatedAffirmations);
    await AsyncStorage.setItem(AFFIRMATIONS_KEY, JSON.stringify(updatedAffirmations));
    
    if (dailyAffirmation?.id === affirmationId) {
      const updated = { ...dailyAffirmation, ...updates };
      setDailyAffirmation(updated);
      await AsyncStorage.setItem(DAILY_AFFIRMATION_KEY, JSON.stringify(updated));
    }
    
    return updatedAffirmations.find(aff => aff.id === affirmationId);
  }, [affirmations, dailyAffirmation]);

  return useMemo(() => ({
    affirmations,
    dailyAffirmation,
    isLoading,
    toggleFavorite,
    addCustomAffirmation,
    deleteAffirmation,
    refreshDailyAffirmation,
    updateAffirmation,
  }), [affirmations, dailyAffirmation, isLoading, toggleFavorite, addCustomAffirmation, deleteAffirmation, refreshDailyAffirmation, updateAffirmation]);
});
