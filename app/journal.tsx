import { useRef, useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  TextInput,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Feather,
  Sparkles,
  Smile,
  Save,
  ChevronDown,
  ArrowLeft,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function JournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const bookPulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [journalEntry, setJournalEntry] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [mood, setMood] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [journalQuote] = useState(() => {
    const quotes = [
      "Write your heart out. Let your thoughts flow freely.",
      "Every word you write is a step towards clarity.",
      "Your story matters. Your thoughts are valid.",
      "Reflection is the beginning of wisdom.",
      "Writing is the painting of the voice.",
      "Pour your soul onto the page tonight.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  const starPositions = useMemo(() => {
    return Array.from({ length: 15 }, () => ({
      left: Math.random() * width,
      top: Math.random() * 350,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(bookPulse, {
          toValue: 1.15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(bookPulse, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(starsRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

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
  }, [fadeAnim, slideAnim, bookPulse, starsRotate, sparkleOpacity]);

  const handleSave = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log("Saving evening reflections:", { journalEntry, gratitude, mood });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const starsRotateInterpolate = starsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={["#1a1a2e", "#2d1b4e", "#3d2963"]}
        style={styles.gradient}
      >
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

        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 8 }]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft color="#c8b5f0" size={28} strokeWidth={2.5} />
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
                <Animated.View style={{ transform: [{ scale: bookPulse }] }}>
                  <Feather
                    color="#c8b5f0"
                    size={48}
                    strokeWidth={2}
                  />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>Evening Reflections</Text>
                  <Text style={styles.headerTime}>{formatTime(currentTime)}</Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                <Sparkles color="#e0b8f0" size={32} strokeWidth={1.5} />
              </Animated.View>
            </View>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
              {Platform.OS === "web" ? (
                <View style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Sparkles color="#c8b5f0" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>Tonight&apos;s Inspiration</Text>
                    </View>
                    <Text style={styles.quoteText}>{journalQuote}</Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="dark" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Sparkles color="#c8b5f0" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>Tonight&apos;s Inspiration</Text>
                    </View>
                    <Text style={styles.quoteText}>{journalQuote}</Text>
                  </View>
                </BlurView>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Unwind Your Thoughts</Text>
                <Text style={styles.sectionSubtitle}>
                  What&apos;s on your mind this evening?
                </Text>
              </View>
            </Animated.View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderInline}>
                <Feather color="#c8b5f0" size={24} strokeWidth={2.5} />
                <Text style={styles.sectionTitleInline}>Your Evening Thoughts</Text>
              </View>
              <Animated.View style={styles.inputCard}>
                {Platform.OS === "web" ? (
                  <View style={styles.inputCardInner}>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Let your thoughts flow..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={journalEntry}
                      onChangeText={setJournalEntry}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                ) : (
                  <BlurView intensity={20} tint="dark" style={styles.inputCardInner}>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Let your thoughts flow..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={journalEntry}
                      onChangeText={setJournalEntry}
                      multiline
                      textAlignVertical="top"
                    />
                  </BlurView>
                )}
              </Animated.View>
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderInline}>
                <Sparkles color="#c8b5f0" size={24} strokeWidth={2.5} />
                <Text style={styles.sectionTitleInline}>Today&apos;s Gratitude</Text>
              </View>
              <Animated.View style={styles.inputCard}>
                {Platform.OS === "web" ? (
                  <View style={styles.inputCardInner}>
                    <TextInput
                      style={styles.textArea}
                      placeholder="What brought joy to your day?"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={gratitude}
                      onChangeText={setGratitude}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                ) : (
                  <BlurView intensity={20} tint="dark" style={styles.inputCardInner}>
                    <TextInput
                      style={styles.textArea}
                      placeholder="What brought joy to your day?"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={gratitude}
                      onChangeText={setGratitude}
                      multiline
                      textAlignVertical="top"
                    />
                  </BlurView>
                )}
              </Animated.View>
            </View>

            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderInline}>
                <Smile color="#c8b5f0" size={24} strokeWidth={2.5} />
                <Text style={styles.sectionTitleInline}>How I&apos;m Feeling</Text>
              </View>
              <Animated.View style={styles.inputCard}>
                {Platform.OS === "web" ? (
                  <View style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder="Describe your mood tonight..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={mood}
                      onChangeText={setMood}
                    />
                  </View>
                ) : (
                  <BlurView intensity={20} tint="dark" style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder="Describe your mood tonight..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={mood}
                      onChangeText={setMood}
                    />
                  </BlurView>
                )}
              </Animated.View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#d946ef", "#a855f7"]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Save color="#FFFFFF" size={24} strokeWidth={2.5} />
                <Text style={styles.saveButtonText}>Save Reflections</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText}>
                Let the stillness of the night embrace your words
              </Text>
            </Animated.View>
          </ScrollView>
        </View>

        {keyboardVisible && (
          <TouchableOpacity
            style={styles.keyboardDismissButton}
            onPress={() => {
              Keyboard.dismiss();
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#d946ef", "#a855f7"]}
              style={styles.keyboardDismissContent}
            >
              <ChevronDown color="#FFFFFF" size={24} strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>
        )}
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
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 50,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#c8b5f0",
    letterSpacing: 0.5,
  },
  headerTime: {
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
  quoteCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 28,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(200, 181, 240, 0.2)",
  },
  quoteOverlay: {
    padding: 24,
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  quoteLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    color: "#e0c8f0",
  },
  quoteText: {
    fontSize: 18,
    fontWeight: "500" as const,
    lineHeight: 28,
    color: "#f4f0f8",
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600" as const,
    marginBottom: 8,
    color: "#c8b5f0",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#d4c4f0",
    letterSpacing: 0.3,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitleInline: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#c8b5f0",
    letterSpacing: 0.3,
  },
  inputCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(200, 181, 240, 0.2)",
  },
  inputCardInner: {
    padding: 20,
  },
  input: {
    fontSize: 16,
    color: "#FFFFFF",
    minHeight: 48,
  },
  textArea: {
    fontSize: 16,
    color: "#FFFFFF",
    minHeight: 120,
    textAlignVertical: "top",
  },
  saveButton: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#d946ef",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#b8a8d8",
    textAlign: "center",
    letterSpacing: 0.5,
    opacity: 0.7,
    fontStyle: "italic" as const,
  },
  backButton: {
    position: "absolute" as const,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(200, 181, 240, 0.15)",
  },
  keyboardDismissButton: {
    position: "absolute" as const,
    bottom: 32,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#d946ef",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  keyboardDismissContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
