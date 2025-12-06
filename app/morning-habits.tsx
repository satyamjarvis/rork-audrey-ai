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
  Sparkles,
  Sunrise,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  Edit3,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import { useMorningHabits, ICON_MAP, MorningHabit } from "@/contexts/MorningHabitsContext";
import { useTranslation } from "@/contexts/LanguageContext";

const { width } = Dimensions.get("window");

const getIconComponent = (iconName: string) => {
  return ICON_MAP[iconName as keyof typeof ICON_MAP];
};

export default function MorningHabitsScreen() {
  const router = useRouter();
  const { translations } = useTranslation();
  const t = translations.morning.habitsPage;
  const common = translations.common;
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sunrisePulse = useRef(new Animated.Value(1)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const { habits, completedCount, totalCount, progressPercentage, toggleHabit, addCustomHabit, updateHabit, deleteHabit } = useMorningHabits();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHabit, setEditingHabit] = useState<MorningHabit | null>(null);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Coffee");

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

  const [quoteKey] = useState(() => {
    const keys = ["1", "2", "3", "4", "5", "6"] as const;
    return keys[Math.floor(Math.random() * keys.length)];
  });
  
  const motivationalQuote = t.quotes[quoteKey as keyof typeof t.quotes];

  const getHabitTitle = (habit: MorningHabit) => {
    if (habit.isCustom) return habit.title;
    const defaultHabitKeys = ["hydrate", "exercise", "breakfast", "coffee", "reading", "sunshine"];
    if (defaultHabitKeys.includes(habit.id)) {
       // @ts-ignore
       return t.defaultHabits?.[habit.id] || habit.title;
    }
    return habit.title;
  };

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
        Animated.timing(sunrisePulse, {
          toValue: 1.15,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(sunrisePulse, {
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
  }, [fadeAnim, slideAnim, sunrisePulse, starsRotate, sparkleOpacity, glitterParticles]);

  const handleAddHabit = async () => {
    if (newHabitTitle.trim()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await addCustomHabit(newHabitTitle.trim(), selectedIcon);
      setNewHabitTitle("");
      setSelectedIcon("Coffee");
      setIsAdding(false);
    }
  };

  const handleEditHabit = async () => {
    if (editingHabit && newHabitTitle.trim()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await updateHabit(editingHabit.id, { title: newHabitTitle.trim(), icon: selectedIcon });
      setEditingHabit(null);
      setNewHabitTitle("");
      setSelectedIcon("Coffee");
      setIsEditing(false);
    }
  };

  const handleDeleteHabit = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      t.deleteHabit,
      t.deleteConfirmation,
      [
        { text: common.cancel, style: "cancel" },
        {
          text: t.delete,
          style: "destructive",
          onPress: async () => {
            await deleteHabit(id);
          },
        },
      ]
    );
  };

  const handleToggleHabit = (habitId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleHabit(habitId);
  };

  const openEditMode = (habit: MorningHabit) => {
    setEditingHabit(habit);
    setNewHabitTitle(habit.title);
    setSelectedIcon(habit.icon);
    setIsEditing(true);
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

  const availableIcons = Object.keys(ICON_MAP);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={["#FFE5B4", "#FFD4A3", "#FFC68A"]}
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
                <Animated.View style={{ transform: [{ scale: sunrisePulse }] }}>
                  <Sunrise
                    color="#FF8C42"
                    size={48}
                    strokeWidth={2}
                    fill="#FF8C42"
                    fillOpacity={0.3}
                  />
                </Animated.View>
                <View>
                  <Text style={styles.headerTitle}>{t.title}</Text>
                  <Text style={styles.headerTime}>{formatTime(currentTime)}</Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                <Sparkles color="#FFB84D" size={32} strokeWidth={1.5} />
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
                      <Text style={styles.quoteLabel}>{t.morningInspiration}</Text>
                    </View>
                    <Text style={styles.quoteText}>{motivationalQuote}</Text>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="light" style={styles.quoteCard}>
                  <View style={styles.quoteOverlay}>
                    <View style={styles.quoteHeader}>
                      <Sparkles color="#FF8C42" size={18} strokeWidth={2} />
                      <Text style={styles.quoteLabel}>{t.morningInspiration}</Text>
                    </View>
                    <Text style={styles.quoteText}>{motivationalQuote}</Text>
                  </View>
                </BlurView>
              )}

              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>{t.todaysProgress}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <LinearGradient
                      colors={["#FF8C42", "#FFB84D"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressBarFill,
                        { width: `${progressPercentage}%` },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.progressText}>
                  {completedCount} of {totalCount} habits completed
                </Text>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.yourMorningRituals}</Text>
                <Text style={styles.sectionSubtitle}>
                  {t.startYourDay}
                </Text>
              </View>
            </Animated.View>

            {!isAdding && !isEditing && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAdding(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#FF8C42", "#FFB84D"]}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus color="#FFFFFF" size={24} strokeWidth={2.5} />
                  <Text style={styles.addButtonText}>{t.addHabit}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isAdding && (
              <Animated.View style={styles.inputCard}>
                {Platform.OS === "web" ? (
                  <View style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder={t.newHabitPlaceholder}
                      placeholderTextColor="rgba(120, 60, 20, 0.5)"
                      value={newHabitTitle}
                      onChangeText={setNewHabitTitle}
                      multiline
                      autoFocus
                    />
                    <Text style={styles.iconLabel}>{t.chooseIcon}</Text>
                    <View style={styles.iconGrid}>
                      {availableIcons.map((iconName) => {
                        const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
                        const isSelected = selectedIcon === iconName;
                        
                        return (
                          <TouchableOpacity
                            key={iconName}
                            style={[
                              styles.iconOption,
                              {
                                backgroundColor: isSelected ? "rgba(255, 140, 66, 0.3)" : "rgba(255, 255, 255, 0.3)",
                                borderColor: isSelected ? "#FF8C42" : "rgba(255, 140, 66, 0.2)",
                              },
                            ]}
                            onPress={() => {
                              setSelectedIcon(iconName);
                              if (Platform.OS !== "web") {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                            }}
                          >
                            <IconComponent
                              color={isSelected ? "#FF8C42" : "#A0522D"}
                              size={24}
                              strokeWidth={2}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={styles.inputActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setIsAdding(false);
                          setNewHabitTitle("");
                          setSelectedIcon("Coffee");
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>{common.cancel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleAddHabit}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={["#FF8C42", "#FFB84D"]}
                          style={styles.saveButtonGradient}
                        >
                          <Text style={styles.saveButtonText}>{t.add}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <BlurView intensity={20} tint="light" style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder={t.newHabitPlaceholder}
                      placeholderTextColor="rgba(120, 60, 20, 0.5)"
                      value={newHabitTitle}
                      onChangeText={setNewHabitTitle}
                      multiline
                      autoFocus
                    />
                    <Text style={styles.iconLabel}>{t.chooseIcon}</Text>
                    <View style={styles.iconGrid}>
                      {availableIcons.map((iconName) => {
                        const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
                        const isSelected = selectedIcon === iconName;
                        
                        return (
                          <TouchableOpacity
                            key={iconName}
                            style={[
                              styles.iconOption,
                              {
                                backgroundColor: isSelected ? "rgba(255, 140, 66, 0.3)" : "rgba(255, 255, 255, 0.3)",
                                borderColor: isSelected ? "#FF8C42" : "rgba(255, 140, 66, 0.2)",
                              },
                            ]}
                            onPress={() => {
                              setSelectedIcon(iconName);
                              if (Platform.OS !== "web") {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                            }}
                          >
                            <IconComponent
                              color={isSelected ? "#FF8C42" : "#A0522D"}
                              size={24}
                              strokeWidth={2}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={styles.inputActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setIsAdding(false);
                          setNewHabitTitle("");
                          setSelectedIcon("Coffee");
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>{common.cancel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleAddHabit}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={["#FF8C42", "#FFB84D"]}
                          style={styles.saveButtonGradient}
                        >
                          <Text style={styles.saveButtonText}>{t.add}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                )}
              </Animated.View>
            )}

            {isEditing && editingHabit && (
              <Animated.View style={styles.inputCard}>
                {Platform.OS === "web" ? (
                  <View style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder={t.editHabitPlaceholder}
                      placeholderTextColor="rgba(120, 60, 20, 0.5)"
                      value={newHabitTitle}
                      onChangeText={setNewHabitTitle}
                      multiline
                      autoFocus
                    />
                    <Text style={styles.iconLabel}>{t.chooseIcon}</Text>
                    <View style={styles.iconGrid}>
                      {availableIcons.map((iconName) => {
                        const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
                        const isSelected = selectedIcon === iconName;
                        
                        return (
                          <TouchableOpacity
                            key={iconName}
                            style={[
                              styles.iconOption,
                              {
                                backgroundColor: isSelected ? "rgba(255, 140, 66, 0.3)" : "rgba(255, 255, 255, 0.3)",
                                borderColor: isSelected ? "#FF8C42" : "rgba(255, 140, 66, 0.2)",
                              },
                            ]}
                            onPress={() => {
                              setSelectedIcon(iconName);
                              if (Platform.OS !== "web") {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                            }}
                          >
                            <IconComponent
                              color={isSelected ? "#FF8C42" : "#A0522D"}
                              size={24}
                              strokeWidth={2}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={styles.inputActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setIsEditing(false);
                          setEditingHabit(null);
                          setNewHabitTitle("");
                          setSelectedIcon("Coffee");
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>{common.cancel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleEditHabit}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={["#FF8C42", "#FFB84D"]}
                          style={styles.saveButtonGradient}
                        >
                          <Text style={styles.saveButtonText}>{t.save}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <BlurView intensity={20} tint="light" style={styles.inputCardInner}>
                    <TextInput
                      style={styles.input}
                      placeholder={t.editHabitPlaceholder}
                      placeholderTextColor="rgba(120, 60, 20, 0.5)"
                      value={newHabitTitle}
                      onChangeText={setNewHabitTitle}
                      multiline
                      autoFocus
                    />
                    <Text style={styles.iconLabel}>{t.chooseIcon}</Text>
                    <View style={styles.iconGrid}>
                      {availableIcons.map((iconName) => {
                        const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
                        const isSelected = selectedIcon === iconName;
                        
                        return (
                          <TouchableOpacity
                            key={iconName}
                            style={[
                              styles.iconOption,
                              {
                                backgroundColor: isSelected ? "rgba(255, 140, 66, 0.3)" : "rgba(255, 255, 255, 0.3)",
                                borderColor: isSelected ? "#FF8C42" : "rgba(255, 140, 66, 0.2)",
                              },
                            ]}
                            onPress={() => {
                              setSelectedIcon(iconName);
                              if (Platform.OS !== "web") {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                            }}
                          >
                            <IconComponent
                              color={isSelected ? "#FF8C42" : "#A0522D"}
                              size={24}
                              strokeWidth={2}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <View style={styles.inputActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setIsEditing(false);
                          setEditingHabit(null);
                          setNewHabitTitle("");
                          setSelectedIcon("Coffee");
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>{common.cancel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleEditHabit}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={["#FF8C42", "#FFB84D"]}
                          style={styles.saveButtonGradient}
                        >
                          <Text style={styles.saveButtonText}>{t.save}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                )}
              </Animated.View>
            )}

            <View style={styles.entriesContainer}>
              {habits.map((habit) => {
                const Icon = getIconComponent(habit.icon);
                
                return (
                  <Animated.View key={habit.id} style={styles.entryCard}>
                    {Platform.OS === "web" ? (
                      <View style={styles.entryCardInner}>
                        <TouchableOpacity
                          onPress={() => handleToggleHabit(habit.id)}
                          style={styles.habitTouchable}
                          activeOpacity={0.7}
                        >
                          <View style={styles.habitContent}>
                            <View
                              style={[
                                styles.iconWrapper,
                                habit.completed && styles.iconWrapperCompleted,
                              ]}
                            >
                              {Icon ? (
                                <Icon
                                  color={habit.completed ? "#00CC66" : "#FF8C42"}
                                  size={28}
                                  strokeWidth={2.5}
                                />
                              ) : (
                                <Sunrise
                                  color={habit.completed ? "#00CC66" : "#FF8C42"}
                                  size={28}
                                  strokeWidth={2.5}
                                />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.habitTitle,
                                habit.completed && styles.habitTitleCompleted,
                              ]}
                            >
                              {getHabitTitle(habit)}
                            </Text>
                            <View
                              style={[
                                styles.checkboxContainer,
                                habit.completed && styles.checkboxCompleted,
                              ]}
                            >
                              {habit.completed && (
                                <Check color="#FFFFFF" size={20} strokeWidth={3} />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.habitActions}>
                          <TouchableOpacity
                            onPress={() => openEditMode(habit)}
                            style={styles.editButton}
                            activeOpacity={0.7}
                          >
                            <Edit3 color="#FF8C42" size={18} strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteHabit(habit.id)}
                            style={styles.deleteButton}
                            activeOpacity={0.7}
                          >
                            <Trash2 color="#f87171" size={18} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <BlurView intensity={15} tint="light" style={styles.entryCardInner}>
                        <TouchableOpacity
                          onPress={() => handleToggleHabit(habit.id)}
                          style={styles.habitTouchable}
                          activeOpacity={0.7}
                        >
                          <View style={styles.habitContent}>
                            <View
                              style={[
                                styles.iconWrapper,
                                habit.completed && styles.iconWrapperCompleted,
                              ]}
                            >
                              {Icon ? (
                                <Icon
                                  color={habit.completed ? "#00CC66" : "#FF8C42"}
                                  size={28}
                                  strokeWidth={2.5}
                                />
                              ) : (
                                <Sunrise
                                  color={habit.completed ? "#00CC66" : "#FF8C42"}
                                  size={28}
                                  strokeWidth={2.5}
                                />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.habitTitle,
                                habit.completed && styles.habitTitleCompleted,
                              ]}
                            >
                              {getHabitTitle(habit)}
                            </Text>
                            <View
                              style={[
                                styles.checkboxContainer,
                                habit.completed && styles.checkboxCompleted,
                              ]}
                            >
                              {habit.completed && (
                                <Check color="#FFFFFF" size={20} strokeWidth={3} />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.habitActions}>
                          <TouchableOpacity
                            onPress={() => openEditMode(habit)}
                            style={styles.editButton}
                            activeOpacity={0.7}
                          >
                            <Edit3 color="#FF8C42" size={18} strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteHabit(habit.id)}
                            style={styles.deleteButton}
                            activeOpacity={0.7}
                          >
                            <Trash2 color="#f87171" size={18} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      </BlurView>
                    )}
                  </Animated.View>
                );
              })}

              {habits.length === 0 && !isAdding && (
                <View style={styles.emptyState}>
                  <Sunrise
                    color="#D4A574"
                    size={64}
                    strokeWidth={1.5}
                    fill="#D4A574"
                    fillOpacity={0.1}
                  />
                  <Text style={styles.emptyStateText}>
                    {t.startBuilding}
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    {t.tapToAdd}
                  </Text>
                </View>
              )}
            </View>

            {completedCount === totalCount && totalCount > 0 && (
              <View style={styles.celebrationCard}>
                <LinearGradient
                  colors={["#FF8C42", "#FFB84D"]}
                  style={styles.celebrationGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.celebrationEmoji}>🌟</Text>
                  <Text style={styles.celebrationTitle}>{t.incredible}</Text>
                  <Text style={styles.celebrationText}>
                    {t.allCompleted}
                  </Text>
                </LinearGradient>
              </View>
            )}

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
  star: {
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
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FF8C42",
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
    marginBottom: 20,
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
    color: "#A0522D",
  },
  quoteText: {
    fontSize: 18,
    fontWeight: "500" as const,
    lineHeight: 28,
    color: "#783C14",
    letterSpacing: 0.3,
  },
  progressCard: {
    marginBottom: 28,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 16,
    color: "#A0522D",
    letterSpacing: 0.3,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 12,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(160, 82, 45, 0.2)",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600" as const,
    textAlign: "center",
    color: "#A0522D",
    letterSpacing: 0.2,
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
    color: "#A0522D",
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
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.3)",
  },
  inputCardInner: {
    padding: 20,
  },
  input: {
    fontSize: 16,
    color: "#783C14",
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  iconLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#A0522D",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
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
    color: "#A0522D",
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
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.2)",
  },
  entryCardInner: {
    padding: 20,
  },
  habitTouchable: {
    marginBottom: 12,
  },
  habitContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 140, 66, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.3)",
  },
  iconWrapperCompleted: {
    backgroundColor: "rgba(0, 204, 102, 0.2)",
    borderColor: "rgba(0, 204, 102, 0.4)",
  },
  habitTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#783C14",
    letterSpacing: 0.3,
  },
  habitTitleCompleted: {
    color: "#00CC66",
  },
  checkboxContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 140, 66, 0.1)",
    borderWidth: 2,
    borderColor: "#FF8C42",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#00CC66",
    borderColor: "#00CC66",
  },
  habitActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
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
    color: "#A0522D",
    letterSpacing: 0.3,
  },
  emptyStateSubtext: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#C4956C",
    letterSpacing: 0.2,
  },
  celebrationCard: {
    marginTop: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  celebrationGradient: {
    padding: 32,
    alignItems: "center",
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  celebrationText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    lineHeight: 22,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#A0522D",
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
