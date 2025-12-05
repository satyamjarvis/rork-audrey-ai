import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Animated,
  Dimensions,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Path } from "react-native-svg";
import {
  ArrowLeft,
  Type,
  Pencil,
  Eraser,
  Download,
  Trash2,
  Plus,
  Save,
  Circle,
  Bold,
  Italic,
  Underline,
  Palette,
  Sparkles,
  FileText,
  MoreHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { useNotes, DrawingStroke } from "@/contexts/NotesContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import QuickPressable from "@/components/QuickPressable";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Tool = "text" | "draw" | "eraser";
type TextStyle = "normal" | "bold" | "italic" | "underline";
type TextAlign = "left" | "center" | "right";
type FontFamily = "default" | "serif" | "monospace" | "cursive";
type Point = { x: number; y: number };

const NIGHT_MODE_COLORS = [
  "#000000", "#FFFFFF", "#FF4444", "#FF6B9D", "#C44569", 
  "#4CAF50", "#00D2D3", "#1B9CFC", "#2196F3", "#5F27CD",
  "#9C27B0", "#EA2027", "#FFC107", "#FF9800", "#F79F1F",
  "#EE5A6F", "#00BCD4", "#E91E63", "#607D8B", "#8395A7",
  "#A3CB38", "#FDA7DF", "#FF7979", "#58B19F", "#00D8D6",
];

const BRIGHT_MODE_COLORS = [
  "#1A1A1A", "#F5F5F5", "#FFB3BA", "#FFDFBA", "#FFFFBA",
  "#BAFFC9", "#BAE1FF", "#C7CEEA", "#FFB6D9", "#E0BBE4",
  "#FFDFD3", "#D4F1F4", "#D5E5A3", "#FDE2E4", "#FADADD",
  "#C9CCD5", "#EFE9F4", "#D0E8F2", "#FFF5E0", "#E8D6CB",
  "#C9F4AA", "#F7D8E7", "#FAD4D8", "#D6EFED", "#CCEEFF",
];

const STROKE_SIZES = [2, 4, 6, 8, 10];

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isNightMode = useMemo(() => {
    return theme.name.toLowerCase().includes('night') || 
           theme.name.toLowerCase().includes('dark');
  }, [theme.name]);

  const COLORS = useMemo(() => {
    return isNightMode
      ? NIGHT_MODE_COLORS
      : BRIGHT_MODE_COLORS;
  }, [isNightMode]);

  const colors = useMemo(() => ({
    primary: isNightMode ? "#FFD700" : theme.colors.primary,
    secondary: isNightMode ? "#FF1493" : theme.colors.secondary,
    accent: isNightMode ? "#FF1493" : "#d946ef",
    cardBg: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
    cardBorder: isNightMode ? "rgba(255, 215, 0, 0.2)" : theme.colors.border,
    textPrimary: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
    textSecondary: isNightMode ? "rgba(255, 20, 147, 0.8)" : theme.colors.text.secondary,
  }), [isNightMode, theme]);

  const gradientColors: readonly [string, string, ...string[]] = useMemo(() => {
    if (isNightMode) {
      return ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] as const;
    }
    const bg = theme.gradients.background;
    if (Array.isArray(bg) && bg.length >= 2) {
      return bg as unknown as readonly [string, string, ...string[]];
    }
    return [theme.colors.primary, theme.colors.secondary] as const;
  }, [isNightMode, theme]);
  const { notes, isLoading, createNote, updateNote, deleteNote, addDrawingStroke, clearDrawing } = useNotes();
  const { translations } = useLanguage();
  const heartPulse = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;

  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("text");
  const [textContent, setTextContent] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState<string>("Untitled");
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [drawColor, setDrawColor] = useState<string>("#000000");
  const [strokeSize, setStrokeSize] = useState<number>(4);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showSizePicker, setShowSizePicker] = useState<boolean>(false);
  const [showNotesList, setShowNotesList] = useState<boolean>(false);
  const [textColor, setTextColor] = useState<string>("#000000");
  const [textStyle, setTextStyle] = useState<TextStyle>("normal");
  const [textAlign, setTextAlign] = useState<TextAlign>("left");
  const [fontFamily, setFontFamily] = useState<FontFamily>("default");
  const [fontSize, setFontSize] = useState<number>(16);
  const [showTextColorPicker, setShowTextColorPicker] = useState<boolean>(false);
  const [showTextOptions, setShowTextOptions] = useState<boolean>(false);

  const touchStartRef = useRef<Point | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const keyboardOffset = useRef(new Animated.Value(100)).current;

  const currentNote = notes.find((n) => n.id === currentNoteId);

  const glitterParticles = useMemo(() => {
    return Array.from({ length: 30 }, () => {
      const spreadX = (Math.random() - 0.5) * SCREEN_WIDTH;
      const spreadY = (Math.random() - 0.5) * 600;
      return {
        x: spreadX,
        y: spreadY,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 2000,
        duration: Math.random() * 3000 + 2000,
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
        scale: new Animated.Value(0),
      };
    });
  }, []);

  const starPositions = useMemo(() => {
    return Array.from({ length: 25 }, () => ({
      left: Math.random() * SCREEN_WIDTH,
      top: Math.random() * 350,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  const handleNewNote = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newNote = await createNote(translations.notes.noteTitle || "New Note");
    setCurrentNoteId(newNote.id);
    setNoteTitle(newNote.title);
    setTextContent(newNote.textContent);
  }, [createNote]);

  const handleSaveNote = useCallback(async () => {
    if (!currentNoteId) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await updateNote(currentNoteId, {
      title: noteTitle,
      textContent,
    });
    Alert.alert(translations.notes.saved, translations.notes.noteSavedSuccess);
  }, [currentNoteId, noteTitle, textContent, updateNote]);

  const handleDeleteNote = useCallback(async () => {
    if (!currentNoteId) return;

    Alert.alert(translations.notes.deleteNote, translations.notes.deleteNoteConfirm, [
      { text: translations.common.cancel, style: "cancel" },
      {
        text: translations.common.delete,
        style: "destructive",
        onPress: async () => {
          await deleteNote(currentNoteId);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          const remainingNotes = notes.filter((n) => n.id !== currentNoteId);
          if (remainingNotes.length > 0) {
            setCurrentNoteId(remainingNotes[0].id);
            setNoteTitle(remainingNotes[0].title);
            setTextContent(remainingNotes[0].textContent);
          } else {
            handleNewNote();
          }
        },
      },
    ]);
  }, [currentNoteId, deleteNote, notes, handleNewNote]);

  const handleClearDrawing = useCallback(async () => {
    if (!currentNoteId) return;

    Alert.alert(translations.notes.clearDrawing, translations.notes.clearDrawingConfirm, [
      { text: translations.common.cancel, style: "cancel" },
      {
        text: translations.notes.clear,
        style: "destructive",
        onPress: async () => {
          await clearDrawing(currentNoteId);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  }, [currentNoteId, clearDrawing]);

  const handleExportPDF = useCallback(async () => {
    if (!currentNote) return;

    try {
      const html = `
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                padding: 40px;
                background: #ffffff;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 16px;
                margin-bottom: 30px;
              }
              h1 {
                margin: 0 0 8px 0;
                font-size: 28px;
                font-weight: 700;
              }
              .date {
                font-size: 13px;
                opacity: 0.9;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 16px;
                white-space: pre-wrap;
                line-height: 1.8;
                font-size: 16px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #999;
                font-size: 11px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${currentNote.title}</h1>
              <div class="date">${new Date(currentNote.lastEdited).toLocaleString()}</div>
            </div>
            <div class="content">${currentNote.textContent || "No content"}</div>
            <div class="footer">Created with Audrey Notes</div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert(translations.notes.error, translations.notes.exportError);
    }
  }, [currentNote]);

  const handleTouchStart = useCallback(
    (event: any) => {
      if (tool === "text") return;

      const { locationX, locationY } = event.nativeEvent;
      const point = { x: locationX, y: locationY };
      touchStartRef.current = point;
      setCurrentPath([point]);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [tool]
  );

  const handleTouchMove = useCallback(
    (event: any) => {
      if (tool === "text" || !touchStartRef.current) return;

      const { locationX, locationY } = event.nativeEvent;
      const point = { x: locationX, y: locationY };
      setCurrentPath((prev) => [...prev, point]);
    },
    [tool]
  );

  const handleTouchEnd = useCallback(async () => {
    if (tool === "text" || currentPath.length === 0 || !currentNoteId) {
      setCurrentPath([]);
      touchStartRef.current = null;
      return;
    }

    const stroke: DrawingStroke = {
      points: currentPath,
      color: tool === "eraser" ? "#FFFFFF" : drawColor,
      strokeWidth: tool === "eraser" ? strokeSize * 3 : strokeSize,
      type: tool === "eraser" ? "eraser" : "pen",
    };

    await addDrawingStroke(currentNoteId, stroke);
    setCurrentPath([]);
    touchStartRef.current = null;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [tool, currentPath, currentNoteId, drawColor, strokeSize, addDrawingStroke]);

  const pathToSvg = useCallback((points: Point[]): string => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }, []);

  const handleToolChange = useCallback(
    (newTool: Tool) => {
      setTool(newTool);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [scaleAnim]
  );

  const handleLoadNote = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        setCurrentNoteId(note.id);
        setNoteTitle(note.title);
        setTextContent(note.textContent);
        setShowNotesList(false);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [notes]
  );

  const handleBackPress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/planner");
    }
  }, []);

  useEffect(() => {
    if (!currentNoteId && notes.length === 0) {
      handleNewNote();
    }
  }, [currentNoteId, notes.length, handleNewNote]);

  useEffect(() => {
    if (!currentNoteId && notes.length > 0) {
      setCurrentNoteId(notes[0].id);
      setNoteTitle(notes[0].title);
      setTextContent(notes[0].textContent);
    }
  }, [currentNoteId, notes]);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Heart pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1.15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Stars rotation
    Animated.loop(
      Animated.timing(starsRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glitter particles animation
    glitterParticles.forEach((particle) => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.6 + 0.4,
              duration: 1000,
              delay: particle.delay,
              useNativeDriver: true,
            }),
            Animated.spring(particle.scale, {
              toValue: 1,
              tension: 20,
              friction: 7,
              delay: particle.delay,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: Math.random() * 200 - 100,
              duration: particle.duration,
              delay: particle.delay,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  }, [fadeAnim, slideAnim, heartPulse, starsRotate, sparkleOpacity, glitterParticles]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (event: any) => {
      Animated.timing(keyboardOffset, {
        toValue: -event.endCoordinates.height,
        duration: Platform.OS === "ios" ? event.duration : 250,
        useNativeDriver: true,
      }).start();
    };

    const onHide = (event: any) => {
      Animated.timing(keyboardOffset, {
        toValue: 100,
        duration: Platform.OS === "ios" ? event.duration : 250,
        useNativeDriver: true,
      }).start();
    };

    const showListener = Keyboard.addListener(showEvent, onShow);
    const hideListener = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [keyboardOffset]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradientColors} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.primary }]}>{translations.notes.loadingNotes}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!currentNote) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradientColors} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.primary }]}>{translations.notes.creatingFirstNote}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const starsRotateInterpolate = starsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getFontFamily = () => {
    switch (fontFamily) {
      case "serif":
        return Platform.select({ ios: "Georgia", android: "serif", web: "Georgia, serif" });
      case "monospace":
        return Platform.select({ ios: "Courier", android: "monospace", web: "Courier, monospace" });
      case "cursive":
        return Platform.select({ ios: "Snell Roundhand", android: "cursive", web: "cursive" });
      default:
        return undefined;
    }
  };

  const getTextStyleObject = () => {
    const baseStyle: any = {
      color: textColor,
      textAlign: textAlign,
      fontFamily: getFontFamily(),
      fontSize: fontSize,
    };

    if (textStyle === "bold") {
      baseStyle.fontWeight = "700" as const;
    } else if (textStyle === "italic") {
      baseStyle.fontStyle = "italic" as const;
    } else if (textStyle === "underline") {
      baseStyle.textDecorationLine = "underline" as const;
    }

    return baseStyle;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {/* Stars background */}
        {starPositions.map((star, index) => (
          <Animated.View
            key={index}
            style={[
              styles.star,
              {
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              },
            ]}
          />
        ))}

        {/* Glitter particles */}
        {glitterParticles.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.glitterDot,
              {
                width: particle.size,
                height: particle.size,
                left: particle.x + SCREEN_WIDTH / 2,
                top: particle.y + 300,
                opacity: particle.opacity,
                transform: [
                  { scale: particle.scale },
                  { translateY: particle.translateY },
                ],
              },
            ]}
          />
        ))}

        {/* Back button */}
        <TouchableOpacity
          style={[
            styles.backButton, 
            { 
              top: insets.top + 8,
              backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 192, 203, 0.15)"
            }
          ]}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.primary} size={28} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.safeArea}>
          <Animated.View
            style={[
              styles.header,
              {
                paddingTop: insets.top + 20,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Animated.View style={{ transform: [{ scale: heartPulse }] }}>
                  <FileText
                    color={colors.primary}
                    size={48}
                    strokeWidth={2}
                  />
                </Animated.View>
                <View>
                  <TextInput
                    style={[styles.headerTitle, { color: colors.primary }]}
                    value={noteTitle}
                    onChangeText={setNoteTitle}
                    placeholder="Note Title"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNotesList(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{notes.length} {translations.notes.notesSaved}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                <Sparkles color={colors.accent} size={32} strokeWidth={1.5} />
              </Animated.View>
            </View>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          >
            <Animated.View
              style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
              {/* Toolbar Card */}
              {Platform.OS === "web" ? (
                <View style={[styles.toolbarCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <View style={styles.toolbarOverlay}>
                    <View style={styles.toolbarHeader}>
                      <Palette color={colors.primary} size={18} strokeWidth={2} />
                      <Text style={[styles.toolbarLabel, { color: colors.secondary }]}>{translations.notes.drawingTools}</Text>
                    </View>
                    <View style={styles.toolbar}>
                      <Animated.View style={{ transform: [{ scale: tool === "text" ? scaleAnim : 1 }] }}>
                        <TouchableOpacity onPress={() => handleToolChange("text")} activeOpacity={0.7}>
                          <LinearGradient
                            colors={tool === "text" ? ["#d946ef", "#a855f7"] : ["transparent", "transparent"]}
                            style={styles.toolButton}
                          >
                            <Type color={tool === "text" ? "#FFFFFF" : colors.secondary} size={18} />
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>

                      <Animated.View style={{ transform: [{ scale: tool === "draw" ? scaleAnim : 1 }] }}>
                        <TouchableOpacity onPress={() => handleToolChange("draw")} activeOpacity={0.7}>
                          <LinearGradient
                            colors={tool === "draw" ? ["#d946ef", "#a855f7"] : ["transparent", "transparent"]}
                            style={styles.toolButton}
                          >
                            <Pencil color={tool === "draw" ? "#FFFFFF" : colors.secondary} size={18} />
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>

                      <Animated.View style={{ transform: [{ scale: tool === "eraser" ? scaleAnim : 1 }] }}>
                        <TouchableOpacity onPress={() => handleToolChange("eraser")} activeOpacity={0.7}>
                          <LinearGradient
                            colors={tool === "eraser" ? ["#d946ef", "#a855f7"] : ["transparent", "transparent"]}
                            style={styles.toolButton}
                          >
                            <Eraser color={tool === "eraser" ? "#FFFFFF" : colors.secondary} size={18} />
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>

                      <View style={styles.divider} />

                      <TouchableOpacity onPress={() => setShowColorPicker(true)} activeOpacity={0.7}>
                        <View style={[styles.colorButton, { borderColor: colors.primary }]}>
                          <View style={[styles.colorCircle, { backgroundColor: drawColor }]} />
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => setShowSizePicker(true)} activeOpacity={0.7}>
                        <View style={[styles.colorButton, { borderColor: colors.primary }]}>
                          <Circle color={colors.primary} size={strokeSize * 3} strokeWidth={2} />
                        </View>
                      </TouchableOpacity>

                      <View style={styles.divider} />

                      <TouchableOpacity onPress={handleClearDrawing} activeOpacity={0.7} style={{ marginRight: 6 }}>
                        <View style={styles.toolButton}>
                          <Trash2 color="#f87171" size={18} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="dark" style={[styles.toolbarCard, { borderColor: colors.cardBorder }]}>
                  <View style={styles.toolbarOverlay}>
                    <View style={styles.toolbarHeader}>
                      <Palette color={colors.primary} size={18} strokeWidth={2} />
                      <Text style={[styles.toolbarLabel, { color: colors.secondary }]}>{translations.notes.drawingTools}</Text>
                    </View>
                    <View style={styles.toolbar}>
                      <Animated.View style={{ transform: [{ scale: tool === "text" ? scaleAnim : 1 }] }}>
                        <TouchableOpacity onPress={() => handleToolChange("text")} activeOpacity={0.7}>
                          <LinearGradient
                            colors={tool === "text" ? ["#d946ef", "#a855f7"] : ["transparent", "transparent"]}
                            style={styles.toolButton}
                          >
                            <Type color={tool === "text" ? "#FFFFFF" : colors.secondary} size={18} />
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>

                      <Animated.View style={{ transform: [{ scale: tool === "draw" ? scaleAnim : 1 }] }}>
                        <TouchableOpacity onPress={() => handleToolChange("draw")} activeOpacity={0.7}>
                          <LinearGradient
                            colors={tool === "draw" ? ["#d946ef", "#a855f7"] : ["transparent", "transparent"]}
                            style={styles.toolButton}
                          >
                            <Pencil color={tool === "draw" ? "#FFFFFF" : colors.secondary} size={18} />
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>

                      <Animated.View style={{ transform: [{ scale: tool === "eraser" ? scaleAnim : 1 }] }}>
                        <TouchableOpacity onPress={() => handleToolChange("eraser")} activeOpacity={0.7}>
                          <LinearGradient
                            colors={tool === "eraser" ? ["#d946ef", "#a855f7"] : ["transparent", "transparent"]}
                            style={styles.toolButton}
                          >
                            <Eraser color={tool === "eraser" ? "#FFFFFF" : colors.secondary} size={18} />
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>

                      <View style={styles.divider} />

                      <TouchableOpacity onPress={() => setShowColorPicker(true)} activeOpacity={0.7}>
                        <View style={[styles.colorButton, { borderColor: colors.primary }]}>
                          <View style={[styles.colorCircle, { backgroundColor: drawColor }]} />
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => setShowSizePicker(true)} activeOpacity={0.7}>
                        <View style={[styles.colorButton, { borderColor: colors.primary }]}>
                          <Circle color={colors.primary} size={strokeSize * 3} strokeWidth={2} />
                        </View>
                      </TouchableOpacity>

                      <View style={styles.divider} />

                      <TouchableOpacity onPress={handleClearDrawing} activeOpacity={0.7} style={{ marginRight: 6 }}>
                        <View style={styles.toolButton}>
                          <Trash2 color="#f87171" size={18} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </BlurView>
              )}
            </Animated.View>

        {tool === "text" && (
          <Animated.View style={{ opacity: fadeAnim }}>
            {Platform.OS === "web" ? (
              <View style={[styles.textToolbar, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.textToolbarContent}>
                    <TouchableOpacity onPress={() => setShowTextColorPicker(true)} activeOpacity={0.7}>
                      <View style={[styles.textToolButton]}>
                        <Palette color={colors.primary} size={16} />
                        <View style={[styles.textColorPreview, { backgroundColor: textColor }]} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextStyle(textStyle === "bold" ? "normal" : "bold")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textStyle === "bold" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <Bold color={textStyle === "bold" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextStyle(textStyle === "italic" ? "normal" : "italic")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textStyle === "italic" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <Italic color={textStyle === "italic" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextStyle(textStyle === "underline" ? "normal" : "underline")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textStyle === "underline" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <Underline color={textStyle === "underline" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.textDivider} />

                    <TouchableOpacity onPress={() => setTextAlign("left")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textAlign === "left" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <AlignLeft color={textAlign === "left" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextAlign("center")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textAlign === "center" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <AlignCenter color={textAlign === "center" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextAlign("right")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textAlign === "right" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <AlignRight color={textAlign === "right" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.textDivider} />

                    <TouchableOpacity onPress={() => setShowTextOptions(true)} activeOpacity={0.7}>
                      <View style={styles.textToolButton}>
                        <MoreHorizontal color={colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            ) : (
              <BlurView intensity={20} tint="dark" style={[styles.textToolbar, { borderColor: colors.cardBorder }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.textToolbarContent}>
                    <TouchableOpacity onPress={() => setShowTextColorPicker(true)} activeOpacity={0.7}>
                      <View style={[styles.textToolButton]}>
                        <Palette color={colors.primary} size={16} />
                        <View style={[styles.textColorPreview, { backgroundColor: textColor }]} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextStyle(textStyle === "bold" ? "normal" : "bold")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textStyle === "bold" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <Bold color={textStyle === "bold" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextStyle(textStyle === "italic" ? "normal" : "italic")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textStyle === "italic" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <Italic color={textStyle === "italic" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextStyle(textStyle === "underline" ? "normal" : "underline")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textStyle === "underline" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <Underline color={textStyle === "underline" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.textDivider} />

                    <TouchableOpacity onPress={() => setTextAlign("left")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textAlign === "left" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <AlignLeft color={textAlign === "left" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextAlign("center")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textAlign === "center" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <AlignCenter color={textAlign === "center" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTextAlign("right")} activeOpacity={0.7}>
                      <View style={[
                        styles.textToolButton,
                        textAlign === "right" && { backgroundColor: "rgba(217, 70, 239, 0.2)" }
                      ]}>
                        <AlignRight color={textAlign === "right" ? colors.accent : colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.textDivider} />

                    <TouchableOpacity onPress={() => setShowTextOptions(true)} activeOpacity={0.7}>
                      <View style={styles.textToolButton}>
                        <MoreHorizontal color={colors.secondary} size={16} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </BlurView>
            )}
          </Animated.View>
        )}



            {/* Canvas Card */}
            <Animated.View style={{ opacity: fadeAnim }}>
              {Platform.OS === "web" ? (
                <View style={[styles.canvasCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <View style={styles.canvasOverlay}>
                    <View style={styles.combinedCanvas}>
                      {/* Text Layer - Always visible */}
                      <TextInput
                        style={[styles.textInput, getTextStyleObject(), { position: 'absolute', zIndex: tool === "text" ? 2 : 1 }]}
                        value={textContent}
                        onChangeText={setTextContent}
                        placeholder={translations.notes.startTyping}
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        multiline
                        textAlignVertical="top"
                        editable={tool === "text"}
                        pointerEvents={tool === "text" ? "auto" : "none"}
                      />
                      {/* Drawing Layer - Always visible */}
                      <View
                        style={[styles.drawingArea, { position: 'absolute', zIndex: tool !== "text" ? 2 : 0 }]}
                        onTouchStart={tool !== "text" ? handleTouchStart : undefined}
                        onTouchMove={tool !== "text" ? handleTouchMove : undefined}
                        onTouchEnd={tool !== "text" ? handleTouchEnd : undefined}
                        pointerEvents={tool !== "text" ? "auto" : "none"}
                      >
                        <Svg width={SCREEN_WIDTH - 80} height={SCREEN_HEIGHT * 0.6}>
                          {currentNote.drawingStrokes.map((stroke, index) => (
                            <Path
                              key={index}
                              d={pathToSvg(stroke.points)}
                              stroke={stroke.color}
                              strokeWidth={stroke.strokeWidth}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ))}
                          {currentPath.length > 0 && (
                            <Path
                              d={pathToSvg(currentPath)}
                              stroke={tool === "eraser" ? "#FFFFFF" : drawColor}
                              strokeWidth={tool === "eraser" ? strokeSize * 3 : strokeSize}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                        </Svg>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="dark" style={[styles.canvasCard, { borderColor: colors.cardBorder }]}>
                  <View style={styles.canvasOverlay}>
                    <View style={styles.combinedCanvas}>
                      {/* Text Layer - Always visible */}
                      <TextInput
                        style={[styles.textInput, getTextStyleObject(), { position: 'absolute', zIndex: tool === "text" ? 2 : 1 }]}
                        value={textContent}
                        onChangeText={setTextContent}
                        placeholder={translations.notes.startTyping}
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        multiline
                        textAlignVertical="top"
                        editable={tool === "text"}
                        pointerEvents={tool === "text" ? "auto" : "none"}
                      />
                      {/* Drawing Layer - Always visible */}
                      <View
                        style={[styles.drawingArea, { position: 'absolute', zIndex: tool !== "text" ? 2 : 0 }]}
                        onTouchStart={tool !== "text" ? handleTouchStart : undefined}
                        onTouchMove={tool !== "text" ? handleTouchMove : undefined}
                        onTouchEnd={tool !== "text" ? handleTouchEnd : undefined}
                        pointerEvents={tool !== "text" ? "auto" : "none"}
                      >
                        <Svg width={SCREEN_WIDTH - 80} height={SCREEN_HEIGHT * 0.6}>
                          {currentNote.drawingStrokes.map((stroke, index) => (
                            <Path
                              key={index}
                              d={pathToSvg(stroke.points)}
                              stroke={stroke.color}
                              strokeWidth={stroke.strokeWidth}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ))}
                          {currentPath.length > 0 && (
                            <Path
                              d={pathToSvg(currentPath)}
                              stroke={tool === "eraser" ? "#FFFFFF" : drawColor}
                              strokeWidth={tool === "eraser" ? strokeSize * 3 : strokeSize}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                        </Svg>
                      </View>
                    </View>
                  </View>
                </BlurView>
              )}
            </Animated.View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleNewNote}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#A3CB38", "#7FB800"]}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus color="#FFFFFF" size={16} strokeWidth={2.5} />
                  <Text style={styles.actionButtonText}>{translations.notes.newNote}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSaveNote}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#d946ef", "#a855f7"]}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Save color="#FFFFFF" size={16} strokeWidth={2.5} />
                  <Text style={styles.actionButtonText}>{translations.notes.save}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleExportPDF}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#FF9800", "#F57C00"]}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Download color="#FFFFFF" size={16} strokeWidth={2.5} />
                  <Text style={styles.actionButtonText}>{translations.notes.export}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDeleteNote}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#f87171", "#ef4444"]}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Trash2 color="#FFFFFF" size={16} strokeWidth={2.5} />
                  <Text style={styles.actionButtonText}>{translations.notes.delete}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                {translations.notes.expressYourThoughts}
              </Text>
            </Animated.View>
          </ScrollView>
        </View>



        <Modal visible={showColorPicker} animationType="slide" transparent onRequestClose={() => setShowColorPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, backgroundColor: isNightMode ? "#1a0a1f" : theme.colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{translations.notes.chooseColor}</Text>
                <QuickPressable onPress={() => setShowColorPicker(false)}>
                  <Text style={[styles.modalClose, { color: theme.colors.text.primary }]}>✕</Text>
                </QuickPressable>
              </View>
              <View style={styles.colorGrid}>
                {COLORS.map((color) => (
                  <QuickPressable
                    key={color}
                    onPress={() => {
                      setDrawColor(color);
                      setShowColorPicker(false);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        drawColor === color && { borderColor: theme.colors.primary, borderWidth: 4 },
                      ]}
                    />
                  </QuickPressable>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showSizePicker} animationType="slide" transparent onRequestClose={() => setShowSizePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, backgroundColor: isNightMode ? "#1a0a1f" : theme.colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{translations.notes.strokeSize}</Text>
                <QuickPressable onPress={() => setShowSizePicker(false)}>
                  <Text style={[styles.modalClose, { color: theme.colors.text.primary }]}>✕</Text>
                </QuickPressable>
              </View>
              <View style={styles.sizeGrid}>
                {STROKE_SIZES.map((size) => (
                  <QuickPressable
                    key={size}
                    onPress={() => {
                      setStrokeSize(size);
                      setShowSizePicker(false);
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.sizeOption,
                        strokeSize === size && { borderColor: theme.colors.primary, borderWidth: 3 },
                      ]}
                    >
                      <View style={[styles.sizeDot, { width: size * 3, height: size * 3, backgroundColor: theme.colors.primary }]} />
                    </View>
                  </QuickPressable>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showNotesList} animationType="slide" transparent onRequestClose={() => setShowNotesList(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, backgroundColor: isNightMode ? "#1a0a1f" : theme.colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{translations.notes.yourNotes}</Text>
                <QuickPressable onPress={() => setShowNotesList(false)}>
                  <Text style={[styles.modalClose, { color: theme.colors.text.primary }]}>✕</Text>
                </QuickPressable>
              </View>
              <ScrollView style={styles.notesList}>
                {notes.map((note) => (
                  <QuickPressable key={note.id} onPress={() => handleLoadNote(note.id)}>
                    <View
                      style={[
                        styles.noteItem,
                        { backgroundColor: note.id === currentNoteId ? theme.colors.primary + "20" : "transparent" },
                      ]}
                    >
                      <Text style={[styles.noteItemTitle, { color: theme.colors.text.primary }]}>{note.title}</Text>
                      <Text style={[styles.noteItemDate, { color: theme.colors.text.light }]}>
                        {new Date(note.lastEdited).toLocaleDateString()}
                      </Text>
                    </View>
                  </QuickPressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showTextColorPicker} animationType="slide" transparent onRequestClose={() => setShowTextColorPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, backgroundColor: isNightMode ? "#1a0a1f" : theme.colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Sparkles color={theme.colors.primary} size={22} />
                  <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{translations.notes.textColor}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <KeyboardDismissButton color={theme.colors.text.primary} size={20} />
                  <QuickPressable onPress={() => setShowTextColorPicker(false)}>
                    <Text style={[styles.modalClose, { color: theme.colors.text.primary }]}>✕</Text>
                  </QuickPressable>
                </View>
              </View>
              <ScrollView>
                <View style={styles.colorGrid}>
                  {COLORS.map((color) => (
                    <QuickPressable
                      key={color}
                      onPress={() => {
                        setTextColor(color);
                        setShowTextColorPicker(false);
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.colorOption,
                          { backgroundColor: color, borderColor: color === "#FFFFFF" ? "#E0E0E0" : color },
                          textColor === color && { borderColor: theme.colors.primary, borderWidth: 4 },
                        ]}
                      />
                    </QuickPressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showTextOptions} animationType="slide" transparent onRequestClose={() => setShowTextOptions(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, backgroundColor: isNightMode ? "#1a0a1f" : theme.colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <FileText color={theme.colors.primary} size={22} />
                  <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{translations.notes.textOptions}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <KeyboardDismissButton color={theme.colors.text.primary} size={20} />
                  <QuickPressable onPress={() => setShowTextOptions(false)}>
                    <Text style={[styles.modalClose, { color: theme.colors.text.primary }]}>✕</Text>
                  </QuickPressable>
                </View>
              </View>
              
              <View style={{ gap: 20 }}>
                <View>
                  <Text style={[styles.optionLabel, { color: theme.colors.text.secondary }]}>{translations.notes.fontFamily}</Text>
                  <View style={styles.fontGrid}>
                    {["default", "serif", "monospace", "cursive"].map((font) => (
                      <QuickPressable
                        key={font}
                        onPress={() => {
                          setFontFamily(font as FontFamily);
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.fontOption,
                            { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.cardBackground, borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(0,0,0,0.1)" },
                            fontFamily === font && { borderColor: theme.colors.primary, borderWidth: 3 },
                          ]}
                        >
                          <Text style={[
                            styles.fontOptionText,
                            { color: theme.colors.text.primary },
                            font === "serif" && Platform.select({ ios: { fontFamily: "Georgia" }, android: { fontFamily: "serif" } }),
                            font === "monospace" && Platform.select({ ios: { fontFamily: "Courier" }, android: { fontFamily: "monospace" } }),
                            font === "cursive" && Platform.select({ ios: { fontFamily: "Snell Roundhand" }, android: { fontFamily: "cursive" } }),
                          ]}>
                            {font === "default" ? translations.notes.default : font === "serif" ? translations.notes.serif : font === "monospace" ? translations.notes.monospace : translations.notes.cursive}
                          </Text>
                        </View>
                      </QuickPressable>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={[styles.optionLabel, { color: theme.colors.text.secondary }]}>{translations.notes.fontSize}: {fontSize}px</Text>
                  <View style={styles.fontSizeGrid}>
                    {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                      <QuickPressable
                        key={size}
                        onPress={() => {
                          setFontSize(size);
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.fontSizeOption,
                            { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.cardBackground, borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(0,0,0,0.1)" },
                            fontSize === size && { borderColor: theme.colors.primary, borderWidth: 3 },
                          ]}
                        >
                          <Text style={[
                            styles.fontSizeText,
                            { color: theme.colors.text.primary, fontSize: Math.min(size, 20) }
                          ]}>
                            {size}
                          </Text>
                        </View>
                      </QuickPressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Animated.View
          style={[
            styles.keyboardDismissContainer,
            { transform: [{ translateY: keyboardOffset }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              Keyboard.dismiss();
            }}
            style={styles.keyboardDismissButton}
            activeOpacity={0.8}
          >
            <ChevronDown color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700" as const,
    paddingHorizontal: 8,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 4,
  },
  colorButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
    borderColor: "#ffc0cb",
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },


  canvas: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 26,
    padding: 20,
    width: "100%",
    height: "100%",
    minHeight: SCREEN_HEIGHT * 0.6,
    color: "#FFFFFF",
    backgroundColor: "transparent",
  },
  drawingArea: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_HEIGHT * 0.6,
  },
  bottomBar: {
    flexDirection: "row" as const,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#d946ef",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
  },
  modalClose: {
    fontSize: 28,
    fontWeight: "300" as const,
  },
  colorGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 14,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "transparent",
  },
  sizeGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 16,
  },
  sizeOption: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  sizeDot: {
    borderRadius: 999,
  },
  notesList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  noteItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  noteItemTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  noteItemDate: {
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#ffc0cb",
  },
  textToolbar: {
    flexDirection: "row" as const,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.2)",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  textToolbarContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 12,
    gap: 6,
  },
  textToolButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: "transparent",
  },
  textColorPreview: {
    position: "absolute" as const,
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  textDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 4,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  fontGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
  },
  fontOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
  },
  fontOptionText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  fontSizeGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
  },
  fontSizeOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
  },
  fontSizeText: {
    fontWeight: "700" as const,
  },
  star: {
    position: "absolute" as const,
    backgroundColor: "#ffffff",
    borderRadius: 50,
  },
  glitterDot: {
    position: "absolute" as const,
    backgroundColor: "#C0C0C0",
    borderRadius: 50,
    shadowColor: "#C0C0C0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    position: "absolute" as const,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 22,
    backgroundColor: "rgba(255, 192, 203, 0.15)",
  },
  safeArea: {
    flex: 1,
  },
  headerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  headerLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#ffc0cb",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#d4c4f0",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 140,
  },
  toolbarCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.2)",
  },
  toolbarOverlay: {
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 16,
  },
  toolbarHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 16,
  },
  toolbarLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    color: "#f0c8d8",
  },
  canvasCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 28,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.2)",
  },
  canvasOverlay: {
    padding: 20,
  },
  combinedCanvas: {
    position: "relative" as const,
    width: SCREEN_WIDTH - 80,
    height: SCREEN_HEIGHT * 0.6,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  actionButtons: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 20,
  },
  actionButtonGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    padding: 10,
    borderRadius: 14,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#b8a8d8",
    textAlign: "center" as const,
    letterSpacing: 0.5,
    opacity: 0.7,
    fontStyle: "italic" as const,
  },
  keyboardDismissContainer: {
    position: "absolute",
    bottom: 12,
    right: 20,
    zIndex: 1000,
  },
  keyboardDismissButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#d946ef",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});
