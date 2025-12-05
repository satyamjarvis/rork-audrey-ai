import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Plus,
  Calendar as CalendarIcon,
  Share2,
  Trash2,
  Users,
  Mail,
  X,
  MessageCircle,
  Phone,
  Settings,
  Download,
  Eye,
  Shield,
  Globe,
  Sparkles,
  Clock,
  CheckCircle,
  Target,
  TrendingUp,
} from "lucide-react-native";
import { router, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/utils/i18n";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";
import QuickPressable from "@/components/QuickPressable";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CalendarManagerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = getTranslations(language);
  const { notifyCalendarOpened } = useMusicPlayer();
  const {
    calendars,
    selectedCalendar,
    setSelectedCalendar,
    createCalendar,
    deleteCalendar,
    shareCalendar,
    updateCalendarSettings,
  } = useCalendar();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [calendarToShare, setCalendarToShare] = useState<string | null>(null);
  const [calendarToEdit, setCalendarToEdit] = useState<string | null>(null);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [isSharedCalendar, setIsSharedCalendar] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePhone, setSharePhone] = useState("");
  const [shareMethod, setShareMethod] = useState<"email" | "phone">("email");
  const [allowDownload, setAllowDownload] = useState(true);

  // Animation values
  const heartPulse = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  const getScaleAnim = (id: string) => {
    if (!scaleAnims[id]) {
      scaleAnims[id] = new Animated.Value(1);
    }
    return scaleAnims[id];
  };

  // Determine theme colors  
  const isNightMode = useMemo(() => {
    return theme.name.toLowerCase().includes('night') || 
           theme.name.toLowerCase().includes('dark');
  }, [theme.name]);

  const colors = useMemo(() => ({
    primary: isNightMode ? "#FFD700" : theme.colors.primary,
    secondary: isNightMode ? "#FF1493" : theme.colors.secondary,
    accent: isNightMode ? "#FF1493" : "#d946ef",
    cardBg: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
    cardBorder: isNightMode ? "rgba(255, 215, 0, 0.2)" : theme.colors.border,
    textPrimary: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
    textSecondary: isNightMode ? "rgba(255, 20, 147, 0.8)" : theme.colors.text.secondary,
  }), [isNightMode, theme]);

  const gradientColors: readonly [string, string, ...string[]] = useMemo(() => {
    if (isNightMode) {
      return ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] as const;
    }
    const bg = theme.gradients.background;
    if (Array.isArray(bg) && bg.length >= 2) {
      return bg as unknown as readonly [string, string, ...string[]];
    }
    return [theme.colors.primary, theme.colors.secondary] as const;
  }, [isNightMode, theme]);

  const handleBackPress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/planner');
    }
  }, []);

  const handleCreateCalendar = async () => {
    if (!newCalendarName.trim()) {
      Alert.alert(t.common.error, t.calendarManager.createModal.errorName);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await createCalendar(newCalendarName.trim(), isSharedCalendar);
    setNewCalendarName("");
    setIsSharedCalendar(false);
    setCreateModalVisible(false);
  };

  const handleDeleteCalendar = (calendarId: string, calendarName: string) => {
    Alert.alert(
      t.calendarManager.deleteAlert.title,
      t.calendarManager.deleteAlert.message.replace("{name}", calendarName),
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.common.delete,
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteCalendar(calendarId);
          },
        },
      ]
    );
  };

  const handleSharePress = (calendarId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCalendarToShare(calendarId);
    setShareModalVisible(true);
  };

  const handleSettingsPress = (calendarId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const calendar = calendars.find(cal => cal.id === calendarId);
    if (calendar) {
      setCalendarToEdit(calendarId);
      setAllowDownload(calendar.attachmentSettings?.allowDownload ?? true);
      setSettingsModalVisible(true);
    }
  };

  const handleSaveSettings = async () => {
    if (!calendarToEdit) return;
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await updateCalendarSettings(calendarToEdit, { allowDownload });
    setSettingsModalVisible(false);
    setCalendarToEdit(null);
  };

  const handleShareCalendar = async () => {
    if (!calendarToShare) {
      return;
    }

    if (shareMethod === "email") {
      if (!shareEmail.trim()) {
        Alert.alert(t.common.error, t.calendarManager.shareModal.errorEmail);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(shareEmail.trim())) {
        Alert.alert(t.common.error, t.calendarManager.shareModal.errorValidEmail);
        return;
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await shareCalendar(calendarToShare, shareEmail.trim());
      Alert.alert(
        t.calendarManager.shareModal.invitationSent,
        t.calendarManager.shareModal.sentTo.replace("{email}", shareEmail.trim())
      );
    } else {
      if (!sharePhone.trim()) {
        Alert.alert(t.common.error, t.calendarManager.shareModal.errorPhone);
        return;
      }

      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanedPhone = sharePhone.trim().replace(/[\s()-]/g, "");
      if (!phoneRegex.test(cleanedPhone)) {
        Alert.alert(t.common.error, t.calendarManager.shareModal.errorValidPhone);
        return;
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await shareCalendar(calendarToShare, `phone:${cleanedPhone}`);
      Alert.alert(
        t.calendarManager.shareModal.invitationSent,
        t.calendarManager.shareModal.smsSentTo.replace("{phone}", sharePhone.trim())
      );
    }

    setShareEmail("");
    setSharePhone("");
    setShareModalVisible(false);
    setCalendarToShare(null);
  };



  const handleCalendarPress = (calendar: typeof calendars[0]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const scaleAnim = getScaleAnim(calendar.id);
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

    setSelectedCalendar(calendar);
  };



  // Notify that calendar page opened for music timing  
  useEffect(() => {
    notifyCalendarOpened();
  }, [notifyCalendarOpened]);

  // Animations setup
  useEffect(() => {
    // Entrance animations
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

    // Heart pulse animation
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

    // Stars rotation
    Animated.loop(
      Animated.timing(starsRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Sparkle animation
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
  }, [fadeAnim, slideAnim, heartPulse, starsRotate, sparkleOpacity]);

  // Generate decorative elements
  const starPositions = useMemo(() => {
    return Array.from({ length: 25 }, () => ({
      left: Math.random() * SCREEN_WIDTH,
      top: Math.random() * 350,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  const glitterParticles = useMemo(() => {
    return Array.from({ length: 30 }, () => {
      const spreadX = (Math.random() - 0.5) * SCREEN_WIDTH;
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

  // Animate glitter particles
  useEffect(() => {
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
  }, [glitterParticles]);

  const starsRotateInterpolate = starsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const stats = useMemo(() => {
    const total = calendars.length;
    const shared = calendars.filter(c => c.isShared).length;
    const personal = total - shared;
    const totalUsers = calendars.reduce((acc, c) => acc + c.sharedWith.length, 0);

    return { total, shared, personal, totalUsers };
  }, [calendars]);



  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {/* Stars background */}
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

        {/* Glitter particles */}
        {glitterParticles.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.glitterDot,
              {
                width: particle.size,
                height: particle.size,
                left: particle.x + SCREEN_WIDTH / 2,
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

        {/* Back button */}
        <TouchableOpacity
          style={[
            styles.backButton, 
            { 
              top: insets.top + 8,
              backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 192, 203, 0.15)"
            }
          ]}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.primary} size={28} strokeWidth={2.5} />
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
                  <CalendarIcon
                    color={colors.primary}
                    size={48}
                    strokeWidth={2}
                  />
                </Animated.View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.primary }]}>{t.calendarManager.title}</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t.calendarManager.calendarsCount.replace('{count}', calendars.length.toString())}</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                  <Sparkles color={colors.accent} size={32} strokeWidth={1.5} />
                </Animated.View>
              </View>
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
              {/* Stats Card */}
              {Platform.OS === "web" ? (
                <View style={[styles.statsCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <View style={styles.statsOverlay}>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Target color={colors.primary} size={24} />
                        <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendarManager.stats.total}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Users color="#30CFD0" size={24} />
                        <Text style={[styles.statValue, { color: "#30CFD0" }]}>{stats.shared}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendarManager.stats.shared}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Shield color="#FFB84D" size={24} />
                        <Text style={[styles.statValue, { color: "#FFB84D" }]}>{stats.personal}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendarManager.stats.personal}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <TrendingUp color="#FA709A" size={24} />
                        <Text style={[styles.statValue, { color: "#FA709A" }]}>{stats.totalUsers}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendarManager.stats.users}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <BlurView intensity={20} tint="dark" style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
                  <View style={styles.statsOverlay}>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Target color={colors.primary} size={24} />
                        <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendarManager.stats.total}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Users color="#30CFD0" size={24} />
                        <Text style={[styles.statValue, { color: "#30CFD0" }]}>{stats.shared}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendarManager.stats.shared}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Shield color="#FFB84D" size={24} />
                        <Text style={[styles.statValue, { color: "#FFB84D" }]}>{stats.personal}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendarManager.stats.personal}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <TrendingUp color="#FA709A" size={24} />
                        <Text style={[styles.statValue, { color: "#FA709A" }]}>{stats.totalUsers}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.calendarManager.stats.users}</Text>
                      </View>
                    </View>
                  </View>
                </BlurView>
              )}
              {/* Calendars Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sparkles color={colors.primary} size={20} strokeWidth={2} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.calendarManager.yourCalendars}</Text>
                </View>

                <View style={styles.calendarsGrid}>
                  {calendars.map((calendar) => {
                    const scaleAnim = getScaleAnim(calendar.id);
                    const isSelected = selectedCalendar?.id === calendar.id;

                    return (
                      <Animated.View
                        key={calendar.id}
                        style={[
                          { transform: [{ scale: scaleAnim }] },
                        ]}
                      >
                        <View style={[styles.calendarCard, { backgroundColor: colors.cardBg, borderColor: isSelected ? colors.primary : colors.cardBorder }]}>
                          <View style={styles.calendarItemOverlay}>
                            <TouchableOpacity 
                              onPress={() => handleCalendarPress(calendar)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              {isSelected ? (
                                <CheckCircle color={colors.primary} size={24} strokeWidth={2.5} />
                              ) : (
                                <CalendarIcon color={colors.textSecondary} size={24} strokeWidth={2.5} />
                              )}
                            </TouchableOpacity>

                            <View style={styles.calendarContent}>
                              <Text 
                                style={[
                                  styles.calendarName,
                                  { color: colors.textPrimary },
                                  isSelected && styles.calendarNameSelected
                                ]}
                                numberOfLines={2}
                              >
                                {calendar.name}
                              </Text>

                              {calendar.isShared && (
                                <View style={styles.calendarMeta}>
                                  <View style={[styles.metaBadge, { backgroundColor: "#2196F3" }]}>
                                    <Text style={styles.metaBadgeText}>{t.calendarManager.badges.shared}</Text>
                                  </View>
                                  {calendar.sharedWith.length > 0 && (
                                    <View style={[styles.metaBadge, { backgroundColor: "#9C27B0" }]}>
                                      <Text style={styles.metaBadgeText}>{t.calendarManager.badges.users.replace('{count}', calendar.sharedWith.length.toString())}</Text>
                                    </View>
                                  )}
                                </View>
                              )}

                              {calendar.isShared && calendar.sharedWith.length > 0 && (
                                <View style={styles.sharedUsersRow}>
                                  <Users color={colors.textSecondary} size={12} />
                                  {calendar.sharedWith.slice(0, 2).map((email, idx) => (
                                    <Text key={idx} style={[styles.sharedUserText, { color: colors.textSecondary }]}>
                                      {email.split('@')[0]}
                                    </Text>
                                  ))}
                                  {calendar.sharedWith.length > 2 && (
                                    <Text style={[styles.sharedUserText, { color: colors.textSecondary }]}>
                                      +{calendar.sharedWith.length - 2}
                                    </Text>
                                  )}
                                </View>
                              )}
                                <View style={styles.colorDotRow}>
                                  <View style={[styles.colorDot, { backgroundColor: calendar.color }]} />
                                  <Text style={[styles.colorText, { color: colors.textSecondary }]}>{t.calendarManager.badges.colorTag}</Text>
                                </View>
                              </View>

                            <View style={styles.calendarActions}>
                              <TouchableOpacity 
                                onPress={() => {
                                  if (Platform.OS !== "web") {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  }
                                  router.push(`/calendar-chat?calendarId=${calendar.id}`);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <MessageCircle color="#d946ef" size={18} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => handleSharePress(calendar.id)} 
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Share2 color="#30CFD0" size={18} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => handleSettingsPress(calendar.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Settings color="#FFB84D" size={18} />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                onPress={() => handleDeleteCalendar(calendar.id, calendar.name)} 
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Trash2 color="#f87171" size={18} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>

              {/* Features Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Shield color={colors.primary} size={20} strokeWidth={2} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t.calendarManager.features}</Text>
                </View>

                <View style={styles.featuresGrid}>
                  <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Shield color={colors.primary} size={24} strokeWidth={2} />
                    </View>
                    <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{t.calendarManager.featureCards.encrypted}</Text>
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      {t.calendarManager.featureCards.encryptionDesc}
                    </Text>
                  </View>

                  <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Globe color={colors.primary} size={24} strokeWidth={2} />
                    </View>
                    <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{t.calendarManager.featureCards.smartSync}</Text>
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      {t.calendarManager.featureCards.syncDesc}
                    </Text>
                  </View>

                  <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Users color={colors.primary} size={24} strokeWidth={2} />
                    </View>
                    <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{t.calendarManager.featureCards.collaborate}</Text>
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      {t.calendarManager.featureCards.collaborateDesc}
                    </Text>
                  </View>

                  <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Clock color={colors.primary} size={24} strokeWidth={2} />
                    </View>
                    <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{t.calendarManager.featureCards.smartPlans}</Text>
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      {t.calendarManager.featureCards.plansDesc}
                    </Text>
                  </View>
                </View>
              </View>

              <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  {t.calendarManager.footer}
                </Text>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </View>

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => setCreateModalVisible(true)} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.accent, "#a855f7"]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus color="#FFFFFF" size={32} strokeWidth={3} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent} bounces={false}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground, paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{t.calendarManager.createModal.title}</Text>
                <View style={styles.modalHeaderActions}>
                  <KeyboardDismissButton color={theme.colors.text.primary} size={20} />
                  <QuickPressable onPress={() => { setCreateModalVisible(false); setNewCalendarName(""); setIsSharedCalendar(false); }}>
                    <Text style={[styles.modalClose, { color: theme.colors.text.primary }]}>✕</Text>
                  </QuickPressable>
                </View>
              </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.colors.text.primary }]}>{t.calendarManager.createModal.nameLabel}</Text>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary, 
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background, 
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border 
                  }
                ]}
                placeholder={t.calendarManager.createModal.namePlaceholder}
                placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                value={newCalendarName}
                onChangeText={setNewCalendarName}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setIsSharedCalendar(!isSharedCalendar);
              }}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: theme.colors.border },
                  isSharedCalendar && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
                ]}
              >
                {isSharedCalendar && (
                  <View style={styles.checkboxInner} />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.colors.text.primary }]}>{t.calendarManager.createModal.sharedLabel}</Text>
            </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateCalendar}
              >
                <LinearGradient colors={[colors.accent, "#a855f7"]} style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>{t.calendarManager.createModal.submit}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShareModalVisible(false);
          setCalendarToShare(null);
          setShareEmail("");
          setSharePhone("");
          setShareMethod("email");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconCircle, { backgroundColor: isNightMode ? 'rgba(255, 215, 0, 0.2)' : `${theme.colors.primary}20` }]}>
                  <Share2 color={theme.colors.primary} size={20} strokeWidth={2.5} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{t.calendarManager.shareModal.title}</Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <KeyboardDismissButton color={theme.colors.text.primary} size={20} style={[styles.keyboardDismissButton, { backgroundColor: isNightMode ? 'rgba(255, 215, 0, 0.15)' : `${theme.colors.primary}15` }]} />
                <TouchableOpacity
                  onPress={() => {
                    setShareModalVisible(false);
                    setCalendarToShare(null);
                    setShareEmail("");
                    setSharePhone("");
                    setShareMethod("email");
                  }}
                  style={styles.closeButton}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <X color={theme.colors.text.primary} size={24} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.shareMethodToggle}>
              <TouchableOpacity
                style={[
                  styles.shareMethodButton,
                  { 
                    backgroundColor: shareMethod === "email" ? theme.colors.primary : theme.colors.background,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShareMethod("email");
                }}
              >
                <Mail
                  color={shareMethod === "email" ? "#FFFFFF" : theme.colors.text.secondary}
                  size={18}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.shareMethodText,
                    { color: shareMethod === "email" ? "#FFFFFF" : theme.colors.text.secondary }
                  ]}
                >
                  {t.calendarManager.shareModal.email}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.shareMethodButton,
                  { 
                    backgroundColor: shareMethod === "phone" ? theme.colors.primary : theme.colors.background,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShareMethod("phone");
                }}
              >
                <Phone
                  color={shareMethod === "phone" ? "#FFFFFF" : theme.colors.text.secondary}
                  size={18}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.shareMethodText,
                    { color: shareMethod === "phone" ? "#FFFFFF" : theme.colors.text.secondary }
                  ]}
                >
                  {t.calendarManager.shareModal.phone}
                </Text>
              </TouchableOpacity>
            </View>

            {shareMethod === "email" ? (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text.primary }]}>{t.calendarManager.shareModal.emailLabel}</Text>
                <View style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background, 
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border 
                  }
                ]}>
                  <Mail color={isNightMode ? "#FFD700" : theme.colors.text.secondary} size={18} strokeWidth={2} />
                  <TextInput
                    style={[styles.input, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}
                    placeholder={t.calendarManager.shareModal.emailPlaceholder}
                    placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                    value={shareEmail}
                    onChangeText={setShareEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                  />
                </View>
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text.primary }]}>{t.calendarManager.shareModal.phoneLabel}</Text>
                <View style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background, 
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border 
                  }
                ]}>
                  <Phone color={isNightMode ? "#FFD700" : theme.colors.text.secondary} size={18} strokeWidth={2} />
                  <TextInput
                    style={[styles.input, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}
                    placeholder={t.calendarManager.shareModal.phonePlaceholder}
                    placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                    value={sharePhone}
                    onChangeText={setSharePhone}
                    keyboardType="phone-pad"
                    autoFocus
                  />
                </View>
              </View>
            )}

            <View style={[styles.infoBox, { backgroundColor: isNightMode ? 'rgba(255, 215, 0, 0.1)' : `${theme.colors.primary}10`, borderColor: theme.colors.border }]}>
              <Share2 color={theme.colors.primary} size={18} strokeWidth={2} />
              <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                {shareMethod === "email"
                  ? t.calendarManager.shareModal.emailInfo
                  : t.calendarManager.shareModal.smsInfo}
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleShareCalendar}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>{t.calendarManager.shareModal.submit}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={settingsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setSettingsModalVisible(false);
          setCalendarToEdit(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconCircle, { backgroundColor: isNightMode ? 'rgba(255, 215, 0, 0.2)' : `${theme.colors.primary}20` }]}>
                  <Settings color={theme.colors.primary} size={20} strokeWidth={2.5} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{t.calendarManager.settingsModal.title}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSettingsModalVisible(false);
                  setCalendarToEdit(null);
                }}
                style={styles.closeButton}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <X color={theme.colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.settingsTitle, { color: theme.colors.text.primary }]}>{t.calendarManager.settingsModal.permissionsTitle}</Text>
              <Text style={[styles.settingsDescription, { color: theme.colors.text.secondary }]}>
                {t.calendarManager.settingsModal.permissionsDesc}
              </Text>

              <TouchableOpacity
                style={[styles.settingOption, { backgroundColor: theme.colors.background, borderColor: allowDownload ? theme.colors.primary : theme.colors.border }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setAllowDownload(true);
                }}
              >
                <View style={styles.settingOptionLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: isNightMode ? 'rgba(255, 215, 0, 0.15)' : `${theme.colors.primary}15` }]}>
                    <Download color={theme.colors.primary} size={18} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={[styles.settingOptionTitle, { color: theme.colors.text.primary }]}>{t.calendarManager.settingsModal.allowDownload}</Text>
                    <Text style={[styles.settingOptionDescription, { color: theme.colors.text.secondary }]}>
                      {t.calendarManager.settingsModal.allowDownloadDesc}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    { borderColor: allowDownload ? theme.colors.primary : theme.colors.border },
                  ]}
                >
                  {allowDownload && <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.primary }]} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingOption, { backgroundColor: theme.colors.background, borderColor: !allowDownload ? theme.colors.primary : theme.colors.border }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setAllowDownload(false);
                }}
              >
                <View style={styles.settingOptionLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: isNightMode ? 'rgba(255, 215, 0, 0.15)' : `${theme.colors.primary}15` }]}>
                    <Eye color={theme.colors.primary} size={18} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={[styles.settingOptionTitle, { color: theme.colors.text.primary }]}>{t.calendarManager.settingsModal.viewOnly}</Text>
                    <Text style={[styles.settingOptionDescription, { color: theme.colors.text.secondary }]}>
                      {t.calendarManager.settingsModal.viewOnlyDesc}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    { borderColor: !allowDownload ? theme.colors.primary : theme.colors.border },
                  ]}
                >
                  {!allowDownload && <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.primary }]} />}
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveSettings}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>{t.calendarManager.settingsModal.save}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "#ffffff",
    borderRadius: 50,
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
  backButton: {
    position: "absolute" as const,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 22,
    backgroundColor: "rgba(255, 192, 203, 0.15)",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  headerRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 140,
  },
  statsCard: {
    borderRadius: 24,
    overflow: "hidden" as const,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.2)",
  },
  statsOverlay: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
  },
  statItem: {
    alignItems: "center" as const,
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800" as const,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  calendarsGrid: {
    gap: 12,
  },
  calendarCard: {
    borderRadius: 24,
    overflow: "hidden" as const,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.2)",
  },
  calendarItemOverlay: {
    flexDirection: "row" as const,
    padding: 16,
    gap: 12,
  },
  calendarContent: {
    flex: 1,
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  calendarName: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  calendarNameSelected: {
    fontWeight: "800" as const,
  },
  calendarMeta: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  sharedUsersRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    flexWrap: "wrap" as const,
  },
  sharedUserText: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  colorDotRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  colorText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sharedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  sharedInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  chatButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sharedUsers: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  userEmail: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500" as const,
  },
  calendarActions: {
    gap: 12,
    justifyContent: "center" as const,
  },
  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
  },
  modalHeaderActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  keyboardDismissButton: {
    borderRadius: 8,
    padding: 6,
  },
  closeButton: {
    padding: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 10,
  },
  textInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500" as const,
    borderWidth: 1,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  shareMethodToggle: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  shareMethodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareMethodText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
  },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    alignItems: "flex-start",
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500" as const,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  settingsDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 19,
  },
  settingOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
  },
  settingOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  settingOptionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  settingOptionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fab: {
    position: "absolute" as const,
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#d946ef",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 32,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden" as const,
    elevation: 2,
    shadowColor: "#d946ef",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginTop: 8,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end" as const,
  },
  modalClose: {
    fontSize: 28,
    fontWeight: "300" as const,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    textAlign: "center" as const,
    letterSpacing: 0.5,
    opacity: 0.7,
    fontStyle: "italic" as const,
  },
});
