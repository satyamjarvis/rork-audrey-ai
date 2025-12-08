import { useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { usePersistentStorage } from "@/utils/usePersistentStorage";
import { encryptMessage, decryptMessage, encryptFile, decryptFile, EncryptedData } from "@/utils/encryption";
import { getMimeTypeFromFileName } from "@/utils/attachmentHelpers";
import { ensureArray, ensureString, safeFilterArray, safeExecute } from "@/utils/resilience";

export type FileAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  encryptedData: EncryptedData;
  size: number;
  uploadedAt: string;
  allowEditing?: boolean;
  sourceFeature?: 'analytics' | 'planner' | 'notes' | 'mindmap' | 'external';
  sourceId?: string;
  metadata?: any;
};

export type ChatMessage = {
  id: string;
  calendarId: string;
  senderEmail: string;
  text: string;
  encrypted: boolean;
  encryptedData?: EncryptedData;
  timestamp: number;
  attachment?: FileAttachment;
  textColor?: string;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic';
};

export type ChatThemeType = 'solid' | 'gradient' | 'animated';
export type ChatThemeAnimation = 'stars' | 'bubbles' | 'rain' | 'snow' | 'floating-shapes' | 'neon-grid';

export interface ChatTheme {
  id: string;
  type: ChatThemeType;
  colors: string[];
  animation?: ChatThemeAnimation;
  name: string;
}

export const DEFAULT_THEME: ChatTheme = {
  id: 'gradient-ios-aurora',
  type: 'gradient',
  colors: ['#2E3192', '#1BFFFF'],
  name: 'Aurora'
};

const CHAT_MESSAGES_KEY = "@chat_messages";
const CHAT_THEMES_KEY = "@chat_themes";

export const [ChatProvider, useChat] = createContextHook(() => {
  // 1. Messages Storage
  const {
    data: messages,
    saveData: saveMessages,
    isLoading: isMessagesLoading
  } = usePersistentStorage<ChatMessage[]>({
    key: CHAT_MESSAGES_KEY,
    initialValue: [],
    encryption: true, // Encrypt the entire message store for metadata protection
    backup: true, // Backup messages
  });

  // 2. Themes Storage
  const {
    data: chatThemes,
    saveData: saveThemes,
    isLoading: isThemesLoading
  } = usePersistentStorage<Record<string, ChatTheme>>({
    key: CHAT_THEMES_KEY,
    initialValue: {},
    encryption: true,
  });

  const isLoading = isMessagesLoading || isThemesLoading;

  const setChatTheme = useCallback(async (calendarId: string, theme: ChatTheme) => {
    try {
      if (!calendarId || !theme) {
        console.warn('[ChatContext] setChatTheme: invalid params');
        return;
      }
      const safeThemes = chatThemes && typeof chatThemes === 'object' ? chatThemes : {};
      const newThemes = { ...safeThemes, [calendarId]: theme };
      await saveThemes(newThemes);
    } catch (error) {
      console.error('[ChatContext] setChatTheme error:', error);
    }
  }, [chatThemes, saveThemes]);

  const getChatTheme = useCallback((calendarId: string): ChatTheme => {
    try {
      if (!calendarId) return DEFAULT_THEME;
      const safeThemes = chatThemes && typeof chatThemes === 'object' ? chatThemes : {};
      return safeThemes[calendarId] || DEFAULT_THEME;
    } catch (error) {
      console.error('[ChatContext] getChatTheme error:', error);
      return DEFAULT_THEME;
    }
  }, [chatThemes]);

  const sendMessage = useCallback(async (
    calendarId: string,
    text: string,
    senderEmail: string = "me",
    attachment?: Omit<FileAttachment, "uploadedAt">,
    textColor?: string,
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic'
  ) => {
    try {
      if (!calendarId) {
        console.error('[ChatContext] sendMessage: calendarId is required');
        throw new Error('Calendar ID is required');
      }
      
      const safeText = ensureString(text, '');
      const encryptedData = await encryptMessage(safeText);
      
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        calendarId,
        senderEmail: ensureString(senderEmail, 'me'),
        text: "",
        encrypted: true,
        encryptedData,
        timestamp: Date.now(),
        attachment: attachment ? { ...attachment, uploadedAt: new Date().toISOString() } : undefined,
        textColor,
        fontStyle,
      };
      
      const safeMessages = ensureArray<ChatMessage>(messages, []);
      const updatedMessages = [...safeMessages, newMessage];
      await saveMessages(updatedMessages);
      console.log("✅ Encrypted message sent:", newMessage.id);
      return newMessage;
    } catch (error) {
      console.error("❌ Error sending encrypted message:", error);
      throw error;
    }
  }, [messages, saveMessages]);

  const getMessagesForCalendar = useCallback((calendarId: string): ChatMessage[] => {
    try {
      const safeMessages = ensureArray<ChatMessage>(messages, []);
      return safeFilterArray(
        safeMessages,
        (msg) => msg && msg.calendarId === calendarId,
        []
      ).sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));
    } catch (error) {
      console.error('[ChatContext] getMessagesForCalendar error:', error);
      return [];
    }
  }, [messages]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const safeMessages = ensureArray<ChatMessage>(messages, []);
      const updatedMessages = safeFilterArray(
        safeMessages,
        (msg) => msg && msg.id !== messageId,
        []
      );
      await saveMessages(updatedMessages);
      console.log("Message deleted:", messageId);
    } catch (error) {
      console.error('[ChatContext] deleteMessage error:', error);
    }
  }, [messages, saveMessages]);

  const clearCalendarChat = useCallback(async (calendarId: string) => {
    try {
      const safeMessages = ensureArray<ChatMessage>(messages, []);
      const updatedMessages = safeFilterArray(
        safeMessages,
        (msg) => msg && msg.calendarId !== calendarId,
        []
      );
      await saveMessages(updatedMessages);
      console.log("Chat cleared for calendar:", calendarId);
    } catch (error) {
      console.error('[ChatContext] clearCalendarChat error:', error);
    }
  }, [messages, saveMessages]);

  const getDecryptedMessage = useCallback(async (message: ChatMessage): Promise<string> => {
    try {
      if (!message) {
        console.warn('[ChatContext] getDecryptedMessage: message is null/undefined');
        return "[No message]";
      }
      if (!message.encrypted || !message.encryptedData) {
        return ensureString(message.text, "");
      }
      const result = await safeExecute(
        () => decryptMessage(message.encryptedData!),
        "[Decryption failed]",
        { context: 'ChatContext.getDecryptedMessage' }
      );
      return result.data || "[Decryption failed]";
    } catch (error) {
      console.error("❌ Error decrypting message:", error);
      return "[Decryption failed]";
    }
  }, []);

  const sendFileAttachment = useCallback(async (
    calendarId: string,
    fileData: string,
    fileName: string,
    messageText: string = "Shared a file",
    senderEmail: string = "me",
    allowEditing: boolean = true,
    sourceFeature?: 'analytics' | 'planner' | 'notes' | 'mindmap' | 'external',
    sourceId?: string,
    metadata?: any
  ) => {
    try {
      console.log("📤 [Chat] Sending file attachment:", fileName);
      console.log("📤 [Chat] File data length:", fileData?.length || 0);
      
      // Validate file data
      if (!fileData || fileData.length === 0) {
        console.error("❌ [Chat] No file data provided");
        throw new Error("No file data provided");
      }
      
      if (!calendarId) {
        console.error("❌ [Chat] No calendar ID provided");
        throw new Error("No calendar ID provided");
      }
      
      const encryptedFileData = await encryptFile(fileData);
      
      if (!encryptedFileData.data || encryptedFileData.data.length === 0) {
        console.error("❌ [Chat] Encryption returned empty data");
        throw new Error("Failed to encrypt file data");
      }
      
      console.log("📤 [Chat] Encrypted data length:", encryptedFileData.data.length);
      
      const mimeType = getMimeTypeFromFileName(fileName);
      console.log("📤 [Chat] MIME type:", mimeType);

      const attachment: Omit<FileAttachment, "uploadedAt"> = {
        id: `file_${Date.now()}_${Math.random()}`,
        fileName,
        fileType: mimeType,
        encryptedData: encryptedFileData,
        size: fileData.length,
        allowEditing,
        sourceFeature,
        sourceId,
        metadata
      };
      
      const result = await sendMessage(calendarId, messageText, senderEmail, attachment);
      console.log("✅ [Chat] File attachment sent successfully:", attachment.id);
      return result;
    } catch (error) {
      console.error("❌ [Chat] Error sending file attachment:", error);
      throw error;
    }
  }, [sendMessage]);

  const downloadAttachment = useCallback(async (
    attachment: FileAttachment,
    calendarId: string,
    messageId: string
  ): Promise<string> => {
    try {
      console.log("📥 [Chat] Downloading attachment:", attachment.fileName);
      console.log("📥 [Chat] Encrypted data length:", attachment.encryptedData?.data?.length || 0);
      
      const decryptedData = await decryptFile(attachment.encryptedData);
      console.log("📥 [Chat] Decrypted data length:", decryptedData?.length || 0);
      
      return decryptedData;
    } catch (error) {
      console.error("❌ [Chat] Error downloading attachment:", error);
      throw error;
    }
  }, []);

  return useMemo(
    () => ({
      messages,
      isLoading,
      sendMessage,
      getMessagesForCalendar,
      deleteMessage,
      clearCalendarChat,
      getDecryptedMessage,
      sendFileAttachment,
      downloadAttachment,
      setChatTheme,
      getChatTheme,
      chatThemes,
    }),
    [
      messages,
      isLoading,
      sendMessage,
      getMessagesForCalendar,
      deleteMessage,
      clearCalendarChat,
      getDecryptedMessage,
      sendFileAttachment,
      downloadAttachment,
      setChatTheme,
      getChatTheme,
      chatThemes,
    ]
  );
});
