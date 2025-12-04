import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useMemo, useCallback } from "react";
import { usePersistentStorage } from "@/utils/usePersistentStorage";
import {
  Theme,
  HolidayTheme,
  getActiveHolidayTheme,
  getAllThemes,
  getThemeById,
  DEFAULT_THEMES,
} from "@/constants/themes";

const THEME_KEY = "@app_theme";
const AUTO_THEME_KEY = "@app_auto_theme";

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const { 
    data: storedThemeId, 
    saveData: saveStoredThemeId, 
    isLoading: isThemeLoading 
  } = usePersistentStorage<string>({
    key: THEME_KEY,
    initialValue: DEFAULT_THEMES[0].id,
    encryption: true,
  });

  const {
    data: autoThemeEnabled,
    saveData: saveAutoTheme,
    isLoading: isAutoLoading
  } = usePersistentStorage<boolean>({
    key: AUTO_THEME_KEY,
    initialValue: false,
    encryption: true,
  });

  const [currentTheme, setCurrentTheme] = useState<Theme>(DEFAULT_THEMES[0]);
  const [activeHolidayTheme, setActiveHolidayTheme] = useState<HolidayTheme | null>(null);

  const isLoading = isThemeLoading || isAutoLoading;

  // Effect to determine the current theme based on stored settings and holiday status
  useEffect(() => {
    if (isLoading) return;

    let targetTheme: Theme | null = null;
    let targetHolidayTheme: HolidayTheme | null = null;

    if (autoThemeEnabled) {
      const holidayTheme = getActiveHolidayTheme();
      if (holidayTheme) {
        targetTheme = holidayTheme;
        targetHolidayTheme = holidayTheme;
        console.log("Auto-applied holiday theme:", holidayTheme.name);
      }
    }

    if (!targetTheme) {
      targetTheme = getThemeById(storedThemeId) || DEFAULT_THEMES[0];
    }

    if (targetTheme.id !== currentTheme.id) {
      setCurrentTheme(targetTheme);
    }
    
    if (activeHolidayTheme?.id !== targetHolidayTheme?.id) {
      setActiveHolidayTheme(targetHolidayTheme);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedThemeId, autoThemeEnabled, isLoading]); // Exclude currentTheme/activeHolidayTheme to prevent loops

  // Periodic check for holiday themes
  useEffect(() => {
    if (isLoading || !autoThemeEnabled) return;

    const checkHolidayTheme = () => {
      const holidayTheme = getActiveHolidayTheme();
      
      // If we entered a holiday period
      if (holidayTheme && holidayTheme.id !== activeHolidayTheme?.id) {
        setCurrentTheme(holidayTheme);
        setActiveHolidayTheme(holidayTheme);
        console.log("Holiday theme changed to:", holidayTheme.name);
      } 
      // If we left a holiday period
      else if (!holidayTheme && activeHolidayTheme) {
        const theme = getThemeById(storedThemeId) || DEFAULT_THEMES[0];
        setCurrentTheme(theme);
        setActiveHolidayTheme(null);
        console.log("Holiday theme ended, reverted to:", theme.name);
      }
    };

    const interval = setInterval(checkHolidayTheme, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoading, autoThemeEnabled, activeHolidayTheme, storedThemeId]);

  const setTheme = useCallback(async (themeId: string) => {
    const theme = getThemeById(themeId);
    if (theme) {
      // If we set a theme manually, we should update current theme immediately
      // The effect will also run but that's fine
      setCurrentTheme(theme);
      await saveStoredThemeId(themeId);
      console.log("Theme manually set to:", theme.name);
    }
  }, [saveStoredThemeId]);

  const toggleAutoTheme = useCallback(async (enabled: boolean) => {
    await saveAutoTheme(enabled);
    console.log("Auto-theme toggled:", enabled);
  }, [saveAutoTheme]);

  const availableThemes = useMemo(() => getAllThemes(), []);

  return useMemo(
    () => ({
      theme: currentTheme,
      setTheme,
      autoThemeEnabled,
      toggleAutoTheme,
      availableThemes,
      isLoading,
      activeHolidayTheme,
    }),
    [currentTheme, autoThemeEnabled, availableThemes, isLoading, activeHolidayTheme, setTheme, toggleAutoTheme]
  );
});
