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
  Zap,
  Brain,
  Moon,
  Activity,
  Sparkles,
  Droplets,
  Clock,
  ArrowLeft,
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
  { value: "excellent", label: "Excellent", emoji: "😄", color: "#4CAF50" },
  { value: "good", label: "Good", emoji: "😊", color: "#8BC34A" },
  { value: "okay", label: "Okay", emoji: "😐", color: "#FFC107" },
  { value: "low", label: "Low", emoji: "😔", color: "#FF9800" },
  { value: "poor", label: "Poor", emoji: "😢", color: "#F44336" },
];

const ENERGY_OPTIONS: EnergyOption[] = [
  { value: "high", label: "High", color: "#4CAF50" },
  { value: "moderate", label: "Moderate", color: "#8BC34A" },
  { value: "low", label: "Low", color: "#FF9800" },
  { value: "exhausted", label: "Exhausted", color: "#F44336" },
];

const STRESS_OPTIONS: StressOption[] = [
  { value: "none", label: "None", color: "#4CAF50" },
  { value: "mild", label: "Mild", color: "#8BC34A" },
  { value: "moderate", label: "Moderate", color: "#FFC107" },
  { value: "high", label: "High", color: "#FF9800" },
  { value: "overwhelming", label: "Overwhelming", color: "#F44336" },
];

const SLEEP_OPTIONS: SleepOption[] = [
  { value: "excellent", label: "Excellent", emoji: "😴", color: "#4CAF50" },
  { value: "good", label: "Good", emoji: "😌", color: "#8BC34A" },
  { value: "fair", label: "Fair", emoji: "😑", color: "#FFC107" },
  { value: "poor", label: "Poor", emoji: "😣", color: "#FF9800" },
  { value: "terrible", label: "Terrible", emoji: "😫", color: "#F44336" },
];

export default function HowAmIFeelingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addEntry, todayEntry } = useWellnessCheck();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());

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
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(
    todayEntry?.mood || null
  );
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel | null>(
    todayEntry?.energy || null
  );
  const [selectedStress, setSelectedStress] = useState<StressLevel | null>(
    todayEntry?.stress || null
  );
  const [selectedSleep, setSelectedSleep] = useState<SleepQuality | null>(
    todayEntry?.sleep || null
  );
  const [physicalHealth, setPhysicalHealth] = useState<number>(
    todayEntry?.physicalHealth || 5
  );
  const [notes, setNotes] = useState<string>(todayEntry?.notes || "");
  const [gratitude, setGratitude] = useState<string>("");
  const [waterIntake, setWaterIntake] = useState<string>(
    todayEntry?.waterIntake?.toString() || ""
  );
  const [exerciseDuration, setExerciseDuration] = useState<string>(
    todayEntry?.exerciseDuration?.toString() || ""
  );

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
  }, [fadeAnim, slideAnim, heartPulse, starsRotate, glitterParticles]);

  const handleSubmitCheckIn = async () => {
    if (!selectedMood || !selectedEnergy || !selectedStress || !selectedSleep) {
      Alert.alert("Incomplete", "Please fill in all wellness parameters");
      return;
    }

    const gratitudeList = gratitude.trim()
      ? gratitude.split("\n").filter((g) => g.trim().length > 0)
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

    Alert.alert("Success", "Your check-in has been logged!", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
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

  const renderMoodSelector = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Heart color="#e8b4fa" size={16} strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
      </View>
      <View style={styles.optionsGrid}>
        {MOOD_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              {
                backgroundColor:
                  selectedMood === option.value
                    ? `${option.color}25`
                    : "rgba(255, 255, 255, 0.05)",
                borderColor:
                  selectedMood === option.value ? option.color : "rgba(255, 255, 255, 0.1)",
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedMood(option.value);
            }}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.optionLabel,
                {
                  color: selectedMood === option.value ? option.color : "#d4c4f0",
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEnergySelector = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Zap color="#e8b4fa" size={16} strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>Energy Level</Text>
      </View>
      <View style={styles.optionsRow}>
        {ENERGY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pillOption,
              {
                backgroundColor:
                  selectedEnergy === option.value
                    ? option.color
                    : "rgba(255, 255, 255, 0.05)",
                borderColor:
                  selectedEnergy === option.value ? option.color : "rgba(255, 255, 255, 0.1)",
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedEnergy(option.value);
            }}
          >
            <Text
              style={[
                styles.pillLabel,
                {
                  color: selectedEnergy === option.value ? "#FFFFFF" : "#d4c4f0",
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStressSelector = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Brain color="#e8b4fa" size={16} strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>Stress Level</Text>
      </View>
      <View style={styles.optionsRow}>
        {STRESS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pillOption,
              {
                backgroundColor:
                  selectedStress === option.value
                    ? option.color
                    : "rgba(255, 255, 255, 0.05)",
                borderColor:
                  selectedStress === option.value ? option.color : "rgba(255, 255, 255, 0.1)",
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedStress(option.value);
            }}
          >
            <Text
              style={[
                styles.pillLabel,
                {
                  color: selectedStress === option.value ? "#FFFFFF" : "#d4c4f0",
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSleepSelector = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Moon color="#e8b4fa" size={16} strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>Sleep Quality</Text>
      </View>
      <View style={styles.optionsGrid}>
        {SLEEP_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              {
                backgroundColor:
                  selectedSleep === option.value
                    ? `${option.color}25`
                    : "rgba(255, 255, 255, 0.05)",
                borderColor:
                  selectedSleep === option.value ? option.color : "rgba(255, 255, 255, 0.1)",
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedSleep(option.value);
            }}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.optionLabel,
                {
                  color: selectedSleep === option.value ? option.color : "#d4c4f0",
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPhysicalHealthSlider = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Activity color="#e8b4fa" size={16} strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>
          Physical Health: {physicalHealth}/10
        </Text>
      </View>
      <View style={styles.sliderContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.sliderDot,
              {
                backgroundColor:
                  value <= physicalHealth ? "#e8b4fa" : "rgba(255, 255, 255, 0.2)",
              },
            ]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setPhysicalHealth(value);
            }}
          />
        ))}
      </View>
    </View>
  );

  const renderAdditionalInputs = () => (
    <View style={styles.additionalSection}>
      {Platform.OS === "web" ? (
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Sparkles color="#e8b4fa" size={14} strokeWidth={2.5} />
            <Text style={styles.inputLabel}>Gratitude (one per line)</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="What are you grateful for today?"
            placeholderTextColor="rgba(248, 244, 232, 0.4)"
            value={gratitude}
            onChangeText={setGratitude}
            multiline
            numberOfLines={3}
          />
        </View>
      ) : (
        <BlurView intensity={15} tint="dark" style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Sparkles color="#e8b4fa" size={14} strokeWidth={2.5} />
            <Text style={styles.inputLabel}>Gratitude (one per line)</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="What are you grateful for today?"
            placeholderTextColor="rgba(248, 244, 232, 0.4)"
            value={gratitude}
            onChangeText={setGratitude}
            multiline
            numberOfLines={3}
          />
        </BlurView>
      )}

      <View style={styles.quickInputsRow}>
        {Platform.OS === "web" ? (
          <>
            <View style={styles.quickInputCard}>
              <Droplets color="#e8b4fa" size={14} strokeWidth={2.5} />
              <Text style={styles.quickInputLabel}>Water (glasses)</Text>
              <TextInput
                style={styles.quickInput}
                placeholder="0"
                placeholderTextColor="rgba(248, 244, 232, 0.4)"
                value={waterIntake}
                onChangeText={setWaterIntake}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.quickInputCard}>
              <Clock color="#e8b4fa" size={14} strokeWidth={2.5} />
              <Text style={styles.quickInputLabel}>Exercise (min)</Text>
              <TextInput
                style={styles.quickInput}
                placeholder="0"
                placeholderTextColor="rgba(248, 244, 232, 0.4)"
                value={exerciseDuration}
                onChangeText={setExerciseDuration}
                keyboardType="number-pad"
              />
            </View>
          </>
        ) : (
          <>
            <BlurView intensity={15} tint="dark" style={styles.quickInputCard}>
              <Droplets color="#e8b4fa" size={14} strokeWidth={2.5} />
              <Text style={styles.quickInputLabel}>Water (glasses)</Text>
              <TextInput
                style={styles.quickInput}
                placeholder="0"
                placeholderTextColor="rgba(248, 244, 232, 0.4)"
                value={waterIntake}
                onChangeText={setWaterIntake}
                keyboardType="number-pad"
              />
            </BlurView>

            <BlurView intensity={15} tint="dark" style={styles.quickInputCard}>
              <Clock color="#e8b4fa" size={14} strokeWidth={2.5} />
              <Text style={styles.quickInputLabel}>Exercise (min)</Text>
              <TextInput
                style={styles.quickInput}
                placeholder="0"
                placeholderTextColor="rgba(248, 244, 232, 0.4)"
                value={exerciseDuration}
                onChangeText={setExerciseDuration}
                keyboardType="number-pad"
              />
            </BlurView>
          </>
        )}
      </View>

      {Platform.OS === "web" ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Additional Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any thoughts or observations?"
            placeholderTextColor="rgba(248, 244, 232, 0.4)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>
      ) : (
        <BlurView intensity={15} tint="dark" style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Additional Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any thoughts or observations?"
            placeholderTextColor="rgba(248, 244, 232, 0.4)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </BlurView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient colors={["#1a1a2e", "#2d1b4e", "#3d2963"]} style={styles.gradient}>
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
          <ArrowLeft color="#e8b4fa" size={28} strokeWidth={2.5} />
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
                    color="#e8b4fa"
                    size={40}
                    strokeWidth={2}
                    fill="#e8b4fa"
                    fillOpacity={0.3}
                  />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>How I&apos;m Feeling</Text>
                  <Text style={styles.headerTime}>{formatTime(currentTime)}</Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                <Sparkles color="#d4c4f0" size={28} strokeWidth={1.5} />
              </Animated.View>
            </View>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
              {renderMoodSelector()}
              {renderEnergySelector()}
              {renderStressSelector()}
              {renderSleepSelector()}
              {renderPhysicalHealthSlider()}
              {renderAdditionalInputs()}

              <TouchableOpacity onPress={handleSubmitCheckIn} style={styles.submitButton}>
                <LinearGradient
                  colors={["#d946ef", "#a855f7"]}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.submitText}>Complete Check-in</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Animated.View style={{ opacity: fadeAnim, marginTop: 16 }}>
                <Text style={styles.footerText}>
                  Understanding your feelings is the first step to wellness
                </Text>
              </Animated.View>
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
    position: "absolute" as const,
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
    color: "#e8b4fa",
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
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
    color: "#e8b4fa",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pillOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  sliderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 8,
  },
  sliderDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  additionalSection: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(232, 180, 250, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
    color: "#e8b4fa",
  },
  textArea: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(15, 12, 41, 0.5)",
    minHeight: 80,
    textAlignVertical: "top",
    fontWeight: "500" as const,
    color: "#f4f0f8",
  },
  quickInputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickInputCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(232, 180, 250, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    overflow: "hidden",
  },
  quickInputLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textAlign: "center",
    letterSpacing: 0.2,
    color: "#d4c4f0",
  },
  quickInput: {
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(15, 12, 41, 0.5)",
    width: "100%",
    textAlign: "center",
    fontWeight: "600" as const,
    color: "#f4f0f8",
  },
  submitButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#d946ef",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  submitText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.4,
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
    backgroundColor: "rgba(232, 180, 250, 0.15)",
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
