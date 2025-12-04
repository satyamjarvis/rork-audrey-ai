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

const { width } = Dimensions.get("window");

type SoundType = {
  id: string;
  title: string;
  duration: string;
  description: string;
  isPlaying: boolean;
};

export default function SleepMeditationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const musicPulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [sounds, setSounds] = useState<SoundType[]>([
    {
      id: "1",
      title: "Ocean Waves",
      duration: "30 min",
      description: "Gentle waves lapping on shore",
      isPlaying: false,
    },
    {
      id: "2",
      title: "Rain Sounds",
      duration: "45 min",
      description: "Soft rainfall on a quiet night",
      isPlaying: false,
    },
    {
      id: "3",
      title: "Forest Night",
      duration: "60 min",
      description: "Peaceful forest ambience",
      isPlaying: false,
    },
    {
      id: "4",
      title: "Guided Sleep",
      duration: "20 min",
      description: "Calming voice-guided meditation",
      isPlaying: false,
    },
    {
      id: "5",
      title: "White Noise",
      duration: "All night",
      description: "Continuous calming white noise",
      isPlaying: false,
    },
  ]);

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

  const [meditationQuote] = useState(() => {
    const quotes = [
      "Let the sounds guide you to peaceful rest.",
      "In stillness and silence, we find deep peace.",
      "Allow your mind to drift into gentle dreams.",
      "Rest is the foundation of a vibrant tomorrow.",
      "Breathe deeply, release the day, welcome sleep.",
      "May peaceful sounds carry you to restful sleep.",
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

  const handleTogglePlay = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSounds((prev) =>
      prev.map((sound) =>
        sound.id === id
          ? { ...sound, isPlaying: !sound.isPlaying }
          : { ...sound, isPlaying: false }
      )
    );
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
                  <Text style={styles.headerTitle}>Sleep Meditation</Text>
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
          >
            <Animated.View
              style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
              {Platform.OS === "web" ? (
                <View style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Moon color="#b8a8d8" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>Sleep Wisdom</Text>
                    </View>
                    <Text style={styles.quoteText}>{meditationQuote}</Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="dark" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Moon color="#b8a8d8" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>Sleep Wisdom</Text>
                    </View>
                    <Text style={styles.quoteText}>{meditationQuote}</Text>
                  </View>
                </BlurView>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Peaceful Sounds</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose a sound to drift into sleep
                </Text>
              </View>
            </Animated.View>

            <View style={styles.soundsContainer}>
              {sounds.map((sound, index) => (
                <Animated.View key={sound.id} style={styles.soundCard}>
                  {Platform.OS === "web" ? (
                    <View style={styles.soundCardInner}>
                      <View style={styles.soundHeader}>
                        <View style={styles.soundInfo}>
                          <Animated.View
                            style={{
                              opacity: sparkleOpacity,
                            }}
                          >
                            <Volume2
                              color="#b8a8d8"
                              size={20}
                              strokeWidth={2}
                            />
                          </Animated.View>
                          <View style={styles.soundTextContainer}>
                            <Text style={styles.soundTitle}>{sound.title}</Text>
                            <Text style={styles.soundDuration}>{sound.duration}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleTogglePlay(sound.id)}
                          style={styles.playButton}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={sound.isPlaying ? ["#8e24aa", "#6a1b9a"] : ["#5e35b1", "#4527a0"]}
                            style={styles.playButtonGradient}
                          >
                            {sound.isPlaying ? (
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
                            <Volume2
                              color="#b8a8d8"
                              size={20}
                              strokeWidth={2}
                            />
                          </Animated.View>
                          <View style={styles.soundTextContainer}>
                            <Text style={styles.soundTitle}>{sound.title}</Text>
                            <Text style={styles.soundDuration}>{sound.duration}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleTogglePlay(sound.id)}
                          style={styles.playButton}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={sound.isPlaying ? ["#8e24aa", "#6a1b9a"] : ["#5e35b1", "#4527a0"]}
                            style={styles.playButtonGradient}
                          >
                            {sound.isPlaying ? (
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
              ))}

              {sounds.length === 0 && (
                <View style={styles.emptyState}>
                  <Music
                    color="#b8a8d8"
                    size={64}
                    strokeWidth={1.5}
                    fill="#b8a8d8"
                    fillOpacity={0.1}
                  />
                  <Text style={styles.emptyStateText}>
                    No sounds available
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Check back later for calming sounds
                  </Text>
                </View>
              )}
            </View>

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText}>
                Let peaceful sounds guide you to restful sleep
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
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#9a8ac8",
    letterSpacing: 0.2,
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
    position: "absolute" as const,
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
