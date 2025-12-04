import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  Share,
} from "react-native";
import {
  FileText,
  Calendar,
  User,
  BarChart3,
  Plus,
  Eye,
  X,
  ExternalLink,
  Download,
  Mail,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSharing, SharedItem } from "@/contexts/SharingContext";
import { usePlanner } from "@/contexts/PlannerContext";
import { usePhonebook } from "@/contexts/PhonebookContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useStatistics } from "@/contexts/StatisticsContext";

type SharedItemCardProps = {
  sharedItem: SharedItem;
  chatId: string;
  sharedItemId: string;
};

export default function SharedItemCard({
  sharedItem,
  chatId,
  sharedItemId,
}: SharedItemCardProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { deleteSharedItem } = useSharing();
  const { addTask } = usePlanner();
  const { addContact } = usePhonebook();
  const { loadSpreadsheetData } = useStatistics();
  const [showDetails, setShowDetails] = useState(false);

  const getIcon = () => {
    switch (sharedItem.type) {
      case "planner_task":
        return <FileText color={theme.colors.primary} size={20} strokeWidth={2} />;
      case "calendar_event":
        return <Calendar color={theme.colors.primary} size={20} strokeWidth={2} />;
      case "contact":
        return <User color={theme.colors.primary} size={20} strokeWidth={2} />;
      case "analytics_spreadsheet":
        return <BarChart3 color={theme.colors.primary} size={20} strokeWidth={2} />;
      default:
        return <FileText color={theme.colors.primary} size={20} strokeWidth={2} />;
    }
  };

  const getTypeLabel = () => {
    switch (sharedItem.type) {
      case "planner_task":
        return "Planner Task";
      case "calendar_event":
        return "Calendar Event";
      case "contact":
        return "Contact";
      case "analytics_spreadsheet":
        return "Spreadsheet";
      default:
        return "Item";
    }
  };

  const handleImport = async () => {
    try {
      if (sharedItem.type === "planner_task") {
        await addTask({
          title: sharedItem.data.title,
          description: sharedItem.data.description,
          dueDate: sharedItem.data.dueDate,
          priority: sharedItem.data.priority || "medium",
        });
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("Success", "Task imported to your planner");
      } else if (sharedItem.type === "contact") {
        await addContact(sharedItem.data);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("Success", "Contact imported to your phonebook");
      } else if (sharedItem.type === "analytics_spreadsheet") {
        const spreadsheetData = sharedItem.data;
        if (spreadsheetData && spreadsheetData.type) {
          loadSpreadsheetData(spreadsheetData);
        } else {
          throw new Error("Invalid spreadsheet data");
        }
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("Success", `Spreadsheet "${spreadsheetData.name}" imported to your active spreadsheet`);
        console.log("Spreadsheet imported:", spreadsheetData.name);
      }
    } catch (error) {
      console.error("Error importing:", error);
      Alert.alert("Error", "Failed to import item");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Shared Item",
      "Are you sure you want to remove this shared item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteSharedItem(sharedItemId);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleOpenInSource = async () => {
    if (!sharedItem.permissions.canOpenInSource || !sharedItem.sourceRoute) {
      Alert.alert("Not Available", "This item cannot be opened in its source location");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (sharedItem.type === "analytics_spreadsheet") {
        const permission = sharedItem.exportOptions?.permission || "view";
        
        if (permission === "edit") {
          const spreadsheetData = sharedItem.data;
          if (spreadsheetData && spreadsheetData.type) {
            loadSpreadsheetData(spreadsheetData);
          } else {
            Alert.alert("Error", "Invalid spreadsheet data");
            return;
          }
          
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          
          router.push(sharedItem.sourceRoute as any);
          console.log("Opened editable spreadsheet in active spreadsheets:", spreadsheetData.name);
        } else {
          router.push(`${sharedItem.sourceRoute}?sharedItemId=${sharedItemId}&readOnly=true` as any);
          console.log("Opened read-only spreadsheet preview:", sharedItemId);
        }
      } else {
        router.push(sharedItem.sourceRoute as any);
        console.log("Navigating to source:", sharedItem.sourceRoute);
      }
    } catch (error) {
      console.error("Error navigating to source:", error);
      Alert.alert("Error", "Failed to open source location");
    }
  };

  const handleDownload = () => {
    if (!sharedItem.permissions.canDownload) {
      Alert.alert("Not Allowed", "The sender has disabled downloads for this item");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const dataStr = JSON.stringify(sharedItem.data, null, 2);
      const fileName = `${sharedItem.title.replace(/\s+/g, '_')}_${Date.now()}.json`;

      if (Platform.OS === "web") {
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        Alert.alert(
          "Download",
          "Downloaded data is copied to clipboard",
          [
            {
              text: "OK",
              onPress: () => {
              },
            },
          ]
        );
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log("Data downloaded:", fileName);
    } catch (error) {
      console.error("Error downloading:", error);
      Alert.alert("Error", "Failed to download item");
    }
  };

  const handleEmailShare = async () => {
    if (!sharedItem.permissions.canEmailShare) {
      Alert.alert("Not Allowed", "The sender has disabled email sharing for this item");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      let shareContent = formatShareContent();
      
      await Share.share({
        message: shareContent,
        title: sharedItem.title,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log("Shared via email/messaging");
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const formatShareContent = (): string => {
    let content = `${sharedItem.title}\n`;
    
    if (sharedItem.description) {
      content += `${sharedItem.description}\n\n`;
    }
    
    switch (sharedItem.type) {
      case "planner_task":
        if (sharedItem.data.dueDate) {
          content += `Due: ${new Date(sharedItem.data.dueDate).toLocaleDateString()}\n`;
        }
        if (sharedItem.data.priority) {
          content += `Priority: ${sharedItem.data.priority}\n`;
        }
        break;
      case "calendar_event":
        if (sharedItem.data.date) {
          content += `Date: ${new Date(sharedItem.data.date).toLocaleString()}\n`;
        }
        break;
      case "contact":
        if (sharedItem.data.email) {
          content += `Email: ${sharedItem.data.email}\n`;
        }
        if (sharedItem.data.phone) {
          content += `Phone: ${sharedItem.data.phone}\n`;
        }
        break;
    }
    
    return content;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.cardBackground }]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        <View style={styles.headerInfo}>
          <Text style={[styles.typeLabel, { color: theme.colors.text.light }]}>
            {getTypeLabel()}
          </Text>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {sharedItem.title}
          </Text>
          {sharedItem.description && (
            <Text
              style={[styles.description, { color: theme.colors.text.secondary }]}
              numberOfLines={2}
            >
              {sharedItem.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {sharedItem.permissions.canOpenInSource && sharedItem.sourceRoute && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleOpenInSource}
          >
            <ExternalLink color="#FFFFFF" size={16} strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Open</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setShowDetails(!showDetails);
          }}
        >
          <Eye color="#FFFFFF" size={16} strokeWidth={2.5} />
          <Text style={styles.actionButtonText}>
            {showDetails ? "Hide" : "View"}
          </Text>
        </TouchableOpacity>

        {sharedItem.permissions.canDownload && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: "#4CAF50" },
            ]}
            onPress={handleDownload}
          >
            <Download color="#FFFFFF" size={16} strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>
        )}

        {sharedItem.permissions.canEmailShare && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: "#2196F3" },
            ]}
            onPress={handleEmailShare}
          >
            <Mail color="#FFFFFF" size={16} strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        )}

        {(sharedItem.type === "planner_task" || sharedItem.type === "contact" || sharedItem.type === "analytics_spreadsheet") && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.accent || theme.colors.primary },
            ]}
            onPress={handleImport}
          >
            <Plus color="#FFFFFF" size={16} strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Import</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: "#FF4444" },
          ]}
          onPress={handleDelete}
        >
          <X color="#FFFFFF" size={16} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {showDetails && (
        <View
          style={[
            styles.detailsContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[styles.detailsTitle, { color: theme.colors.text.primary }]}
          >
            Details
          </Text>
          <Text
            style={[styles.detailsText, { color: theme.colors.text.secondary }]}
          >
            {JSON.stringify(sharedItem.data, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(107, 155, 209, 0.1)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  description: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  actions: {
    flexDirection: "row" as const,
    gap: 8,
    flexWrap: "wrap" as const,
  },
  actionButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  detailsContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: "500" as const,
    fontFamily: "monospace" as const,
  },
});
