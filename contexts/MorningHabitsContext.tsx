import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Coffee,
  Droplets,
  Utensils,
  Dumbbell,
  BookOpen,
  Sunrise,
} from "lucide-react-native";

const MORNING_HABITS_KEY = "@morning_habits";

export type MorningHabit = {
  id: string;
  title: string;
  icon: string;
  completed: boolean;
  isCustom: boolean;
};

const DEFAULT_HABITS: MorningHabit[] = [
  {
    id: "hydrate",
    title: "Drink Water",
    icon: "Droplets",
    completed: false,
    isCustom: false,
  },
  {
    id: "exercise",
    title: "Morning Exercise",
    icon: "Dumbbell",
    completed: false,
    isCustom: false,
  },
  {
    id: "breakfast",
    title: "Healthy Breakfast",
    icon: "Utensils",
    completed: false,
    isCustom: false,
  },
  {
    id: "coffee",
    title: "Morning Coffee",
    icon: "Coffee",
    completed: false,
    isCustom: false,
  },
  {
    id: "reading",
    title: "Read or Journal",
    icon: "BookOpen",
    completed: false,
    isCustom: false,
  },
  {
    id: "sunshine",
    title: "Get Sunlight",
    icon: "Sunrise",
    completed: false,
    isCustom: false,
  },
];

export const ICON_MAP = {
  Coffee,
  Droplets,
  Utensils,
  Dumbbell,
  BookOpen,
  Sunrise,
};

export const [MorningHabitsProvider, useMorningHabits] = createContextHook(() => {
  const [habits, setHabits] = useState<MorningHabit[]>(DEFAULT_HABITS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem(MORNING_HABITS_KEY);
      
      if (storedHabits) {
        const parsedHabits = JSON.parse(storedHabits);
        setHabits(parsedHabits);
      } else {
        await AsyncStorage.setItem(MORNING_HABITS_KEY, JSON.stringify(DEFAULT_HABITS));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading morning habits:", error);
      setIsLoading(false);
    }
  };

  const resetDailyProgress = useCallback(async () => {
    const resetHabits = habits.map((habit) => ({
      ...habit,
      completed: false,
    }));
    
    setHabits(resetHabits);
    await AsyncStorage.setItem(MORNING_HABITS_KEY, JSON.stringify(resetHabits));
  }, [habits]);

  useEffect(() => {
    const checkAndResetDaily = async () => {
      const lastResetDate = await AsyncStorage.getItem("@last_habits_reset");
      const parsedLastReset = lastResetDate ? JSON.parse(lastResetDate) : null;
      const today = new Date().toISOString().split('T')[0];
      
      if (parsedLastReset !== today && !isLoading) {
        await resetDailyProgress();
        await AsyncStorage.setItem("@last_habits_reset", JSON.stringify(today));
      }
    };

    if (!isLoading) {
      checkAndResetDaily();
    }
  }, [isLoading, resetDailyProgress]);

  const toggleHabit = useCallback(async (habitId: string) => {
    const updatedHabits = habits.map((habit) =>
      habit.id === habitId
        ? { ...habit, completed: !habit.completed }
        : habit
    );

    setHabits(updatedHabits);
    await AsyncStorage.setItem(MORNING_HABITS_KEY, JSON.stringify(updatedHabits));
  }, [habits]);

  const addCustomHabit = useCallback(async (title: string, icon: string = "Coffee") => {
    const newHabit: MorningHabit = {
      id: `habit_${Date.now()}`,
      title,
      icon,
      completed: false,
      isCustom: true,
    };

    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    await AsyncStorage.setItem(MORNING_HABITS_KEY, JSON.stringify(updatedHabits));
    
    return newHabit;
  }, [habits]);

  const updateHabit = useCallback(async (habitId: string, updates: Partial<Pick<MorningHabit, 'title' | 'icon'>>) => {
    const updatedHabits = habits.map((habit) => 
      habit.id === habitId ? { ...habit, ...updates } : habit
    );

    setHabits(updatedHabits);
    await AsyncStorage.setItem(MORNING_HABITS_KEY, JSON.stringify(updatedHabits));
    
    return updatedHabits.find(habit => habit.id === habitId);
  }, [habits]);

  const deleteHabit = useCallback(async (habitId: string) => {
    const updatedHabits = habits.filter((habit) => habit.id !== habitId);
    setHabits(updatedHabits);
    await AsyncStorage.setItem(MORNING_HABITS_KEY, JSON.stringify(updatedHabits));
  }, [habits]);

  const completedCount = useMemo(() => {
    return habits.filter((h) => h.completed).length;
  }, [habits]);

  const totalCount = useMemo(() => {
    return habits.length;
  }, [habits]);

  const progressPercentage = useMemo(() => {
    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  }, [completedCount, totalCount]);

  return useMemo(() => ({
    habits,
    isLoading,
    completedCount,
    totalCount,
    progressPercentage,
    toggleHabit,
    addCustomHabit,
    updateHabit,
    deleteHabit,
    resetDailyProgress,
  }), [
    habits,
    isLoading,
    completedCount,
    totalCount,
    progressPercentage,
    toggleHabit,
    addCustomHabit,
    updateHabit,
    deleteHabit,
    resetDailyProgress,
  ]);
});
