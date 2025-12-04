import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  Alert,
  Switch,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Plus,
  X,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Filter,
  Download,
  Palette,
  Layout,
  Grid3x3,
  List,
  Settings,
  Star,
  Flag,
  Tag,
  Clock,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useCalendar } from "@/contexts/CalendarContext";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";
import ShareButton from "@/components/ShareButton";
import { useSharing } from "@/contexts/SharingContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ViewMode = "grid" | "list" | "timeline";
type ColorScheme = "default" | "pastel" | "vibrant" | "monochrome" | "custom";
type Priority = "low" | "medium" | "high" | "urgent";
type Status = "not-started" | "in-progress" | "completed" | "on-hold";

type YearlyGoal = {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: Priority;
  status: Status;
  startDate?: string;
  targetDate?: string;
  progress: number;
  color?: string;
  tags: string[];
  milestones: Milestone[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  repeatYearly?: boolean;
  starredForCalendar?: boolean;
};

type Milestone = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#95E1D3",
  medium: "#FFB84D",
  high: "#FF6B9D",
  urgent: "#E74C3C",
};

const STATUS_LABELS: Record<Status, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "completed": "Completed",
  "on-hold": "On Hold",
};

const COLOR_SCHEMES = {
  default: ["#667EEA", "#FA709A", "#30CFD0", "#FFB84D", "#A18CD1"],
  pastel: ["#B4E7CE", "#FFD6E8", "#C7CEEA", "#FFEAA7", "#DFE6E9"],
  vibrant: ["#FF006E", "#FFBE0B", "#3A86FF", "#06FFA5", "#8338EC"],
  monochrome: ["#2C3E50", "#34495E", "#7F8C8D", "#95A5A6", "#BDC3C7"],
  custom: [],
};

const CATEGORIES = [
  "Career",
  "Health",
  "Finance",
  "Relationships",
  "Personal Growth",
  "Education",
  "Travel",
  "Hobbies",
  "Other",
];

const STORAGE_KEY = "@yearly_goals";
const SETTINGS_KEY = "@yearly_planner_settings";

export default function YearlyPlannerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { addEvent, selectedCalendar, updateEvent, events } = useCalendar();
  const { createShareableFromPlannerTask } = useSharing();
  
  const isNightMode = theme.id === "night-mode";
  const modalColors = isNightMode 
    ? {
        background: 'rgba(10, 10, 10, 0.92)',
        text: '#FFFFFF',
        textSecondary: '#FFD700',
        inputBg: 'rgba(255, 215, 0, 0.05)',
        inputBorder: 'rgba(255, 215, 0, 0.3)',
        cardBorder: 'rgba(255, 215, 0, 0.3)',
        labelColor: '#FFD700',
      }
    : {
        background: 'rgba(255, 255, 255, 0.92)',
        text: '#1A1A1A',
        textSecondary: '#9D4EDD',
        inputBg: 'rgba(157, 78, 221, 0.05)',
        inputBorder: 'rgba(157, 78, 221, 0.3)',
        cardBorder: 'rgba(157, 78, 221, 0.2)',
        labelColor: '#9D4EDD',
      };
  
  const [goals, setGoals] = useState<YearlyGoal[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("default");
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<YearlyGoal | null>(null);
  
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalCategory, setGoalCategory] = useState("Personal Growth");
  const [goalPriority, setGoalPriority] = useState<Priority>("medium");
  const [goalStatus, setGoalStatus] = useState<Status>("not-started");
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalTags, setGoalTags] = useState("");
  const [goalNotes, setGoalNotes] = useState("");
  const [goalColor, setGoalColor] = useState("#667EEA");
  const [goalStartDate, setGoalStartDate] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalRepeatYearly, setGoalRepeatYearly] = useState(false);
  const [goalStarredForCalendar, setGoalStarredForCalendar] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  const loadGoals = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setGoals(parsed);
          } else {
            console.warn("Invalid goals format, resetting");
            setGoals([]);
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        } catch (jsonError) {
          console.error("JSON parse error in yearly goals, resetting:", jsonError);
          setGoals([]);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading yearly goals:", error);
      setGoals([]);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, []);

  const saveGoals = useCallback(async (newGoals: YearlyGoal[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
    } catch (error) {
      console.error("Error saving yearly goals:", error);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleBackPress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    router.back();
  };

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (!showCompleted && goal.status === "completed") return false;
      if (filterCategory && goal.category !== filterCategory) return false;
      if (filterPriority && goal.priority !== filterPriority) return false;
      return true;
    });
  }, [goals, showCompleted, filterCategory, filterPriority]);

  const yearStats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.status === "completed").length;
    const inProgress = goals.filter((g) => g.status === "in-progress").length;
    const avgProgress = total > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / total : 0;

    return { total, completed, inProgress, avgProgress: Math.round(avgProgress) };
  }, [goals]);

  const openAddModal = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetForm();
    setAddModalVisible(true);
  };

  const resetForm = () => {
    setGoalTitle("");
    setGoalDescription("");
    setGoalCategory("Personal Growth");
    setGoalPriority("medium");
    setGoalStatus("not-started");
    setGoalProgress(0);
    setGoalTags("");
    setGoalNotes("");
    setGoalColor("#667EEA");
    setGoalStartDate("");
    setGoalTargetDate("");
    setMilestones([]);
    setNewMilestoneTitle("");
    setGoalRepeatYearly(false);
    setGoalStarredForCalendar(false);
  };

  const handleAddGoal = async () => {
    if (!goalTitle.trim()) {
      Alert.alert("Error", "Please enter a goal title");
      return;
    }

    const newGoal: YearlyGoal = {
      id: `goal_${Date.now()}`,
      title: goalTitle.trim(),
      description: goalDescription.trim(),
      category: goalCategory,
      priority: goalPriority,
      status: goalStatus,
      startDate: goalStartDate || undefined,
      targetDate: goalTargetDate || undefined,
      progress: goalProgress,
      color: goalColor,
      tags: goalTags.split(",").map((t) => t.trim()).filter((t) => t),
      milestones: milestones,
      notes: goalNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repeatYearly: goalRepeatYearly,
      starredForCalendar: goalStarredForCalendar,
    };

    if (goalStarredForCalendar && goalTargetDate && selectedCalendar) {
      await addEvent({
        title: `⭐ ${goalTitle.trim()}`,
        date: goalTargetDate,
        description: goalDescription.trim(),
        calendarId: selectedCalendar.id,
        starredFromPlanner: true,
        plannerSource: 'yearly',
      });
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await saveGoals([...goals, newGoal]);
    setAddModalVisible(false);
    resetForm();
  };

  const handleEditGoal = (goal: YearlyGoal) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setGoalToEdit(goal);
    setGoalTitle(goal.title);
    setGoalDescription(goal.description || "");
    setGoalCategory(goal.category);
    setGoalPriority(goal.priority);
    setGoalStatus(goal.status);
    setGoalProgress(goal.progress);
    setGoalTags(goal.tags.join(", "));
    setGoalNotes(goal.notes);
    setGoalColor(goal.color || "#667EEA");
    setGoalStartDate(goal.startDate || "");
    setGoalTargetDate(goal.targetDate || "");
    setMilestones(goal.milestones);
    setGoalRepeatYearly(goal.repeatYearly || false);
    setGoalStarredForCalendar(goal.starredForCalendar || false);
    setEditModalVisible(true);
  };

  const handleUpdateGoal = async () => {
    if (!goalTitle.trim() || !goalToEdit) {
      Alert.alert("Error", "Please enter a goal title");
      return;
    }

    const updatedGoal: YearlyGoal = {
      ...goalToEdit,
      title: goalTitle.trim(),
      description: goalDescription.trim(),
      category: goalCategory,
      priority: goalPriority,
      status: goalStatus,
      startDate: goalStartDate || undefined,
      targetDate: goalTargetDate || undefined,
      progress: goalProgress,
      color: goalColor,
      tags: goalTags.split(",").map((t) => t.trim()).filter((t) => t),
      milestones: milestones,
      notes: goalNotes.trim(),
      updatedAt: new Date().toISOString(),
      repeatYearly: goalRepeatYearly,
      starredForCalendar: goalStarredForCalendar,
    };

    const wasStarred = goalToEdit.starredForCalendar;
    if (goalStarredForCalendar && !wasStarred && goalTargetDate && selectedCalendar) {
      await addEvent({
        title: `⭐ ${goalTitle.trim()}`,
        date: goalTargetDate,
        description: goalDescription.trim(),
        calendarId: selectedCalendar.id,
        starredFromPlanner: true,
        plannerSource: 'yearly',
      });
    } else if (wasStarred && goalStarredForCalendar && goalTargetDate) {
      const relatedEvent = events.find(e => 
        e.starredFromPlanner && 
        e.plannerSource === 'yearly' && 
        e.title.includes(goalToEdit.title)
      );
      if (relatedEvent) {
        await updateEvent(relatedEvent.id, {
          title: `⭐ ${goalTitle.trim()}`,
          date: goalTargetDate,
          description: goalDescription.trim(),
        });
      }
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const updatedGoals = goals.map((g) => (g.id === goalToEdit.id ? updatedGoal : g));
    await saveGoals(updatedGoals);
    setEditModalVisible(false);
    setGoalToEdit(null);
    resetForm();
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          const updatedGoals = goals.filter((g) => g.id !== goalId);
          await saveGoals(updatedGoals);
        },
      },
    ]);
  };

  const addMilestone = () => {
    if (!newMilestoneTitle.trim()) return;

    const milestone: Milestone = {
      id: `milestone_${Date.now()}`,
      title: newMilestoneTitle.trim(),
      completed: false,
    };

    setMilestones([...milestones, milestone]);
    setNewMilestoneTitle("");
  };

  const toggleMilestone = (milestoneId: string) => {
    setMilestones(
      milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      )
    );
  };

  const removeMilestone = (milestoneId: string) => {
    setMilestones(milestones.filter((m) => m.id !== milestoneId));
  };

  const renderGoalCard = (goal: YearlyGoal) => {
    const cardColor = goal.color || COLOR_SCHEMES[colorScheme][0];
    const completedMilestones = goal.milestones.filter((m) => m.completed).length;
    const totalMilestones = goal.milestones.length;

    return (
      <View key={goal.id} style={[styles.goalCard, { backgroundColor: `${cardColor}15` }]}>
        <View style={[styles.goalColorBar, { backgroundColor: cardColor }]} />
        
        <View style={styles.goalContent}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleRow}>
              <Text style={[styles.goalTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>
                {goal.title}
              </Text>
              {goal.priority === "urgent" && (
                <Flag color={PRIORITY_COLORS[goal.priority]} size={18} fill={PRIORITY_COLORS[goal.priority]} />
              )}
            </View>
            <View style={styles.goalActions}>
              <ShareButton
                shareableItem={createShareableFromPlannerTask(goal)}
                size={16}
                color={theme.colors.primary}
              />
              <TouchableOpacity onPress={() => handleEditGoal(goal)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Edit2 color={theme.colors.primary} size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Trash2 color="#E74C3C" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.goalMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: cardColor }]}>
              <Text style={styles.categoryText}>{goal.category}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[goal.priority] }]}>
              <Text style={styles.priorityText}>{goal.priority.toUpperCase()}</Text>
            </View>
          </View>

          {goal.description && (
            <Text style={[styles.goalDescription, { color: theme.colors.text.secondary }]} numberOfLines={2}>
              {goal.description}
            </Text>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: theme.colors.text.secondary }]}>Progress</Text>
              <Text style={[styles.progressValue, { color: cardColor }]}>{goal.progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${goal.progress}%`, backgroundColor: cardColor }]} />
            </View>
          </View>

          {totalMilestones > 0 && (
            <View style={styles.milestonesRow}>
              <CheckCircle2 color={theme.colors.text.secondary} size={14} />
              <Text style={[styles.milestonesText, { color: theme.colors.text.secondary }]}>
                {completedMilestones}/{totalMilestones} Milestones
              </Text>
            </View>
          )}

          {goal.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {goal.tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={[styles.tagChip, { backgroundColor: `${cardColor}30` }]}>
                  <Text style={[styles.tagText, { color: cardColor }]}>{tag}</Text>
                </View>
              ))}
              {goal.tags.length > 3 && (
                <Text style={[styles.moreTagsText, { color: theme.colors.text.light }]}>
                  +{goal.tags.length - 3}
                </Text>
              )}
            </View>
          )}

          <View style={[styles.statusBadge, { backgroundColor: `${cardColor}20` }]}>
            <Text style={[styles.statusText, { color: cardColor }]}>{STATUS_LABELS[goal.status]}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGoalList = (goal: YearlyGoal) => {
    const cardColor = goal.color || COLOR_SCHEMES[colorScheme][0];

    return (
      <TouchableOpacity
        key={goal.id}
        style={[styles.goalListItem, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => handleEditGoal(goal)}
        activeOpacity={0.7}
      >
        <View style={[styles.listColorIndicator, { backgroundColor: cardColor }]} />
        
        <View style={styles.listContent}>
          <View style={styles.listTop}>
            <Text style={[styles.listTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
              {goal.title}
            </Text>
            <View style={[styles.listProgressBadge, { backgroundColor: `${cardColor}20` }]}>
              <Text style={[styles.listProgressText, { color: cardColor }]}>{goal.progress}%</Text>
            </View>
          </View>
          
          <View style={styles.listBottom}>
            <View style={[styles.listCategoryChip, { backgroundColor: `${cardColor}15` }]}>
              <Text style={[styles.listCategoryText, { color: cardColor }]}>{goal.category}</Text>
            </View>
            <Text style={[styles.listStatusText, { color: theme.colors.text.secondary }]}>
              {STATUS_LABELS[goal.status]}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Trash2 color={theme.colors.text.light} size={18} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background as any} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft color="#FFFFFF" size={28} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Calendar color="#FFFFFF" size={28} strokeWidth={2.5} />
            <Text style={styles.headerTitle}>Yearly Planner {selectedYear}</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Target color={theme.colors.primary} size={24} />
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{yearStats.total}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Total Goals</Text>
            </View>
            <View style={styles.statItem}>
              <CheckCircle2 color="#30CFD0" size={24} />
              <Text style={[styles.statValue, { color: "#30CFD0" }]}>{yearStats.completed}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp color="#FFB84D" size={24} />
              <Text style={[styles.statValue, { color: "#FFB84D" }]}>{yearStats.inProgress}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Star color="#FA709A" size={24} />
              <Text style={[styles.statValue, { color: "#FA709A" }]}>{yearStats.avgProgress}%</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Avg Progress</Text>
            </View>
          </View>
        </View>

        <View style={[styles.filtersCard, { backgroundColor: theme.colors.cardBackground }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === "grid" && { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode("grid");
              }}
            >
              <Grid3x3 color={viewMode === "grid" ? "#FFFFFF" : theme.colors.text.secondary} size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === "list" && { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode("list");
              }}
            >
              <List color={viewMode === "list" ? "#FFFFFF" : theme.colors.text.secondary} size={18} />
            </TouchableOpacity>

            <View style={styles.filterDivider} />

            <TouchableOpacity
              style={[styles.filterButton, !showCompleted && { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? <Eye color={theme.colors.text.secondary} size={18} /> : <EyeOff color="#FFFFFF" size={18} />}
              <Text style={[styles.filterButtonText, { color: showCompleted ? theme.colors.text.secondary : "#FFFFFF" }]}>
                Completed
              </Text>
            </TouchableOpacity>

            {filterCategory ? (
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setFilterCategory(null)}
              >
                <X color="#FFFFFF" size={16} />
                <Text style={styles.filterButtonTextActive}>{filterCategory}</Text>
              </TouchableOpacity>
            ) : null}

            {filterPriority ? (
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: PRIORITY_COLORS[filterPriority] }]}
                onPress={() => setFilterPriority(null)}
              >
                <X color="#FFFFFF" size={16} />
                <Text style={styles.filterButtonTextActive}>{filterPriority}</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filteredGoals.length === 0 ? (
            <View style={styles.emptyState}>
              <Target color={theme.colors.text.light} size={64} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>No Goals Yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                Start planning your year by adding your first goal
              </Text>
            </View>
          ) : viewMode === "grid" ? (
            <View style={styles.goalsGrid}>{filteredGoals.map(renderGoalCard)}</View>
          ) : (
            <View style={styles.goalsList}>{filteredGoals.map(renderGoalList)}</View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.9}>
          <LinearGradient colors={theme.gradients.primary as any} style={styles.fabGradient}>
            <Plus color="#FFFFFF" size={32} strokeWidth={3} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <Modal visible={addModalVisible || editModalVisible} transparent animationType="slide" onRequestClose={() => { setAddModalVisible(false); setEditModalVisible(false); }}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              activeOpacity={1}
              onPress={() => {
                setAddModalVisible(false);
                setEditModalVisible(false);
              }}
            />
            <ScrollView contentContainerStyle={styles.modalScrollContent} bounces={false} keyboardShouldPersistTaps="handled">
              <View style={[styles.modalContent, { 
                backgroundColor: modalColors.background, 
                borderTopColor: modalColors.cardBorder 
              }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: modalColors.text }]}>{editModalVisible ? "Edit Goal" : "New Goal"}</Text>
                  <View style={styles.modalHeaderActions}>
                    {keyboardVisible && (
                      <TouchableOpacity 
                        onPress={() => Keyboard.dismiss()}
                        style={styles.iconButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <ChevronRight 
                          color={modalColors.text} 
                          size={20} 
                          style={{ transform: [{ rotate: '270deg' }] }}
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      onPress={() => { setAddModalVisible(false); setEditModalVisible(false); }} 
                      style={styles.iconButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X color={modalColors.text} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Goal Title *</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder="e.g., Learn a new language"
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder="Describe your goal..."
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={goalDescription}
                  onChangeText={setGoalDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryScroll}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryChip, { 
                          backgroundColor: goalCategory === cat ? theme.colors.primary : modalColors.inputBg,
                          borderColor: modalColors.inputBorder 
                        }]}
                        onPress={() => setGoalCategory(cat)}
                      >
                        <Text style={[styles.categoryChipText, { color: goalCategory === cat ? '#FFFFFF' : modalColors.textSecondary }, goalCategory === cat && styles.categoryChipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Priority</Text>
                <View style={styles.priorityGrid}>
                  {(Object.keys(PRIORITY_COLORS) as Priority[]).map((pri) => (
                    <TouchableOpacity
                      key={pri}
                      style={[
                        styles.priorityChip,
                        {
                          backgroundColor: goalPriority === pri ? PRIORITY_COLORS[pri] : modalColors.inputBg,
                          borderColor: goalPriority === pri ? PRIORITY_COLORS[pri] : modalColors.inputBorder,
                        },
                      ]}
                      onPress={() => setGoalPriority(pri)}
                    >
                      <Text style={[styles.priorityChipText, { color: goalPriority === pri ? '#FFFFFF' : modalColors.textSecondary }, goalPriority === pri && styles.priorityChipTextActive]}>
                        {pri.charAt(0).toUpperCase() + pri.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Status</Text>
                <View style={styles.statusGrid}>
                  {(Object.keys(STATUS_LABELS) as Status[]).map((stat) => (
                    <TouchableOpacity
                      key={stat}
                      style={[styles.statusChip, { 
                        backgroundColor: goalStatus === stat ? theme.colors.primary : modalColors.inputBg,
                        borderColor: modalColors.inputBorder 
                      }]}
                      onPress={() => setGoalStatus(stat)}
                    >
                      <Text style={[styles.statusChipText, { color: goalStatus === stat ? '#FFFFFF' : modalColors.textSecondary }, goalStatus === stat && styles.statusChipTextActive]}>
                        {STATUS_LABELS[stat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Progress: {goalProgress}%</Text>
                <View style={styles.progressSliderContainer}>
                  <TouchableOpacity
                    style={styles.progressButton}
                    onPress={() => setGoalProgress(Math.max(0, goalProgress - 10))}
                  >
                    <Text style={styles.progressButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.progressDisplay}>
                    <View style={styles.progressBarBgLarge}>
                      <View style={[styles.progressBarFillLarge, { width: `${goalProgress}%`, backgroundColor: theme.colors.primary }]} />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.progressButton}
                    onPress={() => setGoalProgress(Math.min(100, goalProgress + 10))}
                  >
                    <Text style={styles.progressButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.colorScroll}>
                    {COLOR_SCHEMES[colorScheme].map((color, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.colorOption, { backgroundColor: color }, goalColor === color && styles.colorOptionSelected]}
                        onPress={() => setGoalColor(color)}
                      >
                        {goalColor === color && <CheckCircle2 color="#FFFFFF" size={20} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Target Date</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={goalTargetDate}
                  onChangeText={setGoalTargetDate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Tags (comma separated)</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder="e.g., fitness, morning, 30-day"
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={goalTags}
                  onChangeText={setGoalTags}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Milestones</Text>
                <View style={styles.milestoneInput}>
                  <TextInput
                    style={[styles.milestoneTextInput, { 
                      backgroundColor: modalColors.inputBg, 
                      borderColor: modalColors.inputBorder,
                      color: modalColors.text 
                    }]}
                    placeholder="Add milestone..."
                    placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                    value={newMilestoneTitle}
                    onChangeText={setNewMilestoneTitle}
                  />
                  <TouchableOpacity style={styles.addMilestoneButton} onPress={addMilestone}>
                    <Plus color={theme.colors.primary} size={20} />
                  </TouchableOpacity>
                </View>
                <View style={styles.milestonesList}>
                  {milestones.map((milestone) => (
                    <View key={milestone.id} style={styles.milestoneItem}>
                      <TouchableOpacity onPress={() => toggleMilestone(milestone.id)}>
                        {milestone.completed ? (
                          <CheckCircle2 color={theme.colors.primary} size={20} />
                        ) : (
                          <Circle color={colors.text.light} size={20} />
                        )}
                      </TouchableOpacity>
                      <Text style={[styles.milestoneTitle, { color: modalColors.text }, milestone.completed && styles.milestoneTitleCompleted]}>
                        {milestone.title}
                      </Text>
                      <TouchableOpacity onPress={() => removeMilestone(milestone.id)}>
                        <X color={colors.text.light} size={18} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder="Additional notes..."
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={goalNotes}
                  onChangeText={setGoalNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.repeatYearlyRow}>
                  <View style={styles.repeatYearlyInfo}>
                    <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Repeat Yearly</Text>
                    <Text style={[styles.repeatYearlyDescription, { color: modalColors.textSecondary }]}>
                      This goal will automatically repeat at the same time every year
                    </Text>
                  </View>
                  <Switch
                    value={goalRepeatYearly}
                    onValueChange={setGoalRepeatYearly}
                    trackColor={{ false: colors.border, true: theme.colors.primary }}
                    thumbColor={"#FFFFFF"}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={[styles.starToggle, goalStarredForCalendar && styles.starToggleActive]}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setGoalStarredForCalendar(!goalStarredForCalendar);
                  }}
                  activeOpacity={0.7}
                >
                  <Star
                    color={goalStarredForCalendar ? "#FFD700" : theme.colors.text.secondary}
                    size={24}
                    fill={goalStarredForCalendar ? "#FFD700" : "none"}
                  />
                  <View style={styles.starToggleTextContainer}>
                    <Text style={[styles.starToggleTitle, { color: goalStarredForCalendar ? "#FFD700" : modalColors.text }]}>
                      Show in Main Calendar
                    </Text>
                    <Text style={[styles.starToggleDescription, { color: modalColors.textSecondary }]}>
                      This event will appear with a gold star in the calendar
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={editModalVisible ? handleUpdateGoal : handleAddGoal}
                activeOpacity={0.8}
              >
                <LinearGradient colors={theme.gradients.primary as any} style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>{editModalVisible ? "Update Goal" : "Create Goal"}</Text>
                </LinearGradient>
              </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={settingsModalVisible} transparent animationType="fade" onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.settingsModal, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)} style={styles.closeButton}>
                <X color={theme.colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.settingsLabel, { color: theme.colors.text.primary }]}>Color Scheme</Text>
              <View style={styles.colorSchemeOptions}>
                {(Object.keys(COLOR_SCHEMES) as ColorScheme[]).map((scheme) => (
                  <TouchableOpacity
                    key={scheme}
                    style={[
                      styles.colorSchemeButton,
                      colorScheme === scheme && { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => setColorScheme(scheme)}
                  >
                    <Text style={[styles.colorSchemeText, colorScheme === scheme && { color: "#FFFFFF" }]}>
                      {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.settingsLabel, { color: theme.colors.text.primary }]}>Filter by Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryScroll}>
                  <TouchableOpacity
                    style={[styles.categoryChip, !filterCategory && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setFilterCategory(null)}
                  >
                    <Text style={[styles.categoryChipText, !filterCategory && styles.categoryChipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, filterCategory === cat && { backgroundColor: theme.colors.primary }]}
                      onPress={() => setFilterCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, filterCategory === cat && styles.categoryChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.settingsLabel, { color: theme.colors.text.primary }]}>Filter by Priority</Text>
              <View style={styles.priorityGrid}>
                <TouchableOpacity
                  style={[styles.priorityChip, !filterPriority && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setFilterPriority(null)}
                >
                  <Text style={[styles.priorityChipText, !filterPriority && styles.priorityChipTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {(Object.keys(PRIORITY_COLORS) as Priority[]).map((pri) => (
                  <TouchableOpacity
                    key={pri}
                    style={[
                      styles.priorityChip,
                      filterPriority === pri && { backgroundColor: PRIORITY_COLORS[pri], borderColor: PRIORITY_COLORS[pri] },
                    ]}
                    onPress={() => setFilterPriority(pri)}
                  >
                    <Text style={[styles.priorityChipText, filterPriority === pri && styles.priorityChipTextActive]}>
                      {pri.charAt(0).toUpperCase() + pri.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeSettingsButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Text style={styles.closeSettingsButtonText}>Done</Text>
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
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  settingsButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitleContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  statsCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.2)",
  },
  statRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
  },
  statItem: {
    alignItems: "center" as const,
    gap: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900" as const,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  filtersCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.15)",
  },
  filtersScroll: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  viewModeButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginHorizontal: 4,
  },
  filterButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  filterButtonTextActive: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 100,
  },
  goalsGrid: {
    gap: 14,
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    borderRadius: 24,
    overflow: "hidden",
    flexDirection: "row" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.2)",
  },
  goalColorBar: {
    width: 8,
  },
  goalContent: {
    flex: 1,
    padding: 20,
  },
  goalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 10,
  },
  goalTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 0.3,
    flex: 1,
  },
  goalActions: {
    flexDirection: "row" as const,
    gap: 12,
    alignItems: "center" as const,
  },
  goalMeta: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priorityText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800" as const,
    letterSpacing: 0.8,
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  milestonesRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 10,
  },
  milestonesText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  tagsRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 6,
    marginBottom: 10,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  moreTagsText: {
    fontSize: 11,
    fontWeight: "600" as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start" as const,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  goalListItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  listColorIndicator: {
    width: 4,
    height: "100%",
  },
  listContent: {
    flex: 1,
    padding: 16,
  },
  listTop: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    flex: 1,
    marginRight: 12,
  },
  listProgressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listProgressText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  listBottom: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  listCategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listCategoryText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  listStatusText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center" as const,
    lineHeight: 22,
  },
  fab: {
    position: "absolute" as const,
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#000",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end" as const,
  },
  modalBackdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end" as const,
    paddingTop: 80,
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    minHeight: SCREEN_WIDTH * 1.5,
    borderTopWidth: 2,
    backdropFilter: "blur(20px)",
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  modalHeaderActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  keyboardDismissBtn: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  iconButton: {
    padding: 8,
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  textInput: {
    backgroundColor: "rgba(157, 78, 221, 0.05)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "500" as const,
    borderWidth: 1.5,
    borderColor: "rgba(157, 78, 221, 0.3)",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top" as const,
  },
  categoryScroll: {
    flexDirection: "row" as const,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(157, 78, 221, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.15)",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  priorityGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  priorityChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(157, 78, 221, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(157, 78, 221, 0.15)",
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text.secondary,
  },
  priorityChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  statusGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(157, 78, 221, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.15)",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.text.secondary,
  },
  statusChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  progressSliderContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  progressButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  progressButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700" as const,
  },
  progressDisplay: {
    flex: 1,
  },
  progressBarBgLarge: {
    height: 12,
    backgroundColor: "#F5F7FA",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFillLarge: {
    height: "100%",
    borderRadius: 6,
  },
  colorScroll: {
    flexDirection: "row" as const,
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  milestoneInput: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 12,
  },
  milestoneTextInput: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "500" as const,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addMilestoneButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  milestonesList: {
    gap: 10,
  },
  milestoneItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 8,
  },
  milestoneTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  milestoneTitleCompleted: {
    textDecorationLine: "line-through" as const,
    color: colors.text.light,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#9D4EDD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 12,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  settingsModal: {
    margin: 20,
    borderRadius: 28,
    padding: 28,
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "rgba(157, 78, 221, 0.3)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  settingsGroup: {
    marginBottom: 24,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  colorSchemeOptions: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  colorSchemeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(157, 78, 221, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.15)",
  },
  colorSchemeText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text.secondary,
  },
  closeSettingsButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center" as const,
    marginTop: 12,
  },
  closeSettingsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  repeatYearlyRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 16,
  },
  repeatYearlyInfo: {
    flex: 1,
  },
  repeatYearlyDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    lineHeight: 16,
  },
  starToggle: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    borderWidth: 2,
    borderColor: "transparent",
  },
  starToggleActive: {
    backgroundColor: "#FFF9E6",
    borderColor: "#FFD700",
  },
  starToggleTextContainer: {
    flex: 1,
  },
  starToggleTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text.primary,
    marginBottom: 4,
  },
  starToggleDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
});
