import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Droplets,
  Coffee,
  Dumbbell,
  BookOpen,
  Music,
  Sunrise,
  Utensils,
  Bath,
  Shirt,
  CheckCircle,
} from "lucide-react-native";

const MORNING_ROUTINES_KEY = "@morning_routines";
const LAST_RESET_KEY = "@last_routines_reset";

export type RoutineStep = {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: number;
  order: number;
  completed: boolean;
  isCustom: boolean;
  translationKey?: string;
};

const DEFAULT_ROUTINE_STEPS: RoutineStep[] = [
  {
    id: "wake_up",
    title: "Wake Up & Stretch",
    description: "Start your day with gentle stretches",
    icon: "Sunrise",
    duration: 5,
    order: 0,
    completed: false,
    isCustom: false,
    translationKey: "morning.routines.steps.wake_up",
  },
  {
    id: "hydrate",
    title: "Drink Water",
    description: "Hydrate with a glass of water",
    icon: "Droplets",
    duration: 2,
    order: 1,
    completed: false,
    isCustom: false,
    translationKey: "morning.routines.steps.hydrate",
  },
  {
    id: "morning_routine",
    title: "Morning Hygiene",
    description: "Brush teeth, wash face, shower",
    icon: "Bath",
    duration: 15,
    order: 2,
    completed: false,
    isCustom: false,
    translationKey: "morning.routines.steps.morning_routine",
  },
  {
    id: "get_dressed",
    title: "Get Dressed",
    description: "Choose and wear your outfit",
    icon: "Shirt",
    duration: 5,
    order: 3,
    completed: false,
    isCustom: false,
    translationKey: "morning.routines.steps.get_dressed",
  },
  {
    id: "meditation",
    title: "Meditation",
    description: "5 minutes of mindfulness",
    icon: "Music",
    duration: 5,
    order: 4,
    completed: false,
    isCustom: false,
    translationKey: "morning.routines.steps.meditation",
  },
  {
    id: "exercise",
    title: "Exercise",
    description: "Quick workout or yoga session",
    icon: "Dumbbell",
    duration: 20,
    order: 5,
    completed: false,
    isCustom: false,
    translationKey: "morning.routines.steps.exercise",
  },
  {
    id: "breakfast",
    title: "Healthy Breakfast",
    description: "Prepare and eat a nutritious meal",
    icon: "Utensils",
    duration: 15,
    order: 6,
    completed: false,
    isCustom: false,
    translationKey: "morning.routines.steps.breakfast",
  },
  {
    id: "coffee",
    title: "Morning Beverage",
    description: "Enjoy coffee or tea",
    icon: "Coffee",
    duration: 5,
    order: 7,
    completed: false,
    isCustom: false,
    translationKey: "morning.routines.steps.coffee",
  },
  {
    id: "reading",
    title: "Read or Plan",
    description: "Review goals or read inspiring content",
    icon: "BookOpen",
    duration: 10,
    order: 8,
    completed: false,
    isCustom: false,
    translationKey: "morning.routines.steps.reading",
  },
];

export const ROUTINE_ICON_MAP = {
  Droplets,
  Coffee,
  Dumbbell,
  BookOpen,
  Music,
  Sunrise,
  Utensils,
  Bath,
  Shirt,
  CheckCircle,
};

export const [MorningRoutinesProvider, useMorningRoutines] = createContextHook(() => {
  const [routineSteps, setRoutineSteps] = useState<RoutineStep[]>(DEFAULT_ROUTINE_STEPS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      const storedRoutines = await AsyncStorage.getItem(MORNING_ROUTINES_KEY);
      
      if (storedRoutines) {
        const parsedRoutines = JSON.parse(storedRoutines);
        setRoutineSteps(parsedRoutines.sort((a: RoutineStep, b: RoutineStep) => a.order - b.order));
      } else {
        await AsyncStorage.setItem(MORNING_ROUTINES_KEY, JSON.stringify(DEFAULT_ROUTINE_STEPS));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading morning routines:", error);
      setIsLoading(false);
    }
  };

  const resetDailyProgress = useCallback(async () => {
    const resetRoutines = routineSteps.map((step) => ({
      ...step,
      completed: false,
    }));
    
    setRoutineSteps(resetRoutines);
    await AsyncStorage.setItem(MORNING_ROUTINES_KEY, JSON.stringify(resetRoutines));
    setStartTime(null);
  }, [routineSteps]);

  useEffect(() => {
    const checkAndResetDaily = async () => {
      const lastResetDate = await AsyncStorage.getItem(LAST_RESET_KEY);
      const parsedLastReset = lastResetDate ? JSON.parse(lastResetDate) : null;
      const today = new Date().toISOString().split('T')[0];
      
      if (parsedLastReset !== today && !isLoading) {
        await resetDailyProgress();
        await AsyncStorage.setItem(LAST_RESET_KEY, JSON.stringify(today));
      }
    };

    if (!isLoading) {
      checkAndResetDaily();
    }
  }, [isLoading, resetDailyProgress]);

  const toggleStepCompletion = useCallback(async (stepId: string) => {
    const updatedRoutines = routineSteps.map((step) =>
      step.id === stepId
        ? { ...step, completed: !step.completed }
        : step
    );

    setRoutineSteps(updatedRoutines);
    await AsyncStorage.setItem(MORNING_ROUTINES_KEY, JSON.stringify(updatedRoutines));

    if (!startTime) {
      setStartTime(Date.now());
    }
  }, [routineSteps, startTime]);

  const addCustomStep = useCallback(async (
    title: string,
    description: string,
    duration: number,
    icon: string = "CheckCircle"
  ) => {
    const maxOrder = Math.max(...routineSteps.map(s => s.order), -1);
    
    const newStep: RoutineStep = {
      id: `routine_${Date.now()}`,
      title,
      description,
      icon,
      duration,
      order: maxOrder + 1,
      completed: false,
      isCustom: true,
    };

    const updatedRoutines = [...routineSteps, newStep];
    setRoutineSteps(updatedRoutines);
    await AsyncStorage.setItem(MORNING_ROUTINES_KEY, JSON.stringify(updatedRoutines));
    
    return newStep;
  }, [routineSteps]);

  const updateStep = useCallback(async (
    stepId: string,
    updates: Partial<Pick<RoutineStep, 'title' | 'description' | 'icon' | 'duration'>>
  ) => {
    const updatedRoutines = routineSteps.map((step) => 
      step.id === stepId ? { ...step, ...updates } : step
    );

    setRoutineSteps(updatedRoutines);
    await AsyncStorage.setItem(MORNING_ROUTINES_KEY, JSON.stringify(updatedRoutines));
    
    return updatedRoutines.find(step => step.id === stepId);
  }, [routineSteps]);

  const deleteStep = useCallback(async (stepId: string) => {
    const updatedRoutines = routineSteps
      .filter((step) => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index }));
    
    setRoutineSteps(updatedRoutines);
    await AsyncStorage.setItem(MORNING_ROUTINES_KEY, JSON.stringify(updatedRoutines));
  }, [routineSteps]);

  const reorderSteps = useCallback(async (newOrder: RoutineStep[]) => {
    const reorderedSteps = newOrder.map((step, index) => ({
      ...step,
      order: index,
    }));
    
    setRoutineSteps(reorderedSteps);
    await AsyncStorage.setItem(MORNING_ROUTINES_KEY, JSON.stringify(reorderedSteps));
  }, []);

  const completedCount = useMemo(() => {
    return routineSteps.filter((s) => s.completed).length;
  }, [routineSteps]);

  const totalCount = useMemo(() => {
    return routineSteps.length;
  }, [routineSteps]);

  const progressPercentage = useMemo(() => {
    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  }, [completedCount, totalCount]);

  const totalDuration = useMemo(() => {
    return routineSteps.reduce((sum, step) => sum + step.duration, 0);
  }, [routineSteps]);

  const completedDuration = useMemo(() => {
    return routineSteps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.duration, 0);
  }, [routineSteps]);

  const estimatedEndTime = useMemo(() => {
    if (!startTime) return null;
    const remainingMinutes = totalDuration - completedDuration;
    return new Date(startTime + remainingMinutes * 60 * 1000);
  }, [startTime, totalDuration, completedDuration]);

  const currentStep = useMemo(() => {
    return routineSteps.find(step => !step.completed);
  }, [routineSteps]);

  return useMemo(() => ({
    routineSteps,
    isLoading,
    completedCount,
    totalCount,
    progressPercentage,
    totalDuration,
    completedDuration,
    estimatedEndTime,
    currentStep,
    startTime,
    toggleStepCompletion,
    addCustomStep,
    updateStep,
    deleteStep,
    reorderSteps,
    resetDailyProgress,
  }), [
    routineSteps,
    isLoading,
    completedCount,
    totalCount,
    progressPercentage,
    totalDuration,
    completedDuration,
    estimatedEndTime,
    currentStep,
    startTime,
    toggleStepCompletion,
    addCustomStep,
    updateStep,
    deleteStep,
    reorderSteps,
    resetDailyProgress,
  ]);
});
