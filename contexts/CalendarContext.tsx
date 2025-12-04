import { useEffect, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { usePersistentStorage } from "@/utils/usePersistentStorage";

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
    if (!calendars || calendars.length === 0) return null;
    return calendars.find(c => c.id === selectedCalendarId) || calendars[0];
  }, [calendars, selectedCalendarId]);

  // Initialization logic for default calendar if none exists
  useEffect(() => {
    if (!isCalendarsLoading && calendars.length === 0) {
      const defaultCalendar = createDefaultCalendar();
      saveCalendars([defaultCalendar]);
      if (!selectedCalendarId) {
        saveSelectedCalendarId(defaultCalendar.id);
      }
    }
  }, [isCalendarsLoading, calendars.length, saveCalendars, selectedCalendarId, saveSelectedCalendarId]);

  const createCalendar = useCallback(async (name: string, isShared: boolean = false) => {
    const newCalendar: Calendar = {
      id: `cal_${Date.now()}`,
      name,
      color: defaultColors[calendars.length % defaultColors.length],
      isShared,
      sharedWith: [],
      owner: "me",
      attachmentSettings: {
        allowDownload: true,
      },
    };
    const updatedCalendars = [...calendars, newCalendar];
    await saveCalendars(updatedCalendars);
    console.log("Calendar created:", newCalendar);
    return newCalendar;
  }, [calendars, saveCalendars]);

  const deleteCalendar = useCallback(async (calendarId: string) => {
    const updatedCalendars = calendars.filter((cal) => cal.id !== calendarId);
    await saveCalendars(updatedCalendars);

    const updatedEvents = events.filter((event) => event.calendarId !== calendarId);
    await saveEvents(updatedEvents);

    if (selectedCalendarId === calendarId) {
      const newSelected = updatedCalendars[0] || null;
      await saveSelectedCalendarId(newSelected ? newSelected.id : null);
    }
    console.log("Calendar deleted:", calendarId);
  }, [calendars, events, saveCalendars, saveEvents, selectedCalendarId, saveSelectedCalendarId]);

  const setSelectedCalendar = useCallback(async (calendar: Calendar | null) => {
     await saveSelectedCalendarId(calendar ? calendar.id : null);
  }, [saveSelectedCalendarId]);

  const shareCalendar = useCallback(async (calendarId: string, userEmail: string) => {
    const calendarToShare = calendars.find((cal) => cal.id === calendarId);
    if (!calendarToShare) return;

    const updatedCalendar: Calendar = {
      ...calendarToShare,
      isShared: true,
      sharedWith: [...calendarToShare.sharedWith, userEmail],
    };

    const updatedCalendars = calendars.map((cal) =>
      cal.id === calendarId ? updatedCalendar : cal
    );

    await saveCalendars(updatedCalendars);
    console.log(`Calendar ${calendarId} shared with ${userEmail}`);
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
    const newEvent: CalendarEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    // Check for duplicate prevention
    const isDuplicate = events.some(e => 
      e.title === newEvent.title && 
      e.date === newEvent.date && 
      e.time === newEvent.time &&
      e.calendarId === newEvent.calendarId
    );
    
    if (isDuplicate) {
      console.warn("⚠️ Duplicate event detected, skipping add");
      return newEvent;
    }
    
    const updatedEvents = [...events, newEvent];
    await saveEvents(updatedEvents);
    
    console.log("✅ Event added:", {
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      id: newEvent.id
    });
    
    return newEvent;
  }, [events, saveEvents]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    const updatedEvents = events.map((event) =>
      event.id === eventId ? { ...event, ...updates } : event
    );
    await saveEvents(updatedEvents);
    console.log("Event updated:", eventId);
  }, [events, saveEvents]);

  const deleteEvent = useCallback(async (eventId: string) => {
    // Only delete if explicitly requested by user
    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) {
      console.warn("Event not found for deletion:", eventId);
      return;
    }
    
    console.log("🗑️ Deleting event:", eventToDelete.title, "ID:", eventId);
    const updatedEvents = events.filter((event) => event.id !== eventId);
    await saveEvents(updatedEvents);
    console.log("✅ Event deleted successfully:", eventId);
  }, [events, saveEvents]);

  const getEventsForCalendar = useCallback((calendarId: string): CalendarEvent[] => {
    return events.filter((event) => event.calendarId === calendarId);
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
