import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { safeJSONParse } from "@/utils/asyncStorageHelpers";
import { encrypt, decrypt } from "@/utils/encryption";

export type UserPreference = {
  key: string;
  value: string;
  category: "interest" | "preference" | "personal" | "goal" | "relationship" | "other";
  timestamp: number;
  context?: string;
};

export type UserProfile = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  preferences: UserPreference[];
  lastUpdated: number;
  hasAccessedSolara?: boolean;
};

const USER_PROFILE_KEY = "@user_profile";

const DEFAULT_PROFILE: UserProfile = {
  name: undefined,
  email: undefined,
  phoneNumber: undefined,
  preferences: [],
  lastUpdated: Date.now(),
  hasAccessedSolara: false,
};

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const profileData = await AsyncStorage.getItem(USER_PROFILE_KEY);
      let parsedProfile: UserProfile;
      
      if (profileData) {
        try {
          const decryptedData = await decrypt(profileData);
          parsedProfile = JSON.parse(decryptedData);
          console.log("🔓 User profile decrypted successfully");
        } catch {
          parsedProfile = safeJSONParse<UserProfile>(profileData, DEFAULT_PROFILE);
          console.log("⚠️ Loaded unencrypted profile, will encrypt on next save");
        }
      } else {
        parsedProfile = DEFAULT_PROFILE;
      }
      
      if (parsedProfile && typeof parsedProfile === 'object' && 'preferences' in parsedProfile) {
        setProfile(parsedProfile);
      } else {
        console.warn("Invalid profile structure, resetting");
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
        setProfile(DEFAULT_PROFILE);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      try {
        await AsyncStorage.removeItem(USER_PROFILE_KEY);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      } catch (cleanupError) {
        console.error("Failed to cleanup profile storage:", cleanupError);
      }
      setProfile(DEFAULT_PROFILE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (newProfile: UserProfile) => {
    try {
      const updatedProfile = {
        ...newProfile,
        lastUpdated: Date.now(),
      };
      const encryptedData = await encrypt(JSON.stringify(updatedProfile));
      await AsyncStorage.setItem(USER_PROFILE_KEY, encryptedData);
      setProfile(updatedProfile);
      console.log("🔒 User profile encrypted and saved");
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  }, []);

  const setUserName = useCallback(
    async (name: string) => {
      const updatedProfile = {
        ...profile,
        name,
      };
      await saveProfile(updatedProfile);
    },
    [profile, saveProfile]
  );

  const updateUserProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, "name" | "email" | "phoneNumber">>) => {
      const updatedProfile = {
        ...profile,
        ...updates,
      };
      await saveProfile(updatedProfile);
    },
    [profile, saveProfile]
  );

  const addPreference = useCallback(
    async (
      key: string,
      value: string,
      category: UserPreference["category"],
      context?: string
    ) => {
      const existingIndex = profile.preferences.findIndex((p) => p.key === key);
      const newPreference: UserPreference = {
        key,
        value,
        category,
        timestamp: Date.now(),
        context,
      };

      let updatedPreferences: UserPreference[];
      if (existingIndex >= 0) {
        updatedPreferences = [...profile.preferences];
        updatedPreferences[existingIndex] = newPreference;
      } else {
        updatedPreferences = [...profile.preferences, newPreference];
      }

      const updatedProfile = {
        ...profile,
        preferences: updatedPreferences,
      };
      await saveProfile(updatedProfile);
      console.log(`Preference added/updated: ${key} = ${value}`);
    },
    [profile, saveProfile]
  );

  const removePreference = useCallback(
    async (key: string) => {
      const updatedPreferences = profile.preferences.filter((p) => p.key !== key);
      const updatedProfile = {
        ...profile,
        preferences: updatedPreferences,
      };
      await saveProfile(updatedProfile);
      console.log(`Preference removed: ${key}`);
    },
    [profile, saveProfile]
  );

  const getPreferencesByCategory = useCallback(
    (category: UserPreference["category"]): UserPreference[] => {
      return profile.preferences.filter((p) => p.category === category);
    },
    [profile.preferences]
  );

  const getPreference = useCallback(
    (key: string): UserPreference | undefined => {
      return profile.preferences.find((p) => p.key === key);
    },
    [profile.preferences]
  );

  const markSolaraAccessed = useCallback(async () => {
    if (!profile.hasAccessedSolara) {
      const updatedProfile = {
        ...profile,
        hasAccessedSolara: true,
      };
      await saveProfile(updatedProfile);
      console.log("Solara marked as accessed");
      return true;
    }
    return false;
  }, [profile, saveProfile]);

  const clearProfile = useCallback(async () => {
    await saveProfile(DEFAULT_PROFILE);
    console.log("User profile cleared");
  }, [saveProfile]);

  const getProfileSummary = useCallback((): string => {
    if (profile.preferences.length === 0 && !profile.name) {
      return "No user information available yet.";
    }

    let summary = "";
    
    if (profile.name) {
      summary += `User's name: ${profile.name}\n`;
    }
    if (profile.email) {
      summary += `Email: ${profile.email}\n`;
    }
    if (profile.phoneNumber) {
      summary += `Phone: ${profile.phoneNumber}\n`;
    }
    summary += "\n";

    const categories: UserPreference["category"][] = [
      "personal",
      "interest",
      "preference",
      "goal",
      "relationship",
      "other",
    ];

    categories.forEach((category) => {
      const items = getPreferencesByCategory(category);
      if (items.length > 0) {
        summary += `${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
        items.forEach((item) => {
          summary += `- ${item.key}: ${item.value}`;
          if (item.context) {
            summary += ` (${item.context})`;
          }
          summary += "\n";
        });
        summary += "\n";
      }
    });

    return summary.trim();
  }, [profile, getPreferencesByCategory]);

  return useMemo(
    () => ({
      profile,
      isLoading,
      setUserName,
      updateUserProfile,
      addPreference,
      removePreference,
      getPreferencesByCategory,
      getPreference,
      markSolaraAccessed,
      clearProfile,
      getProfileSummary,
    }),
    [
      profile,
      isLoading,
      setUserName,
      updateUserProfile,
      addPreference,
      removePreference,
      getPreferencesByCategory,
      getPreference,
      markSolaraAccessed,
      clearProfile,
      getProfileSummary,
    ]
  );
});
