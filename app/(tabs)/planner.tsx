import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  CheckSquare,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Paintbrush,
  ListTodo,
  Clock,
  Flame,
  Star,
  ChevronRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useCalendar } from "@/contexts/CalendarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePlanner } from "@/contexts/PlannerContext";
import { getCalendarBackground } from '@/constants/calendarBackgrounds';

type PlannerView = "yearly" | "monthly" | "weekly" | "daily" | null;

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { calendars, selectedCalendar, selectedBackground } = useCalendar();
  const { pendingTasks, todayTasks, overdueTasks, upcomingTasks, isLoading } = usePlanner();
  const [selectedPlannerView, setSelectedPlannerView] = useState<PlannerView>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnimYearly = useRef(new Animated.Value(0)).current;
  const slideAnimMonthly = useRef(new Animated.Value(0)).current;
  const slideAnimWeekly = useRef(new Animated.Value(0)).current;
  const slideAnimDaily = useRef(new Animated.Value(0)).current;

  const isNightMode = useMemo(() => theme.id === 'night-mode' || theme.id === 'night', [theme.id]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animation for grid items
    const staggerDelay = 100;
    const animations = [
      { anim: slideAnimYearly, delay: 0 },
      { anim: slideAnimMonthly, delay: staggerDelay },
      { anim: slideAnimWeekly, delay: staggerDelay * 2 },
      { anim: slideAnimDaily, delay: staggerDelay * 3 },
    ];

    animations.forEach(({ anim, delay }) => {
      setTimeout(() => {
        Animated.spring(anim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, delay);
    });

    return () => {
      animations.forEach(({ anim }) => {
        anim.stopAnimation();
      });
    };
  }, []);



  const selectPlannerView = useCallback((view: PlannerView) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const routes: Record<string, string> = {
      yearly: "/yearly-planner",
      monthly: "/monthly-planner",
      weekly: "/weekly-planner",
      daily: "/daily-planner",
    };

    if (view && routes[view]) {
      router.push(routes[view] as any);
    } else {
      setSelectedPlannerView(view);
      console.log(`Opening ${view} planner view`);
    }
  }, []);

  const openCalendarManager = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/calendar-manager");
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh - in real app this would reload data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // Memoized stats summary
  const taskStats = useMemo(() => ({
    total: pendingTasks.length,
    today: todayTasks.length,
    overdue: overdueTasks.length,
    upcoming: upcomingTasks.length,
  }), [pendingTasks, todayTasks, overdueTasks, upcomingTasks]);

  const activeBackground = useMemo(() => {
    if (selectedBackground && selectedBackground !== 'default') {
      return getCalendarBackground(selectedBackground);
    }
    return null;
  }, [selectedBackground]);

  const textColor = activeBackground ? "#FFFFFF" : (isNightMode ? "#FFD700" : "#1A2B3C");
  const subtextColor = activeBackground ? "#E0E0E0" : (isNightMode ? "#FF1493" : "#6B9BD1");
  const cardBg = activeBackground ? "rgba(0,0,0,0.4)" : (isNightMode ? "rgba(26, 10, 31, 0.8)" : "#FFFFFF");
  const cardBorder = activeBackground ? "rgba(255,255,255,0.3)" : (isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(107, 155, 209, 0.1)");

  const shinyTextStyle = activeBackground ? {
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    color: '#FFFFFF',
  } : {};

  const shinySubtextStyle = activeBackground ? {
    textShadowColor: '#00F5FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    color: '#E8F4FF',
  } : {};

  const shinyAccentStyle = activeBackground ? {
    textShadowColor: '#FF69B4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  } : {};



  return (
    <View style={styles.container}>
      {activeBackground ? (
        <ImageBackground
          source={{ uri: activeBackground.url }}
          style={styles.gradient}
          resizeMode="cover"
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <Animated.View 
              style={[
                styles.header, 
                { 
                  paddingTop: insets.top + 16,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <View style={styles.headerTitleContainer}>
                <View style={[styles.iconWrapper, { 
                  backgroundColor: activeBackground ? "rgba(255, 255, 255, 0.2)" : (isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(107, 155, 209, 0.15)")
                }]}>
                  <ListTodo 
                    color={activeBackground ? "#FFFFFF" : (isNightMode ? "#FFD700" : "#6B9BD1")} 
                    size={24} 
                    strokeWidth={2.5} 
                  />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.headerTitle, { color: textColor }, shinyTextStyle]}>Seraphim Schedule</Text>
                  <Text style={[styles.headerSubtitle, { color: subtextColor }, shinySubtextStyle]}>
                    Master Your Schedule
                  </Text>
                </View>
              </View>
              
              {(taskStats.today > 0 || taskStats.overdue > 0 || taskStats.upcoming > 0) && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.quickStatsContainer}
                >
                  <View style={styles.quickStatsRow}>
                    {taskStats.today > 0 && (
                      <Animated.View style={{ 
                        opacity: fadeAnim,
                        transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
                      }}>
                        <View style={[styles.statBadge, { 
                          backgroundColor: activeBackground ? "rgba(0, 255, 135, 0.3)" : (isNightMode ? "rgba(0, 255, 135, 0.15)" : "rgba(76, 175, 80, 0.15)")
                        }]}>
                          <Clock color={activeBackground ? "#FFFFFF" : (isNightMode ? "#00FF87" : "#4CAF50")} size={16} strokeWidth={2.5} />
                          <Text style={[styles.statBadgeText, { color: activeBackground ? "#00FF87" : (isNightMode ? "#00FF87" : "#4CAF50") }, activeBackground && styles.shinyBadgeText]}>
                            {taskStats.today} Today
                          </Text>
                        </View>
                      </Animated.View>
                    )}
                    {taskStats.overdue > 0 && (
                      <Animated.View style={{ 
                        opacity: fadeAnim,
                        transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
                      }}>
                        <View style={[styles.statBadge, { 
                          backgroundColor: activeBackground ? "rgba(255, 20, 147, 0.3)" : (isNightMode ? "rgba(255, 20, 147, 0.15)" : "rgba(245, 87, 108, 0.15)")
                        }]}>
                          <Flame color={activeBackground ? "#FFFFFF" : (isNightMode ? "#FF1493" : "#F5576C")} size={16} strokeWidth={2.5} />
                          <Text style={[styles.statBadgeText, { color: activeBackground ? "#FF69B4" : (isNightMode ? "#FF1493" : "#F5576C") }, activeBackground && styles.shinyBadgeText]}>
                            {taskStats.overdue} Overdue
                          </Text>
                        </View>
                      </Animated.View>
                    )}
                    {taskStats.upcoming > 0 && (
                      <Animated.View style={{ 
                        opacity: fadeAnim,
                        transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
                      }}>
                        <View style={[styles.statBadge, { 
                          backgroundColor: activeBackground ? "rgba(107, 155, 209, 0.3)" : (isNightMode ? "rgba(107, 155, 209, 0.15)" : "rgba(33, 150, 243, 0.15)")
                        }]}>
                          <TrendingUp color={activeBackground ? "#FFFFFF" : (isNightMode ? "#6B9BD1" : "#2196F3")} size={16} strokeWidth={2.5} />
                          <Text style={[styles.statBadgeText, { color: activeBackground ? "#00F5FF" : (isNightMode ? "#6B9BD1" : "#2196F3") }, activeBackground && styles.shinyBadgeText]}>
                            {taskStats.upcoming} This Week
                          </Text>
                        </View>
                      </Animated.View>
                    )}
                  </View>
                </ScrollView>
              )}
            </Animated.View>

            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[activeBackground ? "#FFFFFF" : (isNightMode ? "#FFD700" : "#6B9BD1")]}
                  tintColor={activeBackground ? "#FFFFFF" : (isNightMode ? "#FFD700" : "#6B9BD1")}
                />
              }
            >
              {!selectedPlannerView ? (
                <Animated.View 
                  style={[
                    styles.plannerOptionsGrid,
                    { opacity: fadeAnim }
                  ]}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator 
                        size="large" 
                        color={activeBackground ? "#FFFFFF" : (isNightMode ? "#FFD700" : "#6B9BD1")}
                      />
                      <Text style={[styles.loadingText, { color: textColor }, shinyTextStyle]}>
                        Loading planner data...
                      </Text>
                    </View>
                  ) : null}

                  <View style={[styles.calendarSelectorCard, { 
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: cardBorder,
                  }]}>
                    <View style={styles.calendarSelectorHeader}>
                      <View style={styles.titleRow}>
                        <Zap color={activeBackground ? "#00F5FF" : (isNightMode ? "#00F5FF" : "#6B9BD1")} size={20} strokeWidth={2.5} />
                        <Text style={[styles.calendarSelectorTitle, { color: textColor }, shinyTextStyle]}>Active Calendar</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.manageCalendarsButton}
                        onPress={openCalendarManager}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={isNightMode || activeBackground ? ["#FFD700", "#FFA500"] : ["#F093FB", "#F5576C"]}
                          style={styles.manageButtonGradient}
                        >
                          <Text style={[styles.manageCalendarsText, { color: isNightMode || activeBackground ? "#000000" : "#FFFFFF" }]}>Manage</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                    {selectedCalendar ? (
                      <View style={styles.selectedCalendarDisplay}>
                        <View
                          style={[
                            styles.calendarDot,
                            { backgroundColor: selectedCalendar.color },
                          ]}
                        />
                        <Text style={[styles.selectedCalendarName, { color: textColor }, shinyTextStyle]}>
                          {selectedCalendar.name}
                        </Text>
                        {selectedCalendar.isShared && (
                          <View style={[styles.sharedIndicator, { backgroundColor: activeBackground ? "rgba(0, 255, 135, 0.3)" : (isNightMode ? "#00FF8720" : "#6B9BD120") }]}>
                            <Text style={[styles.sharedIndicatorText, { color: activeBackground ? "#00FF87" : (isNightMode ? "#00FF87" : "#6B9BD1") }, activeBackground && styles.shinyBadgeText]}>SHARED</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={[styles.noCalendarText, { color: subtextColor }, shinySubtextStyle]}>No calendar selected</Text>
                    )}
                    <Text style={[styles.calendarCount, { color: subtextColor }, shinySubtextStyle]}>
                      {calendars.length} {calendars.length === 1 ? "calendar" : "calendars"} total
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.plannerOption, { 
                      backgroundColor: cardBg,
                      borderWidth: 1,
                      borderColor: cardBorder,
                    }]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push("/todo-list");
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={isNightMode || activeBackground ? ["rgba(255, 20, 147, 0.2)", "rgba(255, 20, 147, 0.05)"] : ["rgba(240, 147, 251, 0.15)", "rgba(245, 87, 108, 0.05)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.optionIconContainer}
                    >
                      <CheckSquare color={activeBackground ? "#FFFFFF" : (isNightMode ? "#FF1493" : "#F093FB")} size={26} strokeWidth={2.5} />
                    </LinearGradient>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.plannerOptionText, { color: textColor }, shinyTextStyle]}>To-Do List</Text>
                      <Text style={[styles.plannerOptionSubtext, { color: subtextColor }, shinySubtextStyle]}>Manage your tasks</Text>
                    </View>
                    <View style={styles.optionRightContent}>
                      {pendingTasks.length > 0 && (
                        <View style={[styles.badge, { backgroundColor: isNightMode || activeBackground ? "#FF1493" : "#F5576C" }]}>
                          <Text style={styles.badgeText}>{pendingTasks.length}</Text>
                        </View>
                      )}
                      <ChevronRight 
                        color={activeBackground ? "#FFFFFF" : (isNightMode ? "#666666" : "#A0ADB8")} 
                        size={20} 
                        strokeWidth={2}
                      />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.notesButton, { 
                      backgroundColor: cardBg,
                      borderWidth: 1,
                      borderColor: cardBorder,
                    }]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      router.push("/notes");
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={isNightMode || activeBackground ? ["rgba(255, 107, 157, 0.2)", "rgba(157, 78, 221, 0.2)"] : ["rgba(240, 147, 251, 0.15)", "rgba(255, 107, 157, 0.15)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.notesButtonGradient}
                    >
                      <View style={styles.notesButtonContent}>
                        <View style={[styles.notesIconContainer, { 
                          backgroundColor: isNightMode || activeBackground ? "rgba(255, 107, 157, 0.3)" : "rgba(255, 107, 157, 0.2)"
                        }]}>
                          <Paintbrush color={activeBackground ? "#FFFFFF" : (isNightMode ? "#FF6B9D" : "#F093FB")} size={32} strokeWidth={2.5} />
                        </View>
                        <View style={styles.notesTextContainer}>
                          <Text style={[styles.notesButtonTitle, { color: textColor }, shinyTextStyle]}>NOTES & PAD</Text>
                          <Text style={[styles.notesButtonSubtitle, { color: activeBackground ? "#FFB6D9" : (isNightMode ? "#FF6B9D" : "#9D4EDD") }, shinyAccentStyle]}>Type • Draw • Voice • Encrypt • Export</Text>
                        </View>
                        <Star 
                          color={activeBackground ? "#FFD700" : (isNightMode ? "#FFD700" : "#F093FB")} 
                          size={24} 
                          strokeWidth={2} 
                          fill={activeBackground ? "#FFD70030" : (isNightMode ? "#FFD70030" : "#F093FB20")}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.gridRow}>
                    <Animated.View style={[
                      { flex: 1 },
                      {
                        transform: [
                          { scale: slideAnimYearly.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                          { translateY: slideAnimYearly.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
                        ],
                        opacity: slideAnimYearly
                      }
                    ]}>
                      <TouchableOpacity
                        style={[styles.plannerOptionHalf, { 
                          backgroundColor: cardBg,
                          borderWidth: 1,
                          borderColor: cardBorder,
                        }]}
                        onPress={() => selectPlannerView("yearly")}
                        activeOpacity={0.7}
                      >
                      <LinearGradient
                        colors={isNightMode || activeBackground ? ["rgba(255, 215, 0, 0.2)", "rgba(255, 215, 0, 0.05)"] : ["rgba(76, 175, 80, 0.15)", "rgba(76, 175, 80, 0.05)"]}
                        style={styles.smallIconContainer}
                      >
                        <Target color={activeBackground ? "#FFFFFF" : (isNightMode ? "#FFD700" : "#4CAF50")} size={28} strokeWidth={2.5} />
                      </LinearGradient>
                        <Text style={[styles.plannerOptionTextSmall, { color: textColor }, shinyTextStyle]}>Yearly</Text>
                        <Text style={[styles.plannerOptionSubtextSmall, { color: subtextColor }, shinySubtextStyle]}>Goals</Text>
                      </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[
                      { flex: 1 },
                      {
                        transform: [
                          { scale: slideAnimMonthly.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                          { translateY: slideAnimMonthly.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
                        ],
                        opacity: slideAnimMonthly
                      }
                    ]}>
                      <TouchableOpacity
                        style={[styles.plannerOptionHalf, { 
                          backgroundColor: cardBg,
                          borderWidth: 1,
                          borderColor: cardBorder,
                        }]}
                        onPress={() => selectPlannerView("monthly")}
                        activeOpacity={0.7}
                      >
                      <LinearGradient
                        colors={isNightMode || activeBackground ? ["rgba(157, 78, 221, 0.2)", "rgba(157, 78, 221, 0.05)"] : ["rgba(33, 150, 243, 0.15)", "rgba(33, 150, 243, 0.05)"]}
                        style={styles.smallIconContainer}
                      >
                        <Calendar color={activeBackground ? "#FFFFFF" : (isNightMode ? "#9D4EDD" : "#2196F3")} size={28} strokeWidth={2.5} />
                      </LinearGradient>
                        <Text style={[styles.plannerOptionTextSmall, { color: textColor }, shinyTextStyle]}>Monthly</Text>
                        <Text style={[styles.plannerOptionSubtextSmall, { color: subtextColor }, shinySubtextStyle]}>Overview</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  <View style={styles.gridRow}>
                    <Animated.View style={[
                      { flex: 1 },
                      {
                        transform: [
                          { scale: slideAnimWeekly.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                          { translateY: slideAnimWeekly.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
                        ],
                        opacity: slideAnimWeekly
                      }
                    ]}>
                      <TouchableOpacity
                        style={[styles.plannerOptionHalf, { 
                          backgroundColor: cardBg,
                          borderWidth: 1,
                          borderColor: cardBorder,
                        }]}
                        onPress={() => selectPlannerView("weekly")}
                        activeOpacity={0.7}
                      >
                      <LinearGradient
                        colors={isNightMode || activeBackground ? ["rgba(0, 245, 255, 0.2)", "rgba(0, 245, 255, 0.05)"] : ["rgba(255, 152, 0, 0.15)", "rgba(255, 152, 0, 0.05)"]}
                        style={styles.smallIconContainer}
                      >
                        <TrendingUp color={activeBackground ? "#FFFFFF" : (isNightMode ? "#00F5FF" : "#FF9800")} size={28} strokeWidth={2.5} />
                      </LinearGradient>
                        <Text style={[styles.plannerOptionTextSmall, { color: textColor }, shinyTextStyle]}>Weekly</Text>
                        <Text style={[styles.plannerOptionSubtextSmall, { color: subtextColor }, shinySubtextStyle]}>Progress</Text>
                      </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[
                      { flex: 1 },
                      {
                        transform: [
                          { scale: slideAnimDaily.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                          { translateY: slideAnimDaily.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
                        ],
                        opacity: slideAnimDaily
                      }
                    ]}>
                      <TouchableOpacity
                        style={[styles.plannerOptionHalf, { 
                          backgroundColor: cardBg,
                          borderWidth: 1,
                          borderColor: cardBorder,
                        }]}
                        onPress={() => selectPlannerView("daily")}
                        activeOpacity={0.7}
                      >
                      <LinearGradient
                        colors={isNightMode || activeBackground ? ["rgba(0, 255, 135, 0.2)", "rgba(0, 255, 135, 0.05)"] : ["rgba(255, 184, 77, 0.15)", "rgba(255, 184, 77, 0.05)"]}
                        style={styles.smallIconContainer}
                      >
                        <Sparkles color={activeBackground ? "#FFFFFF" : (isNightMode ? "#00FF87" : "#FFB84D")} size={28} strokeWidth={2.5} />
                      </LinearGradient>
                        <Text style={[styles.plannerOptionTextSmall, { color: textColor }, shinyTextStyle]}>Daily</Text>
                        <Text style={[styles.plannerOptionSubtextSmall, { color: subtextColor }, shinySubtextStyle]}>Focus</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                </Animated.View>
              ) : (
                <View style={[styles.plannerViewContainer, { backgroundColor: cardBg }]}>
                  <Text style={[styles.plannerViewTitle, { color: textColor }, shinyTextStyle]}>
                    {selectedPlannerView.charAt(0).toUpperCase() + selectedPlannerView.slice(1)} Planner
                  </Text>
                  <Text style={[styles.plannerViewSubtitle, { color: subtextColor }, shinySubtextStyle]}>
                    This is your {selectedPlannerView} planning view. You can organize and plan your schedule here.
                  </Text>
                  <TouchableOpacity
                    style={styles.backToOptionsButton}
                    onPress={() => setSelectedPlannerView(null)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={theme.gradients.primary as any}
                      style={styles.backButtonGradient}
                    >
                      <Text style={styles.backToOptionsText}>Back to Options</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </ImageBackground>
      ) : (
      <LinearGradient
        colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.header, 
            { 
              paddingTop: insets.top + 16,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.headerTitleContainer}>
            <View style={[styles.iconWrapper, { 
              backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(107, 155, 209, 0.15)"
            }]}>
              <ListTodo 
                color={isNightMode ? "#FFD700" : "#6B9BD1"} 
                size={24} 
                strokeWidth={2.5} 
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: isNightMode ? "#FFD700" : "#1A2B3C" }]}>Seraphim Schedule</Text>
              <Text style={[styles.headerSubtitle, { color: isNightMode ? "#FF1493" : "#6B9BD1" }]}>
                Master Your Schedule
              </Text>
            </View>
          </View>
          
          {(taskStats.today > 0 || taskStats.overdue > 0 || taskStats.upcoming > 0) && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.quickStatsContainer}
            >
              <View style={styles.quickStatsRow}>
                {taskStats.today > 0 && (
                  <Animated.View style={{ 
                    opacity: fadeAnim,
                    transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
                  }}>
                    <View style={[styles.statBadge, { 
                      backgroundColor: isNightMode ? "rgba(0, 255, 135, 0.15)" : "rgba(76, 175, 80, 0.15)"
                    }]}>
                      <Clock color={isNightMode ? "#00FF87" : "#4CAF50"} size={16} strokeWidth={2.5} />
                      <Text style={[styles.statBadgeText, { color: isNightMode ? "#00FF87" : "#4CAF50" }]}>
                        {taskStats.today} Today
                      </Text>
                    </View>
                  </Animated.View>
                )}
                {taskStats.overdue > 0 && (
                  <Animated.View style={{ 
                    opacity: fadeAnim,
                    transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
                  }}>
                    <View style={[styles.statBadge, { 
                      backgroundColor: isNightMode ? "rgba(255, 20, 147, 0.15)" : "rgba(245, 87, 108, 0.15)"
                    }]}>
                      <Flame color={isNightMode ? "#FF1493" : "#F5576C"} size={16} strokeWidth={2.5} />
                      <Text style={[styles.statBadgeText, { color: isNightMode ? "#FF1493" : "#F5576C" }]}>
                        {taskStats.overdue} Overdue
                      </Text>
                    </View>
                  </Animated.View>
                )}
                {taskStats.upcoming > 0 && (
                  <Animated.View style={{ 
                    opacity: fadeAnim,
                    transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]
                  }}>
                    <View style={[styles.statBadge, { 
                      backgroundColor: isNightMode ? "rgba(107, 155, 209, 0.15)" : "rgba(33, 150, 243, 0.15)"
                    }]}>
                      <TrendingUp color={isNightMode ? "#6B9BD1" : "#2196F3"} size={16} strokeWidth={2.5} />
                      <Text style={[styles.statBadgeText, { color: isNightMode ? "#6B9BD1" : "#2196F3" }]}>
                        {taskStats.upcoming} This Week
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            </ScrollView>
          )}
        </Animated.View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isNightMode ? "#FFD700" : "#6B9BD1"]}
              tintColor={isNightMode ? "#FFD700" : "#6B9BD1"}
            />
          }
        >
          {!selectedPlannerView ? (
            <Animated.View 
              style={[
                styles.plannerOptionsGrid,
                { opacity: fadeAnim }
              ]}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator 
                    size="large" 
                    color={isNightMode ? "#FFD700" : "#6B9BD1"}
                  />
                  <Text style={[styles.loadingText, { color: isNightMode ? "#FFD700" : "#6B9BD1" }]}>
                    Loading planner data...
                  </Text>
                </View>
              ) : null}

              <View style={[styles.calendarSelectorCard, { 
                backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : "#FFFFFF",
                borderWidth: 1,
                borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(107, 155, 209, 0.1)",
              }]}>
                <View style={styles.calendarSelectorHeader}>
                  <View style={styles.titleRow}>
                    <Zap color={isNightMode ? "#00F5FF" : "#6B9BD1"} size={20} strokeWidth={2.5} />
                    <Text style={[styles.calendarSelectorTitle, { color: isNightMode ? "#FFD700" : "#1A2B3C" }]}>Active Calendar</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.manageCalendarsButton}
                    onPress={openCalendarManager}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={isNightMode ? ["#FFD700", "#FFA500"] : ["#F093FB", "#F5576C"]}
                      style={styles.manageButtonGradient}
                    >
                      <Text style={[styles.manageCalendarsText, { color: isNightMode ? "#000000" : "#FFFFFF" }]}>Manage</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                {selectedCalendar ? (
                  <View style={styles.selectedCalendarDisplay}>
                    <View
                      style={[
                        styles.calendarDot,
                        { backgroundColor: selectedCalendar.color },
                      ]}
                    />
                    <Text style={[styles.selectedCalendarName, { color: isNightMode ? "#FFFFFF" : "#1A2B3C" }]}>
                      {selectedCalendar.name}
                    </Text>
                    {selectedCalendar.isShared && (
                      <View style={[styles.sharedIndicator, { backgroundColor: isNightMode ? "#00FF8720" : "#6B9BD120" }]}>
                        <Text style={[styles.sharedIndicatorText, { color: isNightMode ? "#00FF87" : "#6B9BD1" }]}>SHARED</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.noCalendarText, { color: isNightMode ? "#999999" : "#6B7E8F" }]}>No calendar selected</Text>
                )}
                <Text style={[styles.calendarCount, { color: isNightMode ? "#888888" : "#6B7E8F" }]}>
                  {calendars.length} {calendars.length === 1 ? "calendar" : "calendars"} total
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.plannerOption, { 
                  backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isNightMode ? "rgba(255, 20, 147, 0.2)" : "rgba(240, 147, 251, 0.2)",
                }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push("/todo-list");
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={isNightMode ? ["rgba(255, 20, 147, 0.2)", "rgba(255, 20, 147, 0.05)"] : ["rgba(240, 147, 251, 0.15)", "rgba(245, 87, 108, 0.05)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionIconContainer}
                >
                  <CheckSquare color={isNightMode ? "#FF1493" : "#F093FB"} size={26} strokeWidth={2.5} />
                </LinearGradient>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.plannerOptionText, { color: isNightMode ? "#FFD700" : "#1A2B3C" }]}>To-Do List</Text>
                  <Text style={[styles.plannerOptionSubtext, { color: isNightMode ? "#888888" : "#A0ADB8" }]}>Manage your tasks</Text>
                </View>
                <View style={styles.optionRightContent}>
                  {pendingTasks.length > 0 && (
                    <View style={[styles.badge, { backgroundColor: isNightMode ? "#FF1493" : "#F5576C" }]}>
                      <Text style={styles.badgeText}>{pendingTasks.length}</Text>
                    </View>
                  )}
                  <ChevronRight 
                    color={isNightMode ? "#666666" : "#A0ADB8"} 
                    size={20} 
                    strokeWidth={2}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.notesButton, { 
                  backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isNightMode ? "rgba(255, 107, 157, 0.2)" : "rgba(240, 147, 251, 0.2)",
                }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push("/notes");
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={isNightMode ? ["rgba(255, 107, 157, 0.2)", "rgba(157, 78, 221, 0.2)"] : ["rgba(240, 147, 251, 0.15)", "rgba(255, 107, 157, 0.15)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.notesButtonGradient}
                >
                  <View style={styles.notesButtonContent}>
                    <View style={[styles.notesIconContainer, { 
                      backgroundColor: isNightMode ? "rgba(255, 107, 157, 0.3)" : "rgba(255, 107, 157, 0.2)"
                    }]}>
                      <Paintbrush color={isNightMode ? "#FF6B9D" : "#F093FB"} size={32} strokeWidth={2.5} />
                    </View>
                    <View style={styles.notesTextContainer}>
                      <Text style={[styles.notesButtonTitle, { color: isNightMode ? "#FFD700" : "#1A2B3C" }]}>NOTES & PAD</Text>
                      <Text style={[styles.notesButtonSubtitle, { color: isNightMode ? "#FF6B9D" : "#9D4EDD" }]}>Type • Draw • Voice • Encrypt • Export</Text>
                    </View>
                    <Star 
                      color={isNightMode ? "#FFD700" : "#F093FB"} 
                      size={24} 
                      strokeWidth={2} 
                      fill={isNightMode ? "#FFD70030" : "#F093FB20"}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.gridRow}>
                <Animated.View style={[
                  { flex: 1 },
                  {
                    transform: [
                      { scale: slideAnimYearly.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                      { translateY: slideAnimYearly.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
                    ],
                    opacity: slideAnimYearly
                  }
                ]}>
                  <TouchableOpacity
                    style={[styles.plannerOptionHalf, { 
                      backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(76, 175, 80, 0.2)",
                    }]}
                    onPress={() => selectPlannerView("yearly")}
                    activeOpacity={0.7}
                  >
                  <LinearGradient
                    colors={isNightMode ? ["rgba(255, 215, 0, 0.2)", "rgba(255, 215, 0, 0.05)"] : ["rgba(76, 175, 80, 0.15)", "rgba(76, 175, 80, 0.05)"]}
                    style={styles.smallIconContainer}
                  >
                    <Target color={isNightMode ? "#FFD700" : "#4CAF50"} size={28} strokeWidth={2.5} />
                  </LinearGradient>
                    <Text style={[styles.plannerOptionTextSmall, { color: isNightMode ? "#FFD700" : "#1A2B3C" }]}>Yearly</Text>
                    <Text style={[styles.plannerOptionSubtextSmall, { color: isNightMode ? "#666666" : "#A0ADB8" }]}>Goals</Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[
                  { flex: 1 },
                  {
                    transform: [
                      { scale: slideAnimMonthly.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                      { translateY: slideAnimMonthly.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
                    ],
                    opacity: slideAnimMonthly
                  }
                ]}>
                  <TouchableOpacity
                    style={[styles.plannerOptionHalf, { 
                      backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isNightMode ? "rgba(157, 78, 221, 0.2)" : "rgba(33, 150, 243, 0.2)",
                    }]}
                    onPress={() => selectPlannerView("monthly")}
                    activeOpacity={0.7}
                  >
                  <LinearGradient
                    colors={isNightMode ? ["rgba(157, 78, 221, 0.2)", "rgba(157, 78, 221, 0.05)"] : ["rgba(33, 150, 243, 0.15)", "rgba(33, 150, 243, 0.05)"]}
                    style={styles.smallIconContainer}
                  >
                    <Calendar color={isNightMode ? "#9D4EDD" : "#2196F3"} size={28} strokeWidth={2.5} />
                  </LinearGradient>
                    <Text style={[styles.plannerOptionTextSmall, { color: isNightMode ? "#FFD700" : "#1A2B3C" }]}>Monthly</Text>
                    <Text style={[styles.plannerOptionSubtextSmall, { color: isNightMode ? "#666666" : "#A0ADB8" }]}>Overview</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <View style={styles.gridRow}>
                <Animated.View style={[
                  { flex: 1 },
                  {
                    transform: [
                      { scale: slideAnimWeekly.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                      { translateY: slideAnimWeekly.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
                    ],
                    opacity: slideAnimWeekly
                  }
                ]}>
                  <TouchableOpacity
                    style={[styles.plannerOptionHalf, { 
                      backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isNightMode ? "rgba(0, 245, 255, 0.2)" : "rgba(255, 152, 0, 0.2)",
                    }]}
                    onPress={() => selectPlannerView("weekly")}
                    activeOpacity={0.7}
                  >
                  <LinearGradient
                    colors={isNightMode ? ["rgba(0, 245, 255, 0.2)", "rgba(0, 245, 255, 0.05)"] : ["rgba(255, 152, 0, 0.15)", "rgba(255, 152, 0, 0.05)"]}
                    style={styles.smallIconContainer}
                  >
                    <TrendingUp color={isNightMode ? "#00F5FF" : "#FF9800"} size={28} strokeWidth={2.5} />
                  </LinearGradient>
                    <Text style={[styles.plannerOptionTextSmall, { color: isNightMode ? "#FFD700" : "#1A2B3C" }]}>Weekly</Text>
                    <Text style={[styles.plannerOptionSubtextSmall, { color: isNightMode ? "#666666" : "#A0ADB8" }]}>Progress</Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[
                  { flex: 1 },
                  {
                    transform: [
                      { scale: slideAnimDaily.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                      { translateY: slideAnimDaily.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }
                    ],
                    opacity: slideAnimDaily
                  }
                ]}>
                  <TouchableOpacity
                    style={[styles.plannerOptionHalf, { 
                      backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isNightMode ? "rgba(0, 255, 135, 0.2)" : "rgba(255, 184, 77, 0.2)",
                    }]}
                    onPress={() => selectPlannerView("daily")}
                    activeOpacity={0.7}
                  >
                  <LinearGradient
                    colors={isNightMode ? ["rgba(0, 255, 135, 0.2)", "rgba(0, 255, 135, 0.05)"] : ["rgba(255, 184, 77, 0.15)", "rgba(255, 184, 77, 0.05)"]}
                    style={styles.smallIconContainer}
                  >
                    <Sparkles color={isNightMode ? "#00FF87" : "#FFB84D"} size={28} strokeWidth={2.5} />
                  </LinearGradient>
                    <Text style={[styles.plannerOptionTextSmall, { color: isNightMode ? "#FFD700" : "#1A2B3C" }]}>Daily</Text>
                    <Text style={[styles.plannerOptionSubtextSmall, { color: isNightMode ? "#666666" : "#A0ADB8" }]}>Focus</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

            </Animated.View>
          ) : (
            <View style={[styles.plannerViewContainer, { backgroundColor: theme.colors.cardBackground }]}>
              <Text style={[styles.plannerViewTitle, { color: theme.colors.text.primary }]}>
                {selectedPlannerView.charAt(0).toUpperCase() + selectedPlannerView.slice(1)} Planner
              </Text>
              <Text style={[styles.plannerViewSubtitle, { color: theme.colors.text.secondary }]}>
                This is your {selectedPlannerView} planning view. You can organize and plan your schedule here.
              </Text>
              <TouchableOpacity
                style={styles.backToOptionsButton}
                onPress={() => setSelectedPlannerView(null)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={theme.gradients.primary as any}
                  style={styles.backButtonGradient}
                >
                  <Text style={styles.backToOptionsText}>Back to Options</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
      )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerTitleContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  quickStatsContainer: {
    marginTop: 8,
    marginHorizontal: -24,
  },
  quickStatsRow: {
    flexDirection: "row" as const,
    gap: 10,
    paddingHorizontal: 24,
  },
  statBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statBadgeText: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  plannerOptionsGrid: {
    gap: 14,
  },
  plannerOption: {
    borderRadius: 24,
    padding: 20,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    marginBottom: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  optionTextContainer: {
    flex: 1,
  },
  plannerOptionText: {
    fontSize: 19,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  plannerOptionSubtext: {
    fontSize: 13,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
  },
  gridRow: {
    flexDirection: "row" as const,
    gap: 16,
  },
  plannerOptionHalf: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    minHeight: 140,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  smallIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  plannerOptionTextSmall: {
    fontSize: 17,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  plannerOptionSubtextSmall: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
  },

  plannerViewContainer: {
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  plannerViewTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 12,
    textAlign: "center" as const,
    letterSpacing: 0.3,
  },
  plannerViewSubtitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    textAlign: "center" as const,
    lineHeight: 24,
    marginBottom: 24,
  },
  backToOptionsButton: {
    borderRadius: 16,
    overflow: "hidden" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  backButtonGradient: {
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  backToOptionsText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  calendarSelectorCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  calendarSelectorHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  calendarSelectorTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  manageCalendarsButton: {
    borderRadius: 12,
    overflow: "hidden" as const,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  manageButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  manageCalendarsText: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  selectedCalendarDisplay: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 12,
  },
  calendarDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  selectedCalendarName: {
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
    letterSpacing: 0.3,
  },
  sharedIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sharedIndicatorText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  noCalendarText: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginBottom: 12,
  },
  calendarCount: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
  },

  notesButton: {
    borderRadius: 24,
    marginTop: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    overflow: "hidden" as const,
  },
  notesButtonGradient: {
    padding: 20,
  },
  notesButtonContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  notesIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  notesTextContainer: {
    flex: 1,
  },
  notesButtonTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesButtonSubtitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  loadingContainer: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  shinyBadgeText: {
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  optionRightContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
});
