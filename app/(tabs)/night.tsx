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
  BookOpen,
  Moon,
  Music,
  Cloud,
  Stars,
  Smile,
  Sunset,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AppBackgroundWrapper from "@/components/AppBackgroundWrapper";

const { width } = Dimensions.get("window");

type FeatureCard = {
  id: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  gradient: readonly [string, string];
  route?: string;
};

export default function NightScreen() {
  const insets = useSafeAreaInsets();
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const moonPulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [eveningQuote] = useState(() => {
    const quotes = [
      "As the stars begin to shine, let your soul find peace.",
      "The night whispers secrets of rest and renewal.",
      "In stillness, we find the magic of tomorrow.",
      "Let today's journey settle like moonlight on calm waters.",
      "Dreams are the poetry written by a peaceful heart.",
      "The moon reminds us: even darkness has its glow.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  const starPositions = useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      left: Math.random() * width,
      top: Math.random() * 300,
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
        Animated.timing(moonPulse, {
          toValue: 1.12,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(moonPulse, {
          toValue: 1,
          duration: 3000,
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
  }, [fadeAnim, slideAnim, moonPulse, starsRotate]);

  const features: FeatureCard[] = [
    {
      id: "journal",
      title: "Moments of Gratitude",
      description: "Capture your thoughts",
      icon: BookOpen,
      gradient: ["#4a148c", "#6a1b9a"] as const,
      route: "/gratitude-moments",
    },
    {
      id: "mood",
      title: "How I'm Feeling",
      description: "Check in with your emotions",
      icon: Smile,
      gradient: ["#283593", "#3949ab"] as const,
      route: "/how-am-i-feeling",
    },
    {
      id: "dreamlog",
      title: "Dream Journal",
      description: "Capture your dreams",
      icon: Cloud,
      gradient: ["#4527a0", "#5e35b1"] as const,
      route: "/dream-journal",
    },
    {
      id: "meditation",
      title: "Sleep Meditation",
      description: "Peaceful rest sounds",
      icon: Music,
      gradient: ["#6a1b9a", "#8e24aa"] as const,
      route: "/sleep-meditation",
    },
    {
      id: "tomorrow",
      title: "Tomorrow's Intentions",
      description: "Set goals for tomorrow",
      icon: Sunset,
      gradient: ["#ad1457", "#c2185b"] as const,
      route: "/tomorrows-intentions",
    },
    {
      id: "wellness",
      title: "Wellness Check",
      description: "Daily health assessment",
      icon: Moon,
      gradient: ["#1a237e", "#283593"] as const,
      route: "/wellness-check",
    },
  ];

  const getScaleAnim = (id: string) => {
    if (!scaleAnims[id]) {
      scaleAnims[id] = new Animated.Value(1);
    }
    return scaleAnims[id];
  };

  const handleFeaturePress = (feature: FeatureCard) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const scaleAnim = getScaleAnim(feature.id);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (feature.route) {
      router.push(feature.route as any);
    } else {
      console.log(`Opening ${feature.title}`);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 18 && hour < 21) return "Good Evening";
    if (hour >= 21 || hour < 3) return "Good Night";
    return "Rest Well";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const starsRotateInterpolate = starsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });



  return (
    <AppBackgroundWrapper overlayOpacity={0.2}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#0f0c29", "#1a1a2e", "#302b63"]}
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

        <View style={styles.safeArea}>
          <Animated.View 
            style={[
              styles.header, 
              { 
                paddingTop: insets.top + 20,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Animated.View style={{ transform: [{ scale: moonPulse }] }}>
                  <Moon color="#f4e4c1" size={48} strokeWidth={2} fill="#f4e4c1" fillOpacity={0.2} />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>
                    {getGreeting()}
                  </Text>
                  <Text style={styles.headerTime}>
                    {formatTime(currentTime)}
                  </Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                <Stars color="#b8a8d8" size={32} strokeWidth={1.5} />
              </Animated.View>
            </View>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {Platform.OS === "web" ? (
                <View style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Moon color="#f4e4c1" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>
                        Tonight&apos;s Reflection
                      </Text>
                    </View>
                    <Text style={styles.quoteText}>
                      {eveningQuote}
                    </Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="dark" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Moon color="#f4e4c1" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>
                        Tonight&apos;s Reflection
                      </Text>
                    </View>
                    <Text style={styles.quoteText}>
                      {eveningQuote}
                    </Text>
                  </View>
                </BlurView>
              )}

              <Text style={styles.sectionTitle}>
                Evening Rituals
              </Text>
            </Animated.View>

            <FeatureCards 
              features={features} 
              handleFeaturePress={handleFeaturePress}
              getScaleAnim={getScaleAnim}
            />

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText}>
                Take your time. There&apos;s no rush.
              </Text>
            </Animated.View>
          </ScrollView>
          </View>
        </LinearGradient>
      </View>
    </AppBackgroundWrapper>
  );
}

type FeatureCardsProps = {
  features: FeatureCard[];
  handleFeaturePress: (feature: FeatureCard) => void;
  getScaleAnim: (id: string) => Animated.Value;
};

function FeatureCards({ features, handleFeaturePress, getScaleAnim }: FeatureCardsProps) {
  const cardAnims = useMemo(() => {
    return features.map(() => ({
      fadeAnim: new Animated.Value(0),
      slideAnim: new Animated.Value(30),
    }));
  }, [features]);

  const glitterParticles = useMemo(() => {
    return features.map(() => {
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
    });
  }, [features]);

  useEffect(() => {
    const animations = cardAnims.map((anims, index) => {
      const delay = index * 100;
      return Animated.parallel([
        Animated.timing(anims.fadeAnim, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(anims.slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          delay,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();

    glitterParticles.forEach((particles) => {
      particles.forEach((particle) => {
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
    });
  }, [cardAnims, glitterParticles]);

  return (
    <View style={styles.featuresGrid}>
      {features.map((feature, index) => {
        const Icon = feature.icon;
        const scaleAnim = getScaleAnim(feature.id);
        const { fadeAnim: cardFadeAnim, slideAnim: cardSlideAnim } = cardAnims[index];
        const particles = glitterParticles[index];

        return (
          <Animated.View
            key={feature.id}
            style={[
              styles.featureCardWrapper,
              { 
                transform: [{ scale: scaleAnim }, { translateY: cardSlideAnim }],
                opacity: cardFadeAnim,
              },
            ]}
          >
            <View style={styles.glitterOuterContainer}>
              {particles.map((particle, pIndex) => (
                <Animated.View
                  key={pIndex}
                  style={[
                    styles.glitterDot,
                    {
                      width: particle.size,
                      height: particle.size,
                      left: particle.x + width / 2,
                      top: particle.y + 100,
                      opacity: particle.opacity,
                      transform: [
                        { scale: particle.scale },
                        { translateY: particle.translateY },
                      ],
                    },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[...feature.gradient, feature.gradient[0]]}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.glowRing} />

                <View style={styles.cardIconSection}>
                  <View style={styles.iconWrapper}>
                    <Icon color="#FFFFFF" size={32} strokeWidth={2.5} />
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <Text style={styles.cardDescription}>
                    {feature.description}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
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
    color: "#f4e4c1",
    letterSpacing: 0.5,
  },
  headerTime: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#b8a8d8",
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
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    color: "#d4c4a8",
  },
  quoteText: {
    fontSize: 18,
    fontWeight: "500" as const,
    lineHeight: 28,
    color: "#f4f0e8",
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600" as const,
    marginBottom: 20,
    color: "#f4e4c1",
    letterSpacing: 0.5,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 4,
  },
  featureCardWrapper: {
    width: "48%",
    aspectRatio: 1,
    marginBottom: 12,
    position: "relative" as const,
  },
  glitterOuterContainer: {
    position: "absolute" as const,
    width: width,
    height: 800,
    zIndex: 0,
    left: -width / 2,
    top: -300,
    pointerEvents: "none" as const,
  },
  featureCard: {
    flex: 1,
    borderRadius: 1000,
    overflow: "visible",
    zIndex: 10,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 1000,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  glowRing: {
    position: "absolute" as const,
    width: "90%",
    height: "90%",
    borderRadius: 1000,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
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
  cardIconSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  cardContent: {
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
    letterSpacing: 0.2,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardDescription: {
    fontSize: 10,
    fontWeight: "500" as const,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 14,
    textAlign: "center" as const,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#9a8ac8",
    textAlign: "center",
    letterSpacing: 0.5,
    opacity: 0.7,
  },
});
