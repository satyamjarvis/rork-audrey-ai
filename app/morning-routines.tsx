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
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Sparkles,
  Sun,
  Star,
  Plus,
  Trash2,
  ArrowLeft,
  Clock,
  Check,
  RotateCcw,
  Edit3,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import { useMorningRoutines, ROUTINE_ICON_MAP, RoutineStep } from "@/contexts/MorningRoutinesContext";
import { useLanguage } from "@/contexts/LanguageContext";

const { width } = Dimensions.get("window");

const getIconComponent = (iconName: string) => {
  return ROUTINE_ICON_MAP[iconName as keyof typeof ROUTINE_ICON_MAP] || Clock;
};

export default function MorningRoutinesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { translate } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingStep, setEditingStep] = useState<RoutineStep | null>(null);
  const [newStepTitle, setNewStepTitle] = useState<string>("");
  const [newStepDescription, setNewStepDescription] = useState<string>("");
  const [newStepDuration, setNewStepDuration] = useState<string>("5");
  const [selectedIcon, setSelectedIcon] = useState<string>("CheckCircle");

  const {
    routineSteps,
    isLoading,
    completedCount,
    totalCount,
    progressPercentage,
    totalDuration,
    completedDuration,
    estimatedEndTime,
    currentStep,
    startTime,
    toggleStepCompletion,
    resetDailyProgress,
    addCustomStep,
    updateStep,
    deleteStep,
  } = useMorningRoutines();

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

  const morningQuote = useMemo(() => {
    const quotes = [
      translate('morning.routinesPage.quotes.1'),
      translate('morning.routinesPage.quotes.2'),
      translate('morning.routinesPage.quotes.3'),
      translate('morning.routinesPage.quotes.4'),
      translate('morning.routinesPage.quotes.5'),
      translate('morning.routinesPage.quotes.6'),
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [translate]);

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
  }, [fadeAnim, slideAnim, sunPulse, starsRotate, sparkleOpacity, glitterParticles]);

  const handleToggleStep = (stepId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleStepCompletion(stepId);
  };

  const handleReset = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetDailyProgress();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const availableIcons = Object.keys(ROUTINE_ICON_MAP);

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) {
      Alert.alert(translate('morning.routinesPage.error'), translate('morning.routinesPage.enterStepName'));
      return;
    }

    const duration = parseInt(newStepDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert(translate('morning.routinesPage.error'), translate('morning.routinesPage.enterValidDuration'));
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await addCustomStep(
      newStepTitle.trim(),
      newStepDescription.trim(),
      duration,
      selectedIcon
    );

    setNewStepTitle("");
    setNewStepDescription("");
    setNewStepDuration("5");
    setSelectedIcon("CheckCircle");
    setShowAddModal(false);
  };

  const handleEditStep = async () => {
    if (!editingStep || !newStepTitle.trim()) {
      Alert.alert(translate('morning.routinesPage.error'), translate('morning.routinesPage.enterStepName'));
      return;
    }

    const duration = parseInt(newStepDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert(translate('morning.routinesPage.error'), translate('morning.routinesPage.enterValidDuration'));
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await updateStep(editingStep.id, {
      title: newStepTitle.trim(),
      description: newStepDescription.trim(),
      duration,
      icon: selectedIcon,
    });

    setEditingStep(null);
    setNewStepTitle("");
    setNewStepDescription("");
    setNewStepDuration("5");
    setSelectedIcon("CheckCircle");
    setShowEditModal(false);
  };

  const handleDeleteStep = async (stepId: string) => {
    Alert.alert(
      translate('morning.routinesPage.deleteStep'),
      translate('morning.routinesPage.deleteStepConfirmation'),
      [
        { text: translate('morning.routinesPage.cancel'), style: "cancel" },
        {
          text: translate('common.delete'),
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
            await deleteStep(stepId);
          },
        },
      ]
    );
  };

  const openAddModal = () => {
    setNewStepTitle("");
    setNewStepDescription("");
    setNewStepDuration("5");
    setSelectedIcon("CheckCircle");
    setShowAddModal(true);
  };

  const openEditModal = (step: RoutineStep) => {
    setEditingStep(step);
    setNewStepTitle(step.title);
    setNewStepDescription(step.description);
    setNewStepDuration(step.duration.toString());
    setSelectedIcon(step.icon);
    setShowEditModal(true);
  };

  const starsRotateInterpolate = starsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#FFF8E7", "#FFE5B4", "#FFDAB9"]}
          style={styles.gradient}
        >
          <Text style={{ color: "#FF8C42", textAlign: "center", marginTop: 100 }}>
            {translate('morning.routinesPage.loading')}
          </Text>
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
        colors={["#FFF8E7", "#FFE5B4", "#FFDAB9"]}
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
                    fill="#FF8C42"
                    fillOpacity={0.3}
                  />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>{translate('morning.routinesPage.title')}</Text>
                  <Text style={styles.headerTime}>{formatTime(currentTime)}</Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                <Sparkles color="#FFB347" size={32} strokeWidth={1.5} />
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
                      <Text style={styles.quoteLabel}>{translate('morning.routinesPage.todaysInspiration')}</Text>
                    </View>
                    <Text style={styles.quoteText}>{morningQuote}</Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="light" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Sparkles color="#FF8C42" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>{translate('morning.routinesPage.todaysInspiration')}</Text>
                    </View>
                    <Text style={styles.quoteText}>{morningQuote}</Text>
                  </View>
                </BlurView>
              )}

              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderTop}>
                  <Text style={styles.sectionTitle}>{translate('morning.routinesPage.yourMorningFlow')}</Text>
                  <TouchableOpacity
                    onPress={handleReset}
                    style={styles.resetButton}
                    activeOpacity={0.7}
                  >
                    <RotateCcw color="#FF8C42" size={20} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionSubtitle}>
                  {completedCount}/{totalCount} {translate('morning.routinesPage.stepsCompleted')} • {completedDuration}/{totalDuration} {translate('morning.routinesPage.min')}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={["#FF8C42", "#FFB347"]}
                    style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </View>
            </Animated.View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={openAddModal}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#FF8C42", "#FFB347"]}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
                  <Text style={styles.addButtonText}>{translate('morning.routinesPage.addStep')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.stepsContainer}>
              {routineSteps.map((step, index) => {
                const Icon = getIconComponent(step.icon);
                const stepTitle = step.translationKey 
                  ? translate(`${step.translationKey}.title`) 
                  : step.title;
                const stepDescription = step.translationKey 
                  ? translate(`${step.translationKey}.description`) 
                  : step.description;

                return (
                  <Animated.View key={step.id} style={styles.stepCard}>
                    {Platform.OS === "web" ? (
                      <View style={styles.stepCardInner}>
                        <TouchableOpacity
                          style={styles.stepTouchable}
                          onPress={() => handleToggleStep(step.id)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.stepIcon,
                              step.completed && styles.stepIconCompleted,
                            ]}
                          >
                            <Icon
                              color={step.completed ? "#22C55E" : "#FF8C42"}
                              size={24}
                              strokeWidth={2.5}
                            />
                          </View>

                          <View style={styles.stepContent}>
                            <Text
                              style={[
                                styles.stepTitle,
                                step.completed && styles.stepTitleCompleted,
                              ]}
                            >
                              {stepTitle}
                            </Text>
                            <Text style={styles.stepDescription}>
                              {stepDescription}
                            </Text>
                            <View style={styles.stepMeta}>
                              <Clock color="#8B6914" size={14} strokeWidth={2} />
                              <Text style={styles.stepDuration}>{step.duration} {translate('morning.routinesPage.min')}</Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.checkboxContainer,
                              step.completed && styles.checkboxCompleted,
                            ]}
                          >
                            {step.completed && (
                              <Check color="#FFFFFF" size={20} strokeWidth={3} />
                            )}
                          </View>
                        </TouchableOpacity>

                        <View style={styles.stepActions}>
                          <TouchableOpacity
                            onPress={() => openEditModal(step)}
                            style={styles.actionButton}
                          >
                            <Edit3 color="#FF8C42" size={16} strokeWidth={2} />
                          </TouchableOpacity>

                          {step.isCustom && (
                            <TouchableOpacity
                              onPress={() => handleDeleteStep(step.id)}
                              style={[styles.actionButton, styles.deleteActionButton]}
                            >
                              <Trash2 color="#DC2626" size={16} strokeWidth={2} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ) : (
                      <BlurView intensity={15} tint="light" style={styles.stepCardInner}>
                        <TouchableOpacity
                          style={styles.stepTouchable}
                          onPress={() => handleToggleStep(step.id)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.stepIcon,
                              step.completed && styles.stepIconCompleted,
                            ]}
                          >
                            <Icon
                              color={step.completed ? "#22C55E" : "#FF8C42"}
                              size={24}
                              strokeWidth={2.5}
                            />
                          </View>

                          <View style={styles.stepContent}>
                            <Text
                              style={[
                                styles.stepTitle,
                                step.completed && styles.stepTitleCompleted,
                              ]}
                            >
                              {stepTitle}
                            </Text>
                            <Text style={styles.stepDescription}>
                              {stepDescription}
                            </Text>
                            <View style={styles.stepMeta}>
                              <Clock color="#8B6914" size={14} strokeWidth={2} />
                              <Text style={styles.stepDuration}>{step.duration} {translate('morning.routinesPage.min')}</Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.checkboxContainer,
                              step.completed && styles.checkboxCompleted,
                            ]}
                          >
                            {step.completed && (
                              <Check color="#FFFFFF" size={20} strokeWidth={3} />
                            )}
                          </View>
                        </TouchableOpacity>

                        <View style={styles.stepActions}>
                          <TouchableOpacity
                            onPress={() => openEditModal(step)}
                            style={styles.actionButton}
                          >
                            <Edit3 color="#FF8C42" size={16} strokeWidth={2} />
                          </TouchableOpacity>

                          {step.isCustom && (
                            <TouchableOpacity
                              onPress={() => handleDeleteStep(step.id)}
                              style={[styles.actionButton, styles.deleteActionButton]}
                            >
                              <Trash2 color="#DC2626" size={16} strokeWidth={2} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </BlurView>
                    )}
                  </Animated.View>
                );
              })}

              {routineSteps.length === 0 && (
                <View style={styles.emptyState}>
                  <Sun
                    color="#FFB347"
                    size={64}
                    strokeWidth={1.5}
                    fill="#FFB347"
                    fillOpacity={0.1}
                  />
                  <Text style={styles.emptyStateText}>
                    {translate('morning.routinesPage.createYourMorningRoutine')}
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    {translate('morning.routinesPage.tapAddStepToBegin')}
                  </Text>
                </View>
              )}
            </View>

            {completedCount === totalCount && totalCount > 0 && (
              <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
                <LinearGradient
                  colors={["#FF8C42", "#FFB347"]}
                  style={styles.completionCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.completionEmoji}>🌟</Text>
                  <Text style={styles.completionTitle}>{translate('morning.routinesPage.perfectMorning')}</Text>
                  <Text style={styles.completionText}>
                    {translate('morning.routinesPage.completedEntireRoutine')}
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}

            <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
              <Text style={styles.footerText}>
                {translate('morning.routinesPage.startDayWithIntention')}
              </Text>
            </Animated.View>
          </ScrollView>
        </View>
      </LinearGradient>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#FFF8E7", "#FFE5B4", "#FFDAB9"]}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translate('morning.routinesPage.addRoutineStep')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X color="#8B6914" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{translate('morning.routinesPage.stepName')}</Text>
              <TextInput
                style={styles.input}
                value={newStepTitle}
                onChangeText={setNewStepTitle}
                placeholder={translate('morning.routinesPage.stepNamePlaceholder')}
                placeholderTextColor="rgba(139, 105, 20, 0.5)"
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>{translate('morning.routinesPage.descriptionLabel')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newStepDescription}
                onChangeText={setNewStepDescription}
                placeholder={translate('morning.routinesPage.descriptionPlaceholder')}
                placeholderTextColor="rgba(139, 105, 20, 0.5)"
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>{translate('morning.routinesPage.durationLabel')}</Text>
              <TextInput
                style={styles.input}
                value={newStepDuration}
                onChangeText={setNewStepDuration}
                placeholder={translate('morning.routinesPage.durationPlaceholder')}
                placeholderTextColor="rgba(139, 105, 20, 0.5)"
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { marginTop: 24 }]}>{translate('morning.routinesPage.chooseIcon')}</Text>
              <View style={styles.iconGrid}>
                {availableIcons.map((iconName) => {
                  const IconComponent = ROUTINE_ICON_MAP[iconName as keyof typeof ROUTINE_ICON_MAP];
                  const isSelected = selectedIcon === iconName;

                  return (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconOption,
                        isSelected && styles.iconOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedIcon(iconName);
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <IconComponent
                        color={isSelected ? "#FF8C42" : "#8B6914"}
                        size={28}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>{translate('morning.routinesPage.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleAddStep}
              >
                <LinearGradient
                  colors={["#FF8C42", "#FFB347"]}
                  style={styles.modalSaveButtonGradient}
                >
                  <Text style={styles.modalSaveButtonText}>{translate('morning.routinesPage.addStep')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#FFF8E7", "#FFE5B4", "#FFDAB9"]}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{translate('morning.routinesPage.editRoutineStep')}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X color="#8B6914" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{translate('morning.routinesPage.stepName')}</Text>
              <TextInput
                style={styles.input}
                value={newStepTitle}
                onChangeText={setNewStepTitle}
                placeholder={translate('morning.routinesPage.stepNamePlaceholder')}
                placeholderTextColor="rgba(139, 105, 20, 0.5)"
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>{translate('morning.routinesPage.descriptionLabel')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newStepDescription}
                onChangeText={setNewStepDescription}
                placeholder={translate('morning.routinesPage.descriptionPlaceholder')}
                placeholderTextColor="rgba(139, 105, 20, 0.5)"
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>{translate('morning.routinesPage.durationLabel')}</Text>
              <TextInput
                style={styles.input}
                value={newStepDuration}
                onChangeText={setNewStepDuration}
                placeholder={translate('morning.routinesPage.durationPlaceholder')}
                placeholderTextColor="rgba(139, 105, 20, 0.5)"
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { marginTop: 24 }]}>{translate('morning.routinesPage.chooseIcon')}</Text>
              <View style={styles.iconGrid}>
                {availableIcons.map((iconName) => {
                  const IconComponent = ROUTINE_ICON_MAP[iconName as keyof typeof ROUTINE_ICON_MAP];
                  const isSelected = selectedIcon === iconName;

                  return (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconOption,
                        isSelected && styles.iconOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedIcon(iconName);
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <IconComponent
                        color={isSelected ? "#FF8C42" : "#8B6914"}
                        size={28}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>{translate('morning.routinesPage.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleEditStep}
              >
                <LinearGradient
                  colors={["#FF8C42", "#FFB347"]}
                  style={styles.modalSaveButtonGradient}
                >
                  <Text style={styles.modalSaveButtonText}>{translate('morning.routinesPage.saveChanges')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
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
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FF8C42",
    letterSpacing: 0.5,
  },
  headerTime: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#8B6914",
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
    color: "#FF8C42",
  },
  quoteText: {
    fontSize: 18,
    fontWeight: "500" as const,
    lineHeight: 28,
    color: "#5D4E37",
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600" as const,
    color: "#FF8C42",
    letterSpacing: 0.5,
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 140, 66, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#8B6914",
    letterSpacing: 0.3,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBarBg: {
    height: 12,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(139, 105, 20, 0.2)",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  actionsRow: {
    marginBottom: 24,
  },
  addButton: {
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
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.2)",
  },
  stepCardInner: {
    padding: 20,
  },
  stepTouchable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 140, 66, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconCompleted: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#5D4E37",
    letterSpacing: 0.2,
  },
  stepTitleCompleted: {
    textDecorationLine: "line-through" as const,
    opacity: 0.7,
  },
  stepDescription: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#8B6914",
    lineHeight: 18,
  },
  stepMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  stepDuration: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#8B6914",
    letterSpacing: 0.1,
  },
  checkboxContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 140, 66, 0.3)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  stepActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 140, 66, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteActionButton: {
    backgroundColor: "rgba(220, 38, 38, 0.2)",
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
    color: "#8B6914",
    letterSpacing: 0.3,
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#A0826D",
    letterSpacing: 0.2,
  },
  completionCard: {
    padding: 36,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  completionEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  completionText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    lineHeight: 24,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#8B6914",
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
    backgroundColor: "rgba(255, 140, 66, 0.2)",
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
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 140, 66, 0.2)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FF8C42",
    letterSpacing: 0.3,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#8B6914",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#5D4E37",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.3)",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top" as const,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  iconOption: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 2,
    borderColor: "rgba(255, 140, 66, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconOptionSelected: {
    backgroundColor: "rgba(255, 140, 66, 0.3)",
    borderColor: "#FF8C42",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 140, 66, 0.2)",
  },
  modalCancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#8B6914",
    letterSpacing: 0.2,
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalSaveButtonGradient: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
