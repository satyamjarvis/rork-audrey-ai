import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { encrypt, decrypt } from "@/utils/encryption";

// Local type definition to avoid circular dependency
export type Attachment = {
  id: string;
  name: string;
  type: string;
  uri: string;
  size: number;
  uploadedAt: string;
};

export type ShareableItemType = 
  | "planner_task"
  | "calendar_event"
  | "contact"
  | "analytics_spreadsheet"
  | "calendar_attachment";

export type SharedItem = {
  id: string;
  type: ShareableItemType;
  data: any;
  sharedAt: string;
  sharedBy: string;
  title: string;
  description?: string;
  permissions: {
    canDownload: boolean;
    canEmailShare: boolean;
    canOpenInSource: boolean;
  };
  sourceRoute?: string;
  exportOptions?: {
    format?: "xlsx" | "csv" | "pdf";
    permission?: "view" | "edit";
    password?: string;
    email?: string;
  };
};

export type ChatSharedItem = {
  id: string;
  chatId: string;
  sharedItem: SharedItem;
  timestamp: number;
};

const SHARED_ITEMS_KEY = "@shared_items";

export const [SharingProvider, useSharing] = createContextHook(() => {
  const [sharedItems, setSharedItems] = useState<ChatSharedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSharedItems = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(SHARED_ITEMS_KEY);
      if (data && data.trim() !== '' && data !== 'undefined' && data !== 'null') {
        try {
          let parsedItems;
          try {
            const decryptedData = await decrypt(data);
            parsedItems = JSON.parse(decryptedData);
            console.log("🔓 Shared items decrypted successfully");
          } catch {
            parsedItems = JSON.parse(data);
            console.log("⚠️ Loaded unencrypted shared items, will encrypt on next save");
          }
          if (Array.isArray(parsedItems)) {
            setSharedItems(parsedItems);
          }
        } catch (parseError) {
          console.error("Error parsing shared items:", parseError);
          await AsyncStorage.removeItem(SHARED_ITEMS_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading shared items:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSharedItems();
  }, [loadSharedItems]);

  const saveSharedItems = useCallback(async (items: ChatSharedItem[]) => {
    try {
      if (!Array.isArray(items)) {
        console.error("Invalid shared items data: not an array", typeof items);
        return;
      }
      const jsonString = JSON.stringify(items);
      if (!jsonString || jsonString === 'undefined' || jsonString.startsWith('[object')) {
        console.error("Invalid JSON string generated", jsonString.substring(0, 50));
        return;
      }
      const encryptedData = await encrypt(jsonString);
      await AsyncStorage.setItem(SHARED_ITEMS_KEY, encryptedData);
      setSharedItems(items);
      console.log("🔒 Shared items encrypted and saved");
    } catch (error) {
      console.error("Error saving shared items:", error);
    }
  }, []);

  const shareItemToChat = useCallback(async (
    chatId: string,
    item: SharedItem
  ): Promise<ChatSharedItem> => {
    const newSharedItem: ChatSharedItem = {
      id: `shared_${Date.now()}_${Math.random()}`,
      chatId,
      sharedItem: item,
      timestamp: Date.now(),
    };
    const updatedItems = [...sharedItems, newSharedItem];
    await saveSharedItems(updatedItems);
    console.log("Item shared to chat:", newSharedItem.id);
    return newSharedItem;
  }, [sharedItems, saveSharedItems]);

  const getSharedItemsForChat = useCallback((chatId: string): ChatSharedItem[] => {
    return sharedItems
      .filter((item) => item.chatId === chatId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sharedItems]);

  const deleteSharedItem = useCallback(async (sharedItemId: string) => {
    const updatedItems = sharedItems.filter((item) => item.id !== sharedItemId);
    await saveSharedItems(updatedItems);
    console.log("Shared item deleted:", sharedItemId);
  }, [sharedItems, saveSharedItems]);

  const createShareableFromPlannerTask = useCallback((task: any): SharedItem => {
    return {
      id: `share_planner_${Date.now()}`,
      type: "planner_task",
      data: task,
      sharedAt: new Date().toISOString(),
      sharedBy: "me",
      title: task.title,
      description: task.description,
      permissions: {
        canDownload: true,
        canEmailShare: true,
        canOpenInSource: true,
      },
      sourceRoute: "/planner",
    };
  }, []);

  const createShareableFromCalendarEvent = useCallback((event: any): SharedItem => {
    return {
      id: `share_event_${Date.now()}`,
      type: "calendar_event",
      data: event,
      sharedAt: new Date().toISOString(),
      sharedBy: "me",
      title: event.title,
      description: event.description,
      permissions: {
        canDownload: true,
        canEmailShare: true,
        canOpenInSource: true,
      },
      sourceRoute: "/calendar-manager",
    };
  }, []);

  const createShareableFromContact = useCallback((contact: any): SharedItem => {
    return {
      id: `share_contact_${Date.now()}`,
      type: "contact",
      data: contact,
      sharedAt: new Date().toISOString(),
      sharedBy: "me",
      title: `${contact.firstName} ${contact.lastName}`,
      description: contact.email || contact.phone,
      permissions: {
        canDownload: true,
        canEmailShare: true,
        canOpenInSource: true,
      },
      sourceRoute: "/phonebook",
    };
  }, []);

  const createShareableFromSpreadsheet = useCallback((
    spreadsheet: { columns: any[]; rows: any[]; name: string; type?: string },
    exportOptions?: {
      format?: "xlsx" | "csv" | "pdf";
      permission?: "view" | "edit";
      password?: string;
      email?: string;
    }
  ): SharedItem => {
    return {
      id: `share_spreadsheet_${Date.now()}`,
      type: "analytics_spreadsheet",
      data: spreadsheet,
      sharedAt: new Date().toISOString(),
      sharedBy: "me",
      title: spreadsheet.name,
      description: `${spreadsheet.rows.length} rows, ${spreadsheet.columns.length} columns`,
      permissions: {
        canDownload: exportOptions?.permission !== "view",
        canEmailShare: true,
        canOpenInSource: true,
      },
      sourceRoute: "/analytics",
      exportOptions,
    };
  }, []);

  const createShareableFromAttachment = useCallback((
    attachment: Attachment,
    context?: { eventId?: string; eventTitle?: string; calendarName?: string }
  ): SharedItem => {
    const descriptorParts = [
      context?.eventTitle ? `Event: ${context.eventTitle}` : undefined,
      context?.calendarName ? `Calendar: ${context.calendarName}` : undefined,
      `${(attachment.size / 1024).toFixed(1)} KB`,
    ].filter(Boolean);

    return {
      id: `share_attachment_${Date.now()}`,
      type: "calendar_attachment",
      data: {
        attachment,
        meta: {
          eventId: context?.eventId,
          eventTitle: context?.eventTitle,
          calendarName: context?.calendarName,
        },
      },
      sharedAt: new Date().toISOString(),
      sharedBy: "me",
      title: attachment.name,
      description: descriptorParts.join(" • "),
      permissions: {
        canDownload: true,
        canEmailShare: true,
        canOpenInSource: true,
      },
      sourceRoute: "/calendar-manager",
    };
  }, []);

  return useMemo(
    () => ({
      sharedItems,
      isLoading,
      shareItemToChat,
      getSharedItemsForChat,
      deleteSharedItem,
      createShareableFromPlannerTask,
      createShareableFromCalendarEvent,
      createShareableFromContact,
      createShareableFromSpreadsheet,
      createShareableFromAttachment,
    }),
    [
      sharedItems,
      isLoading,
      shareItemToChat,
      getSharedItemsForChat,
      deleteSharedItem,
      createShareableFromPlannerTask,
      createShareableFromCalendarEvent,
      createShareableFromContact,
      createShareableFromSpreadsheet,
      createShareableFromAttachment,
    ]
  );
});
