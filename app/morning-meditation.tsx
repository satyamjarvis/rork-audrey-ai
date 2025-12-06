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
} from "react-native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Sparkles,
  Sun,
  Wind,
  Heart,
  ArrowLeft,
  Play,
  Clock,
  CheckCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useMeditation, MeditationType } from "@/contexts/MeditationContext";
import { useLanguage } from "@/contexts/LanguageContext";

const { width } = Dimensions.get("window");

const meditationTypeIcons: Record<MeditationType, any> = {
  breathing: Wind,
  "body-scan": Sun,
  visualization: Sparkles,
  mindfulness: Heart,
  "loving-kindness": Heart,
};

const meditationTypeColors: Record<MeditationType, [string, string]> = {
  breathing: ["#fb923c", "#f59e0b"],
  "body-scan": ["#fbbf24", "#fb923c"],
  visualization: ["#f59e0b", "#d97706"],
  mindfulness: ["#fb923c", "#ea580c"],
  "loving-kindness": ["#fbbf24", "#f59e0b"],
};

export default function MorningMeditationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { translate } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const { meditations, completedToday, totalMinutesToday, toggleFavorite, completeMeditation } = useMeditation();
  const [selectedFilter, setSelectedFilter] = useState<MeditationType | "all">("all");
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingMeditationId, setPlayingMeditationId] = useState<string | null>(null);

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

  const meditationQuote = useMemo(() => {
    const quoteIndex = Math.floor(Math.random() * 6) + 1;
    const key = `morning.meditationPage.quotes.${quoteIndex}`;
    const translated = translate(key);
    // Fallback if translation returns key (though we just added them)
    if (translated === key) {
        const fallbacks = [
            "Begin each day with a grateful heart and peaceful mind.",
            "Breathe in calm, breathe out stress.",
            "Your morning sets the tone for your entire day.",
            "Find peace within, and radiate light outward.",
            "Each breath is a new beginning.",
            "Awaken your spirit with mindful presence.",
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
    return translated;
  }, [translate]);

  const filteredMeditations = useMemo(() => {
    if (selectedFilter === "all") return meditations;
    return meditations.filter((med) => med.type === selectedFilter);
  }, [meditations, selectedFilter]);

  const handleStartMeditation = async (meditationId: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    const meditation = meditations.find((med) => med.id === meditationId);
    
    if (meditation?.audioUrl) {
      try {
        if (sound) {
          await sound.unloadAsync();
          setSound(null);
          setPlayingMeditationId(null);
        }
        
        console.log("Loading audio from:", meditation.audioUrl);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: meditation.audioUrl },
          { shouldPlay: true }
        );
        
        setSound(newSound);
        setPlayingMeditationId(meditationId);
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            completeMeditation(meditationId);
            setPlayingMeditationId(null);
            newSound.unloadAsync();
            setSound(null);
          }
        });
        
        console.log("Audio playback started for:", meditation.title);
      } catch (error) {
        console.error("Error playing audio:", error);
        completeMeditation(meditationId);
      }
    } else {
      completeMeditation(meditationId);
    }
  };

  const handleToggleFavorite = (meditationId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleFavorite(meditationId);
  };

  const starPositions = useMemo(() => {
    return Array.from({ length: 25 }, () => ({
      left: Math.random() * width,
      top: Math.random() * 350,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.4 + 0.3,
    }));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timer);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

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
          Animated.delay(particle.delay),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.6 + 0.4,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: Math.random() * 200 - 100,
              duration: particle.duration,
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
  }, [fadeAnim, slideAnim, sunPulse, starsRotate, sparkleOpacity, glitterParticles]);

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
        colors={["#fef3c7", "#fde68a", "#fbbf24"]}
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
          <ArrowLeft color="#f59e0b" size={28} strokeWidth={2.5} />
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
                    color="#f59e0b"
                    size={48}
                    strokeWidth={2}
                    fill="#f59e0b"
                    fillOpacity={0.3}
                  />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>{translate('morning.meditationPage.title')}</Text>
                  <Text style={styles.headerTime}>{formatTime(currentTime)}</Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                <Sparkles color="#fb923c" size={32} strokeWidth={1.5} />
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
                      <Sparkles color="#f59e0b" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>{translate('morning.meditationPage.todaysReminder')}</Text>
                    </View>
                    <Text style={styles.quoteText}>{meditationQuote}</Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="light" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Sparkles color="#f59e0b" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>{translate('morning.meditationPage.todaysReminder')}</Text>
                    </View>
                    <Text style={styles.quoteText}>{meditationQuote}</Text>
                  </View>
                </BlurView>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{totalMinutesToday}</Text>
                  <Text style={styles.statLabel}>{translate('morning.meditationPage.minutesToday')}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{completedToday.length}</Text>
                  <Text style={styles.statLabel}>{translate('morning.meditationPage.sessions')}</Text>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{translate('morning.meditationPage.guidedMeditations')}</Text>
                <Text style={styles.sectionSubtitle}>
                  {translate('morning.meditationPage.chooseMeditation')}
                </Text>
              </View>
            </Animated.View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScrollView}
              contentContainerStyle={styles.filterContainer}
            >
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === "all" && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter("all")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === "all" && styles.filterButtonTextActive,
                  ]}
                >
                  {translate('morning.meditationPage.filters.all')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === "breathing" && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter("breathing")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === "breathing" && styles.filterButtonTextActive,
                  ]}
                >
                  {translate('morning.meditationPage.filters.breathing')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === "body-scan" && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter("body-scan")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === "body-scan" && styles.filterButtonTextActive,
                  ]}
                >
                  {translate('morning.meditationPage.filters.bodyScan')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === "visualization" && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter("visualization")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === "visualization" && styles.filterButtonTextActive,
                  ]}
                >
                  {translate('morning.meditationPage.filters.visualization')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === "mindfulness" && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter("mindfulness")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === "mindfulness" && styles.filterButtonTextActive,
                  ]}
                >
                  {translate('morning.meditationPage.filters.mindfulness')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === "loving-kindness" && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter("loving-kindness")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === "loving-kindness" && styles.filterButtonTextActive,
                  ]}
                >
                  {translate('morning.meditationPage.filters.lovingKindness')}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.meditationsContainer}>
              {filteredMeditations.map((meditation) => {
                const IconComponent = meditationTypeIcons[meditation.type];
                const isCompleted = completedToday.includes(meditation.id);
                const isPlaying = playingMeditationId === meditation.id;
                
                // Dynamic translation for meditation content
                const titleKey = `morning.meditations.${meditation.id}.title`;
                const descriptionKey = `morning.meditations.${meditation.id}.description`;
                const title = translate(titleKey) !== titleKey ? translate(titleKey) : meditation.title;
                const description = translate(descriptionKey) !== descriptionKey ? translate(descriptionKey) : meditation.description;

                return (
                  <Animated.View key={meditation.id} style={styles.meditationCard}>
                    {Platform.OS === "web" ? (
                      <View style={styles.meditationCardInner}>
                        <View style={styles.meditationHeader}>
                          <View style={styles.meditationIconContainer}>
                            <IconComponent
                              color="#f59e0b"
                              size={24}
                              strokeWidth={2}
                            />
                          </View>
                          <TouchableOpacity
                            onPress={() => handleToggleFavorite(meditation.id)}
                            activeOpacity={0.7}
                            style={styles.favoriteButton}
                          >
                            <Heart
                              color="#f59e0b"
                              size={20}
                              strokeWidth={2}
                              fill={meditation.isFavorite ? "#f59e0b" : "transparent"}
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.meditationTitle}>{title}</Text>
                        <Text style={styles.meditationDescription}>
                          {description}
                        </Text>
                        <View style={styles.meditationFooter}>
                          <View style={styles.meditationDuration}>
                            <Clock color="#fb923c" size={16} strokeWidth={2} />
                            <Text style={styles.meditationDurationText}>
                              {meditation.duration} min
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => handleStartMeditation(meditation.id)}
                            activeOpacity={0.7}
                            disabled={isCompleted && !isPlaying}
                          >
                            <LinearGradient
                              colors={meditationTypeColors[meditation.type]}
                              style={styles.startButtonGradient}
                            >
                              {isCompleted ? (
                                <CheckCircle color="#FFFFFF" size={18} strokeWidth={2.5} />
                              ) : isPlaying ? (
                                <Play color="#FFFFFF" size={18} strokeWidth={2.5} />
                              ) : (
                                <Play color="#FFFFFF" size={18} strokeWidth={2.5} />
                              )}
                              <Text style={styles.startButtonText}>
                                {isCompleted ? translate('morning.meditationPage.actions.completed') : isPlaying ? translate('morning.meditationPage.actions.playing') : translate('morning.meditationPage.actions.start')}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <BlurView intensity={15} tint="light" style={styles.meditationCardInner}>
                        <View style={styles.meditationHeader}>
                          <View style={styles.meditationIconContainer}>
                            <IconComponent
                              color="#f59e0b"
                              size={24}
                              strokeWidth={2}
                            />
                          </View>
                          <TouchableOpacity
                            onPress={() => handleToggleFavorite(meditation.id)}
                            activeOpacity={0.7}
                            style={styles.favoriteButton}
                          >
                            <Heart
                              color="#f59e0b"
                              size={20}
                              strokeWidth={2}
                              fill={meditation.isFavorite ? "#f59e0b" : "transparent"}
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.meditationTitle}>{title}</Text>
                        <Text style={styles.meditationDescription}>
                          {description}
                        </Text>
                        <View style={styles.meditationFooter}>
                          <View style={styles.meditationDuration}>
                            <Clock color="#fb923c" size={16} strokeWidth={2} />
                            <Text style={styles.meditationDurationText}>
                              {meditation.duration} min
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => handleStartMeditation(meditation.id)}
                            activeOpacity={0.7}
                            disabled={isCompleted && !isPlaying}
                          >
                            <LinearGradient
                              colors={meditationTypeColors[meditation.type]}
                              style={styles.startButtonGradient}
                            >
                              {isCompleted ? (
                                <CheckCircle color="#FFFFFF" size={18} strokeWidth={2.5} />
                              ) : isPlaying ? (
                                <Play color="#FFFFFF" size={18} strokeWidth={2.5} />
                              ) : (
                                <Play color="#FFFFFF" size={18} strokeWidth={2.5} />
                              )}
                              <Text style={styles.startButtonText}>
                                {isCompleted ? translate('morning.meditationPage.actions.completed') : isPlaying ? translate('morning.meditationPage.actions.playing') : translate('morning.meditationPage.actions.start')}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </BlurView>
                    )}
                  </Animated.View>
                );
              })}

              {filteredMeditations.length === 0 && (
                <View style={styles.emptyState}>
                  <Sun
                    color="#fb923c"
                    size={64}
                    strokeWidth={1.5}
                    fill="#fb923c"
                    fillOpacity={0.1}
                  />
                  <Text style={styles.emptyStateText}>
                    {translate('morning.meditationPage.noMeditationsFound')}
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    {translate('morning.meditationPage.tryDifferentFilter')}
                  </Text>
                </View>
              )}
            </View>

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText}>
                {translate('morning.meditationPage.footer')}
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
    backgroundColor: "#fbbf24",
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
    color: "#f59e0b",
    letterSpacing: 0.5,
  },
  headerTime: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#fb923c",
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
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
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
    color: "#d97706",
  },
  quoteText: {
    fontSize: 18,
    fontWeight: "500" as const,
    lineHeight: 28,
    color: "#78350f",
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600" as const,
    marginBottom: 8,
    color: "#f59e0b",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#fb923c",
    letterSpacing: 0.3,
  },
  addButton: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#f59e0b",
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
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#f59e0b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#fb923c",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  filterScrollView: {
    marginBottom: 24,
    maxHeight: 50,
  },
  filterContainer: {
    gap: 8,
    paddingRight: 24,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  filterButtonActive: {
    backgroundColor: "#f59e0b",
    borderColor: "#f59e0b",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fb923c",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  meditationsContainer: {
    gap: 16,
  },
  meditationCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  meditationCardInner: {
    padding: 20,
  },
  meditationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  meditationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButton: {
    padding: 8,
  },
  meditationTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#78350f",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  meditationDescription: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#92400e",
    lineHeight: 22,
    marginBottom: 16,
  },
  meditationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  meditationDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
  },
  meditationDurationText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fb923c",
  },
  startButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#FFFFFF",
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
    color: "#fb923c",
    letterSpacing: 0.3,
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#fbbf24",
    letterSpacing: 0.2,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#fb923c",
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
    backgroundColor: "rgba(245, 158, 11, 0.25)",
  },
  glitterDot: {
    position: "absolute" as const,
    backgroundColor: "#FFD700",
    borderRadius: 50,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
});
