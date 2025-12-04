/**
 * Complete list of AsyncStorage keys used throughout the app
 * These keys represent persistent data that should be retained until manually deleted
 */

export const STORAGE_KEYS = {
  // Notes and Documents
  NOTES_DATA: "@notes_data",
  
  // Todo Lists
  TODO_ITEMS: "@todo_items",
  
  // Planner
  PLANNER_TASKS: "@planner_tasks",
  
  // Password Manager
  PASSWORDS_STORAGE: "@passwords_storage",
  SECURITY_SETTINGS: "@security_settings",
  
  // Morning Routines
  MORNING_HABITS: "@morning_habits",
  LAST_HABITS_RESET: "@last_habits_reset",
  MORNING_AFFIRMATIONS: "@morning_affirmations",
  FAVORITE_AFFIRMATIONS: "@favorite_affirmations",
  DAILY_AFFIRMATION: "@daily_affirmation",
  DAILY_AFFIRMATION_DATE: "@daily_affirmation_date",
  
  // Meditation
  MEDITATION_SESSIONS: "@meditation_sessions",
  MEDITATION_STREAK: "@meditation_streak",
  MEDITATION_GOALS: "@meditation_goals",
  
  // Wellness and Health
  WELLNESS_ENTRIES: "@wellness_entries",
  GRATITUDE_MOMENTS: "@gratitude_moments",
  DREAM_JOURNAL: "@dream_journal",
  FEELINGS_LOG: "@feelings_log",
  TOMORROWS_INTENTIONS: "@tomorrows_intentions",
  
  // Calendar and Scheduling
  SCHEDULE_EVENTS: "@schedule_events",
  CALENDAR_EVENTS: "@calendar_events",
  CALENDAR_SETTINGS: "@calendar_settings",
  
  // Learning Platform
  LEARN_DATA: "@learn_data",
  COURSE_PROGRESS: "@course_progress",
  VIDEO_BOOKMARKS: "@video_bookmarks",
  
  // Phonebook and Contacts
  PHONEBOOK_CONTACTS: "@phonebook_contacts",
  PHONEBOOK_GROUPS: "@phonebook_groups",
  
  // Chat and Messages
  CHAT_MESSAGES: "@chat_messages",
  CHAT_HISTORY: "@chat_history",
  
  // User Profile and Settings
  USER_PROFILE: "@user_profile",
  USER_PREFERENCES: "@user_preferences",
  THEME_SETTINGS: "@theme_settings",
  LANGUAGE_SETTINGS: "@language_settings",
  FONT_SIZE_SETTINGS: "@font_size_settings",
  NOTIFICATION_SETTINGS: "@notification_settings",
  
  // Audrey Memory System
  AUDREY_MEMORY: "@audrey_memory",
  AUDREY_CONTEXT: "@audrey_context",
  
  // Music and Audio
  MUSIC_SETTINGS: "@music_settings",
  AUDIO_STYLE_SETTINGS: "@audio_style_settings",
  
  // Finance and Wealth
  FINANCE_TRANSACTIONS: "@finance_transactions",
  WEALTH_GOALS: "@wealth_goals",
  WEALTH_MANIFESTING: "@wealth_manifesting",
  
  // Statistics and Analytics
  STATISTICS_DATA: "@statistics_data",
  ANALYTICS_METRICS: "@analytics_metrics",
  
  // Sharing
  SHARED_ITEMS: "@shared_items",
  SHARE_HISTORY: "@share_history",
  
  // Universe Mode
  UNIVERSE_MODE_SETTINGS: "@universe_mode_settings",
  
  // Onboarding
  ONBOARDING_COMPLETE: "@onboarding_complete",
  SUBSCRIPTION_STATUS: "@subscription_status",
} as const;

/**
 * Helper to check if string is valid base64
 */
const isValidBase64 = (str: string): boolean => {
  if (!str || str.length === 0) return false;
  // Base64 strings should only contain A-Z, a-z, 0-9, +, /, and = for padding
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str) && str.length % 4 === 0;
};

/**
 * Function to validate if data in storage is corrupted
 */
export const isCorruptedData = (data: string | null): boolean => {
  if (!data || data.trim() === '') return true;
  if (data === 'undefined' || data === 'null') return true;
  if (data.includes('[object') || data.startsWith('object')) return true;
  if (data.includes('�')) return true; // Binary data marker
  
  const trimmed = data.trim();
  // Check for SHA256 hash (corrupted encryption)
  if (/^[a-f0-9]{64}$/i.test(trimmed)) return true;
  // Check for question mark corruption from unrecognized tokens
  if (trimmed === '?' || /^[?\s]+$/.test(trimmed)) return true;
  
  // First, try to parse as JSON (unencrypted data)
  try {
    JSON.parse(data);
    return false;
  } catch {
    // Not valid JSON - check if it's valid base64 (encrypted data)
    if (isValidBase64(trimmed)) {
      // Valid base64 means it's likely encrypted data, not corrupted
      return false;
    }
    // Neither valid JSON nor valid base64 - corrupted
    return true;
  }
};

/**
 * Function to get all app storage keys
 */
export const getAllStorageKeys = (): string[] => {
  return Object.values(STORAGE_KEYS);
};

/**
 * Function to check if a key is a valid app storage key
 */
export const isValidStorageKey = (key: string): boolean => {
  return Object.values(STORAGE_KEYS).includes(key as any);
};