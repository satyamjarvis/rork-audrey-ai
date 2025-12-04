import { useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { usePersistentStorage } from "@/utils/usePersistentStorage";

export type ConversationSummary = {
  id: string;
  timestamp: number;
  preview: string;
  topicsDiscussed: string[];
  actionsTaken: string[];
  userInsightsLearned: string[];
};

export type AudreyMemory = {
  conversationHistory: ConversationSummary[];
  totalConversations: number;
  firstInteractionDate?: number;
  lastInteractionDate?: number;
  commonTopics: { [key: string]: number };
  userPatterns: {
    preferredTimeOfDay?: "morning" | "afternoon" | "evening" | "night";
    frequentRequests: string[];
    communicationStyle?: "formal" | "casual" | "direct";
  };
};

const AUDREY_MEMORY_KEY = "@audrey_memory";
const MAX_CONVERSATION_SUMMARIES = 100;

const DEFAULT_MEMORY: AudreyMemory = {
  conversationHistory: [],
  totalConversations: 0,
  commonTopics: {},
  userPatterns: {
    frequentRequests: [],
  },
};

export const [AudreyMemoryProvider, useAudreyMemory] = createContextHook(() => {
  const {
    data: memory,
    isLoading,
    saveData,
    error,
  } = usePersistentStorage<AudreyMemory>({
    key: AUDREY_MEMORY_KEY,
    initialValue: DEFAULT_MEMORY,
    encryption: true,
    backup: true,
    debounce: 1000,
  });

  const addConversationSummary = useCallback(
    async (
      preview: string,
      topicsDiscussed: string[],
      actionsTaken: string[],
      userInsightsLearned: string[]
    ) => {
      const summary: ConversationSummary = {
        id: `conv_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        preview,
        topicsDiscussed,
        actionsTaken,
        userInsightsLearned,
      };

      const updatedCommonTopics = { ...memory.commonTopics };
      topicsDiscussed.forEach((topic) => {
        updatedCommonTopics[topic] = (updatedCommonTopics[topic] || 0) + 1;
      });

      const updatedFrequentRequests = [...memory.userPatterns.frequentRequests];
      actionsTaken.forEach((action) => {
        if (!updatedFrequentRequests.includes(action)) {
          updatedFrequentRequests.push(action);
        }
      });

      const conversationHistory = [
        summary,
        ...memory.conversationHistory,
      ].slice(0, MAX_CONVERSATION_SUMMARIES);

      const hour = new Date().getHours();
      let timeOfDay: "morning" | "afternoon" | "evening" | "night";
      if (hour >= 6 && hour < 12) timeOfDay = "morning";
      else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17 && hour < 22) timeOfDay = "evening";
      else timeOfDay = "night";

      const updatedMemory: AudreyMemory = {
        conversationHistory,
        totalConversations: memory.totalConversations + 1,
        firstInteractionDate: memory.firstInteractionDate || Date.now(),
        lastInteractionDate: Date.now(),
        commonTopics: updatedCommonTopics,
        userPatterns: {
          ...memory.userPatterns,
          preferredTimeOfDay: timeOfDay,
          frequentRequests: updatedFrequentRequests.slice(0, 20),
        },
      };

      await saveData(updatedMemory);
      console.log("✅ Conversation summary added to memory");
      return summary;
    },
    [memory, saveData]
  );

  const getRecentConversations = useCallback(
    (count: number = 5): ConversationSummary[] => {
      return memory.conversationHistory.slice(0, count);
    },
    [memory.conversationHistory]
  );

  const getMemorySummary = useCallback((): string => {
    if (memory.totalConversations === 0) {
      return "This is your first conversation with Audrey.";
    }

    const topTopics = Object.entries(memory.commonTopics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    let summary = `Conversation Statistics:
- Total conversations: ${memory.totalConversations}
- Common topics: ${topTopics.join(", ") || "none yet"}
- Preferred interaction time: ${memory.userPatterns.preferredTimeOfDay || "unknown"}

Recent conversation insights:
`;

    const recentConvs = getRecentConversations(3);
    if (recentConvs.length > 0) {
      recentConvs.forEach((conv, idx) => {
        summary += `${idx + 1}. ${conv.preview}\n`;
        if (conv.userInsightsLearned.length > 0) {
          summary += `   Learned: ${conv.userInsightsLearned.join(", ")}\n`;
        }
      });
    } else {
      summary += "No recent conversations.";
    }

    return summary;
  }, [memory, getRecentConversations]);

  const getContextForNewConversation = useCallback((): string => {
    if (memory.totalConversations === 0) {
      return "This is the user's first conversation with you. Be welcoming and learn about them.";
    }

    const recentConvs = getRecentConversations(3);
    const topTopics = Object.entries(memory.commonTopics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    let context = `Previous Interaction Context:
- You've had ${memory.totalConversations} conversation(s) with this user
- They often discuss: ${topTopics.join(", ") || "various topics"}
- Preferred time: ${memory.userPatterns.preferredTimeOfDay || "any time"}
- Common requests: ${memory.userPatterns.frequentRequests.slice(0, 3).join(", ") || "none yet"}

Recent conversations:
`;

    recentConvs.forEach((conv, idx) => {
      context += `${idx + 1}. ${conv.preview}\n`;
      if (conv.topicsDiscussed.length > 0) {
        context += `   Topics: ${conv.topicsDiscussed.join(", ")}\n`;
      }
      if (conv.userInsightsLearned.length > 0) {
        context += `   User insights: ${conv.userInsightsLearned.join(", ")}\n`;
      }
    });

    context += "\nUse this context to provide more personalized and contextual assistance. Reference past conversations when relevant.";

    return context;
  }, [memory, getRecentConversations]);

  const clearMemory = useCallback(async () => {
    await saveData(DEFAULT_MEMORY);
    console.log("✅ Audrey memory cleared");
  }, [saveData]);

  return useMemo(
    () => ({
      memory,
      isLoading,
      error,
      addConversationSummary,
      getRecentConversations,
      getMemorySummary,
      getContextForNewConversation,
      clearMemory,
    }),
    [
      memory,
      isLoading,
      error,
      addConversationSummary,
      getRecentConversations,
      getMemorySummary,
      getContextForNewConversation,
      clearMemory,
    ]
  );
});
