import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { encrypt, decrypt } from "@/utils/encryption";
import { isValidJSON } from "@/utils/asyncStorageHelpers";

export type ManifestationType = "daily_affirmation" | "visualization" | "gratitude" | "action_step";

export type Manifestation = {
  id: string;
  type: ManifestationType;
  content: string;
  amount?: number;
  date: string;
  completed: boolean;
  createdAt: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  requirement: number;
  currentProgress: number;
};

export type UserLevel = {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  title: string;
};

const MANIFESTATIONS_KEY = "@manifestations";
const ACHIEVEMENTS_KEY = "@achievements";
const USER_LEVEL_KEY = "@user_level";
const STREAK_KEY = "@manifestation_streak";

const LEVEL_TITLES = [
  "Seeker",
  "Believer",
  "Manifester",
  "Visionary",
  "Master Manifester",
  "Abundance Creator",
  "Wealth Magnet",
  "Financial Wizard",
  "Money Master",
  "Prosperity Legend",
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_manifestation",
    title: "First Step",
    description: "Complete your first manifestation",
    icon: "🌟",
    requirement: 1,
    currentProgress: 0,
  },
  {
    id: "week_streak",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    requirement: 7,
    currentProgress: 0,
  },
  {
    id: "manifestation_master",
    title: "Manifestation Master",
    description: "Complete 50 manifestations",
    icon: "👑",
    requirement: 50,
    currentProgress: 0,
  },
  {
    id: "daily_dedicator",
    title: "Daily Dedicator",
    description: "Complete manifestations for 30 days",
    icon: "💎",
    requirement: 30,
    currentProgress: 0,
  },
  {
    id: "wealth_attractor",
    title: "Wealth Attractor",
    description: "Manifest $10,000 in goals",
    icon: "💰",
    requirement: 10000,
    currentProgress: 0,
  },
  {
    id: "abundance_seeker",
    title: "Abundance Seeker",
    description: "Complete 100 manifestations",
    icon: "✨",
    requirement: 100,
    currentProgress: 0,
  },
];

export const [WealthManifestingProvider, useWealthManifesting] = createContextHook(() => {
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [userLevel, setUserLevel] = useState<UserLevel>({
    level: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    title: LEVEL_TITLES[0],
  });
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const [manifestationsData, achievementsData, levelData, streakData] = await Promise.all([
        AsyncStorage.getItem(MANIFESTATIONS_KEY),
        AsyncStorage.getItem(ACHIEVEMENTS_KEY),
        AsyncStorage.getItem(USER_LEVEL_KEY),
        AsyncStorage.getItem(STREAK_KEY),
      ]);

      if (manifestationsData) {
        try {
          if (!isValidJSON(manifestationsData)) {
            console.error("Invalid manifestations data format, resetting");
            await AsyncStorage.removeItem(MANIFESTATIONS_KEY);
            setManifestations([]);
          } else {
            let parsed;
            try {
              const decryptedData = await decrypt(manifestationsData);
              parsed = JSON.parse(decryptedData);
              console.log("🔓 Manifestations decrypted successfully");
            } catch {
              parsed = JSON.parse(manifestationsData);
              console.log("⚠️ Loaded unencrypted manifestations, will encrypt on next save");
            }
            if (Array.isArray(parsed)) {
              setManifestations(parsed);
            } else {
              await AsyncStorage.removeItem(MANIFESTATIONS_KEY);
              setManifestations([]);
            }
          }
        } catch (error) {
          console.error("Error parsing manifestations:", error);
          console.error("Corrupted data:", manifestationsData.substring(0, 100));
          await AsyncStorage.removeItem(MANIFESTATIONS_KEY);
          setManifestations([]);
        }
      }

      if (achievementsData) {
        try {
          if (!isValidJSON(achievementsData)) {
            console.error("Invalid achievements data format, resetting");
            await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
            setAchievements(DEFAULT_ACHIEVEMENTS);
          } else {
            let parsed;
            try {
              const decryptedData = await decrypt(achievementsData);
              parsed = JSON.parse(decryptedData);
              console.log("🔓 Achievements decrypted successfully");
            } catch {
              parsed = JSON.parse(achievementsData);
              console.log("⚠️ Loaded unencrypted achievements, will encrypt on next save");
            }
            if (Array.isArray(parsed)) {
              setAchievements(parsed);
            } else {
              await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
              setAchievements(DEFAULT_ACHIEVEMENTS);
            }
          }
        } catch (error) {
          console.error("Error parsing achievements:", error);
          console.error("Corrupted data:", achievementsData.substring(0, 100));
          await AsyncStorage.removeItem(ACHIEVEMENTS_KEY);
          setAchievements(DEFAULT_ACHIEVEMENTS);
        }
      }

      if (levelData) {
        try {
          if (!isValidJSON(levelData)) {
            console.error("Invalid level data format, resetting");
            await AsyncStorage.removeItem(USER_LEVEL_KEY);
          } else {
            const parsed = JSON.parse(levelData);
            if (parsed && typeof parsed === 'object') {
              setUserLevel(parsed);
            } else {
              await AsyncStorage.removeItem(USER_LEVEL_KEY);
            }
          }
        } catch (error) {
          console.error("Error parsing level:", error);
          console.error("Corrupted data:", levelData.substring(0, 100));
          await AsyncStorage.removeItem(USER_LEVEL_KEY);
        }
      }

      if (streakData) {
        try {
          if (streakData.trim().length === 0 || streakData.startsWith('[object')) {
            console.error("Invalid streak data format, resetting");
            await AsyncStorage.removeItem(STREAK_KEY);
            setStreak(0);
          } else {
            const parsed = parseInt(streakData, 10);
            if (!isNaN(parsed)) {
              setStreak(parsed);
            } else {
              await AsyncStorage.removeItem(STREAK_KEY);
              setStreak(0);
            }
          }
        } catch (error) {
          console.error("Error parsing streak:", error);
          console.error("Corrupted data:", streakData.substring(0, 100));
          await AsyncStorage.removeItem(STREAK_KEY);
          setStreak(0);
        }
      }
    } catch (error) {
      console.error("Error loading manifestation data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveManifestations = useCallback(async (newManifestations: Manifestation[]) => {
    try {
      const encryptedData = await encrypt(JSON.stringify(newManifestations));
      await AsyncStorage.setItem(MANIFESTATIONS_KEY, encryptedData);
      setManifestations(newManifestations);
      console.log("🔒 Manifestations encrypted and saved");
    } catch (error) {
      console.error("Error saving manifestations:", error);
    }
  }, []);

  const saveAchievements = useCallback(async (newAchievements: Achievement[]) => {
    try {
      const encryptedData = await encrypt(JSON.stringify(newAchievements));
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, encryptedData);
      setAchievements(newAchievements);
      console.log("🔒 Achievements encrypted and saved");
    } catch (error) {
      console.error("Error saving achievements:", error);
    }
  }, []);

  const saveUserLevel = useCallback(async (newLevel: UserLevel) => {
    try {
      await AsyncStorage.setItem(USER_LEVEL_KEY, JSON.stringify(newLevel));
      setUserLevel(newLevel);
    } catch (error) {
      console.error("Error saving user level:", error);
    }
  }, []);

  const saveStreak = useCallback(async (newStreak: number) => {
    try {
      await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
      setStreak(newStreak);
    } catch (error) {
      console.error("Error saving streak:", error);
    }
  }, []);

  const addXP = useCallback((xp: number) => {
    const newXP = userLevel.currentXP + xp;
    let newLevel = userLevel.level;
    let remaining = newXP;
    let xpNeeded = userLevel.xpToNextLevel;

    while (remaining >= xpNeeded) {
      remaining -= xpNeeded;
      newLevel++;
      xpNeeded = Math.floor(100 * Math.pow(1.5, newLevel - 1));
    }

    const updatedLevel: UserLevel = {
      level: newLevel,
      currentXP: remaining,
      xpToNextLevel: xpNeeded,
      title: LEVEL_TITLES[Math.min(newLevel - 1, LEVEL_TITLES.length - 1)],
    };

    saveUserLevel(updatedLevel);
    return newLevel > userLevel.level;
  }, [userLevel, saveUserLevel]);

  const updateAchievementProgress = useCallback((achievementId: string, progress: number) => {
    const updatedAchievements = achievements.map((achievement) => {
      if (achievement.id === achievementId) {
        const newProgress = achievement.currentProgress + progress;
        const isUnlocked = newProgress >= achievement.requirement && !achievement.unlockedAt;
        
        return {
          ...achievement,
          currentProgress: newProgress,
          unlockedAt: isUnlocked ? new Date().toISOString() : achievement.unlockedAt,
        };
      }
      return achievement;
    });

    saveAchievements(updatedAchievements);
  }, [achievements, saveAchievements]);

  const addManifestation = useCallback(async (manifestation: Omit<Manifestation, "id" | "createdAt" | "completed">) => {
    const newManifestation: Manifestation = {
      ...manifestation,
      id: `manifestation_${Date.now()}`,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    const updatedManifestations = [...manifestations, newManifestation];
    await saveManifestations(updatedManifestations);
    console.log("Manifestation added:", newManifestation);
    return newManifestation;
  }, [manifestations, saveManifestations]);

  const completeManifestation = useCallback(async (manifestationId: string) => {
    const updatedManifestations = manifestations.map((m) =>
      m.id === manifestationId && !m.completed ? { ...m, completed: true } : m
    );
    
    const manifestation = manifestations.find(m => m.id === manifestationId);
    if (manifestation && !manifestation.completed) {
      const leveledUp = addXP(20);
      updateAchievementProgress("first_manifestation", 1);
      updateAchievementProgress("manifestation_master", 1);
      updateAchievementProgress("abundance_seeker", 1);
      
      if (manifestation.amount) {
        updateAchievementProgress("wealth_attractor", manifestation.amount);
      }

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const lastCompleted = manifestations
        .filter(m => m.completed)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      const lastCompletedDate = lastCompleted ? lastCompleted.createdAt.split('T')[0] : null;
      
      if (lastCompletedDate === yesterday) {
        const newStreak = streak + 1;
        saveStreak(newStreak);
        updateAchievementProgress("week_streak", newStreak >= 7 ? 7 : 0);
        updateAchievementProgress("daily_dedicator", newStreak >= 30 ? 30 : 0);
      } else if (lastCompletedDate !== today) {
        saveStreak(1);
      }

      console.log(leveledUp ? "Level up! 🎉" : "XP gained! +20");
    }

    await saveManifestations(updatedManifestations);
  }, [manifestations, saveManifestations, addXP, updateAchievementProgress, streak, saveStreak]);

  const deleteManifestation = useCallback(async (manifestationId: string) => {
    const updatedManifestations = manifestations.filter((m) => m.id !== manifestationId);
    await saveManifestations(updatedManifestations);
    console.log("Manifestation deleted:", manifestationId);
  }, [manifestations, saveManifestations]);

  const todayManifestations = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return manifestations.filter(m => m.date === today);
  }, [manifestations]);

  const completedCount = useMemo(() => {
    return manifestations.filter(m => m.completed).length;
  }, [manifestations]);

  const unlockedAchievements = useMemo(() => {
    return achievements.filter(a => a.unlockedAt);
  }, [achievements]);

  return useMemo(
    () => ({
      manifestations,
      todayManifestations,
      achievements,
      unlockedAchievements,
      userLevel,
      streak,
      completedCount,
      isLoading,
      addManifestation,
      completeManifestation,
      deleteManifestation,
    }),
    [
      manifestations,
      todayManifestations,
      achievements,
      unlockedAchievements,
      userLevel,
      streak,
      completedCount,
      isLoading,
      addManifestation,
      completeManifestation,
      deleteManifestation,
    ]
  );
});
