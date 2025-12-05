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
  Sun,
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

import { useAffirmations } from "@/contexts/AffirmationsContext";

import { useTranslation } from "@/contexts/LanguageContext";

const { width } = Dimensions.get("window");

type AffirmationEntry = {
  id: string;
  text: string;
  timestamp: Date;
};

export default function MorningAffirmationsScreen() {
  const router = useRouter();
  const { translations } = useTranslation();
  const t = translations.morning.affirmationsPage;
  const common = translations.common;
  
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;
  const sparklesRotate = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const { dailyAffirmation, refreshDailyAffirmation } = useAffirmations();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [affirmationEntries, setAffirmationEntries] = useState<AffirmationEntry[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const lightRays = useMemo(() => {
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

  const [quoteKey] = useState(() => {
    const keys = ["1", "2", "3", "4", "5", "6"] as const;
    return keys[Math.floor(Math.random() * keys.length)];
  });
  
  const affirmationQuote = t.quotes[quoteKey as keyof typeof t.quotes];

  const sunRayPositions = useMemo(() => {
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
        Animated.timing(sunPulse, {
          toValue: 1.15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(sunPulse, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(sparklesRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    lightRays.forEach((particle) => {
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
  }, [fadeAnim, slideAnim, sunPulse, sparklesRotate, glowOpacity, lightRays]);

  const handleAddEntry = () => {
    if (newEntry.trim()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const entry: AffirmationEntry = {
        id: Date.now().toString(),
        text: newEntry.trim(),
        timestamp: new Date(),
      };

      setAffirmationEntries([entry, ...affirmationEntries]);
      setNewEntry("");
      setIsAdding(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setAffirmationEntries(affirmationEntries.filter((entry) => entry.id !== id));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const sparklesRotateInterpolate = sparklesRotate.interpolate({
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
        colors={["#FFF5E6", "#FFE8CC", "#FFD89B"]}
        style={styles.gradient}
      >
        {sunRayPositions.map((ray, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sunRay,
              {
                left: ray.left,
                top: ray.top,
                width: ray.size,
                height: ray.size,
                opacity: ray.opacity,
              },
            ]}
          />
        ))}

        {lightRays.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.lightParticle,
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
          <ArrowLeft color="#FF8C42" size={28} strokeWidth={2.5} />
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
                <Animated.View style={{ transform: [{ scale: sunPulse }] }}>
                  <Sun
                    color="#FF8C42"
                    size={48}
                    strokeWidth={2}
                    fill="#FFD89B"
                    fillOpacity={0.5}
                  />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>{t.title}</Text>
                  <Text style={styles.headerTime}>{formatTime(currentTime)}</Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: sparklesRotateInterpolate }] }}>
                <Sparkles color="#FFA500" size={32} strokeWidth={1.5} />
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
                      <Sparkles color="#FF8C42" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>{t.todaysInspiration}</Text>
                    </View>
                    <Text style={styles.quoteText}>{affirmationQuote}</Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={15} tint="light" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Sparkles color="#FF8C42" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>{t.todaysInspiration}</Text>
                    </View>
                    <Text style={styles.quoteText}>{affirmationQuote}</Text>
                  </View>
                </BlurView>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.empowerYourDay}</Text>
                <Text style={styles.sectionSubtitle}>
                  {t.whatAffirmations}
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
                  colors={["#FF8C42", "#FFA500"]}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
                  <Text style={styles.addButtonText}>{t.addAffirmation}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isAdding && (
              <Animated.View style={styles.inputCard}>
                {Platform.OS === "web" ? (
                  <View style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder={t.inputPlaceholder}
                      placeholderTextColor="rgba(102, 81, 45, 0.5)"
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
                        <Text style={styles.cancelButtonText}>{common.cancel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleAddEntry}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={["#FF8C42", "#FFA500"]}
                          style={styles.saveButtonGradient}
                        >
                          <Text style={styles.saveButtonText}>{common.save}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <BlurView intensity={15} tint="light" style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder={t.inputPlaceholder}
                      placeholderTextColor="rgba(102, 81, 45, 0.5)"
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
                        <Text style={styles.cancelButtonText}>{common.cancel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleAddEntry}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={["#FF8C42", "#FFA500"]}
                          style={styles.saveButtonGradient}
                        >
                          <Text style={styles.saveButtonText}>{common.save}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                )}
              </Animated.View>
            )}

            <View style={styles.entriesContainer}>
              {affirmationEntries.map((entry) => (
                <Animated.View key={entry.id} style={styles.entryCard}>
                  {Platform.OS === "web" ? (
                    <View style={styles.entryCardInner}>
                      <View style={styles.entryHeader}>
                        <Animated.View
                          style={{
                            opacity: glowOpacity,
                          }}
                        >
                          <Star
                            color="#FFA500"
                            size={20}
                            strokeWidth={2}
                            fill="#FFA500"
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
                    <BlurView intensity={10} tint="light" style={styles.entryCardInner}>
                      <View style={styles.entryHeader}>
                        <Animated.View
                          style={{
                            opacity: glowOpacity,
                          }}
                        >
                          <Star
                            color="#FFA500"
                            size={20}
                            strokeWidth={2}
                            fill="#FFA500"
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

              {affirmationEntries.length === 0 && !isAdding && (
                <View style={styles.emptyState}>
                  <Sun
                    color="#FFB76B"
                    size={64}
                    strokeWidth={1.5}
                    fill="#FFD89B"
                    fillOpacity={0.3}
                  />
                  <Text style={styles.emptyStateText}>
                    {t.startJourney}
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    {t.tapToAdd}
                  </Text>
                </View>
              )}
            </View>

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText}>
                {t.footer}
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
  sunRay: {
    position: "absolute" as const,
    backgroundColor: "#FFA500",
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
    color: "#FF8C42",
    letterSpacing: 0.5,
  },
  headerTime: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#CC6600",
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
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.3)",
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
    color: "#CC6600",
  },
  quoteText: {
    fontSize: 18,
    fontWeight: "500" as const,
    lineHeight: 28,
    color: "#66512D",
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600" as const,
    marginBottom: 8,
    color: "#FF8C42",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#CC6600",
    letterSpacing: 0.3,
  },
  addButton: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#FF8C42",
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
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.3)",
  },
  inputCardInner: {
    padding: 20,
  },
  input: {
    fontSize: 16,
    color: "#66512D",
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
    color: "#CC6600",
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
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.2)",
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
    color: "#CC6600",
  },
  deleteButton: {
    padding: 4,
  },
  entryText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#66512D",
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
    color: "#CC6600",
    letterSpacing: 0.3,
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#D4A574",
    letterSpacing: 0.2,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#D4A574",
    textAlign: "center",
    letterSpacing: 0.5,
    opacity: 0.8,
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
    backgroundColor: "rgba(255, 140, 66, 0.2)",
  },
  lightParticle: {
    position: "absolute" as const,
    backgroundColor: "#FFD700",
    borderRadius: 50,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
});
