export type NotificationSound = {
  id: string;
  name: string;
  assetId: string;
};

export const NOTIFICATION_SOUNDS: NotificationSound[] = [
  { id: 'default', name: 'Default', assetId: 'default' },
  { id: 'shining_stars', name: 'Shining Stars', assetId: 'shining_stars_alert_1' },
  { id: 'festival', name: 'Festival', assetId: 'festival_alert_1' },
  { id: 'futuristic', name: 'Futuristic', assetId: 'futuristic_alert_1' },
  { id: 'piano', name: 'Piano', assetId: 'piano_alert_1' },
  { id: 'violin', name: 'Violin', assetId: 'violin_alert_1' },
  { id: 'thinking', name: 'Thinking About You', assetId: 'thinking_about_you_1' },
  { id: 'calendar', name: 'Calendar Alert', assetId: 'calendar_alert_1' },
];

export const getNotificationSound = (id: string) => {
  return NOTIFICATION_SOUNDS.find(sound => sound.id === id) || NOTIFICATION_SOUNDS[0];
};
