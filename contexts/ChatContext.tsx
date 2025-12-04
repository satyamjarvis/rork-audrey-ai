import { useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { usePersistentStorage } from "@/utils/usePersistentStorage";
import { encryptMessage, decryptMessage, encryptFile, decryptFile, EncryptedData } from "@/utils/encryption";
import { getMimeTypeFromFileName } from "@/utils/attachmentHelpers";

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
  id: 'default',
  type: 'gradient',
  colors: ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"],
  name: 'Default Cosmic'
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
    const newThemes = { ...chatThemes, [calendarId]: theme };
    await saveThemes(newThemes);
  }, [chatThemes, saveThemes]);

  const getChatTheme = useCallback((calendarId: string): ChatTheme => {
    return chatThemes[calendarId] || DEFAULT_THEME;
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
      const encryptedData = await encryptMessage(text);
      
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        calendarId,
        senderEmail,
        text: "",
        encrypted: true,
        encryptedData,
        timestamp: Date.now(),
        attachment: attachment ? { ...attachment, uploadedAt: new Date().toISOString() } : undefined,
        textColor,
        fontStyle,
      };
      
      const updatedMessages = [...messages, newMessage];
      await saveMessages(updatedMessages);
      console.log("✅ Encrypted message sent:", newMessage.id);
      return newMessage;
    } catch (error) {
      console.error("❌ Error sending encrypted message:", error);
      throw error;
    }
  }, [messages, saveMessages]);

  const getMessagesForCalendar = useCallback((calendarId: string): ChatMessage[] => {
    return messages
      .filter((msg) => msg.calendarId === calendarId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages]);

  const deleteMessage = useCallback(async (messageId: string) => {
    const updatedMessages = messages.filter((msg) => msg.id !== messageId);
    await saveMessages(updatedMessages);
    console.log("Message deleted:", messageId);
  }, [messages, saveMessages]);

  const clearCalendarChat = useCallback(async (calendarId: string) => {
    const updatedMessages = messages.filter((msg) => msg.calendarId !== calendarId);
    await saveMessages(updatedMessages);
    console.log("Chat cleared for calendar:", calendarId);
  }, [messages, saveMessages]);

  const getDecryptedMessage = useCallback(async (message: ChatMessage): Promise<string> => {
    if (!message.encrypted || !message.encryptedData) {
      return message.text;
    }
    try {
      return await decryptMessage(message.encryptedData);
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
      const encryptedFileData = await encryptFile(fileData);
      
      const mimeType = getMimeTypeFromFileName(fileName);

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
      
      return await sendMessage(calendarId, messageText, senderEmail, attachment);
    } catch (error) {
      console.error("❌ Error sending file attachment:", error);
      throw error;
    }
  }, [sendMessage]);

  const downloadAttachment = useCallback(async (
    attachment: FileAttachment,
    calendarId: string,
    messageId: string
  ): Promise<string> => {
    try {
      return await decryptFile(attachment.encryptedData);
    } catch (error) {
      console.error("❌ Error downloading attachment:", error);
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
