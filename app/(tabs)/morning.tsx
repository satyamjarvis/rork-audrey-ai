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
  Music,
  Clock,
  Sparkles,
  Coffee,
  Heart,
  Sun,
  Sunrise,
  Zap,
  Star,
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

export default function MorningScreen() {
  const insets = useSafeAreaInsets();
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;
  const raysRotate = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [morningQuote] = useState(() => {
    const quotes = [
      "Rise with the sun, shine with purpose.",
      "Today is a blank canvas—paint it gold.",
      "Every sunrise brings new opportunities.",
      "Awaken your potential, embrace the day.",
      "Morning light brings infinite possibilities.",
      "Radiate positivity, illuminate the world.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  });

  const sunrayPositions = useMemo(() => {
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
        Animated.timing(sunPulse, {
          toValue: 1.12,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(sunPulse, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(raysRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, slideAnim, sunPulse, raysRotate]);

  const features: FeatureCard[] = [
    {
      id: "meditation",
      title: "Morning Meditation",
      description: "Center your mind & breathe",
      icon: Music,
      gradient: ["#FFD700", "#FFA500"] as const,
      route: "/morning-meditation",
    },
    {
      id: "routines",
      title: "Morning Routines",
      description: "Build your perfect ritual",
      icon: Clock,
      gradient: ["#FF8C00", "#FF6347"] as const,
      route: "/morning-routines",
    },
    {
      id: "affirmations",
      title: "Daily Affirmations",
      description: "Speak power into existence",
      icon: Sparkles,
      gradient: ["#FFD700", "#DAA520"] as const,
      route: "/morning-affirmations",
    },
    {
      id: "habits",
      title: "Morning Habits",
      description: "Fuel your transformation",
      icon: Coffee,
      gradient: ["#FFA500", "#FF8C00"] as const,
      route: "/morning-habits",
    },
    {
      id: "wellness",
      title: "Wellness Check",
      description: "Tune into your energy",
      icon: Heart,
      gradient: ["#FFB347", "#FF8C00"] as const,
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
      console.log(`Navigating to ${feature.route}`);
      // Ensure route is treated as a valid path
      router.push(feature.route as any);
    } else {
      console.log(`Opening ${feature.title}`);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 8) return "Rise & Shine";
    if (hour >= 8 && hour < 12) return "Good Morning";
    return "Seize the Day";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const raysRotateInterpolate = raysRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <AppBackgroundWrapper overlayOpacity={0.15}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#FFF8DC", "#FFE4B5", "#FFD700"]}
          style={styles.gradient}
        >
        {sunrayPositions.map((ray, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sunray,
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
                <Animated.View style={{ transform: [{ scale: sunPulse }] }}>
                  <Sun color="#FF8C00" size={48} strokeWidth={2} fill="#FFD700" fillOpacity={0.3} />
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
              <Animated.View style={{ transform: [{ rotate: raysRotateInterpolate }] }}>
                <Sparkles color="#FF8C00" size={32} strokeWidth={1.5} />
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
                      <Sunrise color="#FF8C00" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>
                        Morning Inspiration
                      </Text>
                    </View>
                    <Text style={styles.quoteText}>
                      {morningQuote}
                    </Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="light" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Sunrise color="#FF8C00" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>
                        Morning Inspiration
                      </Text>
                    </View>
                    <Text style={styles.quoteText}>
                      {morningQuote}
                    </Text>
                  </View>
                </BlurView>
              )}

              <Text style={styles.sectionTitle}>
                Awakening Rituals
              </Text>
            </Animated.View>

            <FeatureCards 
              features={features} 
              handleFeaturePress={handleFeaturePress}
              getScaleAnim={getScaleAnim}
            />

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText}>
                Embrace the light. Own your day.
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
  sunray: {
    position: "absolute",
    backgroundColor: "#FFD700",
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
    color: "#8B4513",
    letterSpacing: 0.5,
  },
  headerTime: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#A0522D",
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
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
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
    color: "#D2691E",
  },
  quoteText: {
    fontSize: 18,
    fontWeight: "500" as const,
    lineHeight: 28,
    color: "#654321",
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600" as const,
    marginBottom: 20,
    color: "#8B4513",
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
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  glowRing: {
    position: "absolute" as const,
    width: "90%",
    height: "90%",
    borderRadius: 1000,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
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
  cardIconSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
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
    color: "#A0522D",
    textAlign: "center",
    letterSpacing: 0.5,
    opacity: 0.7,
  },
});
