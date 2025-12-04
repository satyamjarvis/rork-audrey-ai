import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { encryptMessage, decryptMessage, EncryptedData } from "@/utils/encryption";
import { Attachment } from "@/contexts/CalendarContext";

export type ScheduleEventType = "meeting" | "appointment" | "task" | "reminder" | "deadline" | "personal";

export type ScheduleParticipant = {
  email: string;
  name: string;
  status: "pending" | "accepted" | "declined";
  hasAccess: boolean;
};

export type RecurrenceRule = {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
};

export type ScheduleEvent = {
  id: string;
  title: string;
  description?: string;
  type: ScheduleEventType;
  startDate: string;
  endDate: string;
  location?: string;
  participants: ScheduleParticipant[];
  calendarId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  isEncrypted: boolean;
  encryptedData?: EncryptedData;
  recurrence?: RecurrenceRule;
  color: string;
  reminder?: {
    enabled: boolean;
    minutesBefore: number;
  };
  attachments?: Attachment[];
  notes?: string;
};

const SCHEDULE_EVENTS_KEY = "@schedule_events";

export const [SchedulingProvider, useScheduling] = createContextHook(() => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedView, setSelectedView] = useState<"week" | "month">("week");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const eventsData = await AsyncStorage.getItem(SCHEDULE_EVENTS_KEY);
      
      if (eventsData && eventsData.trim() !== "") {
        try {
          if (eventsData.startsWith('[object')) {
            console.error("Invalid events data format, resetting");
            await AsyncStorage.removeItem(SCHEDULE_EVENTS_KEY);
            await AsyncStorage.setItem(SCHEDULE_EVENTS_KEY, JSON.stringify([]));
            setEvents([]);
          } else {
            const parsedEvents = JSON.parse(eventsData);
            
            if (Array.isArray(parsedEvents)) {
              const validEvents = parsedEvents.filter(event => 
                event && typeof event === 'object' && 'id' in event && 'title' in event
              );
              setEvents(validEvents);
              console.log(`Loaded ${validEvents.length} schedule events`);
            } else {
              console.warn("Invalid events format, resetting");
              await AsyncStorage.setItem(SCHEDULE_EVENTS_KEY, JSON.stringify([]));
              setEvents([]);
            }
          }
        } catch (jsonError) {
          console.error("JSON parse error in schedule events, resetting:", jsonError);
          console.error("Corrupted data:", eventsData && eventsData.length > 0 ? eventsData.substring(0, Math.min(100, eventsData.length)) : '');
          await AsyncStorage.setItem(SCHEDULE_EVENTS_KEY, JSON.stringify([]));
          setEvents([]);
        }
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Error loading schedule events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveEvents = useCallback(async (newEvents: ScheduleEvent[]) => {
    try {
      await AsyncStorage.setItem(SCHEDULE_EVENTS_KEY, JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      console.error("Error saving schedule events:", error);
    }
  }, []);

  const addEvent = useCallback(async (
    event: Omit<ScheduleEvent, "id" | "createdAt" | "updatedAt">,
    encrypt: boolean = true
  ) => {
    try {
      let encryptedData: EncryptedData | undefined;
      
      if (encrypt && event.calendarId) {
        const dataToEncrypt = JSON.stringify({
          title: event.title,
          description: event.description,
          location: event.location,
          notes: event.notes,
        });
        
        encryptedData = await encryptMessage(dataToEncrypt);
      }

      const newEvent: ScheduleEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isEncrypted: encrypt,
        encryptedData: encryptedData,
      };

      const updatedEvents = [...events, newEvent];
      await saveEvents(updatedEvents);
      console.log("✅ Schedule event created:", newEvent.id);
      return newEvent;
    } catch (error) {
      console.error("❌ Error adding schedule event:", error);
      throw error;
    }
  }, [events, saveEvents]);

  const updateEvent = useCallback(async (
    eventId: string,
    updates: Partial<ScheduleEvent>
  ) => {
    try {
      const updatedEvents = events.map((event) =>
        event.id === eventId
          ? { ...event, ...updates, updatedAt: Date.now() }
          : event
      );
      await saveEvents(updatedEvents);
      console.log("✅ Schedule event updated:", eventId);
    } catch (error) {
      console.error("❌ Error updating schedule event:", error);
      throw error;
    }
  }, [events, saveEvents]);

  const deleteEvent = useCallback(async (eventId: string) => {
    const updatedEvents = events.filter((event) => event.id !== eventId);
    await saveEvents(updatedEvents);
    console.log("✅ Schedule event deleted:", eventId);
  }, [events, saveEvents]);

  const shareEvent = useCallback(async (
    eventId: string,
    participantEmail: string,
    participantName: string
  ) => {
    const event = events.find(e => e.id === eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const newParticipant: ScheduleParticipant = {
      email: participantEmail,
      name: participantName,
      status: "pending",
      hasAccess: true,
    };

    const updatedParticipants = [...event.participants, newParticipant];
    await updateEvent(eventId, { participants: updatedParticipants });
    console.log("✅ Event shared with:", participantEmail);
  }, [events, updateEvent]);

  const updateParticipantStatus = useCallback(async (
    eventId: string,
    participantEmail: string,
    status: "accepted" | "declined"
  ) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const updatedParticipants = event.participants.map(p =>
      p.email === participantEmail ? { ...p, status } : p
    );

    await updateEvent(eventId, { participants: updatedParticipants });
    console.log(`✅ Participant ${participantEmail} ${status} event`);
  }, [events, updateEvent]);

  const getDecryptedEvent = useCallback(async (event: ScheduleEvent): Promise<Partial<ScheduleEvent>> => {
    if (!event.isEncrypted || !event.encryptedData) {
      return event;
    }
    
    try {
      const calendarEvents = events
        .filter(e => e.calendarId === event.calendarId)
        .sort((a, b) => a.createdAt - b.createdAt);
      const eventIndex = calendarEvents.findIndex(e => e.id === event.id);
      
      if (eventIndex === -1) {
        console.warn("⚠️ Event not found in calendar events list, using unencrypted data");
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          type: event.type,
          startDate: event.startDate,
          endDate: event.endDate,
          color: event.color,
          calendarId: event.calendarId,
          participants: event.participants,
          createdBy: event.createdBy,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          isEncrypted: event.isEncrypted,
        };
      }
      
      const decryptedDataStr = await decryptMessage(event.encryptedData);
      
      if (!decryptedDataStr || decryptedDataStr.trim() === '') {
        console.warn("⚠️ Empty decrypted data, using unencrypted data");
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          type: event.type,
          startDate: event.startDate,
          endDate: event.endDate,
          color: event.color,
          calendarId: event.calendarId,
          participants: event.participants,
          createdBy: event.createdBy,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          isEncrypted: event.isEncrypted,
        };
      }
      
      const cleanedStr = decryptedDataStr.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
      if (cleanedStr === '' || cleanedStr.includes('�')) {
        console.warn("⚠️ Decrypted data contains invalid characters, using unencrypted data");
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          type: event.type,
          startDate: event.startDate,
          endDate: event.endDate,
          color: event.color,
          calendarId: event.calendarId,
          participants: event.participants,
          createdBy: event.createdBy,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          isEncrypted: event.isEncrypted,
        };
      }
      
      try {
        const decryptedData = JSON.parse(cleanedStr);
        
        return {
          ...event,
          title: decryptedData.title || event.title,
          description: decryptedData.description || event.description,
          location: decryptedData.location || event.location,
          notes: decryptedData.notes || event.notes,
        };
      } catch (parseError) {
        console.error("❌ Error parsing decrypted data:", parseError);
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          type: event.type,
          startDate: event.startDate,
          endDate: event.endDate,
          color: event.color,
          calendarId: event.calendarId,
          participants: event.participants,
          createdBy: event.createdBy,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          isEncrypted: event.isEncrypted,
        };
      }
    } catch (error) {
      console.error("❌ Error decrypting event:", error);
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        type: event.type,
        startDate: event.startDate,
        endDate: event.endDate,
        color: event.color,
        calendarId: event.calendarId,
        participants: event.participants,
        createdBy: event.createdBy,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        isEncrypted: event.isEncrypted,
      };
    }
  }, [events]);

  const getEventsForCalendar = useCallback((calendarId: string): ScheduleEvent[] => {
    return events
      .filter(event => event.calendarId === calendarId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events]);

  const getEventsForDateRange = useCallback((startDate: Date, endDate: Date): ScheduleEvent[] => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (eventStart >= startDate && eventStart <= endDate) ||
             (eventEnd >= startDate && eventEnd <= endDate) ||
             (eventStart <= startDate && eventEnd >= endDate);
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events]);

  const getUpcomingEvents = useCallback((limit: number = 10): ScheduleEvent[] => {
    const now = new Date();
    return events
      .filter(event => new Date(event.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit);
  }, [events]);

  const searchEvents = useCallback((query: string): ScheduleEvent[] => {
    const lowerQuery = query.toLowerCase();
    return events.filter(event =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description?.toLowerCase().includes(lowerQuery) ||
      event.location?.toLowerCase().includes(lowerQuery)
    );
  }, [events]);

  return useMemo(
    () => ({
      events,
      isLoading,
      selectedView,
      setSelectedView,
      addEvent,
      updateEvent,
      deleteEvent,
      shareEvent,
      updateParticipantStatus,
      getDecryptedEvent,
      getEventsForCalendar,
      getEventsForDateRange,
      getUpcomingEvents,
      searchEvents,
    }),
    [
      events,
      isLoading,
      selectedView,
      addEvent,
      updateEvent,
      deleteEvent,
      shareEvent,
      updateParticipantStatus,
      getDecryptedEvent,
      getEventsForCalendar,
      getEventsForDateRange,
      getUpcomingEvents,
      searchEvents,
    ]
  );
});
