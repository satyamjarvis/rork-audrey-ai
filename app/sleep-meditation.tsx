import { useRef, useEffect, useState, useMemo, useCallback } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Music,
  Moon,
  Play,
  Pause,
  ArrowLeft,
  Sparkles,
  Volume2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Audio } from "expo-av";
import { useLanguage } from "@/contexts/LanguageContext";

const { width } = Dimensions.get("window");

type SleepSound = {
  id: string;
  title: string;
  duration: string;
  description: string;
  audio?: string;
};

type SleepMeditationPageTranslations = {
  title?: string;
  sleepWisdom?: string;
  peacefulSounds?: string;
  chooseSound?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  footer?: string;
  quotes?: Record<string, string>;
  sounds?: Record<string, Partial<SleepSound>>;
};

const FALLBACK_QUOTES: readonly string[] = [
  "Let the sounds guide you to peaceful rest.",
  "In stillness and silence, we find deep peace.",
  "Allow your mind to drift into gentle dreams.",
  "Rest is the foundation of a vibrant tomorrow.",
  "Breathe deeply, release the day, welcome sleep.",
  "May peaceful sounds carry you to restful sleep.",
];

const FALLBACK_SOUNDS: readonly SleepSound[] = [
  {
    id: "oceanWaves",
    title: "Ocean Waves",
    duration: "5 min",
    description: "Gentle waves lapping on shore",
    audio: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/waves_night_meditation_1",
  },
  {
    id: "rainSounds",
    title: "Rain Sounds",
    duration: "5 min",
    description: "Soft rainfall on a quiet night",
    audio: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/rain_45_min_1",
  },
  {
    id: "forestNight",
    title: "Forest Night",
    duration: "3:10 min",
    description: "Peaceful forest ambience",
    audio: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/forest_night_1",
  },
  {
    id: "guidedSleep",
    title: "Guided Sleep",
    duration: "3:20 min",
    description: "Calming voice-guided meditation",
    audio: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/sleep_meditation_20min_1",
  },
  {
    id: "whiteNoise",
    title: "White Noise",
    duration: "All night",
    description: "Continuous calming white noise",
    audio: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/white_noise_60min_1",
  },
];

const FALLBACK_SOUND_MAP = FALLBACK_SOUNDS.reduce<Record<string, SleepSound>>((acc, sound) => {
  acc[sound.id] = sound;
  return acc;
}, {});

export default function SleepMeditationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { translations } = useLanguage();
  const sleepMeditationPage = (translations.night?.sleepMeditationPage as SleepMeditationPageTranslations | undefined) ?? {};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const musicPulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const meditationQuotes = useMemo(() => {
    const quoteValues = sleepMeditationPage.quotes ? Object.values(sleepMeditationPage.quotes).filter(Boolean) : [];
    return quoteValues.length > 0 ? quoteValues : [...FALLBACK_QUOTES];
  }, [sleepMeditationPage.quotes]);

  const [meditationQuote, setMeditationQuote] = useState<string>(meditationQuotes[0] ?? FALLBACK_QUOTES[0]);

  useEffect(() => {
    if (meditationQuotes.length === 0) {
      return;
    }
    const randomQuote = meditationQuotes[Math.floor(Math.random() * meditationQuotes.length)];
    setMeditationQuote(randomQuote);
  }, [meditationQuotes]);

  const soundOptions = useMemo<SleepSound[]>(() => {
    if (sleepMeditationPage.sounds) {
      const translatedSounds = Object.entries(sleepMeditationPage.sounds).map(([id, value]) => {
        const fallback = FALLBACK_SOUND_MAP[id] ?? {
          id,
          title: id,
          duration: "",
          description: "",
        };
        return {
          id,
          title: value?.title ?? fallback.title,
          duration: value?.duration ?? fallback.duration,
          description: value?.description ?? fallback.description,
        };
      });

      if (translatedSounds.length > 0) {
        return translatedSounds;
      }
    }

    return [...FALLBACK_SOUNDS];
  }, [sleepMeditationPage.sounds]);

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
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().then(() => {
          soundRef.current?.unloadAsync();
        });
      }
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
        Animated.timing(musicPulse, {
          toValue: 1.15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(musicPulse, {
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
  }, [fadeAnim, slideAnim, musicPulse, starsRotate, sparkleOpacity, glitterParticles]);

  const handleTogglePlay = useCallback(async (id: string, audioUrl?: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const isCurrentlyPlaying = activeSoundId === id;

    if (isCurrentlyPlaying) {
      console.log("[SleepMeditation] Pausing sound", { id });
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setActiveSoundId(null);
    } else {
      console.log("[SleepMeditation] Playing sound", { id, audioUrl });
      
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (audioUrl) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true, isLooping: id === "whiteNoise" },
            undefined,
            true
          );
          soundRef.current = sound;
          console.log("[SleepMeditation] Audio loaded and playing", { id, isLooping: id === "whiteNoise" });
        } catch (error) {
          console.error("[SleepMeditation] Error loading audio", error);
        }
      }
      
      setActiveSoundId(id);
    }
  }, [activeSoundId]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const starsRotateInterpolate = starsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const headerTitle = translations.night?.sleepMeditation ?? "Sleep Meditation";
  const quoteLabel = sleepMeditationPage.sleepWisdom ?? "Sleep Wisdom";
  const sectionTitle = sleepMeditationPage.peacefulSounds ?? translations.night?.peacefulRestSounds ?? "Peaceful Sounds";
  const sectionSubtitle = sleepMeditationPage.chooseSound ?? "Choose a sound to drift into sleep";
  const emptyTitle = sleepMeditationPage.emptyTitle ?? "No sounds available";
  const emptySubtitle = sleepMeditationPage.emptySubtitle ?? "Check back later for calming sounds";
  const footerText = sleepMeditationPage.footer ?? "Let peaceful sounds guide you to restful sleep";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          title: headerTitle,
        }}
      />

      <LinearGradient
        colors={["#0a0e27", "#1a1a3e", "#2d1b4e"]}
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
          testID="sleepMeditationBackButton"
        >
          <ArrowLeft color="#b8a8d8" size={28} strokeWidth={2.5} />
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
                <Animated.View style={{ transform: [{ scale: musicPulse }] }}>
                  <Music
                    color="#b8a8d8"
                    size={48}
                    strokeWidth={2}
                    fill="#b8a8d8"
                    fillOpacity={0.3}
                  />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>{headerTitle}</Text>
                  <Text style={styles.headerTime}>{formatTime(currentTime)}</Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                <Sparkles color="#d4c4f0" size={32} strokeWidth={1.5} />
              </Animated.View>
            </View>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            testID="sleepMeditationScrollView"
          >
            <Animated.View
              style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
              {Platform.OS === "web" ? (
                <View style={styles.quoteCard} testID="sleepMeditationQuoteCard">
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Moon color="#b8a8d8" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>{quoteLabel}</Text>
                    </View>
                    <Text style={styles.quoteText}>{meditationQuote}</Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="dark" style={styles.quoteCard} testID="sleepMeditationQuoteCard">
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Moon color="#b8a8d8" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>{quoteLabel}</Text>
                    </View>
                    <Text style={styles.quoteText}>{meditationQuote}</Text>
                  </View>
                </BlurView>
              )}

              <View style={styles.sectionHeader} testID="sleepMeditationSectionHeader">
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                <Text style={styles.sectionSubtitle}>{sectionSubtitle}</Text>
              </View>
            </Animated.View>

            <View style={styles.soundsContainer}>
              {soundOptions.map((sound) => {
                const isPlaying = activeSoundId === sound.id;

                return (
                  <Animated.View key={sound.id} style={styles.soundCard} testID={`sleepMeditationSoundCard-${sound.id}`}>
                    {Platform.OS === "web" ? (
                      <View style={styles.soundCardInner}>
                        <View style={styles.soundHeader}>
                          <View style={styles.soundInfo}>
                            <Animated.View
                              style={{
                                opacity: sparkleOpacity,
                              }}
                            >
                              <Volume2 color="#b8a8d8" size={20} strokeWidth={2} />
                            </Animated.View>
                            <View style={styles.soundTextContainer}>
                              <Text style={styles.soundTitle}>{sound.title}</Text>
                              <Text style={styles.soundDuration}>{sound.duration}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleTogglePlay(sound.id, sound.audio)}
                            style={styles.playButton}
                            activeOpacity={0.7}
                            testID={`sleepMeditationPlayButton-${sound.id}`}
                          >
                            <LinearGradient
                              colors={isPlaying ? ["#8e24aa", "#6a1b9a"] : ["#5e35b1", "#4527a0"]}
                              style={styles.playButtonGradient}
                            >
                              {isPlaying ? (
                                <Pause color="#FFFFFF" size={20} strokeWidth={2.5} />
                              ) : (
                                <Play color="#FFFFFF" size={20} strokeWidth={2.5} />
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.soundDescription}>{sound.description}</Text>
                      </View>
                    ) : (
                      <BlurView intensity={15} tint="dark" style={styles.soundCardInner}>
                        <View style={styles.soundHeader}>
                          <View style={styles.soundInfo}>
                            <Animated.View
                              style={{
                                opacity: sparkleOpacity,
                              }}
                            >
                              <Volume2 color="#b8a8d8" size={20} strokeWidth={2} />
                            </Animated.View>
                            <View style={styles.soundTextContainer}>
                              <Text style={styles.soundTitle}>{sound.title}</Text>
                              <Text style={styles.soundDuration}>{sound.duration}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleTogglePlay(sound.id, sound.audio)}
                            style={styles.playButton}
                            activeOpacity={0.7}
                            testID={`sleepMeditationPlayButton-${sound.id}`}
                          >
                            <LinearGradient
                              colors={isPlaying ? ["#8e24aa", "#6a1b9a"] : ["#5e35b1", "#4527a0"]}
                              style={styles.playButtonGradient}
                            >
                              {isPlaying ? (
                                <Pause color="#FFFFFF" size={20} strokeWidth={2.5} />
                              ) : (
                                <Play color="#FFFFFF" size={20} strokeWidth={2.5} />
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.soundDescription}>{sound.description}</Text>
                      </BlurView>
                    )}
                  </Animated.View>
                );
              })}

              {soundOptions.length === 0 && (
                <View style={styles.emptyState} testID="sleepMeditationEmptyState">
                  <Music
                    color="#b8a8d8"
                    size={64}
                    strokeWidth={1.5}
                    fill="#b8a8d8"
                    fillOpacity={0.1}
                  />
                  <Text style={styles.emptyStateText}>{emptyTitle}</Text>
                  <Text style={styles.emptyStateSubtext}>{emptySubtitle}</Text>
                </View>
              )}
            </View>

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText} testID="sleepMeditationFooterText">
                {footerText}
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
    color: "#b8a8d8",
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
    borderColor: "rgba(184, 168, 216, 0.2)",
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
    color: "#c8d8f0",
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
    color: "#b8a8d8",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#d4c4f0",
    letterSpacing: 0.3,
  },
  soundsContainer: {
    gap: 16,
  },
  soundCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(184, 168, 216, 0.15)",
  },
  soundCardInner: {
    padding: 20,
  },
  soundHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  soundInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  soundTextContainer: {
    flex: 1,
  },
  soundTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#f4f0f8",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  soundDuration: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#d4c4f0",
  },
  playButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  playButtonGradient: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  soundDescription: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#b8a8d8",
    lineHeight: 20,
    letterSpacing: 0.2,
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
    color: "#b8a8d8",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#9a8ac8",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#9a8ac8",
    textAlign: "center",
    letterSpacing: 0.5,
    opacity: 0.7,
    fontStyle: "italic" as const,
  },
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(184, 168, 216, 0.15)",
  },
  glitterDot: {
    position: "absolute",
    backgroundColor: "#C0C0C0",
    borderRadius: 50,
    shadowColor: "#C0C0C0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
});
