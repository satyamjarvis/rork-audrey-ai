import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { usePersistentStorage } from "@/utils/usePersistentStorage";
import { Platform, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import * as SMS from "expo-sms";

export type TimerType = "countdown" | "stopwatch" | "pomodoro";
export type TimerStatus = "idle" | "running" | "paused" | "completed";

export type AudreyTimer = {
  id: string;
  name: string;
  type: TimerType;
  duration: number;
  remaining: number;
  status: TimerStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  notifyOnComplete: boolean;
  speakOnComplete: boolean;
  autoRestart: boolean;
  pomodoroConfig?: {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLongBreak: number;
    currentSession: number;
    isBreak: boolean;
  };
};

export type AutomationTrigger = "time" | "timer_complete" | "daily" | "weekly";

export type AudreyAutomation = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  triggerConfig: {
    time?: string;
    dayOfWeek?: number[];
    timerId?: string;
  };
  action: {
    type: "speak" | "notify" | "task" | "reminder" | "affirmation" | "sms";
    message?: string;
    taskTitle?: string;
    affirmationCategory?: string;
    phoneNumber?: string;
    includeSignature?: boolean;
  };
  lastRun?: number;
  nextRun?: number;
  createdAt: number;
};

export type AudreyTimerData = {
  timers: AudreyTimer[];
  automations: AudreyAutomation[];
  activeTimerId?: string;
  settings: {
    defaultNotifyOnComplete: boolean;
    defaultSpeakOnComplete: boolean;
    pomodoroDefaultWork: number;
    pomodoroDefaultBreak: number;
    pomodoroDefaultLongBreak: number;
  };
};

const TIMER_STORAGE_KEY = "@audrey_timers";

const DEFAULT_DATA: AudreyTimerData = {
  timers: [],
  automations: [],
  settings: {
    defaultNotifyOnComplete: true,
    defaultSpeakOnComplete: true,
    pomodoroDefaultWork: 25 * 60,
    pomodoroDefaultBreak: 5 * 60,
    pomodoroDefaultLongBreak: 15 * 60,
  },
};

export const [AudreyTimerProvider, useAudreyTimer] = createContextHook(() => {
  const {
    data,
    isLoading,
    saveData,
    error,
  } = usePersistentStorage<AudreyTimerData>({
    key: TIMER_STORAGE_KEY,
    initialValue: DEFAULT_DATA,
    encryption: false,
    backup: true,
    debounce: 500,
  });

  const [currentTime, setCurrentTime] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const automationCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const runningTimers = data.timers.filter(t => t.status === "running");
    
    if (runningTimers.length > 0) {
      const updatedTimers = data.timers.map(timer => {
        if (timer.status !== "running" || !timer.startedAt) return timer;

        const elapsed = Math.floor((currentTime - timer.startedAt) / 1000);
        
        if (timer.type === "stopwatch") {
          return { ...timer, remaining: elapsed };
        }
        
        const remaining = Math.max(0, timer.duration - elapsed);
        
        if (remaining === 0 && timer.status === "running") {
          handleTimerComplete(timer);
          return { ...timer, remaining: 0, status: "completed" as TimerStatus, completedAt: currentTime };
        }
        
        return { ...timer, remaining };
      });

      const hasChanges = updatedTimers.some((timer, index) => 
        timer.remaining !== data.timers[index].remaining || 
        timer.status !== data.timers[index].status
      );

      if (hasChanges) {
        saveData({ ...data, timers: updatedTimers });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  useEffect(() => {
    automationCheckRef.current = setInterval(() => {
      checkAutomations();
    }, 60000);

    return () => {
      if (automationCheckRef.current) {
        clearInterval(automationCheckRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.automations]);

  const handleTimerComplete = useCallback(async (timer: AudreyTimer) => {
    console.log("[AudreyTimer] Timer completed:", timer.name);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (timer.speakOnComplete) {
      const message = timer.type === "pomodoro" && timer.pomodoroConfig?.isBreak
        ? `Break time is over. Time to focus on your work!`
        : `Timer "${timer.name}" is complete!`;
      
      Speech.speak(message, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
      });
    }

    if (timer.notifyOnComplete) {
      Alert.alert(
        "⏰ Timer Complete",
        `${timer.name} has finished!`,
        [{ text: "OK" }]
      );
    }

    const relatedAutomations = data.automations.filter(
      a => a.enabled && a.trigger === "timer_complete" && a.triggerConfig.timerId === timer.id
    );

    for (const automation of relatedAutomations) {
      await executeAutomation(automation);
    }

    if (timer.autoRestart && timer.type === "countdown") {
      setTimeout(() => {
        startTimer(timer.id);
      }, 2000);
    }

    if (timer.type === "pomodoro" && timer.pomodoroConfig) {
      handlePomodoroTransition(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.automations]);

  const handlePomodoroTransition = useCallback((timer: AudreyTimer) => {
    if (!timer.pomodoroConfig) return;

    const config = timer.pomodoroConfig;
    const isCurrentlyBreak = config.isBreak;
    let newSession = config.currentSession;
    let isBreak = !isCurrentlyBreak;
    let duration: number;

    if (isCurrentlyBreak) {
      newSession++;
      if (newSession % config.sessionsBeforeLongBreak === 0) {
        duration = config.longBreakDuration;
      } else {
        duration = config.breakDuration;
      }
    } else {
      duration = config.workDuration;
    }

    const updatedTimer: AudreyTimer = {
      ...timer,
      duration,
      remaining: duration,
      status: "idle",
      startedAt: undefined,
      completedAt: undefined,
      pomodoroConfig: {
        ...config,
        currentSession: newSession,
        isBreak,
      },
    };

    const updatedTimers = data.timers.map(t => 
      t.id === timer.id ? updatedTimer : t
    );

    saveData({ ...data, timers: updatedTimers });

    if (timer.autoRestart) {
      setTimeout(() => {
        startTimer(timer.id);
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, saveData]);

  const checkAutomations = useCallback(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    const currentTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

    for (const automation of data.automations) {
      if (!automation.enabled) continue;

      let shouldRun = false;

      if (automation.trigger === "time" || automation.trigger === "daily") {
        if (automation.triggerConfig.time === currentTimeStr) {
          if (automation.trigger === "daily") {
            shouldRun = true;
          } else if (automation.trigger === "time") {
            const lastRun = automation.lastRun || 0;
            const timeSinceLastRun = Date.now() - lastRun;
            shouldRun = timeSinceLastRun > 60000;
          }
        }
      }

      if (automation.trigger === "weekly") {
        if (
          automation.triggerConfig.time === currentTimeStr &&
          automation.triggerConfig.dayOfWeek?.includes(currentDay)
        ) {
          const lastRun = automation.lastRun || 0;
          const timeSinceLastRun = Date.now() - lastRun;
          shouldRun = timeSinceLastRun > 60000;
        }
      }

      if (shouldRun) {
        await executeAutomation(automation);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.automations]);

  const sendAutomatedSMS = useCallback(async (automation: AudreyAutomation) => {
    try {
      const phoneNumber = automation.action.phoneNumber;
      const message = automation.action.message;
      const includeSignature = automation.action.includeSignature !== false;

      if (!phoneNumber || !message) {
        console.error("[AudreyTimer] SMS automation missing phone number or message");
        Alert.alert(
          "SMS Automation Error",
          "This automation is missing a phone number or message.",
          [{ text: "OK" }]
        );
        return;
      }

      console.log("[AudreyTimer] Sending automated SMS to:", phoneNumber);

      if (Platform.OS === "web") {
        console.log("[AudreyTimer] SMS not available on web, showing notification instead");
        Alert.alert(
          "SMS Scheduled",
          `Would send SMS to ${phoneNumber}: ${message}`,
          [{ text: "OK" }]
        );
        return;
      }

      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        console.error("[AudreyTimer] SMS is not available on this device");
        Alert.alert(
          "SMS Not Available",
          "SMS is not available on this device.",
          [{ text: "OK" }]
        );
        return;
      }

      const formattedMessage = includeSignature
        ? `🤖 Audrey AI Assistant:\n\n${message}\n\n— Sent via Audrey AI (Automated)`
        : message;

      const { result } = await SMS.sendSMSAsync(
        [phoneNumber],
        formattedMessage
      );

      console.log("[AudreyTimer] Automated SMS result:", result);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (result === "sent") {
        console.log("[AudreyTimer] Automated SMS sent successfully");
        Speech.speak(`Automated SMS sent to ${phoneNumber}`, {
          language: "en-US",
          pitch: 1.0,
          rate: 0.9,
        });
      } else if (result === "cancelled") {
        console.log("[AudreyTimer] Automated SMS was cancelled");
      } else {
        console.log("[AudreyTimer] SMS app opened for automated message");
      }
    } catch (error) {
      console.error("[AudreyTimer] Error sending automated SMS:", error);
      Alert.alert(
        "SMS Error",
        "Failed to send automated SMS. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, []);

  const executeAutomation = useCallback(async (automation: AudreyAutomation) => {
    console.log("[AudreyTimer] Executing automation:", automation.name);

    const updatedAutomations = data.automations.map(a =>
      a.id === automation.id ? { ...a, lastRun: Date.now() } : a
    );
    saveData({ ...data, automations: updatedAutomations });

    switch (automation.action.type) {
      case "speak":
        if (automation.action.message) {
          Speech.speak(automation.action.message, {
            language: "en-US",
            pitch: 1.0,
            rate: 0.9,
          });
        }
        break;

      case "notify":
        Alert.alert(
          "🔔 Audrey Reminder",
          automation.action.message || "Time for your scheduled task!",
          [{ text: "OK" }]
        );
        break;

      case "reminder":
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        Alert.alert(
          "⏰ Reminder",
          automation.action.message || "Don't forget!",
          [{ text: "Got it" }]
        );
        break;

      case "affirmation":
        const affirmations = [
          "You are capable of amazing things!",
          "Today is full of possibilities.",
          "You are worthy of success and happiness.",
          "Every step forward is progress.",
          "You have the power to create change.",
        ];
        const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
        Speech.speak(randomAffirmation, {
          language: "en-US",
          pitch: 1.0,
          rate: 0.85,
        });
        break;

      case "sms":
        await sendAutomatedSMS(automation);
        break;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [data, saveData, sendAutomatedSMS]);

  const createTimer = useCallback(async (
    name: string,
    type: TimerType,
    duration: number,
    options?: {
      notifyOnComplete?: boolean;
      speakOnComplete?: boolean;
      autoRestart?: boolean;
      pomodoroConfig?: AudreyTimer["pomodoroConfig"];
    }
  ): Promise<AudreyTimer> => {
    const timer: AudreyTimer = {
      id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      duration,
      remaining: type === "stopwatch" ? 0 : duration,
      status: "idle",
      createdAt: Date.now(),
      notifyOnComplete: options?.notifyOnComplete ?? data.settings.defaultNotifyOnComplete,
      speakOnComplete: options?.speakOnComplete ?? data.settings.defaultSpeakOnComplete,
      autoRestart: options?.autoRestart ?? false,
      pomodoroConfig: options?.pomodoroConfig,
    };

    const updatedTimers = [...data.timers, timer];
    await saveData({ ...data, timers: updatedTimers });
    
    console.log("[AudreyTimer] Timer created:", timer.name);
    return timer;
  }, [data, saveData]);

  const createPomodoroTimer = useCallback(async (
    name: string,
    options?: {
      workDuration?: number;
      breakDuration?: number;
      longBreakDuration?: number;
      sessionsBeforeLongBreak?: number;
      autoRestart?: boolean;
    }
  ): Promise<AudreyTimer> => {
    const workDuration = options?.workDuration ?? data.settings.pomodoroDefaultWork;
    const breakDuration = options?.breakDuration ?? data.settings.pomodoroDefaultBreak;
    const longBreakDuration = options?.longBreakDuration ?? data.settings.pomodoroDefaultLongBreak;

    return createTimer(name, "pomodoro", workDuration, {
      notifyOnComplete: true,
      speakOnComplete: true,
      autoRestart: options?.autoRestart ?? false,
      pomodoroConfig: {
        workDuration,
        breakDuration,
        longBreakDuration,
        sessionsBeforeLongBreak: options?.sessionsBeforeLongBreak ?? 4,
        currentSession: 0,
        isBreak: false,
      },
    });
  }, [data.settings, createTimer]);

  const startTimer = useCallback(async (timerId: string) => {
    const timer = data.timers.find(t => t.id === timerId);
    if (!timer) return;

    const updatedTimer: AudreyTimer = {
      ...timer,
      status: "running",
      startedAt: Date.now(),
      remaining: timer.type === "stopwatch" ? 0 : (timer.remaining > 0 ? timer.remaining : timer.duration),
    };

    if (timer.status === "paused" && timer.type !== "stopwatch") {
      updatedTimer.startedAt = Date.now() - ((timer.duration - timer.remaining) * 1000);
    }

    const updatedTimers = data.timers.map(t => 
      t.id === timerId ? updatedTimer : t
    );

    await saveData({ ...data, timers: updatedTimers, activeTimerId: timerId });
    console.log("[AudreyTimer] Timer started:", timer.name);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [data, saveData]);

  const pauseTimer = useCallback(async (timerId: string) => {
    const timer = data.timers.find(t => t.id === timerId);
    if (!timer || timer.status !== "running") return;

    const elapsed = timer.startedAt 
      ? Math.floor((Date.now() - timer.startedAt) / 1000)
      : 0;

    const remaining = timer.type === "stopwatch" 
      ? elapsed 
      : Math.max(0, timer.duration - elapsed);

    const updatedTimer: AudreyTimer = {
      ...timer,
      status: "paused",
      remaining,
      startedAt: undefined,
    };

    const updatedTimers = data.timers.map(t => 
      t.id === timerId ? updatedTimer : t
    );

    await saveData({ ...data, timers: updatedTimers });
    console.log("[AudreyTimer] Timer paused:", timer.name);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [data, saveData]);

  const resetTimer = useCallback(async (timerId: string) => {
    const timer = data.timers.find(t => t.id === timerId);
    if (!timer) return;

    const updatedTimer: AudreyTimer = {
      ...timer,
      status: "idle",
      remaining: timer.type === "stopwatch" ? 0 : timer.duration,
      startedAt: undefined,
      completedAt: undefined,
    };

    if (timer.pomodoroConfig) {
      updatedTimer.pomodoroConfig = {
        ...timer.pomodoroConfig,
        currentSession: 0,
        isBreak: false,
      };
      updatedTimer.duration = timer.pomodoroConfig.workDuration;
      updatedTimer.remaining = timer.pomodoroConfig.workDuration;
    }

    const updatedTimers = data.timers.map(t => 
      t.id === timerId ? updatedTimer : t
    );

    await saveData({ ...data, timers: updatedTimers });
    console.log("[AudreyTimer] Timer reset:", timer.name);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [data, saveData]);

  const deleteTimer = useCallback(async (timerId: string) => {
    const updatedTimers = data.timers.filter(t => t.id !== timerId);
    const updatedAutomations = data.automations.filter(
      a => a.triggerConfig.timerId !== timerId
    );

    await saveData({ 
      ...data, 
      timers: updatedTimers, 
      automations: updatedAutomations,
      activeTimerId: data.activeTimerId === timerId ? undefined : data.activeTimerId,
    });
    
    console.log("[AudreyTimer] Timer deleted");

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [data, saveData]);

  const createAutomation = useCallback(async (
    name: string,
    trigger: AutomationTrigger,
    triggerConfig: AudreyAutomation["triggerConfig"],
    action: AudreyAutomation["action"]
  ): Promise<AudreyAutomation> => {
    const automation: AudreyAutomation = {
      id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      enabled: true,
      trigger,
      triggerConfig,
      action,
      createdAt: Date.now(),
    };

    const updatedAutomations = [...data.automations, automation];
    await saveData({ ...data, automations: updatedAutomations });
    
    console.log("[AudreyTimer] Automation created:", automation.name);
    return automation;
  }, [data, saveData]);

  const toggleAutomation = useCallback(async (automationId: string) => {
    const updatedAutomations = data.automations.map(a =>
      a.id === automationId ? { ...a, enabled: !a.enabled } : a
    );

    await saveData({ ...data, automations: updatedAutomations });
    console.log("[AudreyTimer] Automation toggled");
  }, [data, saveData]);

  const deleteAutomation = useCallback(async (automationId: string) => {
    const updatedAutomations = data.automations.filter(a => a.id !== automationId);
    await saveData({ ...data, automations: updatedAutomations });
    console.log("[AudreyTimer] Automation deleted");
  }, [data, saveData]);

  const getActiveTimer = useCallback((): AudreyTimer | undefined => {
    if (data.activeTimerId) {
      return data.timers.find(t => t.id === data.activeTimerId);
    }
    return data.timers.find(t => t.status === "running");
  }, [data.timers, data.activeTimerId]);

  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
      timers: data.timers,
      automations: data.automations,
      settings: data.settings,
      createTimer,
      createPomodoroTimer,
      startTimer,
      pauseTimer,
      resetTimer,
      deleteTimer,
      createAutomation,
      toggleAutomation,
      deleteAutomation,
      getActiveTimer,
      formatTime,
      executeAutomation,
      sendAutomatedSMS,
    }),
    [
      data,
      isLoading,
      error,
      createTimer,
      createPomodoroTimer,
      startTimer,
      pauseTimer,
      resetTimer,
      deleteTimer,
      createAutomation,
      toggleAutomation,
      deleteAutomation,
      getActiveTimer,
      formatTime,
      executeAutomation,
      sendAutomatedSMS,
    ]
  );
});
