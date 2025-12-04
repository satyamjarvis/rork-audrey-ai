import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WELLNESS_CHECK_KEY = "@wellness_check_logs";
const LAST_CHECK_KEY = "@last_wellness_check";

export type MoodType = "excellent" | "good" | "okay" | "low" | "poor";
export type EnergyLevel = "high" | "moderate" | "low" | "exhausted";
export type StressLevel = "none" | "mild" | "moderate" | "high" | "overwhelming";
export type SleepQuality = "excellent" | "good" | "fair" | "poor" | "terrible";

export type WellnessEntry = {
  id: string;
  timestamp: number;
  date: string;
  mood: MoodType;
  energy: EnergyLevel;
  stress: StressLevel;
  sleep: SleepQuality;
  physicalHealth: number;
  notes: string;
  gratitude?: string[];
  waterIntake?: number;
  exerciseDuration?: number;
};

export type WellnessStats = {
  averageMood: number;
  averageEnergy: number;
  averageStress: number;
  averageSleep: number;
  averagePhysicalHealth: number;
  totalEntries: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  currentStreak: number;
  longestStreak: number;
};

const MOOD_VALUES: Record<MoodType, number> = {
  excellent: 5,
  good: 4,
  okay: 3,
  low: 2,
  poor: 1,
};

const ENERGY_VALUES: Record<EnergyLevel, number> = {
  high: 4,
  moderate: 3,
  low: 2,
  exhausted: 1,
};

const STRESS_VALUES: Record<StressLevel, number> = {
  none: 1,
  mild: 2,
  moderate: 3,
  high: 4,
  overwhelming: 5,
};

const SLEEP_VALUES: Record<SleepQuality, number> = {
  excellent: 5,
  good: 4,
  fair: 3,
  poor: 2,
  terrible: 1,
};

export const [WellnessCheckProvider, useWellnessCheck] = createContextHook(() => {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastCheckDate, setLastCheckDate] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const [storedEntries, storedLastCheck] = await Promise.all([
        AsyncStorage.getItem(WELLNESS_CHECK_KEY),
        AsyncStorage.getItem(LAST_CHECK_KEY),
      ]);

      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        setEntries(parsedEntries.sort((a: WellnessEntry, b: WellnessEntry) => b.timestamp - a.timestamp));
      }

      if (storedLastCheck) {
        const parsedLastCheck = JSON.parse(storedLastCheck);
        setLastCheckDate(parsedLastCheck);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading wellness entries:", error);
      setIsLoading(false);
    }
  };

  const addEntry = useCallback(async (
    mood: MoodType,
    energy: EnergyLevel,
    stress: StressLevel,
    sleep: SleepQuality,
    physicalHealth: number,
    notes: string,
    gratitude?: string[],
    waterIntake?: number,
    exerciseDuration?: number
  ) => {
    const newEntry: WellnessEntry = {
      id: `wellness_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      mood,
      energy,
      stress,
      sleep,
      physicalHealth,
      notes,
      gratitude,
      waterIntake,
      exerciseDuration,
    };

    const updatedEntries = [newEntry, ...entries].slice(0, 365);
    setEntries(updatedEntries);

    const today = new Date().toISOString().split('T')[0];
    setLastCheckDate(today);

    await Promise.all([
      AsyncStorage.setItem(WELLNESS_CHECK_KEY, JSON.stringify(updatedEntries)),
      AsyncStorage.setItem(LAST_CHECK_KEY, JSON.stringify(today)),
    ]);

    console.log("Wellness entry added");
    return newEntry;
  }, [entries]);

  const updateEntry = useCallback(async (
    entryId: string,
    updates: Partial<Omit<WellnessEntry, 'id' | 'timestamp' | 'date'>>
  ) => {
    const updatedEntries = entries.map((entry) =>
      entry.id === entryId ? { ...entry, ...updates } : entry
    );

    setEntries(updatedEntries);
    await AsyncStorage.setItem(WELLNESS_CHECK_KEY, JSON.stringify(updatedEntries));

    return updatedEntries.find(e => e.id === entryId);
  }, [entries]);

  const deleteEntry = useCallback(async (entryId: string) => {
    const updatedEntries = entries.filter((entry) => entry.id !== entryId);
    setEntries(updatedEntries);
    await AsyncStorage.setItem(WELLNESS_CHECK_KEY, JSON.stringify(updatedEntries));
  }, [entries]);

  const hasCheckedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return lastCheckDate === today;
  }, [lastCheckDate]);

  const todayEntry = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return entries.find(e => e.date.split('T')[0] === today);
  }, [entries]);

  const recentEntries = useMemo(() => {
    return entries.slice(0, 7);
  }, [entries]);

  const calculateStats = useMemo((): WellnessStats => {
    if (entries.length === 0) {
      return {
        averageMood: 0,
        averageEnergy: 0,
        averageStress: 0,
        averageSleep: 0,
        averagePhysicalHealth: 0,
        totalEntries: 0,
        entriesThisWeek: 0,
        entriesThisMonth: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    const entriesThisWeek = entries.filter(e => now - e.timestamp < oneWeek).length;
    const entriesThisMonth = entries.filter(e => now - e.timestamp < oneMonth).length;

    const totalMood = entries.reduce((sum, e) => sum + MOOD_VALUES[e.mood], 0);
    const totalEnergy = entries.reduce((sum, e) => sum + ENERGY_VALUES[e.energy], 0);
    const totalStress = entries.reduce((sum, e) => sum + STRESS_VALUES[e.stress], 0);
    const totalSleep = entries.reduce((sum, e) => sum + SLEEP_VALUES[e.sleep], 0);
    const totalPhysical = entries.reduce((sum, e) => sum + e.physicalHealth, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const sortedByDate = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedByDate.forEach((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        tempStreak = 1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (entryDate.getTime() === today.getTime()) {
          currentStreak = 1;
        }
      } else {
        const dayDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (dayDiff === 1) {
          tempStreak++;
          if (currentStreak > 0) {
            currentStreak++;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          if (currentStreak > 0) {
            currentStreak = 0;
          }
        }
      }
      
      lastDate = entryDate;
    });

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      averageMood: totalMood / entries.length,
      averageEnergy: totalEnergy / entries.length,
      averageStress: totalStress / entries.length,
      averageSleep: totalSleep / entries.length,
      averagePhysicalHealth: totalPhysical / entries.length,
      totalEntries: entries.length,
      entriesThisWeek,
      entriesThisMonth,
      currentStreak,
      longestStreak,
    };
  }, [entries]);

  const getEntriesByDateRange = useCallback((startDate: Date, endDate: Date): WellnessEntry[] => {
    return entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [entries]);

  const getAudreyAnalysisData = useMemo(() => {
    return {
      entries: entries.slice(0, 30),
      stats: calculateStats,
      trends: {
        moodTrend: entries.slice(0, 7).map(e => ({ date: e.date, value: MOOD_VALUES[e.mood] })),
        energyTrend: entries.slice(0, 7).map(e => ({ date: e.date, value: ENERGY_VALUES[e.energy] })),
        stressTrend: entries.slice(0, 7).map(e => ({ date: e.date, value: STRESS_VALUES[e.stress] })),
      },
      recentGratitude: entries.slice(0, 10).flatMap(e => e.gratitude || []),
      recentConcerns: entries.slice(0, 10).filter(e => 
        STRESS_VALUES[e.stress] >= 4 || MOOD_VALUES[e.mood] <= 2
      ).map(e => ({ date: e.date, notes: e.notes, mood: e.mood, stress: e.stress })),
    };
  }, [entries, calculateStats]);

  return useMemo(() => ({
    entries,
    isLoading,
    hasCheckedToday,
    todayEntry,
    recentEntries,
    stats: calculateStats,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByDateRange,
    getAudreyAnalysisData,
  }), [
    entries,
    isLoading,
    hasCheckedToday,
    todayEntry,
    recentEntries,
    calculateStats,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByDateRange,
    getAudreyAnalysisData,
  ]);
});
