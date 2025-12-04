import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  FileSpreadsheet,
  FileText,
  FileType,
  ShieldCheck,
  Lock,
  Eye,
  PenTool,
  Check,
  Share2,
  Download,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { Calendar } from "@/contexts/CalendarContext";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";

export type ExportFormat = "csv" | "xlsx" | "pdf";
export type ExportPermission = "view" | "edit";

export type ExportOptions = {
  format: ExportFormat;
  password?: string;
  permission: ExportPermission;
  email?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  type: "download" | "email" | "chat";
  calendars?: Calendar[];
  onShareToChat?: (calendarId: string, options: ExportOptions) => void;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AnalyticsExportModal({
  visible,
  onClose,
  onExport,
  type,
  calendars,
  onShareToChat,
}: Props) {
  const { theme } = useTheme();
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [permission, setPermission] = useState<ExportPermission>("edit");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [step, setStep] = useState<"options" | "chat">("options");
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);

  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(text));
  };

  // Reset step when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setStep("options");
      setEmail("");
      setIsValidEmail(false);
    }
  }, [visible]);

  const isDark =
    theme.name.toLowerCase().includes("night") ||
    theme.name.toLowerCase().includes("dark") ||
    theme.colors.background === "#000000";

  const textColor = isDark ? "#FFFFFF" : theme.colors.text.primary;
  const subTextColor = isDark ? "#d4c4f0" : theme.colors.text.secondary;
  const borderColor = isDark
    ? "rgba(255, 192, 203, 0.2)"
    : theme.colors.border;
  const primaryColor = isDark ? "#ffc0cb" : theme.colors.primary;

  const handleExport = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    if (type === "chat" && step === "options") {
      setStep("chat");
      return;
    }

    onExport({
      format,
      password: usePassword ? password : undefined,
      permission,
      email: type === 'email' && email ? email : undefined,
    });
    onClose();
  };

  const handleChatSelect = (calendarId: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onShareToChat) {
      onShareToChat(calendarId, {
        format,
        password: usePassword ? password : undefined,
        permission,
      });
    }
    onClose();
  };

  const togglePassword = (value: boolean) => {
    setUsePassword(value);
    if (!value) setPassword("");
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[
            styles.container,
            { backgroundColor: isDark ? "#1E1E1E" : theme.colors.cardBackground },
          ]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: textColor }]}>
                {type === "download" 
                  ? "Export Analytics" 
                  : type === "email" 
                  ? "Send to Email" 
                  : step === "options" 
                  ? "Send to Chat" 
                  : "Select Chat"}
              </Text>
              <View style={styles.certifiedBadge}>
                <ShieldCheck
                  size={12}
                  color={isDark ? "#4ECDC4" : "#2A9D8F"}
                  strokeWidth={2.5}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: isDark ? "#4ECDC4" : "#2A9D8F",
                    letterSpacing: 0.5,
                  }}
                >
                  CERTIFIED FULLY ENCRYPTED
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={textColor} size={24} />
            </TouchableOpacity>
          </View>

          {step === "options" ? (
            <ScrollView style={styles.content}>
              {/* Format Selection */}
              <Text style={[styles.sectionTitle, { color: subTextColor }]}>
                File Format
              </Text>
              <View style={styles.formatContainer}>
                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    format === "xlsx" && styles.formatOptionSelected,
                    { borderColor: format === "xlsx" ? primaryColor : borderColor },
                  ]}
                  onPress={() => setFormat("xlsx")}
                >
                  <FileSpreadsheet
                    color={format === "xlsx" ? primaryColor : subTextColor}
                    size={24}
                  />
                  <Text
                    style={[
                      styles.formatText,
                      { color: format === "xlsx" ? primaryColor : subTextColor },
                    ]}
                  >
                    Numbers / Excel
                  </Text>
                  {format === "xlsx" && (
                    <View style={styles.checkIcon}>
                      <Check color={primaryColor} size={12} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
  
                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    format === "pdf" && styles.formatOptionSelected,
                    { borderColor: format === "pdf" ? primaryColor : borderColor },
                  ]}
                  onPress={() => setFormat("pdf")}
                >
                  <FileText
                    color={format === "pdf" ? primaryColor : subTextColor}
                    size={24}
                  />
                  <Text
                    style={[
                      styles.formatText,
                      { color: format === "pdf" ? primaryColor : subTextColor },
                    ]}
                  >
                    PDF Document
                  </Text>
                  {format === "pdf" && (
                    <View style={styles.checkIcon}>
                      <Check color={primaryColor} size={12} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
  
                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    format === "csv" && styles.formatOptionSelected,
                    { borderColor: format === "csv" ? primaryColor : borderColor },
                  ]}
                  onPress={() => setFormat("csv")}
                >
                  <FileType
                    color={format === "csv" ? primaryColor : subTextColor}
                    size={24}
                  />
                  <Text
                    style={[
                      styles.formatText,
                      { color: format === "csv" ? primaryColor : subTextColor },
                    ]}
                  >
                    CSV (Raw Data)
                  </Text>
                  {format === "csv" && (
                    <View style={styles.checkIcon}>
                      <Check color={primaryColor} size={12} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Email Input */}
              {type === "email" && (
                <View style={{ marginTop: 24 }}>
                   <Text style={[styles.sectionTitle, { color: subTextColor }]}>
                    Recipient Email
                  </Text>
                  <View style={{ position: 'relative' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TextInput
                        style={[
                          styles.emailInput,
                          {
                            color: textColor,
                            borderColor: email ? (isValidEmail ? (isDark ? "#4ECDC4" : "#2A9D8F") : "#F77F8B") : borderColor,
                            backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.02)",
                            flex: 1,
                          }
                        ]}
                        placeholder="Enter email address"
                        placeholderTextColor={subTextColor}
                        value={email}
                        onChangeText={validateEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <KeyboardDismissButton 
                        color={primaryColor} 
                        size={22}
                        style={{ marginRight: 0 }}
                      />
                    </View>
                    {email.length > 0 && (
                      <View style={{ position: 'absolute', right: 50, top: 14 }}>
                        {isValidEmail ? (
                           <Check color={isDark ? "#4ECDC4" : "#2A9D8F"} size={20} strokeWidth={2.5} />
                        ) : (
                           <X color="#F77F8B" size={20} strokeWidth={2.5} />
                        )}
                      </View>
                    )}
                  </View>
                  {email.length > 0 && (
                     <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                        {isValidEmail ? (
                           <>
                             <ShieldCheck size={14} color={isDark ? "#4ECDC4" : "#2A9D8F"} strokeWidth={2.5} />
                             <Text style={{ fontSize: 12, color: isDark ? "#4ECDC4" : "#2A9D8F", fontWeight: '600' }}>Safe to send</Text>
                           </>
                        ) : (
                           <Text style={{ fontSize: 12, color: "#F77F8B", fontWeight: '600' }}>Email not verified</Text>
                        )}
                     </View>
                  )}
                </View>
              )}
  
              {/* Permissions */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: subTextColor, marginTop: 24 },
                ]}
              >
                Permissions
              </Text>
              <View
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                  },
                ]}
              >
                <View style={styles.optionInfo}>
                  <View style={styles.iconCircle}>
                    {permission === "view" ? (
                      <Eye color={textColor} size={18} />
                    ) : (
                      <PenTool color={textColor} size={18} />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.optionLabel, { color: textColor }]}>
                      {permission === "view" ? "View Only" : "Edit Access"}
                    </Text>
                    <Text style={[styles.optionDesc, { color: subTextColor }]}>
                      {permission === "view"
                        ? "Recipient cannot modify the file"
                        : "Recipient can make changes"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={permission === "edit"}
                  onValueChange={(v) => setPermission(v ? "edit" : "view")}
                  trackColor={{ false: "#767577", true: primaryColor }}
                  thumbColor={"#f4f3f4"}
                />
              </View>
  
              {/* Password Protection */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: subTextColor, marginTop: 24 },
                ]}
              >
                Security
              </Text>
              <View
                style={[
                  styles.securityContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                    borderColor: usePassword ? primaryColor : "transparent",
                  },
                ]}
              >
                <View style={[styles.optionRow, { backgroundColor: "transparent", padding: 0, marginBottom: usePassword ? 16 : 0 }]}>
                  <View style={styles.optionInfo}>
                    <View style={styles.iconCircle}>
                      <Lock color={textColor} size={18} />
                    </View>
                    <View>
                      <Text style={[styles.optionLabel, { color: textColor }]}>
                        Password Protection
                      </Text>
                      <Text style={[styles.optionDesc, { color: subTextColor }]}>
                        Require a password to open
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={usePassword}
                    onValueChange={togglePassword}
                    trackColor={{ false: "#767577", true: primaryColor }}
                    thumbColor={"#f4f3f4"}
                  />
                </View>
  
                {usePassword && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          color: textColor,
                          borderColor: borderColor,
                          backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#FFF",
                          flex: 1,
                        },
                      ]}
                      placeholder="Enter password"
                      placeholderTextColor={subTextColor}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                    <KeyboardDismissButton 
                      color={primaryColor} 
                      size={22}
                      style={{ marginRight: 0 }}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          ) : (
             <ScrollView style={styles.content}>
               {calendars?.map(cal => (
                  <TouchableOpacity 
                    key={cal.id} 
                    style={[
                      styles.chatItem, 
                      { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }
                    ]} 
                    onPress={() => handleChatSelect(cal.id)}
                  >
                     <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cal.color }} />
                     <View style={{ flex: 1 }}>
                        <Text style={[styles.chatName, { color: textColor }]}>{cal.name}</Text>
                        <Text style={[styles.chatInfo, { color: subTextColor }]}>{cal.isShared ? `Shared with ${cal.sharedWith.length} people` : 'Personal'}</Text>
                     </View>
                     <Share2 color={primaryColor} size={18} />
                  </TouchableOpacity>
               ))}
               {(!calendars || calendars.length === 0) && (
                 <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: subTextColor }}>No chats available</Text>
                 </View>
               )}
             </ScrollView>
          )}

          {step === "options" && (
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <LinearGradient
              colors={theme.gradients.primary as any}
              style={styles.exportGradient}
            >
              {type === "download" ? (
                <Download color="#FFFFFF" size={20} />
              ) : type === "email" ? (
                <Share2 color="#FFFFFF" size={20} />
              ) : (
                <Share2 color="#FFFFFF" size={20} />
              )}
              <Text style={styles.exportButtonText}>
                {type === "download" 
                  ? "Download File" 
                  : type === "email" 
                  ? "Send Email" 
                  : "Next: Select Chat"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          )}
          
          {step === "chat" && (
             <TouchableOpacity style={{ marginTop: 15, padding: 10, alignItems: 'center' }} onPress={() => setStep("options")}>
                <Text style={{ color: subTextColor }}>Back to Options</Text>
             </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    paddingTop: "20%",
  },
  container: {
    borderRadius: 28,
    marginHorizontal: 16,
    padding: 24,
    maxHeight: "60%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  certifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(78, 205, 196, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  content: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formatContainer: {
    gap: 12,
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(100, 100, 100, 0.05)",
    gap: 16,
  },
  formatOptionSelected: {
    backgroundColor: "rgba(100, 100, 100, 0.1)",
    borderWidth: 2,
  },
  formatText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  checkIcon: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(100, 100, 100, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  securityContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    paddingRight: 40,
  },
  exportButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exportGradient: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 10,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
  },
  chatInfo: {
    fontSize: 12,
    marginTop: 2,
  },
});
