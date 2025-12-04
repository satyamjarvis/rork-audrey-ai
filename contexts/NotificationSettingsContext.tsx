import { useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { usePersistentStorage } from "@/utils/usePersistentStorage";

export type NotificationSettings = {
  enabled: boolean;
  messagesEnabled: boolean;
  timeBefore: number;
  timeBeforeUnit: 'minutes' | 'hours' | 'days';
  snoozeTime: number;
  snoozeUnit: 'minutes' | 'hours';
  calendarSound: string;
  messageSound: string;
  notificationSound: string;
  plannerSound: string;
};

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  messagesEnabled: true,
  timeBefore: 15,
  timeBeforeUnit: 'minutes',
  snoozeTime: 5,
  snoozeUnit: 'minutes',
  calendarSound: 'default',
  messageSound: 'default',
  notificationSound: 'default',
  plannerSound: 'default',
};

export const [NotificationSettingsProvider, useNotificationSettings] = createContextHook(() => {
  const {
    data: settings,
    saveData: saveSettings,
    isLoading
  } = usePersistentStorage<NotificationSettings>({
    key: NOTIFICATION_SETTINGS_KEY,
    initialValue: DEFAULT_SETTINGS,
  });

  const updateSettings = useCallback(async (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...settings, ...updates };
    await saveSettings(newSettings);
    console.log('[NotificationSettings] Updated settings:', newSettings);
  }, [settings, saveSettings]);

  const resetSettings = useCallback(async () => {
    await saveSettings(DEFAULT_SETTINGS);
    console.log('[NotificationSettings] Reset to defaults');
  }, [saveSettings]);

  return useMemo(
    () => ({
      settings,
      isLoading,
      updateSettings,
      resetSettings,
    }),
    [settings, isLoading, updateSettings, resetSettings]
  );
});
