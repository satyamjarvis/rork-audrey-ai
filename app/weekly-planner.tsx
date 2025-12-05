import { useState, useEffect, useMemo, useCallback } from "react";
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
  Keyboard,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Plus,
  X,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  ChevronRight,
  Eye,
  EyeOff,
  Grid3x3,
  List,
  Settings,
  Target,
  TrendingUp,
  Star,
  Flag,
  Clock,
  ChevronDown,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/contexts/LanguageContext";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ViewMode = "grid" | "list" | "timeline";
type ColorScheme = "default" | "pastel" | "vibrant" | "monochrome";
type Priority = "low" | "medium" | "high" | "urgent";
type Status = "not-started" | "in-progress" | "completed" | "on-hold";

type RepeatConfig = {
  enabled: boolean;
  type: "indefinite" | "limited";
  weeksCount?: number;
};

type WeeklyTask = {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: Priority;
  status: Status;
  dayOfWeek: number;
  timeSlot?: string;
  progress: number;
  color?: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  repeatConfig?: RepeatConfig;
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
};

const CATEGORIES = [
  "Work",
  "Personal",
  "Health",
  "Finance",
  "Social",
  "Education",
  "Home",
  "Other",
];

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const STORAGE_KEY = "@weekly_tasks";

export default function WeeklyPlannerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  
  const isNightMode = theme.id === "night-mode";
  const modalColors = isNightMode 
    ? {
        background: 'rgba(10, 10, 10, 0.85)',
        text: '#FFFFFF',
        textSecondary: '#FFD700',
        inputBg: 'rgba(255, 215, 0, 0.05)',
        inputBorder: 'rgba(255, 215, 0, 0.3)',
        cardBorder: 'rgba(255, 215, 0, 0.15)',
        labelColor: '#FFD700',
      }
    : {
        background: 'rgba(255, 255, 255, 0.85)',
        text: '#1A1A1A',
        textSecondary: '#9D4EDD',
        inputBg: 'rgba(157, 78, 221, 0.05)',
        inputBorder: 'rgba(157, 78, 221, 0.3)',
        cardBorder: 'rgba(157, 78, 221, 0.15)',
        labelColor: '#9D4EDD',
      };
  
  const getStatusLabel = (status: Status) => {
    return t(`weeklyPlanner.statuses.${status}`);
  };

  const getCategoryLabel = (category: string) => {
    return t(`weeklyPlanner.categories.${category}`) || category;
  };

  const getPriorityLabel = (priority: Priority) => {
    return t(`weeklyPlanner.priorities.${priority}`);
  };

  const getColorSchemeLabel = (scheme: ColorScheme) => {
    return t(`weeklyPlanner.colorSchemes.${scheme}`);
  };

  const getDayLabel = (dayIndex: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return t(`weeklyPlanner.days.${days[dayIndex]}`);
  };
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("default");
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<WeeklyTask | null>(null);
  
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState("Work");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskStatus, setTaskStatus] = useState<Status>("not-started");
  const [taskProgress, setTaskProgress] = useState(0);
  const [taskTags, setTaskTags] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskColor, setTaskColor] = useState("#667EEA");
  const [taskDayOfWeek, setTaskDayOfWeek] = useState<number>(0);
  const [taskTimeSlot, setTaskTimeSlot] = useState("");
  const [taskRepeatEnabled, setTaskRepeatEnabled] = useState(false);
  const [taskRepeatType, setTaskRepeatType] = useState<"indefinite" | "limited">("indefinite");
  const [taskRepeatWeeks, setTaskRepeatWeeks] = useState(4);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  const loadTasks = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setTasks(parsed);
          } else {
            console.warn("Invalid tasks format, resetting");
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        } catch (jsonError) {
          console.error("JSON parse error in weekly tasks, resetting:", jsonError);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading weekly tasks:", error);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, []);

  const saveTasks = useCallback(async (newTasks: WeeklyTask[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (error) {
      console.error("Error saving weekly tasks:", error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const handleBackPress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    router.back();
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!showCompleted && task.status === "completed") return false;
      if (filterCategory && task.category !== filterCategory) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, showCompleted, filterCategory, filterPriority]);

  const weekStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const avgProgress = total > 0 ? tasks.reduce((sum, task) => sum + task.progress, 0) / total : 0;

    return { total, completed, inProgress, avgProgress: Math.round(avgProgress) };
  }, [tasks]);

  const openAddModal = (dayOfWeek?: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetForm();
    if (dayOfWeek !== undefined) {
      setTaskDayOfWeek(dayOfWeek);
    }
    setAddModalVisible(true);
  };

  const resetForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskCategory("Work");
    setTaskPriority("medium");
    setTaskStatus("not-started");
    setTaskProgress(0);
    setTaskTags("");
    setTaskNotes("");
    setTaskColor("#667EEA");
    setTaskDayOfWeek(0);
    setTaskTimeSlot("");
    setTaskRepeatEnabled(false);
    setTaskRepeatType("indefinite");
    setTaskRepeatWeeks(4);
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert(t('weeklyPlanner.error'), t('weeklyPlanner.enterTitleError'));
      return;
    }

    const newTask: WeeklyTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      category: taskCategory,
      priority: taskPriority,
      status: taskStatus,
      dayOfWeek: taskDayOfWeek,
      timeSlot: taskTimeSlot || undefined,
      progress: taskProgress,
      color: taskColor,
      tags: taskTags.split(",").map((t) => t.trim()).filter((t) => t),
      notes: taskNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repeatConfig: taskRepeatEnabled ? {
        enabled: true,
        type: taskRepeatType,
        weeksCount: taskRepeatType === "limited" ? taskRepeatWeeks : undefined,
      } : undefined,
    };

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await saveTasks([...tasks, newTask]);
    setAddModalVisible(false);
    resetForm();
  };

  const handleEditTask = (task: WeeklyTask) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setTaskToEdit(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskCategory(task.category);
    setTaskPriority(task.priority);
    setTaskStatus(task.status);
    setTaskProgress(task.progress);
    setTaskTags(task.tags.join(", "));
    setTaskNotes(task.notes);
    setTaskColor(task.color || "#667EEA");
    setTaskDayOfWeek(task.dayOfWeek);
    setTaskTimeSlot(task.timeSlot || "");
    setTaskRepeatEnabled(task.repeatConfig?.enabled || false);
    setTaskRepeatType(task.repeatConfig?.type || "indefinite");
    setTaskRepeatWeeks(task.repeatConfig?.weeksCount || 4);
    setEditModalVisible(true);
  };

  const handleUpdateTask = async () => {
    if (!taskTitle.trim() || !taskToEdit) {
      Alert.alert(t('weeklyPlanner.error'), t('weeklyPlanner.enterTitleError'));
      return;
    }

    const updatedTask: WeeklyTask = {
      ...taskToEdit,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      category: taskCategory,
      priority: taskPriority,
      status: taskStatus,
      dayOfWeek: taskDayOfWeek,
      timeSlot: taskTimeSlot || undefined,
      progress: taskProgress,
      color: taskColor,
      tags: taskTags.split(",").map((t) => t.trim()).filter((t) => t),
      notes: taskNotes.trim(),
      updatedAt: new Date().toISOString(),
      repeatConfig: taskRepeatEnabled ? {
        enabled: true,
        type: taskRepeatType,
        weeksCount: taskRepeatType === "limited" ? taskRepeatWeeks : undefined,
      } : undefined,
    };

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const updatedTasks = tasks.map((t) => (t.id === taskToEdit.id ? updatedTask : t));
    await saveTasks(updatedTasks);
    setEditModalVisible(false);
    setTaskToEdit(null);
    resetForm();
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(t('weeklyPlanner.deleteTask'), t('weeklyPlanner.deleteConfirmation'), [
      { text: t('weeklyPlanner.cancel'), style: "cancel" },
      {
        text: t('weeklyPlanner.delete'),
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          const updatedTasks = tasks.filter((t) => t.id !== taskId);
          await saveTasks(updatedTasks);
        },
      },
    ]);
  };

  const previousWeek = () => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeekStart(newDate);
  };

  const getTasksForDay = (dayOfWeek: number) => {
    return filteredTasks.filter(task => task.dayOfWeek === dayOfWeek);
  };

  const renderTimelineView = () => {
    return (
      <View style={styles.timelineContainer}>
        {DAYS_OF_WEEK.map((day, idx) => {
          const dayTasks = getTasksForDay(idx);
          const weekDate = new Date(selectedWeekStart);
          weekDate.setDate(weekDate.getDate() + idx);
          const isToday = weekDate.toDateString() === new Date().toDateString();

          return (
            <View key={idx} style={styles.daySection}>
              <View style={styles.daySectionHeader}>
                <View style={styles.dayInfo}>
                  <Text style={[
                    styles.dayName,
                    isToday && styles.dayNameToday,
                    { color: isToday ? theme.colors.primary : theme.colors.text.primary }
                  ]}>
                    {getDayLabel(idx)}
                  </Text>
                  <Text style={[styles.dayDate, { color: theme.colors.text.secondary }]}>
                    {weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addDayTaskButton}
                  onPress={() => openAddModal(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Plus color={theme.colors.primary} size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {dayTasks.length === 0 ? (
                <View style={[styles.emptyDay, { backgroundColor: theme.colors.cardBackground }]}>
                  <Text style={[styles.emptyDayText, { color: theme.colors.text.light }]}>
                    {t('weeklyPlanner.noTasksScheduled')}
                  </Text>
                </View>
              ) : (
                <View style={styles.dayTasks}>
                  {dayTasks.map(renderTaskCard)}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderTaskCard = (task: WeeklyTask) => {
    const cardColor = task.color || COLOR_SCHEMES[colorScheme][0];

    return (
      <View key={task.id} style={[styles.taskCard, { backgroundColor: `${cardColor}15` }]}>
        <View style={[styles.taskColorBar, { backgroundColor: cardColor }]} />
        
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleRow}>
              <Text style={[styles.taskTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>
                {task.title}
              </Text>
              {task.priority === "urgent" && (
                <Flag color={PRIORITY_COLORS[task.priority]} size={18} fill={PRIORITY_COLORS[task.priority]} />
              )}
            </View>
            <View style={styles.taskActions}>
              <TouchableOpacity onPress={() => handleEditTask(task)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Edit2 color={theme.colors.primary} size={16} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteTask(task.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Trash2 color="#E74C3C" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.taskMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: cardColor }]}>
              <Text style={styles.categoryText}>{getCategoryLabel(task.category)}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
              <Text style={styles.priorityText}>{getPriorityLabel(task.priority).toUpperCase()}</Text>
            </View>
          </View>

          {task.timeSlot && (
            <View style={styles.timeRow}>
              <Clock color={theme.colors.text.secondary} size={14} />
              <Text style={[styles.timeText, { color: theme.colors.text.secondary }]}>
                {task.timeSlot}
              </Text>
            </View>
          )}

          {task.description && (
            <Text style={[styles.taskDescription, { color: theme.colors.text.secondary }]} numberOfLines={2}>
              {task.description}
            </Text>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: theme.colors.text.secondary }]}>{t('weeklyPlanner.progress')}</Text>
              <Text style={[styles.progressValue, { color: cardColor }]}>{task.progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${task.progress}%`, backgroundColor: cardColor }]} />
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${cardColor}20` }]}>
            <Text style={[styles.statusText, { color: cardColor }]}>{getStatusLabel(task.status)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTaskList = (task: WeeklyTask) => {
    const cardColor = task.color || COLOR_SCHEMES[colorScheme][0];

    return (
      <TouchableOpacity
        key={task.id}
        style={[styles.taskListItem, { backgroundColor: theme.colors.cardBackground }]}
        onPress={() => handleEditTask(task)}
        activeOpacity={0.7}
      >
        <View style={[styles.listColorIndicator, { backgroundColor: cardColor }]} />
        
        <View style={styles.listContent}>
          <View style={styles.listTop}>
            <Text style={[styles.listTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
              {task.title}
            </Text>
            <View style={[styles.listProgressBadge, { backgroundColor: `${cardColor}20` }]}>
              <Text style={[styles.listProgressText, { color: cardColor }]}>{task.progress}%</Text>
            </View>
          </View>
          
          <View style={styles.listBottom}>
            <View style={[styles.listCategoryChip, { backgroundColor: `${cardColor}15` }]}>
              <Text style={[styles.listCategoryText, { color: cardColor }]}>
                {getDayLabel(task.dayOfWeek).substring(0, 3)} • {getCategoryLabel(task.category)}
              </Text>
            </View>
            <Text style={[styles.listStatusText, { color: theme.colors.text.secondary }]}>
              {getStatusLabel(task.status)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => handleDeleteTask(task.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
            <Text style={styles.headerTitle}>{t('weeklyPlanner.title')}</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={[styles.weekSelector, { backgroundColor: theme.colors.cardBackground }]}>
          <TouchableOpacity onPress={previousWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft color={theme.colors.primary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.weekText, { color: theme.colors.text.primary }]}>
            {t('weeklyPlanner.weekOf')} {selectedWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={nextWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronRight color={theme.colors.primary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Target color={theme.colors.primary} size={24} />
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{weekStats.total}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{t('weeklyPlanner.totalTasks')}</Text>
            </View>
            <View style={styles.statItem}>
              <CheckCircle2 color="#30CFD0" size={24} />
              <Text style={[styles.statValue, { color: "#30CFD0" }]}>{weekStats.completed}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{t('weeklyPlanner.completed')}</Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp color="#FFB84D" size={24} />
              <Text style={[styles.statValue, { color: "#FFB84D" }]}>{weekStats.inProgress}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{t('weeklyPlanner.inProgress')}</Text>
            </View>
            <View style={styles.statItem}>
              <Star color="#FA709A" size={24} />
              <Text style={[styles.statValue, { color: "#FA709A" }]}>{weekStats.avgProgress}%</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{t('weeklyPlanner.avgProgress')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.filtersCard, { backgroundColor: theme.colors.cardBackground }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === "timeline" && { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode("timeline");
              }}
            >
              <Calendar color={viewMode === "timeline" ? "#FFFFFF" : theme.colors.text.secondary} size={18} />
            </TouchableOpacity>

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
                {t('weeklyPlanner.filterCompleted')}
              </Text>
            </TouchableOpacity>

            {filterCategory ? (
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setFilterCategory(null)}
              >
                <X color="#FFFFFF" size={16} />
                <Text style={styles.filterButtonTextActive}>{getCategoryLabel(filterCategory)}</Text>
              </TouchableOpacity>
            ) : null}

            {filterPriority ? (
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: PRIORITY_COLORS[filterPriority] }]}
                onPress={() => setFilterPriority(null)}
              >
                <X color="#FFFFFF" size={16} />
                <Text style={styles.filterButtonTextActive}>{getPriorityLabel(filterPriority)}</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {viewMode === "timeline" ? (
            renderTimelineView()
          ) : filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Target color={theme.colors.text.light} size={64} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>{t('weeklyPlanner.noTasksYet')}</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                {t('weeklyPlanner.startPlanning')}
              </Text>
            </View>
          ) : viewMode === "grid" ? (
            <View style={styles.tasksGrid}>{filteredTasks.map(renderTaskCard)}</View>
          ) : (
            <View style={styles.tasksList}>{filteredTasks.map(renderTaskList)}</View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => openAddModal()} activeOpacity={0.9}>
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
                  <Text style={[styles.modalTitle, { color: modalColors.text }]}>{editModalVisible ? t('weeklyPlanner.editTask') : t('weeklyPlanner.createTask')}</Text>
                  <View style={styles.modalHeaderActions}>
                    {keyboardVisible && (
                      <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.modernIconButton}>
                        <ChevronDown color={modalColors.text} size={24} strokeWidth={2.5} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => { setAddModalVisible(false); setEditModalVisible(false); }} style={styles.modernIconButton}>
                      <X color={modalColors.text} size={24} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.taskTitle')} *</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder={t('weeklyPlanner.taskTitlePlaceholder')}
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.description')}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder={t('weeklyPlanner.descriptionPlaceholder')}
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.dayOfWeek')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dayScroll}>
                    {DAYS_OF_WEEK.map((day, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.dayChip, { 
                          backgroundColor: taskDayOfWeek === idx ? theme.colors.primary : modalColors.inputBg,
                          borderColor: modalColors.inputBorder 
                        }]}
                        onPress={() => setTaskDayOfWeek(idx)}
                      >
                        <Text style={[styles.dayChipText, { color: taskDayOfWeek === idx ? '#FFFFFF' : modalColors.textSecondary }, taskDayOfWeek === idx && styles.dayChipTextActive]}>
                          {getDayLabel(idx).substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.timeSlot')}</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder={t('weeklyPlanner.timeSlotPlaceholder')}
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={taskTimeSlot}
                  onChangeText={setTaskTimeSlot}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.category')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryScroll}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryChip, { 
                          backgroundColor: taskCategory === cat ? theme.colors.primary : modalColors.inputBg,
                          borderColor: modalColors.inputBorder 
                        }]}
                        onPress={() => setTaskCategory(cat)}
                      >
                        <Text style={[styles.categoryChipText, { color: taskCategory === cat ? '#FFFFFF' : modalColors.textSecondary }, taskCategory === cat && styles.categoryChipTextActive]}>
                          {getCategoryLabel(cat)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.priority')}</Text>
                <View style={styles.priorityGrid}>
                  {(Object.keys(PRIORITY_COLORS) as Priority[]).map((pri) => (
                    <TouchableOpacity
                      key={pri}
                      style={[
                        styles.priorityChip,
                        {
                          backgroundColor: taskPriority === pri ? PRIORITY_COLORS[pri] : modalColors.inputBg,
                          borderColor: taskPriority === pri ? PRIORITY_COLORS[pri] : modalColors.inputBorder,
                        },
                      ]}
                      onPress={() => setTaskPriority(pri)}
                    >
                      <Text style={[styles.priorityChipText, { color: taskPriority === pri ? '#FFFFFF' : modalColors.textSecondary }, taskPriority === pri && styles.priorityChipTextActive]}>
                        {getPriorityLabel(pri)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.status')}</Text>
                <View style={styles.statusGrid}>
                  {(Object.keys(STATUS_LABELS) as Status[]).map((stat) => (
                    <TouchableOpacity
                      key={stat}
                      style={[styles.statusChip, { 
                        backgroundColor: taskStatus === stat ? theme.colors.primary : modalColors.inputBg,
                        borderColor: modalColors.inputBorder 
                      }]}
                      onPress={() => setTaskStatus(stat)}
                    >
                      <Text style={[styles.statusChipText, { color: taskStatus === stat ? '#FFFFFF' : modalColors.textSecondary }, taskStatus === stat && styles.statusChipTextActive]}>
                        {getStatusLabel(stat)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.progress')}: {taskProgress}%</Text>
                <View style={styles.progressSliderContainer}>
                  <TouchableOpacity
                    style={styles.progressButton}
                    onPress={() => setTaskProgress(Math.max(0, taskProgress - 10))}
                  >
                    <Text style={styles.progressButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.progressDisplay}>
                    <View style={styles.progressBarBgLarge}>
                      <View style={[styles.progressBarFillLarge, { width: `${taskProgress}%`, backgroundColor: theme.colors.primary }]} />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.progressButton}
                    onPress={() => setTaskProgress(Math.min(100, taskProgress + 10))}
                  >
                    <Text style={styles.progressButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.color')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.colorScroll}>
                    {COLOR_SCHEMES[colorScheme].map((color, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.colorOption, { backgroundColor: color }, taskColor === color && styles.colorOptionSelected]}
                        onPress={() => setTaskColor(color)}
                      >
                        {taskColor === color && <CheckCircle2 color="#FFFFFF" size={20} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.tags')}</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder={t('weeklyPlanner.tagsPlaceholder')}
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={taskTags}
                  onChangeText={setTaskTags}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{t('weeklyPlanner.notes')}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder={t('weeklyPlanner.notesPlaceholder')}
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={taskNotes}
                  onChangeText={setTaskNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.repeatHeader}>
                  <Text style={styles.formLabel}>{t('weeklyPlanner.repeatWeekly')}</Text>
                  <TouchableOpacity
                    style={[styles.toggleButton, taskRepeatEnabled && styles.toggleButtonActive]}
                    onPress={() => setTaskRepeatEnabled(!taskRepeatEnabled)}
                  >
                    <Text style={[styles.toggleButtonText, taskRepeatEnabled && styles.toggleButtonTextActive]}>
                      {taskRepeatEnabled ? t('weeklyPlanner.on') : t('weeklyPlanner.off')}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {taskRepeatEnabled && (
                  <View style={styles.repeatOptions}>
                    <TouchableOpacity
                      style={[
                        styles.repeatTypeButton,
                        taskRepeatType === "indefinite" && { backgroundColor: theme.colors.primary }
                      ]}
                      onPress={() => setTaskRepeatType("indefinite")}
                    >
                      <Text style={[
                        styles.repeatTypeText,
                        taskRepeatType === "indefinite" && styles.repeatTypeTextActive
                      ]}>
                        {t('weeklyPlanner.repeatIndefinite')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.repeatTypeButton,
                        taskRepeatType === "limited" && { backgroundColor: theme.colors.primary }
                      ]}
                      onPress={() => setTaskRepeatType("limited")}
                    >
                      <Text style={[
                        styles.repeatTypeText,
                        taskRepeatType === "limited" && styles.repeatTypeTextActive
                      ]}>
                        {t('weeklyPlanner.repeatLimited')}
                      </Text>
                    </TouchableOpacity>

                    {taskRepeatType === "limited" && (
                      <View style={styles.weeksCountContainer}>
                        <Text style={styles.weeksCountLabel}>{t('weeklyPlanner.numberOfWeeks')}: {taskRepeatWeeks}</Text>
                        <View style={styles.weeksCountControl}>
                          <TouchableOpacity
                            style={styles.weeksCountButton}
                            onPress={() => setTaskRepeatWeeks(Math.max(1, taskRepeatWeeks - 1))}
                          >
                            <Text style={styles.weeksCountButtonText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.weeksCountValue}>{taskRepeatWeeks}</Text>
                          <TouchableOpacity
                            style={styles.weeksCountButton}
                            onPress={() => setTaskRepeatWeeks(taskRepeatWeeks + 1)}
                          >
                            <Text style={styles.weeksCountButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={editModalVisible ? handleUpdateTask : handleAddTask}
              >
                <LinearGradient colors={theme.gradients.primary as any} style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>{editModalVisible ? t('weeklyPlanner.updateTask') : t('weeklyPlanner.addTask')}</Text>
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
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{t('weeklyPlanner.settings')}</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)} style={styles.closeButton}>
                <X color={theme.colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.settingsLabel, { color: theme.colors.text.primary }]}>{t('weeklyPlanner.colorScheme')}</Text>
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
                      {getColorSchemeLabel(scheme)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.settingsLabel, { color: theme.colors.text.primary }]}>{t('weeklyPlanner.filterByCategory')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryScroll}>
                  <TouchableOpacity
                    style={[styles.categoryChip, !filterCategory && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setFilterCategory(null)}
                  >
                    <Text style={[styles.categoryChipText, !filterCategory && styles.categoryChipTextActive]}>
                      {t('weeklyPlanner.all')}
                    </Text>
                  </TouchableOpacity>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, filterCategory === cat && { backgroundColor: theme.colors.primary }]}
                      onPress={() => setFilterCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, filterCategory === cat && styles.categoryChipTextActive]}>
                        {getCategoryLabel(cat)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.settingsLabel, { color: theme.colors.text.primary }]}>{t('weeklyPlanner.filterByPriority')}</Text>
              <View style={styles.priorityGrid}>
                <TouchableOpacity
                  style={[styles.priorityChip, !filterPriority && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setFilterPriority(null)}
                >
                  <Text style={[styles.priorityChipText, !filterPriority && styles.priorityChipTextActive]}>
                    {t('weeklyPlanner.all')}
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
                      {getPriorityLabel(pri)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeSettingsButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Text style={styles.closeSettingsButtonText}>{t('weeklyPlanner.done')}</Text>
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
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  weekSelector: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  weekText: {
    fontSize: 16,
    fontWeight: "700" as const,
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
    paddingBottom: 100,
  },
  timelineContainer: {
    gap: 20,
  },
  daySection: {
    gap: 12,
  },
  daySectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  dayInfo: {
    gap: 4,
  },
  dayName: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  dayNameToday: {
    fontWeight: "800" as const,
  },
  dayDate: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  addDayTaskButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyDay: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center" as const,
  },
  emptyDayText: {
    fontSize: 13,
    fontStyle: "italic" as const,
  },
  dayTasks: {
    gap: 12,
  },
  tasksGrid: {
    gap: 16,
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
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
  taskColorBar: {
    width: 8,
  },
  taskContent: {
    flex: 1,
    padding: 20,
  },
  taskHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 10,
  },
  taskTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 0.3,
    flex: 1,
  },
  taskActions: {
    flexDirection: "row" as const,
    gap: 12,
  },
  taskMeta: {
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
  timeRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 10,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  taskDescription: {
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
  taskListItem: {
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
    backgroundColor: Platform.OS === 'ios' ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.5)",
    ...(Platform.OS === 'ios' && {
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    } as any),
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end" as const,
    paddingTop: 80,
  },
  modalContent: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    minHeight: SCREEN_WIDTH * 1.2,
    borderTopWidth: 1,
    borderTopColor: "rgba(157, 78, 221, 0.15)",
    ...(Platform.OS === 'ios' && {
      backdropFilter: "blur(30px)",
      WebkitBackdropFilter: "blur(30px)",
    } as any),
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
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 4,
  },
  modernIconButton: {
    padding: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
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
  dayScroll: {
    flexDirection: "row" as const,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(157, 78, 221, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.15)",
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.text.secondary,
  },
  dayChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  categoryScroll: {
    flexDirection: "row" as const,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(157, 78, 221, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.15)",
  },
  categoryChipText: {
    fontSize: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(157, 78, 221, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(157, 78, 221, 0.15)",
  },
  priorityChipText: {
    fontSize: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(157, 78, 221, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.15)",
  },
  statusChipText: {
    fontSize: 11,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  progressButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
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
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#9D4EDD",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginTop: 12,
  },
  submitButtonGradient: {
    paddingVertical: 13,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
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
  repeatHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.text.secondary,
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  repeatOptions: {
    gap: 12,
    marginTop: 8,
  },
  repeatTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: colors.border,
  },
  repeatTypeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text.secondary,
    textAlign: "center" as const,
  },
  repeatTypeTextActive: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  weeksCountContainer: {
    gap: 8,
    marginTop: 4,
  },
  weeksCountLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text.secondary,
  },
  weeksCountControl: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 20,
  },
  weeksCountButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  weeksCountButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  weeksCountValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text.primary,
    minWidth: 40,
    textAlign: "center" as const,
  },
});
