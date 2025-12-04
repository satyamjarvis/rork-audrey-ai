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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Sparkles,
  Heart,
  Star,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

const { width } = Dimensions.get("window");

type GratitudeEntry = {
  id: string;
  text: string;
  timestamp: Date;
};

export default function GratitudeMomentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const glitterParticles = useMemo(() => {
    return Array.from({ length: 30 }, () => {
      const spreadX = (Math.random() - 0.5) * width;
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

  const [gratitudeQuote] = useState(() => {
    const quotes = [
      "Gratitude turns what we have into enough.",
      "In every moment, there is something to be grateful for.",
      "The more grateful we are, the more we attract abundance.",
      "Gratitude is the sweetest thing in a seeker's life.",
      "Let gratitude be the pillow upon which you kneel.",
      "Gratitude unlocks the fullness of life.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  const starPositions = useMemo(() => {
    return Array.from({ length: 25 }, () => ({
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

  const handleAddEntry = () => {
    if (newEntry.trim()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const entry: GratitudeEntry = {
        id: Date.now().toString(),
        text: newEntry.trim(),
        timestamp: new Date(),
      };

      setGratitudeEntries([entry, ...gratitudeEntries]);
      setNewEntry("");
      setIsAdding(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setGratitudeEntries(gratitudeEntries.filter((entry) => entry.id !== id));
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

        {glitterParticles.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.glitterDot,
              {
                width: particle.size,
                height: particle.size,
                left: particle.x + width / 2,
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
          <ArrowLeft color="#ffc0cb" size={28} strokeWidth={2.5} />
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
                  <Heart
                    color="#ffc0cb"
                    size={48}
                    strokeWidth={2}
                    fill="#ffc0cb"
                    fillOpacity={0.3}
                  />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>Gratitude Moments</Text>
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
                      <Sparkles color="#ffc0cb" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>Today&apos;s Reminder</Text>
                    </View>
                    <Text style={styles.quoteText}>{gratitudeQuote}</Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="dark" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Sparkles color="#ffc0cb" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>Today&apos;s Reminder</Text>
                    </View>
                    <Text style={styles.quoteText}>{gratitudeQuote}</Text>
                  </View>
                </BlurView>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Count Your Blessings</Text>
                <Text style={styles.sectionSubtitle}>
                  What are you grateful for today?
                </Text>
              </View>
            </Animated.View>

            {!isAdding && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAdding(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#d946ef", "#a855f7"]}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
                  <Text style={styles.addButtonText}>Add Gratitude</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isAdding && (
              <Animated.View style={styles.inputCard}>
                {Platform.OS === "web" ? (
                  <View style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder="I am grateful for..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={newEntry}
                      onChangeText={setNewEntry}
                      multiline
                      autoFocus
                    />
                    <View style={styles.inputActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setIsAdding(false);
                          setNewEntry("");
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleAddEntry}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={["#d946ef", "#a855f7"]}
                          style={styles.saveButtonGradient}
                        >
                          <Text style={styles.saveButtonText}>Save</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <BlurView intensity={20} tint="dark" style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder="I am grateful for..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={newEntry}
                      onChangeText={setNewEntry}
                      multiline
                      autoFocus
                    />
                    <View style={styles.inputActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setIsAdding(false);
                          setNewEntry("");
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleAddEntry}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={["#d946ef", "#a855f7"]}
                          style={styles.saveButtonGradient}
                        >
                          <Text style={styles.saveButtonText}>Save</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                )}
              </Animated.View>
            )}

            <View style={styles.entriesContainer}>
              {gratitudeEntries.map((entry, index) => (
                <Animated.View key={entry.id} style={styles.entryCard}>
                  {Platform.OS === "web" ? (
                    <View style={styles.entryCardInner}>
                      <View style={styles.entryHeader}>
                        <Animated.View
                          style={{
                            opacity: sparkleOpacity,
                          }}
                        >
                          <Star
                            color="#ffc0cb"
                            size={20}
                            strokeWidth={2}
                            fill="#ffc0cb"
                            fillOpacity={0.5}
                          />
                        </Animated.View>
                        <Text style={styles.entryTime}>
                          {entry.timestamp.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(entry.id)}
                          style={styles.deleteButton}
                          activeOpacity={0.7}
                        >
                          <Trash2 color="#f87171" size={18} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.entryText}>{entry.text}</Text>
                    </View>
                  ) : (
                    <BlurView intensity={15} tint="dark" style={styles.entryCardInner}>
                      <View style={styles.entryHeader}>
                        <Animated.View
                          style={{
                            opacity: sparkleOpacity,
                          }}
                        >
                          <Star
                            color="#ffc0cb"
                            size={20}
                            strokeWidth={2}
                            fill="#ffc0cb"
                            fillOpacity={0.5}
                          />
                        </Animated.View>
                        <Text style={styles.entryTime}>
                          {entry.timestamp.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(entry.id)}
                          style={styles.deleteButton}
                          activeOpacity={0.7}
                        >
                          <Trash2 color="#f87171" size={18} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.entryText}>{entry.text}</Text>
                    </BlurView>
                  )}
                </Animated.View>
              ))}

              {gratitudeEntries.length === 0 && !isAdding && (
                <View style={styles.emptyState}>
                  <Heart
                    color="#d4c4f0"
                    size={64}
                    strokeWidth={1.5}
                    fill="#d4c4f0"
                    fillOpacity={0.1}
                  />
                  <Text style={styles.emptyStateText}>
                    Start your gratitude journey
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap &ldquo;Add Gratitude&rdquo; to begin
                  </Text>
                </View>
              )}
            </View>

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText}>
                Gratitude transforms ordinary days into blessings
              </Text>
            </Animated.View>
          </ScrollView>
        </View>
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
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#ffc0cb",
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
    borderColor: "rgba(255, 192, 203, 0.2)",
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
    color: "#f0c8d8",
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
    color: "#ffc0cb",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#d4c4f0",
    letterSpacing: 0.3,
  },
  addButton: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#d946ef",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  inputCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.2)",
  },
  inputCardInner: {
    padding: 20,
  },
  input: {
    fontSize: 16,
    color: "#FFFFFF",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  inputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#d4c4f0",
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  entriesContainer: {
    gap: 16,
  },
  entryCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.15)",
  },
  entryCardInner: {
    padding: 20,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  entryTime: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#d4c4f0",
  },
  deleteButton: {
    padding: 4,
  },
  entryText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#f4f0f8",
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#d4c4f0",
    letterSpacing: 0.3,
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#b8a8d8",
    letterSpacing: 0.2,
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
    backgroundColor: "rgba(255, 192, 203, 0.15)",
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
});
