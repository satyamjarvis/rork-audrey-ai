import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MEDITATION_KEY = "@meditation_data";
const FAVORITES_KEY = "@meditation_favorites";

export type MeditationType = "breathing" | "body-scan" | "visualization" | "mindfulness" | "loving-kindness";

export type Meditation = {
  id: string;
  title: string;
  description: string;
  duration: number | string;
  type: MeditationType;
  isFavorite: boolean;
  audioUrl?: string;
};

const DEFAULT_MEDITATIONS: Meditation[] = [
  {
    id: "1",
    title: "Morning Breath",
    description: "Start with simple breathing exercises to center yourself",
    duration: 5,
    type: "breathing",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/breathing_exercise_1",
  },
  {
    id: "2",
    title: "Body Scan Awakening",
    description: "Gentle body scan to connect with your physical presence",
    duration: 10,
    type: "body-scan",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/body_scan_meditation_1",
  },
  {
    id: "3",
    title: "Gratitude Visualization",
    description: "Visualize the day ahead with gratitude and positivity",
    duration: 5,
    type: "visualization",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/gratitude_meditation_1",
  },
  {
    id: "4",
    title: "Mindful Awareness",
    description: "Cultivate present-moment awareness for the day ahead",
    duration: "4:40",
    type: "mindfulness",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/mindful_awareness_1",
  },
  {
    id: "5",
    title: "Loving-Kindness Practice",
    description: "Send compassion to yourself and others",
    duration: 8,
    type: "loving-kindness",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/kindness_compassion_meditation_1",
  },
  {
    id: "6",
    title: "Quick Centering",
    description: "Fast 3-minute breathing practice for busy mornings",
    duration: 3,
    type: "breathing",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/fast_3_mins_breathing_1",
  },
  {
    id: "7",
    title: "Deep Body Relaxation",
    description: "Release tension from head to toe",
    duration: 12,
    type: "body-scan",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/relaxation_meditation_1",
  },
  {
    id: "8",
    title: "Energy Visualization",
    description: "Visualize positive energy flowing through your body",
    duration: 5,
    type: "visualization",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/meditation_energy_flow_1",
  },
  {
    id: "9",
    title: "Extended Mindfulness",
    description: "Deep mindfulness practice for experienced meditators",
    duration: "4:40",
    type: "mindfulness",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/meditation_mindfulness_1",
  },
  {
    id: "10",
    title: "Self-Compassion",
    description: "Practice kindness and acceptance toward yourself",
    duration: 4,
    type: "loving-kindness",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/selfcompassion_meditation_1",
  },
  {
    id: "11",
    title: "5 Minute Breathing",
    description: "A focused 5-minute breathing practice to center yourself.",
    duration: 5,
    type: "breathing",
    isFavorite: false,
    audioUrl: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/breathing_practice_6",
  },
];

export const [MeditationProvider, useMeditation] = createContextHook(() => {
  const [meditations, setMeditations] = useState<Meditation[]>(DEFAULT_MEDITATIONS);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [totalMinutesToday, setTotalMinutesToday] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMeditationData() {
      try {
        const [storedFavorites, storedData] = await Promise.all([
          AsyncStorage.getItem(FAVORITES_KEY),
          AsyncStorage.getItem(MEDITATION_KEY),
        ]);

        const favorites: string[] = storedFavorites ? JSON.parse(storedFavorites) : [];
        
        const updatedMeditations = DEFAULT_MEDITATIONS.map((med) => ({
          ...med,
          isFavorite: favorites.includes(med.id),
        }));

        setMeditations(updatedMeditations);

        if (storedData) {
          const data = JSON.parse(storedData);
          const today = new Date().toISOString().split('T')[0];
          
          if (data.date === today) {
            setCompletedToday(data.completed || []);
            setTotalMinutesToday(data.totalMinutes || 0);
          }
        }

        setIsLoading(false);
        console.log("Meditation data loaded");
      } catch (error) {
        console.error("Error loading meditation data:", error);
        setIsLoading(false);
      }
    }

    loadMeditationData();
  }, []);

  const toggleFavorite = useCallback(async (meditationId: string) => {
    setMeditations((prev) => {
      const updated = prev.map((med) =>
        med.id === meditationId ? { ...med, isFavorite: !med.isFavorite } : med
      );
      
      const favorites = updated.filter((med) => med.isFavorite).map((med) => med.id);
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      console.log("Favorites updated");
      
      return updated;
    });
  }, []);

  const completeMeditation = useCallback(async (meditationId: string) => {
    const meditation = meditations.find((med) => med.id === meditationId);
    if (!meditation) return;

    const today = new Date().toISOString().split('T')[0];
    const newCompleted = [...completedToday, meditationId];
    
    let addedMinutes = 0;
    if (typeof meditation.duration === 'number') {
      addedMinutes = meditation.duration;
    } else if (typeof meditation.duration === 'string') {
      const parts = meditation.duration.split(':');
      if (parts.length === 2) {
        // Convert M:SS to minutes (e.g. 4:40 -> 4.67)
        addedMinutes = parseInt(parts[0]) + parseInt(parts[1]) / 60;
      } else {
        addedMinutes = parseFloat(meditation.duration);
      }
    }
    
    const newTotalMinutes = Math.round(totalMinutesToday + addedMinutes);

    setCompletedToday(newCompleted);
    setTotalMinutesToday(newTotalMinutes);

    await AsyncStorage.setItem(
      MEDITATION_KEY,
      JSON.stringify({
        date: today,
        completed: newCompleted,
        totalMinutes: newTotalMinutes,
      })
    );

    console.log("Meditation completed:", meditation.title);
  }, [meditations, completedToday, totalMinutesToday]);

  const favoriteCount = useMemo(
    () => meditations.filter((med) => med.isFavorite).length,
    [meditations]
  );

  const completedCount = useMemo(
    () => completedToday.length,
    [completedToday]
  );

  return useMemo(
    () => ({
      meditations,
      completedToday,
      totalMinutesToday,
      completedCount,
      favoriteCount,
      isLoading,
      toggleFavorite,
      completeMeditation,
    }),
    [meditations, completedToday, totalMinutesToday, completedCount, favoriteCount, isLoading, toggleFavorite, completeMeditation]
  );
});
