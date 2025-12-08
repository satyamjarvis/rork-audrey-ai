import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  X,
  FileText,
  Video,
  Lock,
  Eye,
  AlertCircle,
  BarChart3,
  ExternalLink,
  CheckSquare,
  StickyNote,
  Network,
  Share2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { router } from "expo-router";
import * as XLSX from "xlsx";
import type { Attachment } from "@/contexts/CalendarContext";
import { useStatistics, Tracker, SpreadsheetColumn, SpreadsheetRow } from "@/contexts/StatisticsContext";
import { getMimeTypeFromFileName, shareAttachment } from "@/utils/attachmentHelpers";
import { useLanguage } from "@/contexts/LanguageContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AttachmentPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  attachment: Attachment | null;
  fileData: string | null;
  canDownload: boolean;
  calendarOwner: string;
  allowEditing?: boolean;
  themeColors: {
    primary: string;
    secondary: string;
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
  isNightMode: boolean;
}

export default function AttachmentPreviewModal({
  visible,
  onClose,
  attachment,
  fileData,
  canDownload,
  calendarOwner,
  allowEditing = true,
  themeColors,
  isNightMode,
}: AttachmentPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const { saveTracker } = useStatistics();
  const { translations } = useLanguage();
  const t = translations.attachmentPreview;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (!visible) {
      setPreviewError(null);
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
      setIsPlaying(false);
    }
  }, [visible, sound]);

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const handleShare = async () => {
    if (!canDownload) {
      Alert.alert(
        t.shareRestricted,
        t.downloadRestrictedByOwner.replace('{owner}', calendarOwner)
      );
      return;
    }

    if (!attachment || !fileData) {
      Alert.alert(t.error, t.noFileDataAvailable);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const mimeType = attachment.type || getMimeTypeFromFileName(attachment.name);
      
      await shareAttachment({
        fileName: attachment.name,
        fileData: fileData,
        fileType: mimeType,
      });
    } catch (error) {
      console.error("[AttachmentPreview] Error sharing attachment:", error);
      Alert.alert(t.error, t.failedToShareFile);
    }
  };

  const playAudio = async () => {
    if (!attachment || !fileData) return;

    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else if (status.isLoaded) {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      const source = fileData 
        ? { uri: `data:${attachment.type};base64,${fileData}` }
        : { uri: attachment.uri };

      const { sound: newSound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      Alert.alert(t.error, t.failedToPlayAudio);
    }
  };

  const handleOpenInSourceFeature = async () => {
    if (!attachment || !fileData) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      switch (attachment.sourceFeature) {
        case 'analytics':
          if (attachment.sourceId) {
            onClose();
            router.push("/(tabs)/analytics" as any);
            Alert.alert(t.info, t.openingAnalytics);
          } else {
            await handleOpenInAnalytics();
          }
          break;

        case 'planner':
          onClose();
          router.push("/(tabs)/planner" as any);
          Alert.alert(t.info, t.openingPlanner);
          break;

        case 'notes':
          onClose();
          router.push("/notes" as any);
          Alert.alert(t.info, t.openingNotes);
          break;

        case 'mindmap':
          onClose();
          if (attachment.sourceId) {
            router.push(`/mind-mapping/${attachment.sourceId}` as any);
          } else {
            router.push("/mind-mapping/index" as any);
          }
          break;

        default:
          await handleOpenInAnalytics();
          break;
      }
    } catch (error) {
      console.error("Error opening in source feature:", error);
      Alert.alert(t.error, t.failedToOpenInSourceFeature);
    }
  };

  const handleOpenInAnalytics = async () => {
    if (!attachment || !fileData) return;

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      let columns: SpreadsheetColumn[] = [];
      let rows: SpreadsheetRow[] = [];
      
      if (attachment.name.endsWith(".csv") || attachment.type === "text/csv") {
        const content = Platform.OS === 'web' ? atob(fileData) : fileData;
        
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
          columns = headers.map((h, i) => ({
            id: `col_${Date.now()}_${i}`,
            name: h,
            type: "text",
            width: 120
          }));
          
          rows = lines.slice(1).map((line, i) => {
            const values = line.split(',').map(v => v.replace(/^"|"$/g, ''));
            const rowId = `row_${Date.now()}_${i}`;
            const cells: any = {};
            columns.forEach((col, idx) => {
              cells[col.id] = {
                rowId,
                columnId: col.id,
                value: values[idx] || ""
              };
            });
            return { id: rowId, cells };
          });
        }
      } 
      else if (attachment.name.endsWith(".xlsx") || attachment.type.includes("spreadsheet")) {
        const wb = XLSX.read(fileData, { type: 'base64' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        if (data.length > 0) {
          const headers = data[0];
          columns = headers.map((h: any, i: number) => ({
            id: `col_${Date.now()}_${i}`,
            name: String(h),
            type: "text",
            width: 120
          }));
          
          rows = data.slice(1).map((row: any[], i: number) => {
            const rowId = `row_${Date.now()}_${i}`;
            const cells: any = {};
            columns.forEach((col, idx) => {
              cells[col.id] = {
                rowId,
                columnId: col.id,
                value: row[idx] !== undefined ? String(row[idx]) : ""
              };
            });
            return { id: rowId, cells };
          });
        }
      } else {
        Alert.alert(t.error, t.unsupportedFileForAnalytics);
        return;
      }

      if (columns.length === 0) {
        Alert.alert(t.error, t.couldNotParseSpreadsheet);
        return;
      }

      const tracker: Tracker = {
        id: `imported_${Date.now()}`,
        name: attachment.name.replace(/\.[^/.]+$/, ""),
        customName: attachment.name.replace(/\.[^/.]+$/, ""),
        type: "custom",
        columns,
        rows,
        createdAt: Date.now(),
      };

      if (allowEditing) {
        const success = await saveTracker(tracker);
        if (success) {
          Alert.alert(t.success, t.spreadsheetSavedToAnalytics, [
            { text: t.openAnalytics, onPress: () => {
              onClose();
              router.push("/(tabs)/analytics" as any);
            }}
          ]);
        } else {
          Alert.alert(t.error, t.failedToSaveToAnalytics);
        }
      } else {
        Alert.alert(t.restricted, t.senderRestrictedEditing);
      }

    } catch (error) {
      console.error("Error opening in analytics:", error);
      Alert.alert(t.error, t.failedToProcessSpreadsheet);
    }
  };

  const isSpreadsheet = attachment?.name.endsWith(".csv") || 
                        attachment?.name.endsWith(".xlsx") || 
                        attachment?.type.includes("csv") || 
                        attachment?.type.includes("spreadsheet") || 
                        attachment?.type.includes("excel");

  const getSourceFeatureIcon = () => {
    if (!attachment?.sourceFeature) return null;
    
    switch (attachment.sourceFeature) {
      case 'analytics':
        return <BarChart3 color={themeColors.primary} size={20} strokeWidth={2.5} />;
      case 'planner':
        return <CheckSquare color={themeColors.primary} size={20} strokeWidth={2.5} />;
      case 'notes':
        return <StickyNote color={themeColors.primary} size={20} strokeWidth={2.5} />;
      case 'mindmap':
        return <Network color={themeColors.primary} size={20} strokeWidth={2.5} />;
      default:
        return <ExternalLink color={themeColors.primary} size={20} strokeWidth={2.5} />;
    }
  };

  const getSourceFeatureName = () => {
    if (!attachment?.sourceFeature) return null;
    
    switch (attachment.sourceFeature) {
      case 'analytics':
        return t.analytics;
      case 'planner':
        return t.planner;
      case 'notes':
        return t.notes;
      case 'mindmap':
        return t.mindMap;
      default:
        return t.source;
    }
  };

  const renderPreviewContent = () => {
    if (!attachment) {
      return (
        <View style={styles.errorContainer}>
          <AlertCircle color={themeColors.textSecondary} size={64} strokeWidth={1.5} />
          <Text style={[styles.errorText, { color: themeColors.textPrimary }]}>
            {t.noPreviewAvailable}
          </Text>
        </View>
      );
    }

    const isImage = attachment.type.startsWith("image/");
    const isVideo = attachment.type.startsWith("video/");
    const isAudio = attachment.type.startsWith("audio/");

    if (isImage) {
      const source = fileData 
        ? { uri: `data:${attachment.type};base64,${fileData}` } 
        : { uri: attachment.uri };

      return (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={source}
            style={styles.imagePreview}
            resizeMode="contain"
            onError={() => setPreviewError("Failed to load image")}
          />
        </View>
      );
    }

    if (isVideo) {
      return (
        <View style={styles.previewPlaceholder}>
          <Video color={themeColors.primary} size={64} strokeWidth={1.5} />
          <Text style={[styles.previewPlaceholderText, { color: themeColors.textPrimary }]}>
            {t.videoPreview}
          </Text>
          <Text style={[styles.previewSubtext, { color: themeColors.textSecondary }]}>
            {attachment.name}
          </Text>
          <Text style={[styles.previewInfo, { color: themeColors.textSecondary }]}>
            {(attachment.size / 1024).toFixed(1)} KB
          </Text>
        </View>
      );
    }

    if (isAudio) {
      return (
        <View style={styles.previewPlaceholder}>
          <TouchableOpacity
            style={[styles.audioPlayButton, { backgroundColor: themeColors.primary }]}
            onPress={playAudio}
          >
            <Text style={styles.audioPlayButtonText}>
              {isPlaying ? `⏸ ${t.pause}` : `▶ ${t.play}`}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.previewPlaceholderText, { color: themeColors.textPrimary }]}>
            {t.audioFile}
          </Text>
          <Text style={[styles.previewSubtext, { color: themeColors.textSecondary }]}>
            {attachment.name}
          </Text>
          <Text style={[styles.previewInfo, { color: themeColors.textSecondary }]}>
            {(attachment.size / 1024).toFixed(1)} KB
          </Text>
        </View>
      );
    }

    if (isSpreadsheet) {
      return (
        <View style={styles.previewPlaceholder}>
          <BarChart3 color={themeColors.primary} size={64} strokeWidth={1.5} />
          <Text style={[styles.previewPlaceholderText, { color: themeColors.textPrimary }]}>
            {t.spreadsheet}
          </Text>
          <Text style={[styles.previewSubtext, { color: themeColors.textSecondary }]}>
            {attachment.name}
          </Text>
          <Text style={[styles.previewInfo, { color: themeColors.textSecondary }]}>
            {(attachment.size / 1024).toFixed(1)} KB
          </Text>
          {allowEditing ? (
            <View style={{ marginTop: 16, gap: 12 }}>
              {attachment.sourceFeature && attachment.sourceFeature !== 'external' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: `${themeColors.primary}25` }]}
                  onPress={handleOpenInSourceFeature}
                >
                  {getSourceFeatureIcon()}
                  <Text style={[styles.actionButtonText, { color: themeColors.primary }]}>
                    {t.openInMetrics}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: `${themeColors.primary}15` }]}
                onPress={handleOpenInAnalytics}
              >
                <ExternalLink color={themeColors.primary} size={20} strokeWidth={2.5} />
                <Text style={[styles.actionButtonText, { color: themeColors.primary }]}>
                  {t.saveAsActiveSpreadsheet}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.restrictionBadge, { backgroundColor: `${themeColors.primary}15` }]}>
              <Lock color={themeColors.primary} size={16} strokeWidth={2} />
              <Text style={[styles.restrictionText, { color: themeColors.primary }]}>
                {t.editingRestricted}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.previewPlaceholder}>
        <FileText color={themeColors.primary} size={64} strokeWidth={1.5} />
        <Text style={[styles.previewPlaceholderText, { color: themeColors.textPrimary }]}>
          {t.documentPreview}
        </Text>
        <Text style={[styles.previewSubtext, { color: themeColors.textSecondary }]}>
          {attachment.name}
        </Text>
        <Text style={[styles.previewInfo, { color: themeColors.textSecondary }]}>
          {(attachment.size / 1024).toFixed(1)} KB
        </Text>
        {!canDownload && (
          <View style={[styles.restrictionBadge, { backgroundColor: `${themeColors.primary}15` }]}>
            <Lock color={themeColors.primary} size={16} strokeWidth={2} />
            <Text style={[styles.restrictionText, { color: themeColors.primary }]}>
              {t.downloadRestrictedInfo}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!visible || !attachment) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={
            isNightMode
              ? ["rgba(0, 0, 0, 0.9)", "rgba(26, 10, 31, 0.95)", "rgba(0, 0, 0, 0.9)"]
              : ["rgba(0, 0, 0, 0.85)", "rgba(0, 0, 0, 0.9)", "rgba(0, 0, 0, 0.85)"]
          }
          style={styles.modalGradient}
        >
          <View
            style={[
              styles.headerContainer,
              {
                paddingTop: insets.top + 16,
                backgroundColor: isNightMode
                  ? "rgba(80, 40, 100, 0.8)"
                  : "rgba(255, 255, 255, 0.1)",
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: `${themeColors.primary}20` }]}>
                <Eye color={themeColors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>{t.preview}</Text>
                <Text style={[styles.headerSubtitle, { color: "rgba(255, 255, 255, 0.7)" }]}>
                  {attachment.name.length > 30
                    ? attachment.name.substring(0, 27) + "..."
                    : attachment.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#FFFFFF" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {previewError ? (
              <View style={styles.errorContainer}>
                <AlertCircle color="#FF6B6B" size={64} strokeWidth={1.5} />
                <Text style={[styles.errorText, { color: "#FFFFFF" }]}>
                  {previewError}
                </Text>
              </View>
            ) : (
              renderPreviewContent()
            )}

            <View style={styles.attachmentDetails}>
              <View style={[styles.detailCard, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]}>
                <Text style={[styles.detailLabel, { color: "rgba(255, 255, 255, 0.6)" }]}>
                  {t.fileName}
                </Text>
                <Text style={[styles.detailValue, { color: "#FFFFFF" }]}>{attachment.name}</Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]}>
                <Text style={[styles.detailLabel, { color: "rgba(255, 255, 255, 0.6)" }]}>
                  {t.fileSize}
                </Text>
                <Text style={[styles.detailValue, { color: "#FFFFFF" }]}>
                  {(attachment.size / 1024).toFixed(2)} KB
                </Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]}>
                <Text style={[styles.detailLabel, { color: "rgba(255, 255, 255, 0.6)" }]}>
                  {t.fileType}
                </Text>
                <Text style={[styles.detailValue, { color: "#FFFFFF" }]}>{attachment.type}</Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]}>
                <Text style={[styles.detailLabel, { color: "rgba(255, 255, 255, 0.6)" }]}>
                  {t.uploaded}
                </Text>
                <Text style={[styles.detailValue, { color: "#FFFFFF" }]}>
                  {new Date(attachment.uploadedAt).toLocaleDateString()}
                </Text>
              </View>

              {attachment.sourceFeature && attachment.sourceFeature !== 'external' && (
                <View style={[styles.detailCard, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]}>
                  <Text style={[styles.detailLabel, { color: "rgba(255, 255, 255, 0.6)" }]}>
                    {t.createdIn}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {getSourceFeatureIcon()}
                    <Text style={[styles.detailValue, { color: "#FFFFFF" }]}>
                      {getSourceFeatureName()}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {!canDownload && (
              <View style={[styles.warningCard, { backgroundColor: "rgba(255, 165, 0, 0.1)" }]}>
                <Lock color="#FFA500" size={20} strokeWidth={2.5} />
                <Text style={[styles.warningText, { color: "#FFA500" }]}>
                  {t.downloadRestrictedWarning.replace('{owner}', calendarOwner)}
                </Text>
              </View>
            )}
          </ScrollView>

          <View
            style={[
              styles.footerContainer,
              {
                paddingBottom: insets.bottom + 16,
                backgroundColor: isNightMode
                  ? "rgba(80, 40, 100, 0.8)"
                  : "rgba(255, 255, 255, 0.1)",
              },
            ]}
          >
            <View style={styles.footerButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  !canDownload && styles.buttonDisabled,
                ]}
                onPress={handleShare}
                disabled={!canDownload}
              >
                <LinearGradient
                  colors={
                    canDownload
                      ? [themeColors.primary, themeColors.secondary]
                      : ["#666666", "#555555"]
                  }
                  style={styles.primaryActionButtonGradient}
                >
                  <Share2 color="#FFFFFF" size={20} strokeWidth={2.5} />
                  <Text style={styles.primaryActionButtonText}>
                    {t.shareToDevice}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  !canDownload && styles.buttonDisabled,
                ]}
                onPress={handleOpenInAnalytics}
                disabled={!canDownload}
              >
                <LinearGradient
                  colors={
                    canDownload
                      ? [themeColors.secondary, themeColors.primary]
                      : ["#666666", "#555555"]
                  }
                  style={styles.primaryActionButtonGradient}
                >
                  <BarChart3 color="#FFFFFF" size={20} strokeWidth={2.5} />
                  <Text style={styles.primaryActionButtonText}>
                    {t.downloadToMetrics}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {!canDownload && (
              <View style={[styles.restrictedNote, { backgroundColor: "rgba(255, 165, 0, 0.1)" }]}>
                <Lock color="#FFA500" size={16} strokeWidth={2.5} />
                <Text style={[styles.restrictedNoteText, { color: "#FFA500" }]}>
                  {t.actionsRestrictedByOwner}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  imagePreviewContainer: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    marginBottom: 24,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  previewPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  previewPlaceholderText: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginTop: 8,
  },
  previewSubtext: {
    fontSize: 15,
    fontWeight: "500" as const,
    textAlign: "center",
    maxWidth: "80%",
  },
  previewInfo: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  audioPlayButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
  },
  audioPlayButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  restrictionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  restrictionText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  attachmentDetails: {
    gap: 12,
    marginTop: 24,
  },
  detailCard: {
    padding: 16,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  footerButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryActionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  primaryActionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  restrictedNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  restrictedNoteText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  downloadButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600" as const,
    textAlign: "center",
  },
});
