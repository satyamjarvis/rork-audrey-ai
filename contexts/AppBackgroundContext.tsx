import { useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { usePersistentStorage } from "@/utils/usePersistentStorage";
import { CALENDAR_BACKGROUNDS, CalendarBackground } from "@/constants/calendarBackgrounds";

const APP_BACKGROUND_KEY = "@app_global_background";

export const [AppBackgroundProvider, useAppBackground] = createContextHook(() => {
  const {
    data: selectedBackgroundId,
    saveData: setBackgroundId,
    isLoading,
  } = usePersistentStorage<string>({
    key: APP_BACKGROUND_KEY,
    initialValue: "default",
    encryption: true,
  });

  const selectedBackground = useMemo((): CalendarBackground => {
    return CALENDAR_BACKGROUNDS.find(bg => bg.id === selectedBackgroundId) || CALENDAR_BACKGROUNDS[0];
  }, [selectedBackgroundId]);

  const setBackground = useCallback(async (backgroundId: string) => {
    console.log("[AppBackground] Setting global background to:", backgroundId);
    await setBackgroundId(backgroundId);
  }, [setBackgroundId]);

  const hasCustomBackground = useMemo(() => {
    return selectedBackgroundId !== "default";
  }, [selectedBackgroundId]);

  return useMemo(
    () => ({
      selectedBackgroundId,
      selectedBackground,
      setBackground,
      isLoading,
      hasCustomBackground,
      backgrounds: CALENDAR_BACKGROUNDS,
    }),
    [selectedBackgroundId, selectedBackground, setBackground, isLoading, hasCustomBackground]
  );
});
