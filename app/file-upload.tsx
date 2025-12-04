import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import {
  X,
  Upload,
  Image as ImageIcon,
  Video,
  File,
  Trash2,
  Brain,
  FileText,
  FileSpreadsheet,
  Music,
} from "lucide-react-native";
import colors from "@/constants/colors";
import { generateText } from "@rork-ai/toolkit-sdk";

interface UploadedFile {
  id: string;
  uri: string;
  name: string;
  type: string;
  size?: number;
  mimeType?: string;
  analysis?: {
    summary: string;
    keyPoints: string[];
    metadata: Record<string, any>;
    timestamp: number;
  };
}

export default function FileUploadScreen() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analyzingFiles, setAnalyzingFiles] = useState<Set<string>>(new Set());
  const insets = useSafeAreaInsets();

  const pickImageFromGallery = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const newFiles: UploadedFile[] = result.assets.map((asset) => ({
          id: Date.now().toString() + Math.random(),
          uri: asset.uri,
          name: asset.fileName || `media_${Date.now()}`,
          type: asset.type || "image",
          size: asset.fileSize,
          mimeType: asset.mimeType,
        }));

        setUploadedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: UploadedFile[] = result.assets.map((asset) => ({
          id: Date.now().toString() + Math.random(),
          uri: asset.uri,
          name: asset.name,
          type: getFileType(asset.mimeType || ""),
          size: asset.size || 0,
          mimeType: asset.mimeType,
        }));

        setUploadedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.includes("pdf")) return "pdf";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "spreadsheet";
    if (mimeType.includes("text") || mimeType.includes("document")) return "document";
    return "document";
  };

  const analyzeFile = async (file: UploadedFile) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      setAnalyzingFiles(prev => new Set(prev).add(file.id));
      
      console.log("[Audrey Analysis] Starting analysis for:", file.name);
      
      let analysisPrompt = "";
      let fileContent = "";
      
      if (file.type === "image") {
        let base64Data = "";
        
        if (file.uri.startsWith("data:")) {
          base64Data = file.uri;
        } else if (file.uri.startsWith("file://") || file.uri.startsWith("/")) {
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: "base64" as any,
          });
          base64Data = `data:${file.mimeType || 'image/jpeg'};base64,${base64}`;
        } else {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const reader = new FileReader();
          await new Promise((resolve) => {
            reader.onloadend = () => {
              base64Data = reader.result as string;
              resolve(null);
            };
            reader.readAsDataURL(blob);
          });
        }
        
        analysisPrompt = `You are Audrey, a professional AI analyst. Analyze this image in detail and provide:

1. **Summary**: What is this image showing?
2. **Key Elements**: List 3-5 key visual elements, objects, or subjects
3. **Context**: What is the likely context, purpose, or significance?
4. **Technical Details**: Any notable technical aspects (quality, composition, etc.)
5. **Insights**: Any interesting observations or insights
6. **Recommendations**: Suggestions for use, improvements, or related actions

Be thorough, professional, and insightful. Format your response clearly with sections.`;
        
        const analysis = await generateText({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: analysisPrompt },
                { type: "image", image: base64Data },
              ],
            },
          ],
        });
        
        const keyPoints = extractKeyPoints(analysis);
        
        const updatedFile = {
          ...file,
          analysis: {
            summary: analysis,
            keyPoints,
            metadata: {
              analyzedAt: new Date().toISOString(),
              fileType: "image",
              fileName: file.name,
              mimeType: file.mimeType,
            },
            timestamp: Date.now(),
          },
        };
        
        setUploadedFiles(prev =>
          prev.map(f => (f.id === file.id ? updatedFile : f))
        );
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        console.log("[Audrey Analysis] Image analysis complete");
      } else if (file.type === "document" || file.type === "pdf") {
        if (file.uri.startsWith("file://")) {
          try {
            fileContent = await FileSystem.readAsStringAsync(file.uri, {
              encoding: "utf8" as any,
            });
          } catch (readError) {
            console.log("[Audrey Analysis] Could not read as text, using metadata analysis", readError);
            fileContent = "";
          }
        }
        
        if (fileContent.length > 50000) {
          fileContent = fileContent.substring(0, 50000) + "\n\n[Content truncated due to length]";
        }
        
        analysisPrompt = `You are Audrey, a professional document analyst. Analyze this document and provide:

1. **Document Type**: What kind of document is this?
2. **Summary**: Brief overview of the document's content and purpose
3. **Key Points**: Extract 5-10 main points, facts, or sections
4. **Important Details**: Any critical information, dates, names, or figures
5. **Structure**: How is the document organized?
6. **Insights**: Professional analysis and observations
7. **Action Items**: Any tasks, deadlines, or follow-ups mentioned
8. **Recommendations**: Suggestions for how to use or act on this document

Be thorough and professional. Format clearly with sections.

Document name: ${file.name}
${fileContent ? `\nDocument content:\n${fileContent}` : "\nNote: Full text content not available, analyze based on filename and metadata."}`;
        
        const analysis = await generateText({
          messages: [{ role: "user", content: analysisPrompt }],
        });
        
        const keyPoints = extractKeyPoints(analysis);
        
        const updatedFile = {
          ...file,
          analysis: {
            summary: analysis,
            keyPoints,
            metadata: {
              analyzedAt: new Date().toISOString(),
              fileType: file.type,
              fileName: file.name,
              hasTextContent: fileContent.length > 0,
              contentLength: fileContent.length,
            },
            timestamp: Date.now(),
          },
        };
        
        setUploadedFiles(prev =>
          prev.map(f => (f.id === file.id ? updatedFile : f))
        );
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        console.log("[Audrey Analysis] Document analysis complete");
      } else if (file.type === "video") {
        analysisPrompt = `You are Audrey, a professional media analyst. Based on the video file metadata, provide:

1. **Video Analysis**: Professional assessment based on filename and metadata
2. **Likely Content**: What this video likely contains based on the name
3. **Potential Use Cases**: How this video might be used
4. **Recommendations**: Suggestions for organization, editing, or sharing
5. **Metadata**: Technical details from the file

Video name: ${file.name}
Size: ${formatFileSize(file.size)}
Type: ${file.mimeType}`;
        
        const analysis = await generateText({
          messages: [{ role: "user", content: analysisPrompt }],
        });
        
        const keyPoints = extractKeyPoints(analysis);
        
        const updatedFile = {
          ...file,
          analysis: {
            summary: analysis,
            keyPoints,
            metadata: {
              analyzedAt: new Date().toISOString(),
              fileType: "video",
              fileName: file.name,
              size: file.size,
            },
            timestamp: Date.now(),
          },
        };
        
        setUploadedFiles(prev =>
          prev.map(f => (f.id === file.id ? updatedFile : f))
        );
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        console.log("[Audrey Analysis] Video analysis complete");
      } else {
        analysisPrompt = `You are Audrey, a professional file analyst. Analyze this file and provide:

1. **File Assessment**: Professional analysis based on filename and metadata
2. **Content Prediction**: What this file likely contains
3. **Organization**: How to best organize or categorize this file
4. **Recommendations**: Suggestions for handling or using this file

File name: ${file.name}
Size: ${formatFileSize(file.size)}
Type: ${file.mimeType || file.type}`;
        
        const analysis = await generateText({
          messages: [{ role: "user", content: analysisPrompt }],
        });
        
        const keyPoints = extractKeyPoints(analysis);
        
        const updatedFile = {
          ...file,
          analysis: {
            summary: analysis,
            keyPoints,
            metadata: {
              analyzedAt: new Date().toISOString(),
              fileType: file.type,
              fileName: file.name,
            },
            timestamp: Date.now(),
          },
        };
        
        setUploadedFiles(prev =>
          prev.map(f => (f.id === file.id ? updatedFile : f))
        );
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        console.log("[Audrey Analysis] File analysis complete");
      }
      
      Alert.alert(
        "✨ Analysis Complete",
        "Audrey has finished analyzing your file. Scroll down to see the detailed analysis.",
        [{ text: "View Analysis", onPress: () => {} }]
      );
    } catch (error) {
      console.error("[Audrey Analysis] Error:", error);
      Alert.alert(
        "Analysis Failed",
        "Failed to analyze the file. Please try again."
      );
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setAnalyzingFiles(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    }
  };

  const extractKeyPoints = (text: string): string[] => {
    const keyPoints: string[] = [];
    const lines = text.split("\n");
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        (trimmed.startsWith("-") ||
          trimmed.startsWith("•") ||
          trimmed.startsWith("*") ||
          /^\d+\./.test(trimmed)) &&
        trimmed.length > 10 &&
        trimmed.length < 200
      ) {
        keyPoints.push(trimmed.replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, ""));
      }
    }
    
    return keyPoints.slice(0, 10);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const deleteFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={24} color={colors.primary} />;
      case "video":
        return <Video size={24} color={colors.primary} />;
      case "pdf":
        return <FileText size={24} color={colors.primary} />;
      case "spreadsheet":
        return <FileSpreadsheet size={24} color={colors.primary} />;
      case "audio":
        return <Music size={24} color={colors.primary} />;
      default:
        return <File size={24} color={colors.primary} />;
    }
  };

  const pickCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your camera"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random(),
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
          type: "image",
          size: result.assets[0].fileSize,
          mimeType: result.assets[0].mimeType || "image/jpeg",
        };

        setUploadedFiles((prev) => [...prev, newFile]);
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Upload Media</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Add Files for Analysis</Text>
          <Text style={styles.sectionSubtitle}>
            Audrey will analyze your files using professional AI
          </Text>

          <View style={styles.uploadGrid}>
            <TouchableOpacity
              style={styles.uploadCard}
              onPress={pickCamera}
            >
              <View style={[styles.uploadIconContainer, { backgroundColor: "rgba(76, 175, 80, 0.15)" }]}>
                <ImageIcon size={28} color="#4CAF50" />
              </View>
              <Text style={styles.uploadCardText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadCard}
              onPress={pickImageFromGallery}
            >
              <View style={[styles.uploadIconContainer, { backgroundColor: "rgba(33, 150, 243, 0.15)" }]}>
                <ImageIcon size={28} color="#2196F3" />
              </View>
              <Text style={styles.uploadCardText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadCard}
              onPress={pickDocument}
            >
              <View style={[styles.uploadIconContainer, { backgroundColor: "rgba(255, 152, 0, 0.15)" }]}>
                <File size={28} color="#FF9800" />
              </View>
              <Text style={styles.uploadCardText}>Documents</Text>
            </TouchableOpacity>
          </View>
        </View>

        {uploadedFiles.length > 0 && (
          <View style={styles.filesSection}>
            <Text style={styles.sectionTitle}>
              Uploaded Files ({uploadedFiles.length})
            </Text>

            {uploadedFiles.map((file) => (
              <View key={file.id}>
                <View style={styles.fileCard}>
                  <View style={styles.filePreview}>
                    {file.type === "image" ? (
                      <Image
                        source={{ uri: file.uri }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.fileIconContainer}>
                        {getFileIcon(file.type)}
                      </View>
                    )}
                  </View>

                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={2}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                    <Text style={styles.fileType}>
                      {file.mimeType || file.type}
                    </Text>
                    {file.analysis && (
                      <View style={styles.analyzedBadge}>
                        <Brain size={12} color={colors.success} />
                        <Text style={styles.analyzedText}>Analyzed</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.fileActions}>
                    {!file.analysis && !analyzingFiles.has(file.id) && (
                      <TouchableOpacity
                        style={styles.analyzeButton}
                        onPress={() => analyzeFile(file)}
                      >
                        <Brain size={18} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    {analyzingFiles.has(file.id) && (
                      <View style={styles.analyzeButton}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteFile(file.id)}
                    >
                      <Trash2 size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {file.analysis && (
                  <View style={styles.analysisCard}>
                    <View style={styles.analysisHeader}>
                      <Brain size={20} color={colors.primary} />
                      <Text style={styles.analysisTitle}>Audrey&apos;s Analysis</Text>
                    </View>
                    
                    {file.analysis.keyPoints.length > 0 && (
                      <View style={styles.keyPointsSection}>
                        <Text style={styles.keyPointsTitle}>Key Points:</Text>
                        {file.analysis.keyPoints.slice(0, 5).map((point, idx) => (
                          <View key={idx} style={styles.keyPoint}>
                            <Text style={styles.keyPointBullet}>•</Text>
                            <Text style={styles.keyPointText}>{point}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    <View style={styles.analysisSummarySection}>
                      <Text style={styles.analysisSummaryTitle}>Full Analysis:</Text>
                      <ScrollView 
                        style={styles.analysisSummaryScroll}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        <Text style={styles.analysisSummary}>
                          {file.analysis.summary}
                        </Text>
                      </ScrollView>
                    </View>
                    
                    <Text style={styles.analysisTimestamp}>
                      Analyzed {new Date(file.analysis.timestamp).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {uploadedFiles.length === 0 && (
          <View style={styles.emptyState}>
            <Upload size={64} color={colors.text.light} />
            <Text style={styles.emptyText}>No files uploaded yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the buttons above to upload files
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  uploadSection: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  uploadGrid: {
    flexDirection: "row",
    gap: 12,
  },
  uploadCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  uploadIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadCardText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text.primary,
    textAlign: "center",
  },
  uploadButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed" as const,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginTop: 12,
  },
  uploadButtonSubtext: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
  },
  filesSection: {
    padding: 20,
    paddingTop: 0,
  },
  fileCard: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  filePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.background,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  fileIconContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  fileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  analyzeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(103, 58, 183, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(103, 58, 183, 0.2)",
  },
  analyzedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  analyzedText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: colors.success,
  },
  analysisCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 12,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  keyPointsSection: {
    gap: 8,
  },
  keyPointsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: 4,
  },
  keyPoint: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  keyPointBullet: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "700" as const,
    marginTop: -2,
  },
  keyPointText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  analysisSummarySection: {
    gap: 8,
  },
  analysisSummaryTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  analysisSummaryScroll: {
    maxHeight: 300,
  },
  analysisSummary: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  analysisTimestamp: {
    fontSize: 11,
    color: colors.text.light,
    fontStyle: "italic" as const,
    marginTop: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  fileType: {
    fontSize: 11,
    color: colors.text.light,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.2)",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.light,
    marginTop: 8,
    textAlign: "center",
  },
});
