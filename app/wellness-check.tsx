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
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Heart,
  Sparkles,
  Star,
  ArrowLeft,
  Zap,
  Brain,
  Moon,
  Activity,
  Droplets,
  Clock,
  Sun,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  useWellnessCheck,
  MoodType,
  EnergyLevel,
  StressLevel,
  SleepQuality,
} from "@/contexts/WellnessCheckContext";

const { width } = Dimensions.get("window");

type MoodOption = {
  value: MoodType;
  label: string;
  emoji: string;
  color: string;
};

type EnergyOption = {
  value: EnergyLevel;
  label: string;
  color: string;
};

type StressOption = {
  value: StressLevel;
  label: string;
  color: string;
};

type SleepOption = {
  value: SleepQuality;
  label: string;
  emoji: string;
  color: string;
};

const MOOD_OPTIONS: MoodOption[] = [
  { value: "excellent", label: "Excellent", emoji: "😄", color: "#FFD700" },
  { value: "good", label: "Good", emoji: "😊", color: "#FFA500" },
  { value: "okay", label: "Okay", emoji: "😐", color: "#FFB366" },
  { value: "low", label: "Low", emoji: "😔", color: "#FF9966" },
  { value: "poor", label: "Poor", emoji: "😢", color: "#FF8C66" },
];

const ENERGY_OPTIONS: EnergyOption[] = [
  { value: "high", label: "High", color: "#FFD700" },
  { value: "moderate", label: "Moderate", color: "#FFA500" },
  { value: "low", label: "Low", color: "#FF9966" },
  { value: "exhausted", label: "Exhausted", color: "#FF8C66" },
];

const STRESS_OPTIONS: StressOption[] = [
  { value: "none", label: "None", color: "#FFD700" },
  { value: "mild", label: "Mild", color: "#FFA500" },
  { value: "moderate", label: "Moderate", color: "#FFB366" },
  { value: "high", label: "High", color: "#FF9966" },
  { value: "overwhelming", label: "Overwhelming", color: "#FF8C66" },
];

const SLEEP_OPTIONS: SleepOption[] = [
  { value: "excellent", label: "Excellent", emoji: "😴", color: "#FFD700" },
  { value: "good", label: "Good", emoji: "😌", color: "#FFA500" },
  { value: "fair", label: "Fair", emoji: "😑", color: "#FFB366" },
  { value: "poor", label: "Poor", emoji: "😣", color: "#FF9966" },
  { value: "terrible", label: "Terrible", emoji: "😫", color: "#FF8C66" },
];

export default function WellnessCheckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  const {
    hasCheckedToday,
    todayEntry,
    stats,
    addEntry,
    isLoading,
  } = useWellnessCheck();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(todayEntry?.mood || null);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel | null>(todayEntry?.energy || null);
  const [selectedStress, setSelectedStress] = useState<StressLevel | null>(todayEntry?.stress || null);
  const [selectedSleep, setSelectedSleep] = useState<SleepQuality | null>(todayEntry?.sleep || null);
  const [physicalHealth, setPhysicalHealth] = useState<number>(todayEntry?.physicalHealth || 5);
  const [notes, setNotes] = useState<string>(todayEntry?.notes || "");
  const [gratitude, setGratitude] = useState<string>("");
  const [waterIntake, setWaterIntake] = useState<string>(todayEntry?.waterIntake?.toString() || "");
  const [exerciseDuration, setExerciseDuration] = useState<string>(todayEntry?.exerciseDuration?.toString() || "");

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

  const [wellnessQuote] = useState(() => {
    const quotes = [
      "Your wellness journey begins with self-awareness.",
      "Health is a state of complete harmony of body, mind and spirit.",
      "Take care of your body. It's the only place you have to live.",
      "Wellness is not a destination, it is a way of life.",
      "The greatest wealth is health.",
      "Listen to your body. It's always trying to tell you something.",
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

  const handleSubmitCheckIn = async () => {
    if (!selectedMood || !selectedEnergy || !selectedStress || !selectedSleep) {
      Alert.alert("Incomplete", "Please fill in all wellness parameters");
      return;
    }

    const gratitudeList = gratitude.trim() 
      ? gratitude.split("\n").filter(g => g.trim().length > 0) 
      : undefined;

    await addEntry(
      selectedMood,
      selectedEnergy,
      selectedStress,
      selectedSleep,
      physicalHealth,
      notes,
      gratitudeList,
      waterIntake ? parseInt(waterIntake) : undefined,
      exerciseDuration ? parseInt(exerciseDuration) : undefined
    );

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert("Success", "Your wellness check has been logged!");
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#0a0e27", "#1a1a3e", "#2d1b4e"]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

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
          <ArrowLeft color="#a8c5e8" size={28} strokeWidth={2.5} />
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
                  <Sun
                    color="#a8c5e8"
                    size={48}
                    strokeWidth={2}
                    fill="#a8c5e8"
                    fillOpacity={0.3}
                  />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>Wellness Check</Text>
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
                      <Sparkles color="#a8c5e8" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>Today&apos;s Reminder</Text>
                    </View>
                    <Text style={styles.quoteText}>{wellnessQuote}</Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="dark" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Sparkles color="#a8c5e8" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>Today&apos;s Reminder</Text>
                    </View>
                    <Text style={styles.quoteText}>{wellnessQuote}</Text>
                  </View>
                </BlurView>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Check Your Wellness</Text>
                <Text style={styles.sectionSubtitle}>
                  {hasCheckedToday ? "You've checked in today!" : "How are you feeling today?"}
                </Text>
              </View>
            </Animated.View>

            <View style={styles.moodSection}>
              <View style={styles.moodHeader}>
                <Heart color="#a8c5e8" size={24} strokeWidth={2.5} />
                <Text style={styles.moodTitle}>How are you feeling?</Text>
              </View>
              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.moodCard,
                      {
                        backgroundColor:
                          selectedMood === option.value
                            ? `${option.color}40`
                            : "rgba(255, 255, 255, 0.3)",
                        borderColor:
                          selectedMood === option.value
                            ? option.color
                            : "rgba(255, 140, 0, 0.2)",
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedMood(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moodEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        {
                          color:
                            selectedMood === option.value
                              ? option.color
                              : "#8B4513",
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.energySection}>
              <View style={styles.energyHeader}>
                <Zap color="#a8c5e8" size={24} strokeWidth={2.5} />
                <Text style={styles.energyTitle}>Energy Level</Text>
              </View>
              <View style={styles.energyRow}>
                {ENERGY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.energyPill,
                      {
                        backgroundColor:
                          selectedEnergy === option.value
                            ? option.color
                            : "rgba(255, 255, 255, 0.3)",
                        borderColor:
                          selectedEnergy === option.value
                            ? option.color
                            : "rgba(255, 140, 0, 0.2)",
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedEnergy(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.energyLabel,
                        {
                          color:
                            selectedEnergy === option.value
                              ? "#FFFFFF"
                              : "#8B4513",
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.stressSection}>
              <View style={styles.stressHeader}>
                <Brain color="#a8c5e8" size={24} strokeWidth={2.5} />
                <Text style={styles.stressTitle}>Stress Level</Text>
              </View>
              <View style={styles.stressRow}>
                {STRESS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.stressPill,
                      {
                        backgroundColor:
                          selectedStress === option.value
                            ? option.color
                            : "rgba(255, 255, 255, 0.3)",
                        borderColor:
                          selectedStress === option.value
                            ? option.color
                            : "rgba(255, 140, 0, 0.2)",
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedStress(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.stressLabel,
                        {
                          color:
                            selectedStress === option.value
                              ? "#FFFFFF"
                              : "#8B4513",
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sleepSection}>
              <View style={styles.sleepHeader}>
                <Moon color="#a8c5e8" size={24} strokeWidth={2.5} />
                <Text style={styles.sleepTitle}>Sleep Quality</Text>
              </View>
              <View style={styles.sleepGrid}>
                {SLEEP_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sleepCard,
                      {
                        backgroundColor:
                          selectedSleep === option.value
                            ? `${option.color}40`
                            : "rgba(255, 255, 255, 0.3)",
                        borderColor:
                          selectedSleep === option.value
                            ? option.color
                            : "rgba(255, 140, 0, 0.2)",
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedSleep(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sleepEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.sleepLabel,
                        {
                          color:
                            selectedSleep === option.value
                              ? option.color
                              : "#8B4513",
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.healthSection}>
              <View style={styles.healthHeader}>
                <Activity color="#a8c5e8" size={24} strokeWidth={2.5} />
                <Text style={styles.healthTitle}>Physical Health: {physicalHealth}/10</Text>
              </View>
              <View style={styles.healthSlider}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.healthDot,
                      {
                        backgroundColor:
                          value <= physicalHealth
                            ? "#7b68ee"
                            : "rgba(255, 255, 255, 0.4)",
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setPhysicalHealth(value);
                    }}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </View>

            <View style={styles.additionalInputs}>
              <View style={styles.inputCard}>
                {Platform.OS === "web" ? (
                  <View style={styles.inputCardInner}>
                    <View style={styles.inputHeader}>
                      <Sparkles color="#a8c5e8" size={20} strokeWidth={2.5} />
                      <Text style={styles.inputLabel}>Gratitude (one per line)</Text>
                    </View>
                    <TextInput
                      style={styles.textArea}
                      placeholder="What are you grateful for today?"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={gratitude}
                      onChangeText={setGratitude}
                      multiline
                    />
                  </View>
                ) : (
                  <BlurView intensity={15} tint="dark" style={styles.inputCardInner}>
                    <View style={styles.inputHeader}>
                      <Sparkles color="#a8c5e8" size={20} strokeWidth={2.5} />
                      <Text style={styles.inputLabel}>Gratitude (one per line)</Text>
                    </View>
                    <TextInput
                      style={styles.textArea}
                      placeholder="What are you grateful for today?"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={gratitude}
                      onChangeText={setGratitude}
                      multiline
                    />
                  </BlurView>
                )}
              </View>

              <View style={styles.quickInputsRow}>
                <View style={styles.quickInputCard}>
                  {Platform.OS === "web" ? (
                    <View style={styles.quickInputInner}>
                      <Droplets color="#a8c5e8" size={20} strokeWidth={2.5} />
                      <Text style={styles.quickInputLabel}>Water (glasses)</Text>
                      <TextInput
                        style={styles.quickInput}
                        placeholder="0"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={waterIntake}
                        onChangeText={setWaterIntake}
                        keyboardType="number-pad"
                      />
                    </View>
                  ) : (
                    <BlurView intensity={15} tint="dark" style={styles.quickInputInner}>
                      <Droplets color="#a8c5e8" size={20} strokeWidth={2.5} />
                      <Text style={styles.quickInputLabel}>Water (glasses)</Text>
                      <TextInput
                        style={styles.quickInput}
                        placeholder="0"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={waterIntake}
                        onChangeText={setWaterIntake}
                        keyboardType="number-pad"
                      />
                    </BlurView>
                  )}
                </View>

                <View style={styles.quickInputCard}>
                  {Platform.OS === "web" ? (
                    <View style={styles.quickInputInner}>
                      <Clock color="#a8c5e8" size={20} strokeWidth={2.5} />
                      <Text style={styles.quickInputLabel}>Exercise (min)</Text>
                      <TextInput
                        style={styles.quickInput}
                        placeholder="0"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={exerciseDuration}
                        onChangeText={setExerciseDuration}
                        keyboardType="number-pad"
                      />
                    </View>
                  ) : (
                    <BlurView intensity={15} tint="dark" style={styles.quickInputInner}>
                      <Clock color="#a8c5e8" size={20} strokeWidth={2.5} />
                      <Text style={styles.quickInputLabel}>Exercise (min)</Text>
                      <TextInput
                        style={styles.quickInput}
                        placeholder="0"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={exerciseDuration}
                        onChangeText={setExerciseDuration}
                        keyboardType="number-pad"
                      />
                    </BlurView>
                  )}
                </View>
              </View>

              <View style={styles.notesCard}>
                {Platform.OS === "web" ? (
                  <View style={styles.notesCardInner}>
                    <Text style={styles.notesLabel}>Additional Notes</Text>
                    <TextInput
                      style={styles.notesTextArea}
                      placeholder="Any thoughts or observations?"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                    />
                  </View>
                ) : (
                  <BlurView intensity={15} tint="dark" style={styles.notesCardInner}>
                    <Text style={styles.notesLabel}>Additional Notes</Text>
                    <TextInput
                      style={styles.notesTextArea}
                      placeholder="Any thoughts or observations?"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                    />
                  </BlurView>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitCheckIn}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#4a5fc1", "#7b68ee"]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Star color="#FFFFFF" size={24} strokeWidth={2.5} fill="#FFFFFF" />
                <Text style={styles.submitText}>Complete Check-in</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText}>
                Your wellness matters every single day
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
    color: "#a8c5e8",
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
    borderColor: "rgba(168, 197, 232, 0.2)",
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
    color: "#a8c5e8",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#d4c4f0",
    letterSpacing: 0.3,
  },
  moodSection: {
    marginBottom: 28,
  },
  moodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#a8c5e8",
    letterSpacing: 0.3,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  moodCard: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  energySection: {
    marginBottom: 28,
  },
  energyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  energyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#a8c5e8",
    letterSpacing: 0.3,
  },
  energyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  energyPill: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
  },
  energyLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  stressSection: {
    marginBottom: 28,
  },
  stressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  stressTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#a8c5e8",
    letterSpacing: 0.3,
  },
  stressRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  stressPill: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
  },
  stressLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  sleepSection: {
    marginBottom: 28,
  },
  sleepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sleepTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#a8c5e8",
    letterSpacing: 0.3,
  },
  sleepGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sleepCard: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
  },
  sleepEmoji: {
    fontSize: 32,
  },
  sleepLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  healthSection: {
    marginBottom: 28,
  },
  healthHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#a8c5e8",
    letterSpacing: 0.3,
  },
  healthSlider: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 8,
  },
  healthDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  additionalInputs: {
    gap: 16,
    marginBottom: 24,
  },
  inputCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(168, 197, 232, 0.2)",
  },
  inputCardInner: {
    padding: 20,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#a8c5e8",
    letterSpacing: 0.2,
  },
  textArea: {
    fontSize: 16,
    color: "#f4f0f8",
    minHeight: 80,
    textAlignVertical: "top",
  },
  quickInputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickInputCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(168, 197, 232, 0.2)",
  },
  quickInputInner: {
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickInputLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#a8c5e8",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  quickInput: {
    fontSize: 16,
    color: "#f4f0f8",
    width: "100%",
    textAlign: "center",
    fontWeight: "600" as const,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  notesCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(168, 197, 232, 0.2)",
  },
  notesCardInner: {
    padding: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#a8c5e8",
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  notesTextArea: {
    fontSize: 16,
    color: "#f4f0f8",
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#4a5fc1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
  },
  submitText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#d4c4f0",
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
    backgroundColor: "rgba(168, 197, 232, 0.15)",
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#a8c5e8",
  },
});
