import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { Audio } from "expo-av";
import { Platform } from "react-native";
import { encrypt, decrypt } from "@/utils/encryption";

const UNIVERSE_MODE_KEY = "@universeMode";

export type UniverseMode = "classic" | "universe";

export const [UniverseModeProvider, useUniverseMode] = createContextHook(() => {
  const [mode, setModeState] = useState<UniverseMode>("classic");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const loadMode = async () => {
      try {
        console.log("[UniverseModeContext] Loading universe mode...");
        const storedRaw = await AsyncStorage.getItem(UNIVERSE_MODE_KEY);
        if (storedRaw) {
          let stored = storedRaw;
          try {
            stored = await decrypt(storedRaw);
            console.log("🔓 Universe mode decrypted successfully");
          } catch {
            console.log("⚠️ Loaded unencrypted universe mode, will encrypt on next save");
          }
          const parsedMode = stored as UniverseMode;
          console.log("[UniverseModeContext] Loaded mode:", parsedMode);
          setModeState(parsedMode);
        }
      } catch (error) {
        console.error("[UniverseModeContext] Error loading mode:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMode();
  }, []);

  const playUniverseSound = useCallback(async () => {
    try {
      console.log('[UniverseMode] Playing activation sound');
      
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      }
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://rork.app/pa/ier8mze8ucoqq9oktvadp/piano_2' },
        { shouldPlay: true, volume: 0.7 }
      );
      soundRef.current = sound;
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('[UniverseMode] Error playing sound:', error);
    }
  }, []);

  const setMode = useCallback(async (newMode: UniverseMode) => {
    try {
      console.log("[UniverseModeContext] Setting mode to:", newMode);
      
      if (newMode === 'universe') {
        await playUniverseSound();
      }
      
      const encrypted = await encrypt(newMode);
      await AsyncStorage.setItem(UNIVERSE_MODE_KEY, encrypted);
      setModeState(newMode);
      console.log("🔒 Universe mode encrypted and saved");
    } catch (error) {
      console.error("[UniverseModeContext] Error saving mode:", error);
    }
  }, [playUniverseSound]);

  const toggleMode = useCallback(async () => {
    const newMode = mode === "classic" ? "universe" : "classic";
    await setMode(newMode);
  }, [mode, setMode]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return useMemo(() => ({
    mode,
    setMode,
    toggleMode,
    isLoading,
  }), [mode, setMode, toggleMode, isLoading]);
});
