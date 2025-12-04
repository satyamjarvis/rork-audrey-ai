import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  CheckSquare,
  ChevronLeft,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  BookText,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import colors from "@/constants/colors";
import { useCalendar } from "@/contexts/CalendarContext";

type PlannerView = "yearly" | "monthly" | "weekly" | "daily" | null;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: Animated.Value;
  translateX: Animated.Value;
  translateY: Animated.Value;
}

interface Comet {
  id: number;
  x: number;
  y: number;
  speed: number;
  angle: number;
  translateX: Animated.Value;
  translateY: Animated.Value;
  opacity: Animated.Value;
}

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const { calendars, selectedCalendar } = useCalendar();
  const [selectedPlannerView, setSelectedPlannerView] = useState<PlannerView>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [comets, setComets] = useState<Comet[]>([]);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    const newStars: Star[] = [];
    for (let i = 0; i < 400; i++) {
      newStars.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT,
        size: Math.random() * 3 + 0.5,
        speed: Math.random() * 2 + 0.3,
        opacity: new Animated.Value(Math.random() * 0.9 + 0.3),
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
      });
    }
    setStars(newStars);

    const newComets: Comet[] = [];
    for (let i = 0; i < 8; i++) {
      newComets.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: -50,
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 60 - 30,
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(0),
      });
    }
    setComets(newComets);
  }, []);

  useEffect(() => {
    if (stars.length === 0) return;

    const starAnimations = stars.map((star) => {
      const twinkle = Animated.loop(
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.3 + 0.1,
            duration: Math.random() * 1500 + 1000,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.8 + 0.5,
            duration: Math.random() * 1500 + 1000,
            useNativeDriver: true,
          }),
        ])
      );

      const move = Animated.loop(
        Animated.parallel([
          Animated.timing(star.translateX, {
            toValue: star.speed * 100,
            duration: 15000 / star.speed,
            useNativeDriver: true,
          }),
          Animated.timing(star.translateY, {
            toValue: star.speed * 50,
            duration: 15000 / star.speed,
            useNativeDriver: true,
          }),
        ])
      );

      twinkle.start();
      move.start();

      return Animated.parallel([twinkle, move]);
    });

    animationsRef.current = starAnimations;

    return () => {
      starAnimations.forEach((anim) => anim.stop());
    };
  }, [stars]);

  useEffect(() => {
    if (comets.length === 0) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    comets.forEach((comet, index) => {
      const shootComet = () => {
        comet.translateX.setValue(0);
        comet.translateY.setValue(0);
        comet.opacity.setValue(0);

        const startX = Math.random() * SCREEN_WIDTH * 0.3;
        const endX = SCREEN_WIDTH + 100;
        const startY = Math.random() * SCREEN_HEIGHT * 0.4;
        const endY = SCREEN_HEIGHT + 100;

        Animated.sequence([
          Animated.delay(index * 2000 + Math.random() * 5000),
          Animated.parallel([
            Animated.timing(comet.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(comet.translateX, {
              toValue: endX - startX,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(comet.translateY, {
              toValue: endY - startY,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(comet.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          const timeout = setTimeout(shootComet, Math.random() * 8000 + 3000);
          timeouts.push(timeout);
        });
      };

      shootComet();
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [comets]);

  const selectPlannerView = (view: PlannerView) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (view === "yearly") {
      router.push("/yearly-planner");
      return;
    }
    
    if (view === "monthly") {
      router.push("/monthly-planner");
      return;
    }
    
    if (view === "weekly") {
      router.push("/weekly-planner");
      return;
    }
    
    if (view === "daily") {
      router.push("/daily-planner");
      return;
    }
    
    setSelectedPlannerView(view);
    console.log(`Opening ${view} planner view`);
  };

  const openCalendarManager = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/calendar-manager");
  };

  const handleBackPress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#E0B0FF", "#C8A2FF", "#B49AFF", "#9B8FFF", "#8B8BFF", "#7A9BFF", "#6AABFF"]}
        locations={[0, 0.15, 0.3, 0.45, 0.6, 0.8, 1]}
        style={styles.gradient}
      >
        {stars.map((star) => (
          <Animated.View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
                transform: [
                  { translateX: star.translateX },
                  { translateY: star.translateY },
                ],
              },
            ]}
          />
        ))}
        {comets.map((comet) => (
          <Animated.View
            key={comet.id}
            style={[
              styles.cometContainer,
              {
                left: comet.x,
                top: comet.y,
                opacity: comet.opacity,
                transform: [
                  { translateX: comet.translateX },
                  { translateY: comet.translateY },
                  { rotate: "45deg" },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#FFFFFF", "#FFE66D", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.comet}
            />
          </Animated.View>
        ))}
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={["#00F5FF", "#0080FF"]}
              style={styles.backButtonGradient}
            >
              <ChevronLeft color="#000000" size={24} strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <LinearGradient
              colors={["#00F5FF", "#00FF87"]}
              style={styles.iconGlow}
            >
              <Sparkles color="#000000" size={28} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={styles.headerTitle}>PLANNER</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {!selectedPlannerView ? (
            <View style={styles.plannerOptionsGrid}>
              <View style={styles.calendarSelectorCard}>
                <LinearGradient
                  colors={["#FFD6E8", "#FFE0F0", "#FFF0F8"]}
                  style={styles.calendarCardGradient}
                >
                  <View style={styles.neonBorder} />
                  <View style={styles.calendarSelectorHeader}>
                    <View style={styles.titleRow}>
                      <Zap color="#00F5FF" size={16} strokeWidth={2.5} />
                      <Text style={styles.calendarSelectorTitle}>ACTIVE CALENDAR</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.manageCalendarsButton}
                      onPress={openCalendarManager}
                    >
                      <LinearGradient
                        colors={["#00F5FF", "#0080FF"]}
                        style={styles.manageButtonGradient}
                      >
                        <Text style={styles.manageCalendarsText}>MANAGE</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                  {selectedCalendar ? (
                    <View style={styles.selectedCalendarDisplay}>
                      <View style={styles.calendarDotContainer}>
                        <View
                          style={[
                            styles.calendarDot,
                            { backgroundColor: selectedCalendar.color },
                          ]}
                        />
                        <View
                          style={[
                            styles.calendarDotGlow,
                            { backgroundColor: selectedCalendar.color },
                          ]}
                        />
                      </View>
                      <Text style={styles.selectedCalendarName}>
                        {selectedCalendar.name}
                      </Text>
                      {selectedCalendar.isShared && (
                        <View style={styles.sharedIndicator}>
                          <Text style={styles.sharedIndicatorText}>SHARED</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.noCalendarText}>{"// NO CALENDAR SELECTED"}</Text>
                  )}
                  <Text style={styles.calendarCount}>
                    › {calendars.length} {calendars.length === 1 ? "CALENDAR" : "CALENDARS"} REGISTERED
                  </Text>
                </LinearGradient>
              </View>
              <TouchableOpacity
                style={styles.plannerOption}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push("/todo-list");
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["#FFD6E8", "#FFE0F0", "#FFF0F8"]}
                  style={styles.plannerOptionGradient}
                >
                  <View style={[styles.neonBorder, { borderColor: "#FF0080" }]} />
                  <View style={styles.optionIconContainer}>
                    <CheckSquare color="#FF0080" size={28} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.plannerOptionText}>TO-DO LIST</Text>
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={styles.plannerOptionHalf}
                  onPress={() => selectPlannerView("yearly")}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#FFD6E8", "#FFE0F0", "#FFF0F8"]}
                    style={styles.plannerOptionGradientHalf}
                  >
                    <View style={[styles.neonBorder, { borderColor: "#FFD700" }]} />
                    <View style={styles.optionIconContainer}>
                      <Target color="#FFD700" size={24} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.plannerOptionTextSmall}>YEARLY</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.plannerOptionHalf}
                  onPress={() => selectPlannerView("monthly")}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#FFD6E8", "#FFE0F0", "#FFF0F8"]}
                    style={styles.plannerOptionGradientHalf}
                  >
                    <View style={[styles.neonBorder, { borderColor: "#9D4EDD" }]} />
                    <View style={styles.optionIconContainer}>
                      <Calendar color="#9D4EDD" size={24} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.plannerOptionTextSmall}>MONTHLY</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={styles.plannerOptionHalf}
                  onPress={() => selectPlannerView("weekly")}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#FFD6E8", "#FFE0F0", "#FFF0F8"]}
                    style={styles.plannerOptionGradientHalf}
                  >
                    <View style={[styles.neonBorder, { borderColor: "#00F5FF" }]} />
                    <View style={styles.optionIconContainer}>
                      <TrendingUp color="#00F5FF" size={24} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.plannerOptionTextSmall}>WEEKLY</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.plannerOptionHalf}
                  onPress={() => selectPlannerView("daily")}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#FFD6E8", "#FFE0F0", "#FFF0F8"]}
                    style={styles.plannerOptionGradientHalf}
                  >
                    <View style={[styles.neonBorder, { borderColor: "#00FF87" }]} />
                    <View style={styles.optionIconContainer}>
                      <Sparkles color="#00FF87" size={24} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.plannerOptionTextSmall}>DAILY</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.notesButton}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push("/notes");
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["#FF6B9D", "#FF4081", "#C2185B"]}
                  style={styles.notesButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={[styles.neonBorder, { borderColor: "#FF6B9D" }]} />
                  <View style={styles.notesButtonContent}>
                    <View style={styles.notesIconContainer}>
                      <BookText color="#000000" size={32} strokeWidth={2.5} />
                    </View>
                    <View style={styles.notesTextContainer}>
                      <Text style={styles.notesButtonTitle}>NOTES PAD</Text>
                      <Text style={styles.notesButtonSubtitle}>Type • Draw • Voice • Encrypt • Export</Text>
                    </View>
                    <Text style={styles.notesArrow}>›</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

            </View>
          ) : (
            <View style={styles.plannerViewContainer}>
              <Text style={styles.plannerViewTitle}>
                {selectedPlannerView.charAt(0).toUpperCase() + selectedPlannerView.slice(1)} Planner
              </Text>
              <Text style={styles.plannerViewSubtitle}>
                This is your {selectedPlannerView} planning view. You can organize and plan your schedule here.
              </Text>
              <TouchableOpacity
                style={styles.backToOptionsButton}
                onPress={() => setSelectedPlannerView(null)}
              >
                <Text style={styles.backToOptionsText}>Back to Options</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E3A5F",
  },
  gradient: {
    flex: 1,
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },
  cometContainer: {
    position: "absolute",
    width: 100,
    height: 4,
  },
  comet: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  backButtonGradient: {
    padding: 10,
    borderRadius: 12,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconGlow: {
    padding: 8,
    borderRadius: 10,
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900" as const,
    color: "#FFFFFF",
    letterSpacing: 3,
    textShadowColor: "#00F5FF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  plannerOptionsGrid: {
    gap: 16,
  },
  plannerOption: {
    borderRadius: 16,
    overflow: "visible",
  },

  plannerOptionGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    borderRadius: 16,
    position: "relative",
  },
  neonBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: "#00F5FF",
    borderRadius: 16,
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  optionIconContainer: {
    padding: 4,
  },
  plannerOptionText: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: "#1a1a1a",
    letterSpacing: 2,
    flex: 1,
    textAlign: "center",
  },
  arrowContainer: {
    width: 24,
  },
  arrow: {
    fontSize: 32,
    color: "#00F5FF",
    fontWeight: "300" as const,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  plannerOptionHalf: {
    flex: 1,
    borderRadius: 16,
  },
  plannerOptionGradientHalf: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    position: "relative",
    minHeight: 120,
  },
  plannerOptionTextSmall: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: "#1a1a1a",
    letterSpacing: 1.5,
    marginTop: 8,
  },

  plannerViewContainer: {
    paddingVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
  },
  plannerViewTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  plannerViewSubtitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  backToOptionsButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  backToOptionsText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  calendarSelectorCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  calendarCardGradient: {
    borderRadius: 16,
    padding: 18,
    position: "relative",
  },
  calendarSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarSelectorTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#00F5FF",
    letterSpacing: 1.5,
  },
  manageCalendarsButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  manageButtonGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  manageCalendarsText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: "#000000",
    letterSpacing: 1,
  },
  selectedCalendarDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  calendarDotContainer: {
    position: "relative",
    width: 16,
    height: 16,
  },
  calendarDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: "absolute",
    zIndex: 2,
  },
  calendarDotGlow: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: "absolute",
    opacity: 0.4,
    transform: [{ scale: 1.8 }],
  },
  selectedCalendarName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1a1a1a",
    flex: 1,
    letterSpacing: 0.5,
  },
  sharedIndicator: {
    backgroundColor: "#00FF87",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sharedIndicatorText: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: "#000000",
    letterSpacing: 1,
  },
  noCalendarText: {
    fontSize: 13,
    color: "#666666",
    fontStyle: "italic" as const,
    marginBottom: 12,
    fontFamily: Platform.select({ ios: "Courier", android: "monospace", default: "monospace" }),
  },
  calendarCount: {
    fontSize: 11,
    color: "#888888",
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },
  notesButton: {
    borderRadius: 16,
    overflow: "visible",
    marginTop: 8,
  },
  notesButtonGradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    position: "relative",
  },
  notesButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notesIconContainer: {
    padding: 8,
    backgroundColor: "#FF6B9D",
    borderRadius: 12,
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  notesTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  notesButtonTitle: {
    fontSize: 18,
    fontWeight: "900" as const,
    color: "#000000",
    letterSpacing: 2,
  },
  notesButtonSubtitle: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#000000",
    marginTop: 4,
    opacity: 0.7,
  },
  notesArrow: {
    fontSize: 32,
    color: "#000000",
    fontWeight: "300" as const,
  },
});
