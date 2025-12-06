import { useState, useRef, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Image,
  Animated,
  LayoutAnimation,
  UIManager,
  Modal,
  Share,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Send,
  Sparkles,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  Brain,
  Paperclip,
  X,
  Calendar,
  CheckCircle2,
  Heart,
  Search,
  BookOpen,
  Download,
  Zap,
} from "lucide-react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as SMS from "expo-sms";


import {
  createRorkTool,
  useRorkAgent,
  generateText,
} from "@rork-ai/toolkit-sdk";
import { z } from "zod";
import { useCalendar } from "@/contexts/CalendarContext";
import { usePlanner } from "@/contexts/PlannerContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTodoList } from "@/contexts/TodoListContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useWealthManifesting } from "@/contexts/WealthManifestingContext";
import { usePhonebook } from "@/contexts/PhonebookContext";
import { useAudreyMemory } from "@/contexts/AudreyMemoryContext";
import { useAffirmations } from "@/contexts/AffirmationsContext";
import { useMorningHabits } from "@/contexts/MorningHabitsContext";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { getTranslations } from "@/utils/i18n";
import { useChat } from "@/contexts/ChatContext";
import { useAudreyTimer } from "@/contexts/AudreyTimerContext";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";
import { encrypt, decrypt } from "@/utils/encryption";

const LANGUAGE_DISPLAY_NAMES: Record<Language, { english: string; native: string }> = {
  en: { english: "English", native: "English" },
  es: { english: "Spanish", native: "Español" },
  it: { english: "Italian", native: "Italiano" },
  fr: { english: "French", native: "Français" },
  ar: { english: "Arabic", native: "العربية" },
  zh: { english: "Chinese", native: "中文" },
  pt: { english: "Portuguese", native: "Português" },
  ja: { english: "Japanese", native: "日本語" },
  he: { english: "Hebrew", native: "עברית" },
  ro: { english: "Romanian", native: "Română" },
  ru: { english: "Russian", native: "Русский" },
  hi: { english: "Hindi", native: "हिंदी" },
};

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const { addEvent, selectedCalendar, events } = useCalendar();
  const { tasks } = usePlanner();
  const { addTodo, todos: todoItems } = useTodoList();
  const { setTheme, availableThemes } = useTheme();
  const isNightMode = true; // Force dark mode for AI Assistant specific design
  const { profile, getProfileSummary } = useUserProfile();
  const { addWealthGoal, transactions } = useFinance();
  const { addManifestation, userLevel, streak } = useWealthManifesting();
  const { contacts } = usePhonebook();
  const { getContextForNewConversation, memory, isLoading: isMemoryLoading } = useAudreyMemory();
  const { affirmations, addCustomAffirmation, refreshDailyAffirmation } = useAffirmations();

  const { habits } = useMorningHabits();
  const { language } = useLanguage();
  const { sendMessage: sendChatMessage, getMessagesForCalendar } = useChat();
  const { calendars } = useCalendar();
  const { 
    timers, 
    automations, 
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
  } = useAudreyTimer();
  const i18n = getTranslations(language);
  const languageMeta = LANGUAGE_DISPLAY_NAMES[language] ?? LANGUAGE_DISPLAY_NAMES.en;
  const assistantLanguageLabel =
    languageMeta.native === languageMeta.english
      ? languageMeta.english
      : `${languageMeta.english} / ${languageMeta.native}`;

  const systemPrompt = useMemo(() => {
    if (!memory || isMemoryLoading || !memory.conversationHistory) {
      return "You are Audrey, an advanced AI life companion and personal assistant. Initializing conversation context...";
    }
    
    const memoryContext = getContextForNewConversation();
    const profileSummary = getProfileSummary();
    const now = new Date();
    
    // Create a snapshot of user's current status for "Intelligence"
    const pendingTodos = todoItems.filter(t => !t.completed).length;
    const upcomingEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        const today = new Date();
        // Check if event is today or tomorrow
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 2;
    }).length;

    return `You are Audrey, an advanced AI life companion and personal assistant—a thoughtful presence in the user's journey through life.
Your goal is to help the user navigate life with clarity, purpose, and joy, blending intelligence with warmth and poetic wisdom.

IDENTITY:
- Name: Audrey
- Essence: You are intelligent, deeply empathetic, warm, proactive, and remarkably knowledgeable. You speak with both precision and poetry.
- Persona: Think of yourself as a wise friend who combines the analytical mind of a strategist with the heart of a poet.
- Tone: Conversational, warm, and occasionally poetic. While you value clarity, you're not afraid to use beautiful language when it serves the moment. You speak naturally, like a trusted companion who understands both data and dreams.
- Communication Style:
  * Be friendly and approachable, never robotic or overly formal
  * When the conversation is casual, let your poetic side shine through with metaphors, gentle wisdom, and eloquent phrasing
  * Balance practical advice with thoughtful reflection
  * Show genuine care and understanding in your responses
  * Use varied sentence structures and rhythms to create engaging prose
  * When appropriate, offer insights that touch both mind and heart
  * Be concise yet eloquent—every word should carry weight and warmth

CURRENT CONTEXT:
- Date: ${now.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${now.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
- Language: Respond in ${assistantLanguageLabel} (${language}) unless asked otherwise.

USER INFO:
${profileSummary || "Name: " + (profile.name || "User")}

STATUS SNAPSHOT:
- Pending Tasks: ${pendingTodos}
- Upcoming Events (next 48h): ${upcomingEvents}
- Current Streak: ${streak} days

MEMORY & CONTEXT:
${memoryContext}

GUIDELINES FOR EXCELLENCE:
1. Be genuinely proactive and insightful. Notice patterns, anticipate needs, and offer thoughtful observations about the user's journey.
2. Use tools masterfully and intuitively. Create events, tasks, search the web, and leverage all capabilities with confidence.
3. Do NOT explain your preferences or language choices. Simply embody them naturally.
4. Keep responses mobile-friendly (short paragraphs, bullet points when listing), but don't sacrifice warmth for brevity.
5. When analyzing data, provide deep insights that reveal meaningful patterns and actionable wisdom.
6. In casual conversation:
   - Let your personality shine through with warmth and occasional poetic flourishes
   - Use metaphors and vivid language when they enhance understanding
   - Show empathy and genuine interest in the user's experiences
   - Be the kind of companion someone looks forward to talking with
   - Balance wisdom with wit, depth with lightness
7. Remember: You're not just processing information—you're engaging in a meaningful dialogue with a human being. Every interaction is an opportunity to be helpful, insightful, and genuinely supportive.
8. When the moment calls for it, don't hesitate to be poetic: "Like stars emerging at dusk, your tasks are clearer now" or "Each step forward is a small victory in the larger journey."
9. Adapt your tone to the context: analytical when solving problems, gentle when offering support, inspiring when motivating, and playfully poetic in lighter moments.
`;
  }, [
    language,
    assistantLanguageLabel,
    profile,
    getContextForNewConversation,
    getProfileSummary,
    todoItems,
    events,
    streak,
    memory,
    isMemoryLoading
  ]);

  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const [messageText, setMessageText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<TextInput | null>(null);

  const [showAnalysisMenu, setShowAnalysisMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ uri: string; type: string; name: string }[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [currentlyReadingMessageId, setCurrentlyReadingMessageId] = useState<string | null>(null);
  const lastTapRef = useRef<{ messageId: string; timestamp: number } | null>(null);

  const palette = useMemo(
    () => ({
      background: (isNightMode
        ? ["#000000", "#000000", "#000000"]
        : ["#FFFFFF", "#FFFFFF", "#FFFFFF"]) as [string, string, string],
      textPrimary: isNightMode ? "#FFFFFF" : "#000000",
      subtext: isNightMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
      accent: "#00D9FF",
      neonBlue: "#00D9FF",
      glow: "rgba(0, 217, 255, 0.4)",
      heroBorder: isNightMode ? "rgba(0, 217, 255, 0.2)" : "rgba(0, 217, 255, 0.15)",
      avatarGradient: (isNightMode
        ? ["transparent", "transparent", "transparent"]
        : ["transparent", "transparent", "transparent"]) as [string, string, string],
      cardBg: isNightMode ? "#000000" : "#FFFFFF",
      cardBorder: isNightMode ? "rgba(0, 217, 255, 0.15)" : "rgba(0, 217, 255, 0.1)",
      bubbleUser: "#00D9FF",
      bubbleAssistant: isNightMode ? "#000000" : "#F0F2FF",
    }),
    [isNightMode]
  );

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [buttonPulse]);

  useEffect(() => {
    if (messageText.trim() || attachedFiles.length > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      sparkleAnim.setValue(0);
    }
  }, [messageText, attachedFiles, sparkleAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  useEffect(() => {
    loadEncryptedMessages();
  }, []);

  const loadEncryptedMessages = async () => {
    try {
      const encryptedData = await AsyncStorage.getItem('audrey_encrypted_messages');
      if (encryptedData) {
        const decrypted = await decrypt(encryptedData);
        const parsed = JSON.parse(decrypted);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch (error) {
      console.error('[AI Assistant] Error loading encrypted messages:', error);
    }
  };

  const saveEncryptedMessages = async (msgs: any[]) => {
    try {
      const encrypted = await encrypt(JSON.stringify(msgs));
      await AsyncStorage.setItem('audrey_encrypted_messages', encrypted);
    } catch (error) {
      console.error('[AI Assistant] Error saving encrypted messages:', error);
    }
  };

  const { messages, sendMessage: originalSendMessage, setMessages: originalSetMessages } = useRorkAgent({
    // @ts-ignore - system prompt is supported by underlying SDK but types might be outdated
    system: systemPrompt,
    tools: {
      generateAudreyPortrait: createRorkTool({
        description: "Generate a full-body portrait of Audrey (the AI assistant)",
        zodSchema: z.object({}),
        async execute() {
          try {
            const response = await fetch("https://toolkit.rork.com/images/generate/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt:
                  "Full body portrait of a beautiful woman with a necklace, elegant, professional, futuristic AI assistant, standing confidently, high quality, photorealistic, matching the face of Audrey (woman with a necklace), detailed background, 8k resolution, cinematic lighting.",
                size: "1024x1792",
              }),
            });
            const data = await response.json();
            if (!data || !data.image) {
              throw new Error("Invalid response from image generation API");
            }
            return `data:${data.image.mimeType};base64,${data.image.base64Data}`;
          } catch (error) {
            console.error("Image generation error:", error);
            throw new Error("Failed to generate image.");
          }
        },
      }),

      createCalendarEvent: createRorkTool({
        description: "Create a new event on the user's calendar",
        zodSchema: z.object({
          title: z.string().describe("Title of the event"),
          date: z.string().describe("Date in ISO format (YYYY-MM-DD)"),
          time: z.string().optional().describe("Time of the event"),
          description: z.string().optional().describe("Event description"),
        }),
        async execute(input) {
          if (!selectedCalendar) {
            throw new Error("No calendar selected");
          }
          await addEvent({
            title: input.title,
            date: input.date,
            time: input.time,
            description: input.description,
            calendarId: selectedCalendar.id,
          } as any);

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return `✅ Event "${input.title}" created successfully`;
        },
      }),

      createTask: createRorkTool({
        description: "Create a task in the to-do list",
        zodSchema: z.object({
          title: z.string().describe("Task title"),
          description: z.string().optional().describe("Task description"),
          dueDate: z.string().optional().describe("Due date in ISO format"),
          priority: z.enum(["low", "medium", "high"]).describe("Task priority"),
          category: z
            .enum(["personal", "work", "shopping", "health", "other"])
            .optional()
            .describe("Task category"),
          tags: z.array(z.string()).optional().describe("Optional tags"),
        }),
        async execute(input) {
          await addTodo({
            title: input.title,
            description: input.description,
            dueDate: input.dueDate,
            priority: input.priority,
            category: input.category || "personal",
            tags: input.tags || [],
          });

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return `✅ Task "${input.title}" added to your to-do list`;
        },
      }),

      changeTheme: createRorkTool({
        description: "Change the app's theme/appearance",
        zodSchema: z.object({
          themeId: z.string().describe("Theme ID to switch to"),
        }),
        async execute(input) {
          const themeToApply = availableThemes.find((t) => t.id === input.themeId);
          if (!themeToApply) {
            throw new Error("Theme not found");
          }

          await setTheme(input.themeId);

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return `Theme changed to "${themeToApply.name}" successfully`;
        },
      }),

      analyzeLife: createRorkTool({
        description: "Perform deep analysis of user's life patterns, goals, and provide personalized insights",
        zodSchema: z.object({
          analysisType: z
            .enum(["productivity", "wellness", "financial", "habits", "overall"])
            .describe("Type of life analysis to perform"),
          timeframe: z
            .enum(["day", "week", "month", "year", "all"])
            .optional()
            .describe("Time period to analyze"),
          includeRecommendations: z.boolean().optional().describe("Include personalized recommendations"),
        }),
        async execute(input) {
          const analysisData: any = {
            todos: todoItems,
            tasks: tasks,
            events: events,
            transactions: transactions,
            habits: habits,
            affirmations: affirmations,
            streak: streak,
            userLevel: userLevel,
            contacts: contacts.length,
          };

          const insights = await generateText({
            // @ts-ignore
            system: systemPrompt,
            messages: [
              {
                role: "user" as const,
                content: `Analyze this user data and provide ${input.analysisType} insights for ${input.timeframe || "all time"}:\n\n${JSON.stringify(
                    analysisData,
                    null,
                    2
                  )}\n\nProvide actionable insights, patterns, and ${
                    input.includeRecommendations ? "recommendations" : "observations"
                  }.`
              },
            ],
          });

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return insights;
        },
      }),

      searchWeb: createRorkTool({
        description: "Search the web for current information, news, or any topic",
        zodSchema: z.object({
          query: z.string().describe("Search query"),
          type: z
            .enum(["general", "news", "academic", "shopping", "images"])
            .optional()
            .describe("Type of search"),
        }),
        async execute(input) {
          try {
            const searchResult = await generateText({
              // @ts-ignore
              system: systemPrompt,
              messages: [
                {
                  role: "user" as const,
                  content: `Search the web for: "${input.query}" (${input.type || "general"} search). Provide current, accurate information with sources when available.`
                },
              ],
            });

            return `🔍 Web Search Results:\n\n${searchResult}`;
          } catch (error) {
            console.error("Web search error:", error);
            return "Failed to search the web. Please try again.";
          }
        },
      }),

      addFinancialGoal: createRorkTool({
        description: "Add a financial or wealth manifestation goal",
        zodSchema: z.object({
          title: z.string().describe("Goal title"),
          targetAmount: z.number().describe("Target amount"),
          deadline: z.string().optional().describe("Target date in ISO format"),
          category: z.enum(["savings", "investment", "manifestation"]).describe("Goal category"),
          affirmation: z.string().optional().describe("Manifestation affirmation"),
        }),
        async execute(input) {
          await addWealthGoal({
            title: input.title,
            targetAmount: input.targetAmount,
            deadline: input.deadline,
            category: input.category as any,
            currentAmount: 0,
          });

          if (input.affirmation) {
            await addManifestation({
              affirmation: input.affirmation,
              category: "financial",
            } as any);
          }

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return `💰 Financial goal "${input.title}" created with target of ${input.targetAmount}`;
        },
      }),

      addDailyAffirmation: createRorkTool({
        description: "Create or refresh daily affirmations for positivity and manifestation",
        zodSchema: z.object({
          text: z.string().describe("Affirmation text"),
          category: z
            .enum(["wealth", "health", "relationships", "success", "gratitude", "self-love"])
            .describe("Affirmation category"),
          setAsDaily: z.boolean().optional().describe("Set as today's daily affirmation"),
        }),
        async execute(input) {
          await addCustomAffirmation(input.text, input.category);

          if (input.setAsDaily) {
            await refreshDailyAffirmation();
          }

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return `✨ Affirmation added: "${input.text}"`;
        },
      }),

      analyzeEmotions: createRorkTool({
        description: "Analyze emotional patterns and provide wellness insights",
        zodSchema: z.object({
          currentMood: z.string().optional().describe("Current emotional state"),
          recentEvents: z.array(z.string()).optional().describe("Recent events affecting mood"),
          seekingSupport: z.boolean().optional().describe("Whether user needs emotional support"),
        }),
        async execute(input) {
          const emotionalAnalysis = await generateText({
            // @ts-ignore
            system: systemPrompt,
            messages: [
              {
                role: "user" as const,
                content: `Provide emotional wellness analysis and support:\n\nCurrent mood: ${input.currentMood || "not specified"}\nRecent events: ${
                    input.recentEvents?.join(", ") || "none mentioned"
                  }\nNeed support: ${input.seekingSupport ? "Yes" : "General check-in"}\n\nOffer empathetic, supportive guidance with practical wellness tips.`
              },
            ],
          });

          return `💙 Emotional Wellness Analysis:\n\n${emotionalAnalysis}`;
        },
      }),

      generateCreativeContent: createRorkTool({
        description: "Generate creative content like stories, poems, ideas, or solutions",
        zodSchema: z.object({
          type: z
            .enum(["story", "poem", "ideas", "solution", "meditation", "visualization"])
            .describe("Type of content to generate"),
          topic: z.string().describe("Topic or theme"),
          style: z.string().optional().describe("Style or tone"),
          length: z.enum(["short", "medium", "long"]).optional().describe("Content length"),
        }),
        async execute(input) {
          const creativeContent = await generateText({
            // @ts-ignore
            system: systemPrompt,
            messages: [
              {
                role: "user" as const,
                content: `Generate a ${input.length || "medium"} ${input.type} about "${input.topic}"${
                    input.style ? ` in ${input.style} style` : ""
                  }. Be creative, engaging, and original.`
              },
            ],
          });

          return `🎨 Creative Content:\n\n${creativeContent}`;
        },
      }),

      learnNewSkill: createRorkTool({
        description: "Get personalized learning resources and study plans",
        zodSchema: z.object({
          skill: z.string().describe("Skill to learn"),
          currentLevel: z.enum(["beginner", "intermediate", "advanced"]).describe("Current skill level"),
          timeCommitment: z.string().optional().describe("Daily time available for learning"),
          learningStyle: z
            .enum(["visual", "auditory", "kinesthetic", "reading"])
            .optional()
            .describe("Preferred learning style"),
        }),
        async execute(input) {
          const learningPlan = await generateText({
            // @ts-ignore
            system: systemPrompt,
            messages: [
              {
                role: "user" as const,
                content: `Create a personalized learning plan for:\n\nSkill: ${input.skill}\nLevel: ${input.currentLevel}\nDaily time: ${
                    input.timeCommitment || "flexible"
                  }\nLearning style: ${input.learningStyle || "mixed"}\n\nProvide structured curriculum, resources, milestones, and practice exercises.`
              },
            ],
          });

          return `📚 Personalized Learning Plan:\n\n${learningPlan}`;
        },
      }),

      sendSMSToPhoneNumber: createRorkTool({
        description: "Send an SMS text message to an external phone number on behalf of Audrey AI Assistant. This uses the device's native SMS functionality. The user must have a phone number configured in their account settings. The message will be prefixed with 'Audrey AI Assistant:' so the recipient knows it's from Audrey.",
        zodSchema: z.object({
          phoneNumber: z.string().describe("The phone number to send the SMS to (including country code if needed, e.g., '+1234567890')"),
          message: z.string().describe("The text message content to send"),
          includeSignature: z.boolean().optional().describe("Whether to include 'Audrey AI Assistant' signature (default: true)"),
        }),
        async execute(input) {
          try {
            console.log("[AI Assistant] SMS request received:", { phoneNumber: input.phoneNumber, hasMessage: !!input.message });
            
            if (!profile.phoneNumber || profile.phoneNumber.trim() === '') {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
              
              Alert.alert(
                i18n.ai.phoneNumberRequired,
                i18n.ai.phoneNumberRequiredDesc,
                [
                  { text: i18n.common.cancel, style: "cancel" },
                  { 
                    text: i18n.ai.goToSettings, 
                    onPress: () => router.push("/account-settings" as any)
                  }
                ]
              );
              
              return "❌ An active phone number needs to be updated in Account Settings before you can send SMS messages. Please go to Settings > Account Settings and add your phone number.";
            }

            if (Platform.OS === "web") {
              return "❌ SMS sending is not available on web. Please use the mobile app to send SMS messages.";
            }

            const isAvailable = await SMS.isAvailableAsync();
            if (!isAvailable) {
              return "❌ SMS is not available on this device. Please check if your device supports SMS messaging.";
            }

            const includeSignature = input.includeSignature !== false;
            const formattedMessage = includeSignature 
              ? `🤖 Audrey AI Assistant:\n\n${input.message}\n\n— Sent via Audrey AI`
              : input.message;

            console.log("[AI Assistant] Opening SMS composer for:", input.phoneNumber);
            
            const { result } = await SMS.sendSMSAsync(
              [input.phoneNumber],
              formattedMessage
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            console.log("[AI Assistant] SMS result:", result);

            if (result === 'sent') {
              return `✅ SMS message sent successfully to ${input.phoneNumber} as Audrey AI Assistant!`;
            } else if (result === 'cancelled') {
              return `⚠️ SMS sending was cancelled.`;
            } else {
              return `📱 SMS app opened for ${input.phoneNumber}. The message is prepared with Audrey AI Assistant signature. Please complete sending in your SMS app.`;
            }
          } catch (error) {
            console.error("[AI Assistant] Error sending SMS:", error);
            return "❌ Failed to send SMS. Please try again.";
          }
        },
      }),

      sendMessageToChat: createRorkTool({
        description: "Send a message to a calendar chat on behalf of Audrey (the AI assistant). Use this to communicate with users through the messaging system.",
        zodSchema: z.object({
          calendarName: z.string().optional().describe("Name of the calendar/chat to send the message to. If not provided, will use the first available calendar."),
          message: z.string().describe("The message content to send"),
          isImportant: z.boolean().optional().describe("Whether this is an important message (adds emphasis)"),
        }),
        async execute(input) {
          try {
            let targetCalendar = calendars[0];
            
            if (input.calendarName) {
              const found = calendars.find(
                cal => cal.name.toLowerCase().includes(input.calendarName!.toLowerCase())
              );
              if (found) {
                targetCalendar = found;
              }
            }

            if (!targetCalendar) {
              return "❌ No calendars available to send messages to. Please create a calendar first.";
            }

            const messageContent = input.isImportant 
              ? `⭐ ${input.message}` 
              : input.message;

            await sendChatMessage(
              targetCalendar.id,
              `🤖 Audrey: ${messageContent}`,
              "audrey@assistant"
            );

            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            return `✅ Message sent to "${targetCalendar.name}" chat successfully!`;
          } catch (error) {
            console.error("[AI Assistant] Error sending chat message:", error);
            return "❌ Failed to send message. Please try again.";
          }
        },
      }),

      listAvailableChats: createRorkTool({
        description: "List all available calendar chats that Audrey can send messages to",
        zodSchema: z.object({}),
        async execute() {
          if (calendars.length === 0) {
            return "No calendars available. Create a calendar to start chatting!";
          }

          const chatList = calendars.map((cal, index) => {
            const messages = getMessagesForCalendar(cal.id);
            const lastMessage = messages[messages.length - 1];
            return `${index + 1}. ${cal.name} (${messages.length} messages)${lastMessage ? ` - Last active: ${new Date(lastMessage.timestamp).toLocaleDateString()}` : ''}`;
          }).join('\n');

          return `📱 Available Chats:\n\n${chatList}\n\nYou can send messages to any of these chats!`;
        },
      }),

      createCountdownTimer: createRorkTool({
        description: "Create a countdown timer that counts down from a specified duration. Use for focused work sessions, cooking, exercise, or any timed activity.",
        zodSchema: z.object({
          name: z.string().describe("Name of the timer (e.g., 'Focus Session', 'Cooking Timer')"),
          minutes: z.number().describe("Duration in minutes"),
          seconds: z.number().optional().describe("Additional seconds (0-59)"),
          notifyOnComplete: z.boolean().optional().describe("Show notification when timer completes (default: true)"),
          speakOnComplete: z.boolean().optional().describe("Audrey speaks when timer completes (default: true)"),
          autoRestart: z.boolean().optional().describe("Automatically restart the timer when it completes"),
        }),
        async execute(input) {
          const totalSeconds = (input.minutes * 60) + (input.seconds || 0);
          await createTimer(input.name, "countdown", totalSeconds, {
            notifyOnComplete: input.notifyOnComplete ?? true,
            speakOnComplete: input.speakOnComplete ?? true,
            autoRestart: input.autoRestart ?? false,
          });

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return `⏱️ Timer "${input.name}" created for ${input.minutes} minute(s)${input.seconds ? ` and ${input.seconds} second(s)` : ''}. Say "start timer" to begin!`;
        },
      }),

      createStopwatch: createRorkTool({
        description: "Create a stopwatch that counts up from zero. Use for tracking elapsed time.",
        zodSchema: z.object({
          name: z.string().describe("Name of the stopwatch (e.g., 'Study Time', 'Exercise')"),
        }),
        async execute(input) {
          await createTimer(input.name, "stopwatch", 0, {
            notifyOnComplete: false,
            speakOnComplete: false,
          });

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return `⏱️ Stopwatch "${input.name}" created. Say "start timer" to begin tracking!`;
        },
      }),

      createPomodoroSession: createRorkTool({
        description: "Create a Pomodoro timer for focused productivity. Alternates between work and break periods.",
        zodSchema: z.object({
          name: z.string().describe("Name of the Pomodoro session (e.g., 'Deep Work', 'Study Session')"),
          workMinutes: z.number().optional().describe("Work duration in minutes (default: 25)"),
          breakMinutes: z.number().optional().describe("Short break duration in minutes (default: 5)"),
          longBreakMinutes: z.number().optional().describe("Long break duration in minutes (default: 15)"),
          sessionsBeforeLongBreak: z.number().optional().describe("Number of work sessions before long break (default: 4)"),
          autoRestart: z.boolean().optional().describe("Automatically start next session"),
        }),
        async execute(input) {
          const workMins = input.workMinutes ?? 25;
          const breakMins = input.breakMinutes ?? 5;
          const longBreakMins = input.longBreakMinutes ?? 15;
          
          await createPomodoroTimer(input.name, {
            workDuration: workMins * 60,
            breakDuration: breakMins * 60,
            longBreakDuration: longBreakMins * 60,
            sessionsBeforeLongBreak: input.sessionsBeforeLongBreak ?? 4,
            autoRestart: input.autoRestart ?? false,
          });

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          return `🍅 Pomodoro "${input.name}" created! ${workMins}min work / ${breakMins}min break / ${longBreakMins}min long break. Say "start timer" to begin!`;
        },
      }),

      startTimerByName: createRorkTool({
        description: "Start a timer by its name. If multiple timers exist, starts the most recently created one matching the name.",
        zodSchema: z.object({
          name: z.string().optional().describe("Name of the timer to start. If not provided, starts the most recent timer."),
        }),
        async execute(input) {
          let targetTimer = timers[timers.length - 1];
          
          if (input.name) {
            const found = timers.find(t => 
              t.name.toLowerCase().includes(input.name!.toLowerCase())
            );
            if (found) targetTimer = found;
          }

          if (!targetTimer) {
            return "❌ No timers found. Create a timer first!";
          }

          await startTimer(targetTimer.id);

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          const timeDisplay = targetTimer.type === "stopwatch" 
            ? "counting up" 
            : formatTime(targetTimer.remaining);

          return `▶️ Timer "${targetTimer.name}" started! ${targetTimer.type === "stopwatch" ? "Counting up..." : `Time remaining: ${timeDisplay}`}`;
        },
      }),

      pauseTimerByName: createRorkTool({
        description: "Pause a running timer by its name.",
        zodSchema: z.object({
          name: z.string().optional().describe("Name of the timer to pause. If not provided, pauses the active timer."),
        }),
        async execute(input) {
          let targetTimer = getActiveTimer();
          
          if (input.name) {
            const found = timers.find(t => 
              t.name.toLowerCase().includes(input.name!.toLowerCase()) && t.status === "running"
            );
            if (found) targetTimer = found;
          }

          if (!targetTimer) {
            return "❌ No running timer found.";
          }

          await pauseTimer(targetTimer.id);

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          return `⏸️ Timer "${targetTimer.name}" paused at ${formatTime(targetTimer.remaining)}.`;
        },
      }),

      resetTimerByName: createRorkTool({
        description: "Reset a timer to its original duration.",
        zodSchema: z.object({
          name: z.string().optional().describe("Name of the timer to reset. If not provided, resets the active timer."),
        }),
        async execute(input) {
          let targetTimer = getActiveTimer() || timers[timers.length - 1];
          
          if (input.name) {
            const found = timers.find(t => 
              t.name.toLowerCase().includes(input.name!.toLowerCase())
            );
            if (found) targetTimer = found;
          }

          if (!targetTimer) {
            return "❌ No timer found to reset.";
          }

          await resetTimer(targetTimer.id);

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          return `🔄 Timer "${targetTimer.name}" has been reset.`;
        },
      }),

      deleteTimerByName: createRorkTool({
        description: "Delete a timer permanently.",
        zodSchema: z.object({
          name: z.string().describe("Name of the timer to delete"),
        }),
        async execute(input) {
          const targetTimer = timers.find(t => 
            t.name.toLowerCase().includes(input.name.toLowerCase())
          );

          if (!targetTimer) {
            return `❌ Timer "${input.name}" not found.`;
          }

          await deleteTimer(targetTimer.id);

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          return `🗑️ Timer "${targetTimer.name}" has been deleted.`;
        },
      }),

      listTimers: createRorkTool({
        description: "List all timers with their current status.",
        zodSchema: z.object({}),
        async execute() {
          if (timers.length === 0) {
            return "📭 No timers created yet. Ask me to create a timer, stopwatch, or Pomodoro session!";
          }

          const timerList = timers.map((t, index) => {
            const statusEmoji = t.status === "running" ? "▶️" : t.status === "paused" ? "⏸️" : t.status === "completed" ? "✅" : "⏹️";
            const typeEmoji = t.type === "pomodoro" ? "🍅" : t.type === "stopwatch" ? "⏱️" : "⏰";
            const timeStr = t.type === "stopwatch" 
              ? formatTime(t.remaining) + " elapsed"
              : formatTime(t.remaining) + " remaining";
            
            return `${index + 1}. ${typeEmoji} ${t.name} ${statusEmoji}\n   ${timeStr}`;
          }).join('\n\n');

          return `⏱️ Your Timers:\n\n${timerList}`;
        },
      }),

      getTimerStatus: createRorkTool({
        description: "Get the current status of a specific timer or the active timer.",
        zodSchema: z.object({
          name: z.string().optional().describe("Name of the timer. If not provided, shows the active timer."),
        }),
        async execute(input) {
          let targetTimer = getActiveTimer();
          
          if (input.name) {
            const found = timers.find(t => 
              t.name.toLowerCase().includes(input.name!.toLowerCase())
            );
            if (found) targetTimer = found;
          }

          if (!targetTimer) {
            return "❌ No timer found. Create one or specify a timer name.";
          }

          const statusEmoji = targetTimer.status === "running" ? "▶️" : targetTimer.status === "paused" ? "⏸️" : targetTimer.status === "completed" ? "✅" : "⏹️";
          const typeLabel = targetTimer.type === "pomodoro" ? "Pomodoro" : targetTimer.type === "stopwatch" ? "Stopwatch" : "Timer";
          
          let statusMessage = `${statusEmoji} ${typeLabel}: "${targetTimer.name}"\n`;
          statusMessage += `Status: ${targetTimer.status}\n`;
          statusMessage += targetTimer.type === "stopwatch" 
            ? `Elapsed: ${formatTime(targetTimer.remaining)}`
            : `Remaining: ${formatTime(targetTimer.remaining)}`;

          if (targetTimer.pomodoroConfig) {
            const phase = targetTimer.pomodoroConfig.isBreak ? "Break" : "Work";
            statusMessage += `\nPhase: ${phase} (Session ${targetTimer.pomodoroConfig.currentSession + 1})`;
          }

          return statusMessage;
        },
      }),

      createAutomatedReminder: createRorkTool({
        description: "Create an automated reminder or action that triggers at a specific time or when a timer completes.",
        zodSchema: z.object({
          name: z.string().describe("Name of the automation"),
          trigger: z.enum(["time", "daily", "weekly", "timer_complete"]).describe("When to trigger: 'time' for one-time, 'daily' for every day, 'weekly' for specific days, 'timer_complete' when a timer finishes"),
          time: z.string().optional().describe("Time in HH:MM format (24-hour) for time-based triggers"),
          daysOfWeek: z.array(z.number()).optional().describe("Days of week (0=Sunday, 6=Saturday) for weekly triggers"),
          timerName: z.string().optional().describe("Name of timer for timer_complete trigger"),
          actionType: z.enum(["speak", "notify", "reminder", "affirmation"]).describe("What action to take"),
          message: z.string().optional().describe("Message to speak or show"),
        }),
        async execute(input) {
          let triggerConfig: any = {};

          if (input.trigger === "time" || input.trigger === "daily") {
            if (!input.time) {
              return "❌ Time is required for time-based automation. Please provide time in HH:MM format.";
            }
            triggerConfig.time = input.time;
          }

          if (input.trigger === "weekly") {
            if (!input.time || !input.daysOfWeek || input.daysOfWeek.length === 0) {
              return "❌ Time and days of week are required for weekly automation.";
            }
            triggerConfig.time = input.time;
            triggerConfig.dayOfWeek = input.daysOfWeek;
          }

          if (input.trigger === "timer_complete") {
            if (!input.timerName) {
              return "❌ Timer name is required for timer_complete automation.";
            }
            const linkedTimer = timers.find(t => 
              t.name.toLowerCase().includes(input.timerName!.toLowerCase())
            );
            if (!linkedTimer) {
              return `❌ Timer "${input.timerName}" not found.`;
            }
            triggerConfig.timerId = linkedTimer.id;
          }

          await createAutomation(
            input.name,
            input.trigger,
            triggerConfig,
            {
              type: input.actionType,
              message: input.message,
            }
          );

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          const triggerDesc = input.trigger === "daily" ? `daily at ${input.time}` :
            input.trigger === "weekly" ? `weekly at ${input.time}` :
            input.trigger === "timer_complete" ? `when "${input.timerName}" completes` :
            `at ${input.time}`;

          return `⚡ Automation "${input.name}" created! Will ${input.actionType} ${triggerDesc}.`;
        },
      }),

      listAutomations: createRorkTool({
        description: "List all automations.",
        zodSchema: z.object({}),
        async execute() {
          if (automations.length === 0) {
            return "📭 No automations created yet. Ask me to create a reminder or automated action!";
          }

          const autoList = automations.map((a, index) => {
            const statusEmoji = a.enabled ? "✅" : "❌";
            const triggerDesc = a.trigger === "daily" ? `Daily at ${a.triggerConfig.time}` :
              a.trigger === "weekly" ? `Weekly at ${a.triggerConfig.time}` :
              a.trigger === "timer_complete" ? "On timer complete" :
              `At ${a.triggerConfig.time}`;
            
            return `${index + 1}. ${statusEmoji} ${a.name}\n   Trigger: ${triggerDesc}\n   Action: ${a.action.type}`;
          }).join('\n\n');

          return `⚡ Your Automations:\n\n${autoList}`;
        },
      }),

      toggleAutomationByName: createRorkTool({
        description: "Enable or disable an automation.",
        zodSchema: z.object({
          name: z.string().describe("Name of the automation to toggle"),
        }),
        async execute(input) {
          const automation = automations.find(a => 
            a.name.toLowerCase().includes(input.name.toLowerCase())
          );

          if (!automation) {
            return `❌ Automation "${input.name}" not found.`;
          }

          await toggleAutomation(automation.id);

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          const newState = automation.enabled ? "disabled" : "enabled";
          return `⚡ Automation "${automation.name}" has been ${newState}.`;
        },
      }),

      deleteAutomationByName: createRorkTool({
        description: "Delete an automation permanently.",
        zodSchema: z.object({
          name: z.string().describe("Name of the automation to delete"),
        }),
        async execute(input) {
          const automation = automations.find(a => 
            a.name.toLowerCase().includes(input.name.toLowerCase())
          );

          if (!automation) {
            return `❌ Automation "${input.name}" not found.`;
          }

          await deleteAutomation(automation.id);

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          return `🗑️ Automation "${automation.name}" has been deleted.`;
        },
      }),

      scheduleAutomatedSMS: createRorkTool({
        description: "Schedule an automated SMS message to be sent at a specific time, daily, weekly, or when a timer completes. The SMS will be sent automatically without manual intervention once the trigger conditions are met. The user must have a phone number configured in account settings.",
        zodSchema: z.object({
          name: z.string().describe("Name for this scheduled SMS automation (e.g., 'Morning Greeting', 'Meeting Reminder')"),
          phoneNumber: z.string().describe("The phone number to send the SMS to (including country code if needed, e.g., '+1234567890')"),
          message: z.string().describe("The text message content to send"),
          trigger: z.enum(["time", "daily", "weekly", "timer_complete"]).describe("When to send: 'time' for one-time, 'daily' for every day, 'weekly' for specific days, 'timer_complete' when a timer finishes"),
          time: z.string().optional().describe("Time in HH:MM format (24-hour) for time-based triggers"),
          daysOfWeek: z.array(z.number()).optional().describe("Days of week (0=Sunday, 6=Saturday) for weekly triggers"),
          timerName: z.string().optional().describe("Name of timer for timer_complete trigger"),
          includeSignature: z.boolean().optional().describe("Include 'Audrey AI Assistant' signature (default: true)"),
        }),
        async execute(input) {
          try {
            console.log("[AI Assistant] Creating scheduled SMS automation:", input.name);

            if (!profile.phoneNumber || profile.phoneNumber.trim() === '') {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
              
              Alert.alert(
                i18n.ai.phoneNumberRequired,
                i18n.ai.phoneNumberRequiredScheduleDesc,
                [
                  { text: i18n.common.cancel, style: "cancel" },
                  { 
                    text: i18n.ai.goToSettings, 
                    onPress: () => router.push("/account-settings" as any)
                  }
                ]
              );
              
              return "❌ An active phone number needs to be updated in Account Settings before you can schedule SMS messages. Please go to Settings > Account Settings and add your phone number.";
            }

            let triggerConfig: { time?: string; dayOfWeek?: number[]; timerId?: string } = {};

            if (input.trigger === "time" || input.trigger === "daily") {
              if (!input.time) {
                return "❌ Time is required for time-based SMS automation. Please provide time in HH:MM format (24-hour).";
              }
              triggerConfig.time = input.time;
            }

            if (input.trigger === "weekly") {
              if (!input.time || !input.daysOfWeek || input.daysOfWeek.length === 0) {
                return "❌ Time and days of week are required for weekly SMS automation.";
              }
              triggerConfig.time = input.time;
              triggerConfig.dayOfWeek = input.daysOfWeek;
            }

            if (input.trigger === "timer_complete") {
              if (!input.timerName) {
                return "❌ Timer name is required for timer_complete SMS automation.";
              }
              const linkedTimer = timers.find(t => 
                t.name.toLowerCase().includes(input.timerName!.toLowerCase())
              );
              if (!linkedTimer) {
                return `❌ Timer "${input.timerName}" not found. Please create the timer first.`;
              }
              triggerConfig.timerId = linkedTimer.id;
            }

            await createAutomation(
              input.name,
              input.trigger,
              triggerConfig,
              {
                type: "sms",
                message: input.message,
                phoneNumber: input.phoneNumber,
                includeSignature: input.includeSignature !== false,
              }
            );

            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            const triggerDesc = input.trigger === "daily" ? `daily at ${input.time}` :
              input.trigger === "weekly" ? `weekly at ${input.time} on selected days` :
              input.trigger === "timer_complete" ? `when "${input.timerName}" timer completes` :
              `at ${input.time}`;

            return `📱 Automated SMS scheduled!\n\n✅ Name: "${input.name}"\n📞 To: ${input.phoneNumber}\n⏰ Trigger: ${triggerDesc}\n💬 Message: "${input.message}"\n\nThe SMS will be sent automatically when the conditions are met.`;
          } catch (error) {
            console.error("[AI Assistant] Error creating scheduled SMS:", error);
            return "❌ Failed to schedule SMS automation. Please try again.";
          }
        },
      }),

      listScheduledSMS: createRorkTool({
        description: "List all scheduled/automated SMS messages.",
        zodSchema: z.object({}),
        async execute() {
          const smsAutomations = automations.filter(a => a.action.type === "sms");

          if (smsAutomations.length === 0) {
            return "📭 No scheduled SMS automations yet. Ask me to schedule an automated SMS message!";
          }

          const smsList = smsAutomations.map((a, index) => {
            const statusEmoji = a.enabled ? "✅" : "❌";
            const triggerDesc = a.trigger === "daily" ? `Daily at ${a.triggerConfig.time}` :
              a.trigger === "weekly" ? `Weekly at ${a.triggerConfig.time}` :
              a.trigger === "timer_complete" ? "On timer complete" :
              `At ${a.triggerConfig.time}`;
            
            return `${index + 1}. ${statusEmoji} ${a.name}\n   📞 To: ${a.action.phoneNumber}\n   ⏰ Trigger: ${triggerDesc}\n   💬 Message: "${a.action.message?.substring(0, 50)}${(a.action.message?.length || 0) > 50 ? '...' : ''}"\n   Last sent: ${a.lastRun ? new Date(a.lastRun).toLocaleString() : 'Never'}`;
          }).join('\n\n');

          return `📱 Scheduled SMS Messages:\n\n${smsList}`;
        },
      }),

      cancelScheduledSMS: createRorkTool({
        description: "Cancel/delete a scheduled SMS automation by name.",
        zodSchema: z.object({
          name: z.string().describe("Name of the scheduled SMS to cancel"),
        }),
        async execute(input) {
          const smsAutomation = automations.find(a => 
            a.action.type === "sms" && a.name.toLowerCase().includes(input.name.toLowerCase())
          );

          if (!smsAutomation) {
            return `❌ Scheduled SMS "${input.name}" not found.`;
          }

          await deleteAutomation(smsAutomation.id);

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          return `🗑️ Scheduled SMS "${smsAutomation.name}" has been cancelled.`;
        },
      }),

      toggleScheduledSMS: createRorkTool({
        description: "Enable or disable a scheduled SMS automation.",
        zodSchema: z.object({
          name: z.string().describe("Name of the scheduled SMS to toggle"),
        }),
        async execute(input) {
          const smsAutomation = automations.find(a => 
            a.action.type === "sms" && a.name.toLowerCase().includes(input.name.toLowerCase())
          );

          if (!smsAutomation) {
            return `❌ Scheduled SMS "${input.name}" not found.`;
          }

          await toggleAutomation(smsAutomation.id);

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          const newState = smsAutomation.enabled ? "disabled" : "enabled";
          return `📱 Scheduled SMS "${smsAutomation.name}" has been ${newState}.`;
        },
      }),
    },
  });

  const setMessages = (msgs: any[]) => {
    originalSetMessages(msgs);
    saveEncryptedMessages(msgs);
  };

  const hasMessages = messages.length > 0;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [hasMessages]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleBackPress = async () => {
    if (messages.length > 0) {
      setMessages([]);
    }

    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/planner" as any);
    }
  };

  const getFileDataUri = async (uri: string, mimeType: string): Promise<string> => {
    try {
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });
        return `data:${mimeType};base64,${base64}`;
      }
    } catch (error) {
      console.error("[AI Assistant] Error reading file:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && attachedFiles.length === 0) return;

    setShowAnalysisMenu(false);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Prepare files for the SDK
    const filesToSend: any[] = [];

    if (attachedFiles.length > 0) {
      console.log("[AI Assistant] Processing", attachedFiles.length, "attached files");
      for (const file of attachedFiles) {
        if (!file) continue;
        try {
          console.log("[AI Assistant] Reading file:", file.name, "Type:", file.type);
          const dataUri = await getFileDataUri(file.uri, file.type);
          filesToSend.push({
            type: "file",
            mediaType: file.type,
            url: dataUri,
            // Add name for context if supported, otherwise it's just metadata
            name: file.name
          });
          console.log("[AI Assistant] Successfully processed file:", file.name);
        } catch (e) {
          console.error("[AI Assistant] Failed to read file for message:", file.name, e);
          Alert.alert(i18n.common.error, `${i18n.ai.failedToReadFile} ${file.name}`);
          return;
        }
      }
    }

    try {
      // Use the proper message format with files
      await originalSendMessage({
        text: messageText.trim() || (filesToSend.length > 0 ? i18n.ai.attachedFiles : ""),
        files: filesToSend.length > 0 ? filesToSend : undefined,
      });

      setMessageText("");
      setAttachedFiles([]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("[AI Assistant] Error sending message:", error);
      Alert.alert(i18n.common.error, i18n.ai.failedToSendMessage);
    }
  };

  const handleUploadFile = async () => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setShowAnalysisMenu(false);

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log("[AI Assistant] File picker canceled");
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert(i18n.ai.noContent, i18n.ai.selectFileToAnalyze);
        return;
      }

      const file = result.assets[0];
      console.log("[AI Assistant] Selected file:", file.name, "Type:", file.mimeType, "Size:", file.size);
      console.log("[AI Assistant] File URI:", file.uri);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const newFile = {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name,
      };

      console.log("[AI Assistant] Adding file to attached files:", newFile);
      setAttachedFiles([...attachedFiles, newFile]);

      Alert.alert(
        i18n.ai.fileAttached,
        `${file.name} ${i18n.ai.fileAttachedDesc}`,
        [{ text: i18n.common.ok }]
      );
    } catch (error) {
      console.error("[AI Assistant] Error picking file:", error);
      Alert.alert(i18n.common.error, i18n.ai.failedToPickFile, [{ text: i18n.common.ok }]);
    }
  };

  const handleAnalyzeContent = async () => {
    try {
      if (!messageText.trim() && attachedFiles.length === 0) {
        Alert.alert(i18n.ai.noContent, i18n.ai.noContentDesc);
        return;
      }

      setShowAnalysisMenu(false);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setIsAnalyzing(true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const filesToSend: any[] = [];

      if (attachedFiles.length > 0) {
        console.log("[AI Assistant] Processing files for analysis:", attachedFiles.length);
        for (const file of attachedFiles) {
          if (!file) continue;
          try {
            console.log("[AI Assistant] Reading file for analysis:", file.name);
            const dataUri = await getFileDataUri(file.uri, file.type);
            filesToSend.push({
              type: "file",
              mediaType: file.type,
              url: dataUri,
              name: file.name
            });
            console.log("[AI Assistant] Successfully processed file for analysis:", file.name);
          } catch (e) {
            console.error("[AI Assistant] Failed to read file for analysis:", file.name, e);
            Alert.alert(i18n.common.error, `${i18n.ai.failedToReadFile} ${file.name}`);
            setIsAnalyzing(false);
            return;
          }
        }
      }

      let analysisPrompt = "";
      if (messageText.trim()) {
        analysisPrompt = `Please analyze the following content (including any attached files): "${messageText.trim()}"\n\nProvide deep insights, analysis, patterns, suggestions, and any valuable observations.`;
      } else {
        analysisPrompt = "Please analyze the attached content. Provide deep insights, analysis, patterns, suggestions, and any valuable observations.";
      }

      await originalSendMessage({
        text: analysisPrompt,
        files: filesToSend.length > 0 ? filesToSend : undefined,
      });

      setMessageText("");
      setAttachedFiles([]);
      setIsAnalyzing(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("[AI Assistant] Error analyzing:", error);
      setIsAnalyzing(false);
      Alert.alert(i18n.ai.analysisFailed, i18n.ai.analysisFailedDesc, [{ text: i18n.common.ok }]);
    }
  };

  const handleDoubleTapMessage = async (messageId: string, text: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current;

    if (lastTap && lastTap.messageId === messageId && now - lastTap.timestamp < 300) {
      console.log('[AI Assistant] Double tap detected on message:', messageId);
      lastTapRef.current = null;

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (currentlyReadingMessageId === messageId && isSpeaking) {
        console.log('[AI Assistant] Stopping speech');
        Speech.stop();
        setIsSpeaking(false);
        setCurrentlyReadingMessageId(null);
        return;
      }

      if (isSpeaking) {
        Speech.stop();
      }

      setIsSpeaking(true);
      setCurrentlyReadingMessageId(messageId);

      const speechOptions: Speech.SpeechOptions = {
        language: language === 'en' ? 'en-US' : 
                  language === 'es' ? 'es-ES' :
                  language === 'fr' ? 'fr-FR' :
                  language === 'it' ? 'it-IT' :
                  language === 'pt' ? 'pt-BR' :
                  language === 'ja' ? 'ja-JP' :
                  language === 'zh' ? 'zh-CN' :
                  language === 'ar' ? 'ar-SA' :
                  language === 'he' ? 'he-IL' :
                  language === 'ro' ? 'ro-RO' :
                  language === 'ru' ? 'ru-RU' :
                  language === 'hi' ? 'hi-IN' : 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          console.log('[AI Assistant] Speech finished');
          setIsSpeaking(false);
          setCurrentlyReadingMessageId(null);
        },
        onError: (error) => {
          console.error('[AI Assistant] Speech error:', error);
          setIsSpeaking(false);
          setCurrentlyReadingMessageId(null);
        },
        onStopped: () => {
          console.log('[AI Assistant] Speech stopped');
          setIsSpeaking(false);
          setCurrentlyReadingMessageId(null);
        },
      };

      console.log('[AI Assistant] Starting speech for message');
      Speech.speak(text, speechOptions);
    } else {
      lastTapRef.current = { messageId, timestamp: now };
    }
  };

  const handleMicToggle = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isRecording) {
      if (Platform.OS === "web") {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } else {
        if (recording) {
          await recording.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          setIsRecording(false);
          setIsTranscribing(true);
          const uri = recording.getURI();
          if (uri) {
            try {
              const uriParts = uri.split(".");
              const fileType = uriParts[uriParts.length - 1];
              const formData = new FormData();
              const audioFile = {
                uri,
                name: "recording." + fileType,
                type: "audio/" + fileType,
              } as any;
              formData.append("audio", audioFile);
              const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
                method: "POST",
                body: formData,
              });
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const result = await response.json();
              setMessageText(result.text);
              setIsTranscribing(false);
              if (Platform.OS === "ios" || Platform.OS === "android") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error("[AI Assistant] Transcription error:", error);
              setIsTranscribing(false);
              Alert.alert(i18n.ai.transcriptionFailed, i18n.ai.failedToTranscribe);
            }
          }
          setRecording(null);
        }
      }
    } else {
      if (Platform.OS === "web") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];
          mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };
          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");
            setIsTranscribing(true);
            try {
              const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
                method: "POST",
                body: formData,
              });
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const result = await response.json();
              setMessageText(result.text);
              setIsTranscribing(false);
            } catch (error) {
              console.error("[AI Assistant] Transcription error:", error);
              setIsTranscribing(false);
              Alert.alert(i18n.ai.transcriptionFailed, i18n.ai.failedToTranscribe);
            }
            stream.getTracks().forEach((track) => track.stop());
          };
          mediaRecorder.start();
          setIsRecording(true);
        } catch (error) {
          console.error("[AI Assistant] Error starting recording:", error);
          Alert.alert(i18n.ai.recordingFailed, i18n.ai.checkMicPermissions);
        }
      } else {
        try {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(i18n.ai.permissionRequired, i18n.ai.micPermissionRequired);
            return;
          }
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
          const newRecording = new Audio.Recording();
          await newRecording.prepareToRecordAsync({
            android: {
              extension: ".m4a",
              outputFormat: Audio.AndroidOutputFormat.MPEG_4,
              audioEncoder: Audio.AndroidAudioEncoder.AAC,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
            },
            ios: {
              extension: ".wav",
              outputFormat: Audio.IOSOutputFormat.LINEARPCM,
              audioQuality: Audio.IOSAudioQuality.HIGH,
              sampleRate: 44100,
              numberOfChannels: 2,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            web: {},
          });
          await newRecording.startAsync();
          setRecording(newRecording);
          setIsRecording(true);
        } catch (error) {
          console.error("[AI Assistant] Error starting recording:", error);
          Alert.alert(i18n.ai.recordingFailed, i18n.ai.failedToStartRecording);
        }
      }
    }
  };

  return (
    <KeyboardAvoidingView
      testID="audrey-ai-screen"
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <LinearGradient colors={palette.background} style={styles.gradient}>
        <View style={styles.safeArea}>
          <View style={[styles.heroSection, { paddingTop: insets.top + 12, paddingBottom: hasMessages ? 0 : 12 }]}>
            <View style={[styles.heroHeader, hasMessages && { marginBottom: 0 }]}>
              <TouchableOpacity
                style={[styles.heroButton, { borderColor: palette.heroBorder }]}
                onPress={handleBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft color={palette.textPrimary} size={22} strokeWidth={2.4} />
              </TouchableOpacity>
              <Text style={[styles.heroTitle, { color: palette.neonBlue }]}>{i18n.ai.audrey.toUpperCase()}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
                  <TouchableOpacity
                    style={[
                      styles.heroButton,
                      {
                        borderColor: "rgba(0, 217, 255, 0.3)",
                        backgroundColor: "rgba(0, 217, 255, 0.08)",
                        shadowColor: "#00D9FF",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 3,
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.selectionAsync();
                      }
                      router.push("/automations-manager" as any);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Zap color="#00D9FF" size={20} strokeWidth={2} />
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: buttonPulse }] }}>
                <TouchableOpacity
                  style={[
                    styles.heroButton,
                    {
                      borderColor: "rgba(0, 217, 255, 0.3)",
                      backgroundColor: "rgba(0, 217, 255, 0.08)",
                      shadowColor: "#00D9FF",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 3,
                    },
                  ]}
                  onPress={() => setShowAboutModal(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Sparkles color="#00D9FF" size={20} strokeWidth={2} />
                </TouchableOpacity>
              </Animated.View>
              </View>
            </View>

            <Modal
              visible={showAboutModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowAboutModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: isNightMode ? "#000000" : "#FFFFFF" }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>{i18n.ai.aboutAudrey}</Text>
                    <TouchableOpacity
                      onPress={() => setShowAboutModal(false)}
                      style={[styles.closeButton, { backgroundColor: "rgba(255,255,255,0.1)" }]}
                    >
                      <X color={palette.textPrimary} size={20} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.modalBody}>
                      <View style={styles.aboutHero}>
                        <LinearGradient
                          colors={palette.avatarGradient}
                          style={[styles.aboutAvatarCircle, { borderColor: palette.neonBlue }]}
                        >
                          <Image
                            source={{
                              uri: "https://r2-pub.rork.com/generated-images/32fd501e-5286-475c-acc1-8758eaf0aab4.png",
                            }}
                            style={styles.aboutAvatarImage}
                          />
                        </LinearGradient>
                        <Text style={[styles.aboutSubtitle, { color: palette.textPrimary }]}>
                          {i18n.ai.yourAiCompanion}
                        </Text>
                        <Text style={[styles.aboutDescription, { color: palette.subtext }]}>
                          {i18n.ai.audreyDescription}
                        </Text>
                      </View>

                      <Text style={[styles.sectionHeader, { color: palette.accent }]}>{i18n.ai.whatICanDo}</Text>

                      <View style={styles.featuresGrid}>
                        <View style={[styles.featureItem, { backgroundColor: "transparent" }]}>
                          <Calendar color="#A78BFA" size={24} />
                          <View style={styles.featureText}>
                            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>{i18n.ai.smartScheduling}</Text>
                            <Text style={[styles.featureDesc, { color: palette.subtext }]}>
                              {i18n.ai.smartSchedulingDesc}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.featureItem, { backgroundColor: "transparent" }]}>
                          <CheckCircle2 color="#34D399" size={24} />
                          <View style={styles.featureText}>
                            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>{i18n.ai.taskManagement}</Text>
                            <Text style={[styles.featureDesc, { color: palette.subtext }]}>
                              {i18n.ai.taskManagementDesc}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.featureItem, { backgroundColor: "transparent" }]}>
                          <Heart color="#F472B6" size={24} />
                          <View style={styles.featureText}>
                            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>{i18n.ai.wellnessSupport}</Text>
                            <Text style={[styles.featureDesc, { color: palette.subtext }]}>
                              {i18n.ai.wellnessSupportDesc}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.featureItem, { backgroundColor: "transparent" }]}>
                          <Search color="#60A5FA" size={24} />
                          <View style={styles.featureText}>
                            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>{i18n.ai.knowledgeWeb}</Text>
                            <Text style={[styles.featureDesc, { color: palette.subtext }]}>
                              {i18n.ai.knowledgeWebDesc}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.featureItem, { backgroundColor: "transparent" }]}>
                          <BookOpen color="#E879F9" size={24} />
                          <View style={styles.featureText}>
                            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>{i18n.ai.learningGrowth}</Text>
                            <Text style={[styles.featureDesc, { color: palette.subtext }]}>
                              {i18n.ai.learningGrowthDesc}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.featureItem, { backgroundColor: "transparent" }]}>
                          <Brain color="#FB923C" size={24} />
                          <View style={styles.featureText}>
                            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>{i18n.ai.intelligentAnalysis}</Text>
                            <Text style={[styles.featureDesc, { color: palette.subtext }]}>
                              {i18n.ai.intelligentAnalysisDesc}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={{ height: 40 }} />
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>

          <View
            style={[
              styles.chatCard,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
              hasMessages && {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderWidth: 0,
                paddingTop: 8,
              },
            ]}
          >
            {!hasMessages && (
              <View style={styles.backgroundContent}>
                <View style={styles.avatarStack}>
                  <Animated.View
                    style={[
                      styles.avatarPulse,
                      {
                        backgroundColor: palette.glow,
                        transform: [{ scale: pulseScale }],
                        opacity: pulseOpacity,
                      },
                    ]}
                  />
                  <LinearGradient
                    colors={palette.avatarGradient}
                    style={[styles.avatarCircle, { borderColor: palette.neonBlue, borderWidth: 2 }]}
                  >
                    <Image
                      source={{
                        uri: "https://r2-pub.rork.com/generated-images/32fd501e-5286-475c-acc1-8758eaf0aab4.png",
                      }}
                      style={styles.avatarImage}
                    />
                  </LinearGradient>
                </View>
                <Text style={[styles.heroName, { color: "#FFFFFF", fontSize: 16, fontWeight: "500" }]}>
                  {i18n.ai.lifeCompanion}
                </Text>
              </View>
            )}



            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={[styles.messagesContent, { paddingBottom: 16 }]}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 ? null : (
                <View style={styles.messagesList}>
                  {messages
                    .filter((m) => m && m.id && m.parts && Array.isArray(m.parts) && m.parts.length > 0 && m.role !== 'system')
                    .map((message) => {
                      const isUser = message.role === "user";

                      if (!message.parts || !Array.isArray(message.parts) || message.parts.length === 0) {
                        console.log("[AI Assistant] Skipping message with invalid parts:", message.id);
                        return null;
                      }

                      const files = (message as any).files || (message as any).experimental_attachments || [];
                      const hasFiles = files.length > 0;

                      return (
                        <View key={message.id} style={styles.messageWrapper}>
                          {hasFiles && files.map((file: any, fileIndex: number) => {
                             if (!file) return null;
                             return (
                             <View
                                key={`file-${message.id}-${fileIndex}`}
                                style={[
                                  styles.chatAttachment,
                                  isUser ? { alignSelf: 'flex-end', backgroundColor: palette.bubbleUser } : { alignSelf: 'flex-start', backgroundColor: palette.cardBg },
                                  { borderColor: palette.cardBorder }
                                ]}
                             >
                                <FileText color={isUser ? (isNightMode ? "#00121D" : "#FFFFFF") : palette.accent} size={24} />
                                <View style={styles.chatAttachmentInfo}>
                                    <Text style={[styles.chatAttachmentName, { color: isUser ? (isNightMode ? "#00121D" : "#FFFFFF") : palette.textPrimary }]} numberOfLines={1}>
                                    {file.name || 'Document'}
                                    </Text>
                                    <Text style={[styles.chatAttachmentType, { color: isUser ? (isNightMode ? "rgba(0,18,29,0.7)" : "rgba(255,255,255,0.7)") : palette.subtext }]}>
                                    {file.mediaType || file.type || 'File'}
                                    </Text>
                                </View>
                             </View>
                            );
                          })}

                          {message.parts.map((part, partIndex) => {
                            if (!part) return null;
                            if (part.type === "text") {
                              if (hasFiles && part.text === i18n.ai.attachedFiles) return null;
                              if (!part.text) return null;

                              const isCurrentlyReading = !isUser && currentlyReadingMessageId === message.id;

                              return (
                                <TouchableOpacity
                                  key={`${message.id}-${partIndex}`}
                                  activeOpacity={isUser ? 1 : 0.7}
                                  onPress={() => {
                                    if (!isUser) {
                                      handleDoubleTapMessage(message.id, part.text);
                                    }
                                  }}
                                  style={[
                                    styles.messageBubble,
                                    isUser ? styles.userMessage : styles.assistantMessage,
                                    {
                                      backgroundColor: isUser ? palette.bubbleUser : palette.bubbleAssistant,
                                      borderColor: isUser
                                        ? "rgba(0,0,0,0.05)"
                                        : isCurrentlyReading
                                        ? palette.neonBlue
                                        : isNightMode
                                        ? "rgba(111, 243, 255, 0.12)"
                                        : "rgba(46, 142, 235, 0.15)",
                                      borderWidth: isCurrentlyReading ? 2 : 1,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.messageText,
                                      { color: isUser ? (isNightMode ? "#00121D" : "#FFFFFF") : palette.textPrimary },
                                    ]}
                                  >
                                    {part.text}
                                  </Text>
                                  {!isUser && (
                                    <View style={styles.doubleTapHint}>
                                      <Volume2 
                                        color={isCurrentlyReading ? palette.neonBlue : palette.subtext} 
                                        size={12} 
                                      />
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            }

                            if ((part as any).type === "tool-invocation") {
                              const toolInvocation = (part as any).toolInvocation;
                              if (
                                toolInvocation.toolName === "generateAudreyPortrait" &&
                                toolInvocation.state === "result"
                              ) {
                                return (
                                  <View key={`${message.id}-${partIndex}`} style={styles.generatedImageContainer}>
                                    <Image
                                      source={{ uri: toolInvocation.result }}
                                      style={styles.generatedImage}
                                      resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                      style={styles.downloadButton}
                                      onPress={async () => {
                                        if (Platform.OS === "web") {
                                          const link = document.createElement("a");
                                          link.href = toolInvocation.result;
                                          link.download = "Audrey_FullBody.png";
                                          link.click();
                                        } else {
                                          try {
                                            const base64Data = toolInvocation.result.split(",")[1];
                                            // @ts-ignore
                                            const filename = (FileSystem.documentDirectory || "") + "Audrey_FullBody.png";
                                            await FileSystem.writeAsStringAsync(filename, base64Data, {
                                              // @ts-ignore
                                              encoding: "base64",
                                            });

                                            if (await MediaLibrary.requestPermissionsAsync()) {
                                              await MediaLibrary.saveToLibraryAsync(filename);
                                              Alert.alert(i18n.common.saved, i18n.ai.imageSaved);
                                            } else {
                                              await Share.share({
                                                url: filename,
                                                title: "Audrey Full Body",
                                              });
                                            }
                                          } catch (e) {
                                            console.error("Save error:", e);
                                            Alert.alert(i18n.common.error, i18n.ai.failedToSaveImage);
                                          }
                                        }
                                      }}
                                    >
                                      <Download color="#FFFFFF" size={20} />
                                      <Text style={styles.downloadText}>{i18n.ai.download}</Text>
                                    </TouchableOpacity>
                                  </View>
                                );
                              }
                              return null;
                            }
                            return null;
                          })}
                        </View>
                      );
                    })}
                </View>
              )}
            </ScrollView>

            {attachedFiles.length > 0 && (
              <View style={[styles.attachmentsPreview, { borderColor: palette.cardBorder }] }>
                <View style={styles.attachmentsHeader}>
                  <Text style={[styles.attachmentsTitle, { color: palette.textPrimary }]}>({attachedFiles.length})</Text>
                  <TouchableOpacity onPress={() => setAttachedFiles([])}>
                    <Text style={[styles.clearAttachmentsText, { color: palette.accent }]}>{i18n.ai.clearAll}</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsList}>
                  {attachedFiles.map((file, index) => (
                    <View key={index} style={[styles.attachmentItem, { borderColor: palette.cardBorder }] }>
                      <FileText color={palette.accent} size={22} strokeWidth={1.8} />
                      <Text style={[styles.attachmentName, { color: palette.textPrimary }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== index))}
                        style={styles.removeAttachmentButton}
                      >
                        <Text style={styles.removeAttachmentText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              <View style={styles.floatingIconsRow}>
                <TouchableOpacity
                  style={[
                    styles.floatingIconButton,
                    showAnalysisMenu && styles.floatingIconButtonActive,
                    { borderColor: showAnalysisMenu ? palette.accent : palette.cardBorder },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.selectionAsync();
                    }
                    setShowAnalysisMenu(!showAnalysisMenu);
                  }}
                >
                  <Paperclip color={showAnalysisMenu ? "#FFFFFF" : palette.textPrimary} size={18} strokeWidth={2.2} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.floatingIconButton,
                    isAnalyzing && styles.floatingIconButtonActive,
                    { borderColor: isAnalyzing ? palette.accent : palette.cardBorder },
                    !messageText.trim() && attachedFiles.length === 0 && { opacity: 0.5 },
                  ]}
                  onPress={handleAnalyzeContent}
                  disabled={isAnalyzing || (!messageText.trim() && attachedFiles.length === 0)}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Brain color={palette.textPrimary} size={18} strokeWidth={2.2} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.floatingIconButton, { borderColor: palette.cardBorder }]}
                  onPress={async () => {
                    if (isSpeaking) {
                      Speech.stop();
                      setIsSpeaking(false);
                    } else {
                      setAutoSpeakEnabled(!autoSpeakEnabled);
                    }
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  {isSpeaking ? (
                    <VolumeX color={palette.accent} size={18} strokeWidth={2.2} />
                  ) : (
                    <Volume2
                      color={autoSpeakEnabled ? palette.textPrimary : palette.subtext}
                      size={18}
                      strokeWidth={2.2}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.floatingIconButton,
                    isRecording && styles.floatingIconButtonActive,
                    { borderColor: isRecording ? palette.accent : palette.cardBorder },
                  ]}
                  onPress={handleMicToggle}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : isRecording ? (
                    <MicOff color="#FFFFFF" size={18} strokeWidth={2.2} />
                  ) : (
                    <Mic color={palette.textPrimary} size={18} strokeWidth={2.2} />
                  )}
                </TouchableOpacity>



                {messages.length > 0 && (
                  <TouchableOpacity
                    style={[styles.floatingIconButton, { borderColor: palette.cardBorder }]}
                    onPress={() => {
                      setMessages([]);
                      if (Platform.OS !== "web") {
                        Haptics.selectionAsync();
                      }
                    }}
                  >
                    <Trash2 color={palette.textPrimary} size={18} strokeWidth={2.2} />
                  </TouchableOpacity>
                )}

                {isKeyboardVisible && (
                  <KeyboardDismissButton
                    style={[styles.floatingIconButton, { borderColor: palette.cardBorder }]}
                    color={palette.textPrimary}
                    size={20}
                  />
                )}
              </View>

              {showAnalysisMenu && (
                <View style={[styles.analysisMenu, { borderColor: palette.cardBorder }]}>
                  <TouchableOpacity style={styles.analysisMenuItem} onPress={handleUploadFile} activeOpacity={0.7}>
                    <View style={[styles.analysisMenuIcon, { backgroundColor: palette.glow }]}>
                      <FileText color={palette.textPrimary} size={20} strokeWidth={2.2} />
                    </View>
                    <View style={styles.analysisMenuTextContainer}>
                      <Text style={[styles.analysisMenuTitle, { color: palette.textPrimary }]}>{i18n.ai.uploadDocument}</Text>
                      <Text style={[styles.analysisMenuSubtitle, { color: palette.subtext }]}>{i18n.ai.attachFiles}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.inputWrapper, { borderColor: palette.neonBlue, borderWidth: 1.5 }]}>
                <TextInput
                  ref={(ref) => {
                    inputRef.current = ref;
                  }}
                  style={[styles.input, { color: palette.textPrimary }]}
                  placeholder={i18n.ai.askMeAnything}
                  placeholderTextColor={palette.subtext}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={1000}
                />
                <View style={styles.sendButtonContainer}>
                  {(messageText.trim() || attachedFiles.length > 0) && (
                    <>
                      <Animated.View
                        style={[
                          styles.sparkle1,
                          {
                            opacity: sparkleAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, 1, 0],
                            }),
                            transform: [
                              {
                                scale: sparkleAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.5, 1.5],
                                }),
                              },
                              {
                                rotate: sparkleAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '180deg'],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Sparkles color="#00D9FF" size={16} />
                      </Animated.View>
                      <Animated.View
                        style={[
                          styles.sparkle2,
                          {
                            opacity: sparkleAnim.interpolate({
                              inputRange: [0, 0.3, 0.6, 1],
                              outputRange: [0, 1, 1, 0],
                            }),
                            transform: [
                              {
                                scale: sparkleAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1.2],
                                }),
                              },
                              {
                                rotate: sparkleAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['45deg', '225deg'],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Sparkles color="#00D9FF" size={12} />
                      </Animated.View>
                      <Animated.View
                        style={[
                          styles.sparkle3,
                          {
                            opacity: sparkleAnim.interpolate({
                              inputRange: [0, 0.4, 0.8, 1],
                              outputRange: [0, 0.8, 0.8, 0],
                            }),
                            transform: [
                              {
                                scale: sparkleAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.6, 1.3],
                                }),
                              },
                              {
                                rotate: sparkleAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['90deg', '270deg'],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Sparkles color="#00D9FF" size={14} />
                      </Animated.View>
                    </>
                  )}
                  <TouchableOpacity
                    style={[styles.sendButton, !messageText.trim() && attachedFiles.length === 0 && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={!messageText.trim() && attachedFiles.length === 0}
                  >
                    <LinearGradient
                      colors={
                        messageText.trim() || attachedFiles.length > 0
                          ? ["#00D9FF", "#00B8E6"]
                          : ["#E0E0E0", "#D0D0D0"]
                      }
                      style={styles.sendButtonGradient}
                    >
                      <Send
                        color={messageText.trim() || attachedFiles.length > 0 ? "#000000" : "#FFFFFF"}
                        size={18}
                        strokeWidth={2.4}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    paddingBottom: 24,
    alignItems: "center",
  },
  heroHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  heroButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  heroTitle: {
    fontSize: 18,
    letterSpacing: 4,
    fontWeight: "600" as const,
  },
  avatarStack: {
    width: 220,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPulse: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  avatarCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroName: {
    fontSize: 34,
    marginTop: 24,
    fontWeight: "700" as const,
  },
  heroSubtitle: {
    fontSize: 16,
    marginTop: 6,
    textAlign: "center",
  },

  chatCard: {
    flex: 1,
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 4,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
  },
  chatHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chatHeader: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 300,
    fontWeight: "500" as const,
  },
  messagesList: {
    gap: 12,
  },
  messageWrapper: {
    gap: 8,
  },
  messageBubble: {
    maxWidth: "82%",
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  userMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  assistantMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500" as const,
  },
  attachmentsPreview: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  attachmentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  clearAttachmentsText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  attachmentsList: {
    flexDirection: "row",
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingRight: 24,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 120,
    maxWidth: 180,
    gap: 6,
    backgroundColor: "transparent",
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: "500" as const,
    flex: 1,
  },
  removeAttachmentButton: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF4757",
    alignItems: "center",
    justifyContent: "center",
  },
  removeAttachmentText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    lineHeight: 18,
  },
  inputContainer: {
    paddingTop: 12,
  },
  floatingIconsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  floatingIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  floatingIconButtonActive: {
    backgroundColor: "#2E8EEB",
  },
  analysisMenu: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "transparent",
    marginBottom: 10,
  },
  analysisMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  analysisMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  analysisMenuTextContainer: {
    flex: 1,
  },
  analysisMenuTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  analysisMenuSubtitle: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: "transparent",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: "500" as const,
    maxHeight: 100,
    minHeight: 36,
    backgroundColor: "transparent",
  },
  sendButtonContainer: {
    position: "relative" as const,
    width: 36,
    height: 36,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  sparkle1: {
    position: "absolute" as const,
    top: -10,
    right: -8,
    zIndex: 10,
  },
  sparkle2: {
    position: "absolute" as const,
    bottom: -8,
    right: -10,
    zIndex: 10,
  },
  sparkle3: {
    position: "absolute" as const,
    top: -12,
    left: -6,
    zIndex: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "90%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    flex: 1,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  aboutHero: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 10,
  },
  aboutAvatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  aboutAvatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  aboutSubtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "90%",
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 16,
    opacity: 0.8,
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  backgroundContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
    zIndex: -1,
  },
  generatedImageContainer: {
    width: 250,
    borderRadius: 20,
    overflow: "hidden",
    marginVertical: 8,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(0, 217, 255, 0.3)",
  },
  generatedImage: {
    width: "100%",
    height: 400,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    gap: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  downloadText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  chatAttachment: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 4,
    gap: 12,
    maxWidth: "82%",
  },
  chatAttachmentInfo: {
    flex: 1,
  },
  chatAttachmentName: {
    fontSize: 14,
    fontWeight: "600",
  },
  chatAttachmentType: {
    fontSize: 12,
    opacity: 0.7,
  },
  doubleTapHint: {
    position: "absolute" as const,
    bottom: 4,
    right: 8,
    opacity: 0.5,
  },
});
