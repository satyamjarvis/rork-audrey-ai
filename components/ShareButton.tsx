import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  Share,
} from "react-native";
import { Share2, X, MessageCircle, Mail, MessageSquare } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCalendar } from "@/contexts/CalendarContext";
import { useSharing, SharedItem } from "@/contexts/SharingContext";
import { useChat } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";

type ShareButtonProps = {
  shareableItem: SharedItem;
  onShare?: () => void;
  size?: number;
  color?: string;
  testID?: string;
};

export default function ShareButton({
  shareableItem,
  onShare,
  size = 20,
  color,
  testID,
}: ShareButtonProps) {
  const { theme } = useTheme();
  const { calendars } = useCalendar();
  const { shareItemToChat } = useSharing();
  const { sendMessage } = useChat();
  const [showModal, setShowModal] = useState(false);
  const [sharing, setSharing] = useState(false);

  const buttonColor = color || theme.colors.primary;

  const handleShareToExternal = async () => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      let shareContent = formatShareContent(shareableItem);
      
      if (shareableItem.type === "contact") {
        const contactData = encodeURIComponent(JSON.stringify(shareableItem.data));
        const deepLink = `exp://192.168.1.1:8081/--/shared-contact?data=${contactData}`;
        shareContent += `\n\nOpen in app: ${deepLink}`;
        shareContent += `\n\nDownload the app to save this contact directly to your phonebook.`;
      }
      
      const result = await Share.share({
        message: shareContent,
        title: shareableItem.title,
      });

      if (result.action === Share.sharedAction) {
        console.log("Item shared successfully via", result.activityType || "share sheet");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setShowModal(false);
        onShare?.();
      }
    } catch (error) {
      console.error("Error sharing item:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const formatShareContent = (item: SharedItem): string => {
    let content = `${item.title}\n`;
    
    if (item.description) {
      content += `${item.description}\n`;
    }
    
    switch (item.type) {
      case "planner_task":
        if (item.data.dueDate) {
          content += `\nDue: ${new Date(item.data.dueDate).toLocaleDateString()}`;
        }
        if (item.data.priority) {
          content += `\nPriority: ${item.data.priority}`;
        }
        break;
      case "calendar_event":
        if (item.data.startDate) {
          content += `\nStarts: ${new Date(item.data.startDate).toLocaleString()}`;
        }
        if (item.data.location) {
          content += `\nLocation: ${item.data.location}`;
        }
        break;
      case "contact":
        if (item.data.email) {
          content += `\nEmail: ${item.data.email}`;
        }
        if (item.data.phone) {
          content += `\nPhone: ${item.data.phone}`;
        }
        break;
      case "analytics_spreadsheet":
        content += `\nRows: ${item.data.rows?.length || 0}, Columns: ${item.data.columns?.length || 0}`;
        break;
    }
    
    return content;
  };

  const handleShare = async (calendarId: string) => {
    try {
      setSharing(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await shareItemToChat(calendarId, shareableItem);

      const shareMessage = `📎 Shared: ${shareableItem.title}`;
      await sendMessage(calendarId, shareMessage, "me");

      setShowModal(false);
      onShare?.();
      console.log("Item shared successfully");
    } catch (error) {
      console.error("Error sharing item:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setShowModal(true);
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID={testID}
      >
        <Share2 color={buttonColor} size={size} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.colors.text.primary },
                ]}
              >
                Share to Chat
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={theme.colors.text.secondary} size={24} />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.modalSubtitle,
                { color: theme.colors.text.secondary },
              ]}
            >
              Share &quot;{shareableItem.title}&quot;
            </Text>

            <View style={styles.externalShareSection}>
              <TouchableOpacity
                style={[
                  styles.externalShareButton,
                  { backgroundColor: theme.colors.background },
                ]}
                onPress={handleShareToExternal}
                activeOpacity={0.7}
              >
                <View style={styles.externalShareContent}>
                  <Mail color={theme.colors.primary} size={24} strokeWidth={2} />
                  <Text
                    style={[
                      styles.externalShareText,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    Email or Message
                  </Text>
                </View>
                <MessageSquare
                  color={theme.colors.text.secondary}
                  size={18}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.colors.text.light }]}
              />
              <Text
                style={[styles.dividerText, { color: theme.colors.text.secondary }]}
              >
                Or share to chat
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: theme.colors.text.light }]}
              />
            </View>

            <FlatList
              data={calendars}
              keyExtractor={(item) => item.id}
              style={styles.chatList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.chatItem,
                    { backgroundColor: theme.colors.background },
                  ]}
                  onPress={() => handleShare(item.id)}
                  disabled={sharing}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.chatIndicator, { backgroundColor: item.color }]}
                  />
                  <View style={styles.chatInfo}>
                    <Text
                      style={[
                        styles.chatName,
                        { color: theme.colors.text.primary },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.chatMembers,
                        { color: theme.colors.text.light },
                      ]}
                    >
                      {item.sharedWith.length + 1} members
                    </Text>
                  </View>
                  <MessageCircle
                    color={theme.colors.primary}
                    size={20}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    No chats available. Create a calendar first.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginBottom: 20,
  },
  chatList: {
    maxHeight: 400,
  },
  chatItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
  },
  chatIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  chatMembers: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  emptyState: {
    padding: 40,
    alignItems: "center" as const,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  externalShareSection: {
    marginBottom: 16,
  },
  externalShareButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: 16,
    borderRadius: 16,
  },
  externalShareContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  externalShareText: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  divider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
});
