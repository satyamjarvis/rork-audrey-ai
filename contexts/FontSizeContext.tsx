import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { encrypt, decrypt } from "@/utils/encryption";

const FONT_SIZE_KEY = "@app_font_size";

export type FontSizeScale = "small" | "medium" | "large" | "xlarge" | "xxlarge";

export type FontSizeConfig = {
  scale: FontSizeScale;
  multiplier: number;
  name: string;
  description: string;
};

const FONT_SIZE_OPTIONS: FontSizeConfig[] = [
  {
    scale: "small",
    multiplier: 0.9,
    name: "Small",
    description: "Compact text",
  },
  {
    scale: "medium",
    multiplier: 1.0,
    name: "Medium (Default)",
    description: "Standard size",
  },
  {
    scale: "large",
    multiplier: 1.15,
    name: "Large",
    description: "Easier to read",
  },
  {
    scale: "xlarge",
    multiplier: 1.3,
    name: "Extra Large",
    description: "Enhanced readability",
  },
  {
    scale: "xxlarge",
    multiplier: 1.5,
    name: "XXL",
    description: "Maximum readability",
  },
];

export const [FontSizeProvider, useFontSize] = createContextHook(() => {
  const [currentScale, setCurrentScale] = useState<FontSizeScale>("medium");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadFontSize() {
      try {
        const storedScaleRaw = await AsyncStorage.getItem(FONT_SIZE_KEY);
        if (storedScaleRaw) {
          let storedScale = storedScaleRaw;
          try {
            storedScale = await decrypt(storedScaleRaw);
            console.log("🔓 Font size decrypted successfully");
          } catch {
            console.log("⚠️ Loaded unencrypted font size, will encrypt on next save");
          }
          
          if (isValidFontSize(storedScale)) {
            setCurrentScale(storedScale as FontSizeScale);
            console.log("Font size loaded:", storedScale);
          }
        }
      } catch (error) {
        console.error("Error loading font size:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFontSize();
  }, []);

  const isValidFontSize = (scale: string): boolean => {
    return FONT_SIZE_OPTIONS.some((option) => option.scale === scale);
  };

  const setFontSize = useCallback(async (scale: FontSizeScale) => {
    setCurrentScale(scale);
    const encrypted = await encrypt(scale);
    await AsyncStorage.setItem(FONT_SIZE_KEY, encrypted);
    console.log("🔒 Font size encrypted and saved:", scale);
  }, []);

  const currentConfig = useMemo(
    () =>
      FONT_SIZE_OPTIONS.find((option) => option.scale === currentScale) ||
      FONT_SIZE_OPTIONS[1],
    [currentScale]
  );

  const getFontSize = useCallback(
    (baseSize: number): number => {
      return Math.round(baseSize * currentConfig.multiplier);
    },
    [currentConfig.multiplier]
  );

  return useMemo(
    () => ({
      scale: currentScale,
      config: currentConfig,
      multiplier: currentConfig.multiplier,
      options: FONT_SIZE_OPTIONS,
      setFontSize,
      getFontSize,
      isLoading,
    }),
    [currentScale, currentConfig, getFontSize, setFontSize, isLoading]
  );
});
