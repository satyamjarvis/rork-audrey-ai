import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,

  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  TrendingUp,
  DollarSign,
  PiggyBank,
  Target,
  Sparkles,
  Plus,
  X,
  CheckSquare,
  Award,
  Flame,
  Star,
  Trophy,
  ArrowUpRight,
  BarChart3,
  Lock,
  Brain,
} from "lucide-react-native";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from 'expo-image';

import colors from "@/constants/colors";
import { useFinance, TransactionType, WealthCategory } from "@/contexts/FinanceContext";
import { useWealthManifesting, ManifestationType } from "@/contexts/WealthManifestingContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { router } from "expo-router";
import { useCalendar } from "@/contexts/CalendarContext";
import { getCalendarBackground } from '@/constants/calendarBackgrounds';

const StatCard = React.memo(function StatCard({ icon, value, label, color, bgColor }: any) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.statCard,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: bgColor }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
});

const QuickActionCard = React.memo(function QuickActionCard({ onPress, icon, title, subtitle, color }: any) {
  const { theme } = useTheme();
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      damping: 20,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 20,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.quickActionCard,
          {
            backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.9)" : theme.colors.cardBackground,
            borderWidth: 1,
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "transparent",
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        <View style={styles.quickActionContent}>
          <Text style={[styles.quickActionTitle, { color: theme.colors.text.primary }]}>
            {title}
          </Text>
          <Text style={[styles.quickActionSubtitle, { color: theme.colors.text.secondary }]}>
            {subtitle}
          </Text>
        </View>
        <ArrowUpRight color={color} size={20} strokeWidth={2.5} />
      </Animated.View>
    </TouchableOpacity>
  );
});

export default function TrackScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { translations } = useLanguage();
  const { selectedBackground } = useCalendar();
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';
  const { financialStats, addTransaction, wealthGoals, addWealthGoal } = useFinance();
  const { 
    userLevel, 
    streak, 
    completedCount, 
    todayManifestations, 
    addManifestation, 
    completeManifestation,
    unlockedAchievements,
  } = useWealthManifesting();

  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  const [addGoalModalVisible, setAddGoalModalVisible] = useState(false);
  const [addManifestationModalVisible, setAddManifestationModalVisible] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [formData, setFormData] = useState({
    transaction: {
      title: "",
      amount: "",
      type: "income" as TransactionType,
      category: "",
      description: "",
    },
    goal: {
      title: "",
      amount: "",
      category: "general" as WealthCategory,
    },
    manifestation: {
      type: "daily_affirmation" as ManifestationType,
      content: "",
      amount: "",
    },

  });



  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleAddTransaction = useCallback(async () => {
    const { title, amount, type, category, description } = formData.transaction;
    if (!title.trim() || !amount.trim()) {
      Alert.alert(translations.common.error, translations.track.fillRequiredFields || "Please fill in all required fields");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await addTransaction({
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        category: category.trim() || translations.calendar.other,
        date: new Date().toISOString().split('T')[0],
        description: description.trim() || undefined,
      });

      setFormData(prev => ({
        ...prev,
        transaction: {
          title: "",
          amount: "",
          type: "income",
          category: "",
          description: "",
        },
      }));
      setAddTransactionModalVisible(false);
    } finally {
    }
  }, [formData.transaction, addTransaction, translations]);

  const handleAddGoal = useCallback(async () => {
    const { title, amount, category } = formData.goal;
    if (!title.trim() || !amount.trim()) {
      Alert.alert(translations.common.error, translations.track.fillRequiredFields || "Please fill in all required fields");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await addWealthGoal({
        title: title.trim(),
        targetAmount: parseFloat(amount),
        currentAmount: 0,
        category,
      });

      setFormData(prev => ({
        ...prev,
        goal: {
          title: "",
          amount: "",
          category: "general",
        },
      }));
      setAddGoalModalVisible(false);
    } finally {
    }
  }, [formData.goal, addWealthGoal, translations]);

  const handleAddManifestation = useCallback(async () => {
    const { type, content, amount } = formData.manifestation;
    if (!content.trim()) {
      Alert.alert(translations.common.error, translations.track.enterManifestation || "Please enter your manifestation");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await addManifestation({
        type,
        content: content.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        date: new Date().toISOString().split('T')[0],
      });

      setFormData(prev => ({
        ...prev,
        manifestation: {
          type: "daily_affirmation",
          content: "",
          amount: "",
        },
      }));
      setAddManifestationModalVisible(false);
    } finally {
    }
  }, [formData.manifestation, addManifestation, translations]);

  const handleCompleteManifestation = useCallback(async (id: string) => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    completeManifestation(id);
  }, [completeManifestation]);

  const getTransactionTypeLabel = useCallback((type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      income: translations.track.income,
      expense: translations.track.expenses,
      savings: translations.track.savings,
      investment: translations.track.investment || "Investment",
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }, [translations]);

  const getGoalCategoryLabel = useCallback((cat: WealthCategory) => {
    const labels: Record<WealthCategory, string> = {
      emergency: translations.track.emergency || "Emergency",
      retirement: translations.track.retirement || "Retirement",
      investment: translations.track.investment || "Investment",
      general: translations.track.general || "General",
    };
    return labels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
  }, [translations]);

  const getManifestationTypeLabel = useCallback((type: ManifestationType) => {
    const labels: Record<ManifestationType, string> = {
      daily_affirmation: translations.track.dailyAffirmation || "Daily Affirmation",
      visualization: translations.track.visualization || "Visualization",
      gratitude: translations.track.gratitude || "Gratitude",
      action_step: translations.track.actionStep || "Action Step",
    };
    return labels[type] || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [translations]);

  const activeBackground = useMemo(() => {
    if (selectedBackground && selectedBackground !== 'default') {
      return getCalendarBackground(selectedBackground);
    }
    return null;
  }, [selectedBackground]);

  const quickActions = useMemo(() => [
    {
      icon: <BarChart3 color={theme.colors.primary} size={24} strokeWidth={2.5} />,
      title: translations.track.metricsDashboard,
      subtitle: translations.track.trackAndAnalyze,
      color: theme.colors.primary,
      onPress: () => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        router.push('/analytics');
      },
    },

    {
      icon: <Lock color="#FFD700" size={24} strokeWidth={2.5} />,
      title: translations.track.passwordManager,
      subtitle: translations.track.secureVault,
      color: "#FFD700",
      onPress: () => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        router.push('/password-manager');
      },
    },
    {
      icon: <Brain color="#FF1493" size={24} strokeWidth={2.5} />,
      title: translations.track.mindMapping,
      subtitle: translations.track.visualizeIdeas,
      color: "#FF1493",
      onPress: () => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        router.push('/mind-mapping' as any);
      },
    },
  ], [theme, translations]);

  const renderContent = () => (
    <LinearGradient
      colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any}
      style={styles.gradient}
    >
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerTitleContainer}>
              <View style={[styles.iconWrapper, { 
                backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(107, 155, 209, 0.15)"
              }]}>
                <TrendingUp color={isNightMode ? "#FFD700" : theme.colors.primary} size={28} strokeWidth={2.5} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.headerTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>{translations.navigation.track}</Text>
                <Text style={[styles.headerSubtitle, { color: isNightMode ? "#FF1493" : theme.colors.text.secondary }]}>
                  {translations.track.yourFinancialJourney}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.levelCard, { 
            backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
            borderWidth: 1,
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
          }]}>
            <LinearGradient
              colors={isNightMode ? ["rgba(255, 20, 147, 0.2)", "rgba(255, 20, 147, 0.05)"] : ["#F093FB", "#F5576C"]}
              style={styles.levelGradient}
            >
              <View style={styles.levelHeader}>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelTitle}>{userLevel.title}</Text>
                  <Text style={styles.levelNumber}>{translations.common.level} {userLevel.level}</Text>
                </View>
                <Trophy color="#FFFFFF" size={32} strokeWidth={2.5} />
              </View>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${(userLevel.currentXP / userLevel.xpToNextLevel) * 100}%` }]} />
              </View>
              <Text style={styles.xpText}>
                {userLevel.currentXP} / {userLevel.xpToNextLevel} {translations.common.xp}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statBadge}>
                  <Flame color="#FFFFFF" size={16} strokeWidth={2.5} />
                  <Text style={styles.statBadgeText}>{streak} {translations.common.dayStreak}</Text>
                </View>
                <View style={styles.statBadge}>
                  <Star color="#FFFFFF" size={16} strokeWidth={2.5} />
                  <Text style={styles.statBadgeText}>{completedCount} {translations.common.completed}</Text>
                </View>
                <View style={styles.statBadge}>
                  <Award color="#FFFFFF" size={16} strokeWidth={2.5} />
                  <Text style={styles.statBadgeText}>{unlockedAchievements.length} {translations.common.badges}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}  
          </View>

          <View style={[styles.statsGrid, { 
            backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
            borderWidth: 1,
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
          }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{translations.track.financialOverview}</Text>
            <View style={styles.statsRow}>
              <StatCard
                icon={<DollarSign color="#4CAF50" size={24} strokeWidth={2.5} />}
                value={`${financialStats.totalIncome.toFixed(2)}`}
                label={translations.track.income}
                color="#4CAF50"
                bgColor="#4CAF5015"
              />
              <StatCard
                icon={<DollarSign color="#F44336" size={24} strokeWidth={2.5} />}
                value={`${financialStats.totalExpenses.toFixed(2)}`}
                label={translations.track.expenses}
                color="#F44336"
                bgColor="#F4433615"
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                icon={<PiggyBank color="#2196F3" size={24} strokeWidth={2.5} />}
                value={`${financialStats.totalSavings.toFixed(2)}`}
                label={translations.track.savings}
                color="#2196F3"
                bgColor="#2196F315"
              />
              <StatCard
                icon={<TrendingUp color={theme.colors.primary} size={24} strokeWidth={2.5} />}
                value={`${financialStats.netWorth.toFixed(2)}`}
                label={translations.track.netWorth}
                color={theme.colors.primary}
                bgColor={`${theme.colors.primary}15`}
              />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setAddTransactionModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={theme.gradients.primary as any}
                style={styles.addButtonGradient}
              >
                <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
                <Text style={styles.addButtonText}>{translations.track.addTransaction}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={[styles.manifestSection, { 
            backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
            borderWidth: 1,
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
          }]}>
            <View style={styles.manifestHeader}>
              <Sparkles color={theme.colors.primary} size={24} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                {translations.track.wealthManifesting}
              </Text>
            </View>
            <Text style={[styles.manifestSubtitle, { color: theme.colors.text.secondary }]}>
              {translations.track.todaysManifestations} ({todayManifestations.filter(m => m.completed).length}/{todayManifestations.length})
            </Text>
            {todayManifestations.length === 0 ? (
              <View style={styles.emptyState}>
                <Sparkles color={theme.colors.text.light} size={32} strokeWidth={1.5} />
                <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>
                  {translations.track.noManifestationsYet}
                </Text>
              </View>
            ) : (
              <View style={styles.manifestList}>
                {todayManifestations.map((manifestation) => (
                  <TouchableOpacity
                    key={manifestation.id}
                    style={[
                      styles.manifestItem,
                      { backgroundColor: manifestation.completed ? `${theme.colors.primary}15` : "#F5F7FA" }
                    ]}
                    onPress={() => !manifestation.completed && handleCompleteManifestation(manifestation.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.manifestContent}>
                      <Text style={[styles.manifestText, { 
                        color: theme.colors.text.primary,
                        textDecorationLine: manifestation.completed ? "line-through" : "none",
                      }]}>
                        {manifestation.content}
                      </Text>
                      {manifestation.amount && (
                        <Text style={[styles.manifestAmount, { color: theme.colors.primary }]}>
                          ${manifestation.amount.toFixed(2)}
                        </Text>
                      )}
                    </View>
                    {manifestation.completed && (
                      <CheckSquare color={theme.colors.primary} size={24} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setAddManifestationModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#F093FB", "#F5576C"]}
                style={styles.addButtonGradient}
              >
                <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
                <Text style={styles.addButtonText}>{translations.track.addManifestation}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={[styles.goalsSection, { 
            backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
            borderWidth: 1,
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
          }]}>
            <View style={styles.sectionHeader}>
              <Target color={theme.colors.primary} size={24} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{translations.track.wealthGoals}</Text>
            </View>
            {wealthGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <Target color={theme.colors.text.light} size={32} strokeWidth={1.5} />
                <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>
                  {translations.track.noWealthGoalsYet}
                </Text>
              </View>
            ) : (
              <View style={styles.goalsList}>
                {wealthGoals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <View key={goal.id} style={styles.goalItem}>
                      <View style={styles.goalHeader}>
                        <Text style={[styles.goalTitle, { color: theme.colors.text.primary }]}>
                          {goal.title}
                        </Text>
                        <Text style={[styles.goalAmount, { color: theme.colors.primary }]}>
                          ${goal.currentAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}
                        </Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%`, backgroundColor: theme.colors.primary }]} />
                      </View>
                      <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
                        {progress.toFixed(0)}% {translations.track.complete}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setAddGoalModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={theme.gradients.primary as any}
                style={styles.addButtonGradient}
              >
                <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
                <Text style={styles.addButtonText}>{translations.track.addGoal}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>


        </Animated.ScrollView>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      {activeBackground ? (
        <Image
          source={{ uri: activeBackground.url }}
          style={styles.backgroundImage}
          contentFit="cover"
        />
      ) : null}
      {renderContent()}

      <Modal
        visible={addTransactionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddTransactionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: isNightMode ? "#1a0a1f" : "#FFFFFF",
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>{translations.track.addTransaction}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <KeyboardDismissButton isDark={isNightMode} />
                <TouchableOpacity onPress={() => setAddTransactionModalVisible(false)}>
                  <X color={isNightMode ? "#FFD700" : theme.colors.text.primary} size={24} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.forms.title} *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border,
                  }
                ]}
                placeholder={translations.track.titlePlaceholder || "e.g., Salary, Groceries"}
                placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                value={formData.transaction.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, transaction: { ...prev.transaction, title: text } }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.forms.amount} *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border,
                  }
                ]}
                placeholder="0.00"
                placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                value={formData.transaction.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, transaction: { ...prev.transaction, amount: text } }))}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.forms.type} *</Text>
              <View style={styles.typeRow}>
                {(["income", "expense", "savings", "investment"] as TransactionType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                        borderColor: formData.transaction.type === type
                          ? (isNightMode ? "#FFD700" : theme.colors.primary)
                          : "transparent",
                      },
                      formData.transaction.type === type && {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : theme.colors.primary,
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setFormData(prev => ({ ...prev, transaction: { ...prev.transaction, type } }));
                    }}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        {
                          color: formData.transaction.type === type
                            ? (isNightMode ? "#FFD700" : "#FFFFFF")
                            : (isNightMode ? "rgba(255, 215, 0, 0.6)" : theme.colors.text.secondary),
                        },
                      ]}
                    >
                      {getTransactionTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.calendar.category}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border,
                  }
                ]}
                placeholder={translations.track.categoryPlaceholder || "e.g., Food, Entertainment"}
                placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                value={formData.transaction.category}
                onChangeText={(text) => setFormData(prev => ({ ...prev, transaction: { ...prev.transaction, category: text } }))}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddTransaction}>
              <LinearGradient
                colors={theme.gradients.primary as any}
                style={styles.submitButtonGradient}
              >
                <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
                <Text style={styles.submitButtonText}>{translations.track.addTransaction}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addGoalModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: isNightMode ? "#1a0a1f" : "#FFFFFF",
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>{translations.track.addGoal}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <KeyboardDismissButton isDark={isNightMode} />
                <TouchableOpacity onPress={() => setAddGoalModalVisible(false)}>
                  <X color={isNightMode ? "#FFD700" : theme.colors.text.primary} size={24} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.forms.goalTitle} *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border,
                  }
                ]}
                placeholder={translations.track.goalPlaceholder || "e.g., Emergency Fund"}
                placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                value={formData.goal.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, goal: { ...prev.goal, title: text } }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.forms.targetAmount} *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border,
                  }
                ]}
                placeholder="0.00"
                placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                value={formData.goal.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, goal: { ...prev.goal, amount: text } }))}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.calendar.category} *</Text>
              <View style={styles.typeRow}>
                {(["emergency", "retirement", "investment", "general"] as WealthCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                        borderColor: formData.goal.category === cat
                          ? (isNightMode ? "#FFD700" : theme.colors.primary)
                          : "transparent",
                      },
                      formData.goal.category === cat && {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : theme.colors.primary,
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setFormData(prev => ({ ...prev, goal: { ...prev.goal, category: cat } }));
                    }}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        {
                          color: formData.goal.category === cat
                            ? (isNightMode ? "#FFD700" : "#FFFFFF")
                            : (isNightMode ? "rgba(255, 215, 0, 0.6)" : theme.colors.text.secondary),
                        },
                      ]}
                    >
                      {getGoalCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddGoal}>
              <LinearGradient
                colors={theme.gradients.primary as any}
                style={styles.submitButtonGradient}
              >
                <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
                <Text style={styles.submitButtonText}>{translations.track.addGoal}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addManifestationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddManifestationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            {
              backgroundColor: isNightMode ? "#1a0a1f" : "#FFFFFF",
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>{translations.track.addManifestation}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <KeyboardDismissButton isDark={isNightMode} />
                <TouchableOpacity onPress={() => setAddManifestationModalVisible(false)}>
                  <X color={isNightMode ? "#FFD700" : theme.colors.text.primary} size={24} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.forms.type} *</Text>
              <View style={styles.typeRow}>
                {(["daily_affirmation", "visualization", "gratitude", "action_step"] as ManifestationType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                        borderColor: formData.manifestation.type === type
                          ? (isNightMode ? "#FFD700" : theme.colors.primary)
                          : "transparent",
                      },
                      formData.manifestation.type === type && {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : theme.colors.primary,
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setFormData(prev => ({ ...prev, manifestation: { ...prev.manifestation, type } }));
                    }}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        {
                          color: formData.manifestation.type === type
                            ? (isNightMode ? "#FFD700" : "#FFFFFF")
                            : (isNightMode ? "rgba(255, 215, 0, 0.6)" : theme.colors.text.secondary),
                        },
                      ]}
                    >
                      {getManifestationTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.forms.manifestation} *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  {
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border,
                  }
                ]}
                placeholder={translations.forms.writeYourManifestation}
                placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                value={formData.manifestation.content}
                onChangeText={(text) => setFormData(prev => ({ ...prev, manifestation: { ...prev.manifestation, content: text } }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isNightMode ? "#FF1493" : theme.colors.text.primary }]}>{translations.forms.amountOptional}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "#F5F7FA",
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border,
                  }
                ]}
                placeholder="0.00"
                placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                value={formData.manifestation.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, manifestation: { ...prev.manifestation, amount: text } }))}
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleAddManifestation}>
              <LinearGradient
                colors={["#F093FB", "#F5576C"]}
                style={styles.submitButtonGradient}
              >
                <Plus color="#FFFFFF" size={20} strokeWidth={2.5} />
                <Text style={styles.submitButtonText}>{translations.track.addManifestation}</Text>
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
  backgroundImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  headerTitleContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  levelCard: {
    borderRadius: 24,
    overflow: "hidden" as const,
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  levelGradient: {
    padding: 28,
  },
  levelHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  levelInfo: {
    gap: 4,
  },
  levelTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  levelNumber: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  xpBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 3,
    overflow: "hidden" as const,
    marginBottom: 10,
  },
  xpFill: {
    height: "100%" as const,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  xpText: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: "row" as const,
    gap: 8,
    flexWrap: "wrap" as const,
  },
  statBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  statsGrid: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  statCard: {
    flex: 1,
    alignItems: "center" as const,
    gap: 8,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "600" as const,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
    opacity: 0.7,
  },
  addButton: {
    borderRadius: 16,
    overflow: "hidden" as const,
    marginTop: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  addButtonGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 16,
    gap: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  manifestSection: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  manifestHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 8,
  },
  manifestSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginBottom: 16,
  },
  manifestList: {
    gap: 10,
  },
  manifestItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: 16,
    borderRadius: 16,
  },
  manifestContent: {
    flex: 1,
    gap: 6,
  },
  manifestText: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  manifestAmount: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: "center" as const,
    paddingVertical: 32,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  goalsSection: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 16,
  },
  goalsList: {
    gap: 16,
  },
  goalItem: {
    gap: 8,
  },
  goalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: -0.1,
  },
  goalAmount: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    borderRadius: 3,
    overflow: "hidden" as const,
  },
  progressBar: {
    height: "100%" as const,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
    opacity: 0.7,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "500" as const,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top" as const,
  },
  typeRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text.secondary,
  },
  typeOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden" as const,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 8,
  },
  submitButtonGradient: {
    flexDirection: "row" as const,
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },

  analyticsButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    gap: 16,
  },
  analyticsIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  analyticsTextContainer: {
    flex: 1,
  },
  analyticsButtonTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  analyticsButtonSubtitle: {
    fontSize: 12,
    fontWeight: "400" as const,
    letterSpacing: 0.2,
    opacity: 0.7,
  },

  quickActionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 18,
    borderRadius: 20,
    gap: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontWeight: "400" as const,
    opacity: 0.65,
    letterSpacing: 0.1,
  },
});
