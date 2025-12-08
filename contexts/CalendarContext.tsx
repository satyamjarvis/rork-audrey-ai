import { useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { usePersistentStorage } from "@/utils/usePersistentStorage";
import { ensureArray, ensureString, safeFilterArray, safeFindInArray } from "@/utils/resilience";

export type AttachmentPermissions = 'edit_download' | 'view_download' | 'view_only';

export type Attachment = {
  id: string;
  name: string;
  type: string;
  uri: string;
  size: number;
  uploadedAt: string;
  permissions?: AttachmentPermissions;
  sourceFeature?: 'analytics' | 'planner' | 'notes' | 'mindmap' | 'external';
  sourceId?: string;
  metadata?: {
    trackerType?: string;
    taskId?: string;
    noteId?: string;
    mindmapId?: string;
    [key: string]: any;
  };
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  calendarId: string;
  starredFromPlanner?: boolean;
  plannerSource?: 'yearly' | 'monthly' | 'weekly' | 'daily';
  category?: string;
  priority?: string;
  attachments?: Attachment[];
};

export type Calendar = {
  id: string;
  name: string;
  color: string;
  isShared: boolean;
  sharedWith: string[];
  owner: string;
  attachmentSettings?: {
    allowDownload: boolean;
  };
};

const CALENDARS_KEY = "@calendars";
const EVENTS_KEY = "@calendar_events";
const BACKGROUND_KEY = "@calendar_background";
const SELECTED_CALENDAR_KEY = "@selected_calendar";

const defaultColors = [
  "#667EEA",
  "#4FACFE",
  "#FA709A",
  "#F093FB",
  "#30CFD0",
  "#FFB84D",
  "#A18CD1",
];

const createDefaultCalendar = (): Calendar => ({
  id: `cal_${Date.now()}`,
  name: "My Calendar",
  color: defaultColors[0],
  isShared: false,
  sharedWith: [],
  owner: "me",
});

export const [CalendarProvider, useCalendar] = createContextHook(() => {
  // 1. Calendars Storage
  const {
    data: calendars,
    saveData: saveCalendars,
    isLoading: isCalendarsLoading
  } = usePersistentStorage<Calendar[]>({
    key: CALENDARS_KEY,
    initialValue: [], // We'll handle default initialization in useEffect
    encryption: true,
  });

  // 2. Events Storage (with backup)
  const {
    data: events,
    saveData: saveEvents,
    isLoading: isEventsLoading
  } = usePersistentStorage<CalendarEvent[]>({
    key: EVENTS_KEY,
    initialValue: [],
    encryption: true,
    backup: true, // Enable automatic backups
    backupInterval: 60000, // Backup every minute
  });

  // 3. Selected Calendar ID
  const {
    data: selectedCalendarId,
    saveData: saveSelectedCalendarId,
    isLoading: isSelectedLoading
  } = usePersistentStorage<string | null>({
    key: SELECTED_CALENDAR_KEY,
    initialValue: null,
    encryption: true,
  });

  // 4. Background Storage
  const {
    data: selectedBackground,
    saveData: setBackground,
    isLoading: isBackgroundLoading
  } = usePersistentStorage<string>({
    key: BACKGROUND_KEY,
    initialValue: "default",
    encryption: true,
  });

  const isLoading = isCalendarsLoading || isEventsLoading || isSelectedLoading || isBackgroundLoading;

  // Derived state for selected calendar object
  const selectedCalendar = useMemo(() => {
    try {
      const safeCalendars = ensureArray<Calendar>(calendars, []);
      if (safeCalendars.length === 0) return null;
      return safeFindInArray(safeCalendars, c => c && c.id === selectedCalendarId, safeCalendars[0]);
    } catch (error) {
      console.error('[CalendarContext] selectedCalendar error:', error);
      return null;
    }
  }, [calendars, selectedCalendarId]);

  // Initialization logic for default calendar if none exists
  useEffect(() => {
    try {
      const safeCalendars = ensureArray<Calendar>(calendars, []);
      if (!isCalendarsLoading && safeCalendars.length === 0) {
        const defaultCalendar = createDefaultCalendar();
        saveCalendars([defaultCalendar]);
        if (!selectedCalendarId) {
          saveSelectedCalendarId(defaultCalendar.id);
        }
      }
    } catch (error) {
      console.error('[CalendarContext] Initialization error:', error);
    }
  }, [isCalendarsLoading, calendars, saveCalendars, selectedCalendarId, saveSelectedCalendarId]);

  const createCalendar = useCallback(async (name: string, isShared: boolean = false) => {
    try {
      const safeCalendars = ensureArray<Calendar>(calendars, []);
      const newCalendar: Calendar = {
        id: `cal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: ensureString(name, 'New Calendar'),
        color: defaultColors[safeCalendars.length % defaultColors.length],
        isShared,
        sharedWith: [],
        owner: "me",
        attachmentSettings: {
          allowDownload: true,
        },
      };
      const updatedCalendars = [...safeCalendars, newCalendar];
      await saveCalendars(updatedCalendars);
      console.log("Calendar created:", newCalendar);
      return newCalendar;
    } catch (error) {
      console.error('[CalendarContext] createCalendar error:', error);
      throw error;
    }
  }, [calendars, saveCalendars]);

  const deleteCalendar = useCallback(async (calendarId: string) => {
    try {
      if (!calendarId) {
        console.warn('[CalendarContext] deleteCalendar: calendarId is required');
        return;
      }
      const safeCalendars = ensureArray<Calendar>(calendars, []);
      const safeEvents = ensureArray<CalendarEvent>(events, []);
      
      const updatedCalendars = safeFilterArray(safeCalendars, (cal) => cal && cal.id !== calendarId, []);
      await saveCalendars(updatedCalendars);

      const updatedEvents = safeFilterArray(safeEvents, (event) => event && event.calendarId !== calendarId, []);
      await saveEvents(updatedEvents);

      if (selectedCalendarId === calendarId) {
        const newSelected = updatedCalendars[0] || null;
        await saveSelectedCalendarId(newSelected ? newSelected.id : null);
      }
      console.log("Calendar deleted:", calendarId);
    } catch (error) {
      console.error('[CalendarContext] deleteCalendar error:', error);
    }
  }, [calendars, events, saveCalendars, saveEvents, selectedCalendarId, saveSelectedCalendarId]);

  const setSelectedCalendar = useCallback(async (calendar: Calendar | null) => {
     await saveSelectedCalendarId(calendar ? calendar.id : null);
  }, [saveSelectedCalendarId]);

  const shareCalendar = useCallback(async (calendarId: string, userEmail: string) => {
    try {
      if (!calendarId || !userEmail) {
        console.warn('[CalendarContext] shareCalendar: calendarId and userEmail are required');
        return;
      }
      const safeCalendars = ensureArray<Calendar>(calendars, []);
      const calendarToShare = safeFindInArray(safeCalendars, (cal) => cal && cal.id === calendarId);
      if (!calendarToShare) return;

      const updatedCalendar: Calendar = {
        ...calendarToShare,
        isShared: true,
        sharedWith: [...ensureArray(calendarToShare.sharedWith, []), userEmail],
      };

      const updatedCalendars = safeCalendars.map((cal) =>
        cal && cal.id === calendarId ? updatedCalendar : cal
      );

      await saveCalendars(updatedCalendars);
      console.log(`Calendar ${calendarId} shared with ${userEmail}`);
    } catch (error) {
      console.error('[CalendarContext] shareCalendar error:', error);
    }
  }, [calendars, saveCalendars]);

  const unshareCalendar = useCallback(async (calendarId: string, userEmail: string) => {
    const calendar = calendars.find((cal) => cal.id === calendarId);
    if (!calendar) return;

    const updatedCalendar: Calendar = {
      ...calendar,
      sharedWith: calendar.sharedWith.filter((email) => email !== userEmail),
      isShared: calendar.sharedWith.length > 1,
    };

    const updatedCalendars = calendars.map((cal) =>
      cal.id === calendarId ? updatedCalendar : cal
    );

    await saveCalendars(updatedCalendars);
    console.log(`Calendar ${calendarId} unshared with ${userEmail}`);
  }, [calendars, saveCalendars]);

  const addEvent = useCallback(async (event: Omit<CalendarEvent, "id">) => {
    try {
      if (!event || !event.calendarId) {
        console.warn('[CalendarContext] addEvent: valid event with calendarId is required');
        throw new Error('Invalid event data');
      }
      
      const newEvent: CalendarEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: ensureString(event.title, 'Untitled Event'),
      };
      
      const safeEvents = ensureArray<CalendarEvent>(events, []);
      
      // Check for duplicate prevention
      const isDuplicate = safeEvents.some(e => 
        e && e.title === newEvent.title && 
        e.date === newEvent.date && 
        e.time === newEvent.time &&
        e.calendarId === newEvent.calendarId
      );
      
      if (isDuplicate) {
        console.warn("⚠️ Duplicate event detected, skipping add");
        return newEvent;
      }
      
      const updatedEvents = [...safeEvents, newEvent];
      await saveEvents(updatedEvents);
      
      console.log("✅ Event added:", {
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        id: newEvent.id
      });
      
      return newEvent;
    } catch (error) {
      console.error('[CalendarContext] addEvent error:', error);
      throw error;
    }
  }, [events, saveEvents]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      if (!eventId) {
        console.warn('[CalendarContext] updateEvent: eventId is required');
        return;
      }
      const safeEvents = ensureArray<CalendarEvent>(events, []);
      const updatedEvents = safeEvents.map((event) =>
        event && event.id === eventId ? { ...event, ...updates } : event
      );
      await saveEvents(updatedEvents);
      console.log("Event updated:", eventId);
    } catch (error) {
      console.error('[CalendarContext] updateEvent error:', error);
    }
  }, [events, saveEvents]);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      if (!eventId) {
        console.warn('[CalendarContext] deleteEvent: eventId is required');
        return;
      }
      const safeEvents = ensureArray<CalendarEvent>(events, []);
      // Only delete if explicitly requested by user
      const eventToDelete = safeFindInArray(safeEvents, e => e && e.id === eventId);
      if (!eventToDelete) {
        console.warn("Event not found for deletion:", eventId);
        return;
      }
      
      console.log("🗑️ Deleting event:", eventToDelete.title, "ID:", eventId);
      const updatedEvents = safeFilterArray(safeEvents, (event) => event && event.id !== eventId, []);
      await saveEvents(updatedEvents);
      console.log("✅ Event deleted successfully:", eventId);
    } catch (error) {
      console.error('[CalendarContext] deleteEvent error:', error);
    }
  }, [events, saveEvents]);

  const getEventsForCalendar = useCallback((calendarId: string): CalendarEvent[] => {
    try {
      if (!calendarId) return [];
      const safeEvents = ensureArray<CalendarEvent>(events, []);
      return safeFilterArray(safeEvents, (event) => event && event.calendarId === calendarId, []);
    } catch (error) {
      console.error('[CalendarContext] getEventsForCalendar error:', error);
      return [];
    }
  }, [events]);

  const updateCalendarSettings = useCallback(async (calendarId: string, settings: { allowDownload: boolean }) => {
    const updatedCalendars = calendars.map((cal) =>
      cal.id === calendarId
        ? { ...cal, attachmentSettings: { ...cal.attachmentSettings, ...settings } as { allowDownload: boolean } }
        : cal
    );
    await saveCalendars(updatedCalendars);
    console.log("Calendar settings updated:", calendarId);
  }, [calendars, saveCalendars]);

  return useMemo(
    () => ({
      calendars,
      events,
      selectedCalendar,
      isLoading,
      setSelectedCalendar,
      createCalendar,
      deleteCalendar,
      shareCalendar,
      unshareCalendar,
      addEvent,
      updateEvent,
      deleteEvent,
      getEventsForCalendar,
      selectedBackground,
      setBackground,
      updateCalendarSettings,
    }),
    [
      calendars,
      events,
      selectedCalendar,
      isLoading,
      setSelectedCalendar,
      createCalendar,
      deleteCalendar,
      shareCalendar,
      unshareCalendar,
      addEvent,
      updateEvent,
      deleteEvent,
      getEventsForCalendar,
      selectedBackground,
      setBackground,
      updateCalendarSettings,
    ]
  );
});
