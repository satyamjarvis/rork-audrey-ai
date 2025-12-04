import { useState, useMemo, useCallback, useEffect } from "react";
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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
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
  Repeat,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { useUniverseMode } from "@/contexts/UniverseModeContext";


const { width: SCREEN_WIDTH } = Dimensions.get("window");



type ViewMode = "grid" | "list" | "calendar";
type ColorScheme = "default" | "pastel" | "vibrant" | "monochrome";
type Priority = "low" | "medium" | "high" | "urgent";
type Status = "not-started" | "in-progress" | "completed" | "on-hold";

type RepeatConfig = {
  enabled: boolean;
  endType: "never" | "after";
  endAfterOccurrences?: number;
};

type MonthlyTask = {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: Priority;
  status: Status;
  date?: string;
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const STORAGE_KEY = "@monthly_tasks";

export default function MonthlyPlannerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { addEvent, selectedCalendar } = useCalendar();
  const { mode: universeMode } = useUniverseMode();
  
  const isNightMode = theme.id === "night-mode";
  const modalColors = isNightMode 
    ? {
        background: 'rgba(10, 10, 10, 0.85)',
        text: '#FFFFFF',
        textSecondary: '#FFD700',
        inputBg: 'rgba(255, 215, 0, 0.05)',
        inputBorder: 'rgba(255, 215, 0, 0.3)',
        cardBorder: 'rgba(255, 215, 0, 0.3)',
        labelColor: '#FFD700',
      }
    : {
        background: 'rgba(255, 255, 255, 0.85)',
        text: '#1A1A1A',
        textSecondary: '#9D4EDD',
        inputBg: 'rgba(157, 78, 221, 0.05)',
        inputBorder: 'rgba(157, 78, 221, 0.3)',
        cardBorder: 'rgba(157, 78, 221, 0.2)',
        labelColor: '#9D4EDD',
      };
  
  const [tasks, setTasks] = useState<MonthlyTask[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("default");
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<MonthlyTask | null>(null);
  
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState("Work");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskStatus, setTaskStatus] = useState<Status>("not-started");
  const [taskProgress, setTaskProgress] = useState(0);
  const [taskTags, setTaskTags] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskColor, setTaskColor] = useState("#667EEA");
  const [taskDate, setTaskDate] = useState("");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatEndType, setRepeatEndType] = useState<"never" | "after">("never");
  const [repeatEndAfter, setRepeatEndAfter] = useState("12");
  const [taskStarredForCalendar, setTaskStarredForCalendar] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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
          console.error("JSON parse error in monthly tasks, resetting:", jsonError);
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading monthly tasks:", error);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  }, []);

  const saveTasks = useCallback(async (newTasks: MonthlyTask[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (error) {
      console.error("Error saving monthly tasks:", error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!showCompleted && task.status === "completed") return false;
      if (filterCategory && task.category !== filterCategory) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      
      if (task.date) {
        const taskDate = new Date(task.date);
        if (taskDate.getMonth() !== selectedMonth || taskDate.getFullYear() !== selectedYear) {
          return false;
        }
      }
      
      return true;
    });
  }, [tasks, showCompleted, filterCategory, filterPriority, selectedMonth, selectedYear]);

  const monthStats = useMemo(() => {
    const monthTasks = tasks.filter(task => {
      if (task.date) {
        const taskDate = new Date(task.date);
        return taskDate.getMonth() === selectedMonth && taskDate.getFullYear() === selectedYear;
      }
      return true;
    });

    const total = monthTasks.length;
    const completed = monthTasks.filter((t) => t.status === "completed").length;
    const inProgress = monthTasks.filter((t) => t.status === "in-progress").length;
    const avgProgress = total > 0 ? monthTasks.reduce((sum, t) => sum + t.progress, 0) / total : 0;

    return { total, completed, inProgress, avgProgress: Math.round(avgProgress) };
  }, [tasks, selectedMonth, selectedYear]);

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).getDay();
  }, [selectedMonth, selectedYear]);

  const openAddModal = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetForm();
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
    setTaskDate("");
    setRepeatEnabled(false);
    setRepeatEndType("never");
    setRepeatEndAfter("12");
    setTaskStarredForCalendar(false);
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }

    const repeatConfig: RepeatConfig | undefined = repeatEnabled ? {
      enabled: true,
      endType: repeatEndType,
      endAfterOccurrences: repeatEndType === "after" ? parseInt(repeatEndAfter) || 12 : undefined,
    } : undefined;

    const newTask: MonthlyTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      category: taskCategory,
      priority: taskPriority,
      status: taskStatus,
      date: taskDate || undefined,
      progress: taskProgress,
      color: taskColor,
      tags: taskTags.split(",").map((t) => t.trim()).filter((t) => t),
      notes: taskNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repeatConfig,
    };

    if (taskStarredForCalendar && taskDate && selectedCalendar) {
      await addEvent({
        title: `⭐ ${taskTitle.trim()}`,
        date: taskDate,
        description: taskDescription.trim(),
        calendarId: selectedCalendar.id,
        starredFromPlanner: true,
        plannerSource: 'monthly',
      });
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await saveTasks([...tasks, newTask]);
    setAddModalVisible(false);
    resetForm();
  };

  const handleEditTask = (task: MonthlyTask) => {
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
    setTaskDate(task.date || "");
    setRepeatEnabled(task.repeatConfig?.enabled || false);
    setRepeatEndType(task.repeatConfig?.endType || "never");
    setRepeatEndAfter(task.repeatConfig?.endAfterOccurrences?.toString() || "12");
    setTaskStarredForCalendar(false);
    setEditModalVisible(true);
  };

  const handleUpdateTask = async () => {
    if (!taskTitle.trim() || !taskToEdit) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }

    const repeatConfig: RepeatConfig | undefined = repeatEnabled ? {
      enabled: true,
      endType: repeatEndType,
      endAfterOccurrences: repeatEndType === "after" ? parseInt(repeatEndAfter) || 12 : undefined,
    } : undefined;

    const updatedTask: MonthlyTask = {
      ...taskToEdit,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      category: taskCategory,
      priority: taskPriority,
      status: taskStatus,
      date: taskDate || undefined,
      progress: taskProgress,
      color: taskColor,
      tags: taskTags.split(",").map((t) => t.trim()).filter((t) => t),
      notes: taskNotes.trim(),
      updatedAt: new Date().toISOString(),
      repeatConfig,
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
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
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

  const previousMonth = () => {
    setSelectedDay(null);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    setSelectedDay(null);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getTasksForDate = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(task => task.date === dateStr);
  };

  const renderCalendarView = () => {
    const days = [];
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - firstDayOfMonth + 1;
      const isValidDay = day > 0 && day <= daysInMonth;
      const dayTasks = isValidDay ? getTasksForDate(day) : [];
      const isToday = isValidDay && 
        day === new Date().getDate() && 
        selectedMonth === new Date().getMonth() && 
        selectedYear === new Date().getFullYear();

      const showAudreyButton = universeMode === 'classic' && isValidDay && (day === 28 || day === 29);

      days.push(
        <View key={i} style={styles.calendarDayWrapper}>
          <TouchableOpacity
            style={[
              styles.calendarDay,
              !isValidDay && styles.calendarDayEmpty,
              isToday && styles.calendarDayToday,
              selectedDay === day && { backgroundColor: theme.colors.primary, borderRadius: 12 },
            ]}
            disabled={!isValidDay}
            onPress={() => {
              if (isValidDay) {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync();
                }
                setSelectedDay(selectedDay === day ? null : day);
              }
            }}
            onLongPress={() => {
              if (isValidDay) {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                setTaskDate(dateStr);
                openAddModal();
              }
            }}
            delayLongPress={400}
          >
            {isValidDay && (
              <>
                <Text style={[
                  styles.calendarDayText,
                  isToday && styles.calendarDayTextToday,
                  { color: selectedDay === day ? "#FFFFFF" : theme.colors.text.primary }
                ]}>
                  {day}
                </Text>
                {dayTasks.length > 0 && (
                  <View style={styles.taskIndicators}>
                    {dayTasks.slice(0, 3).map((task, idx) => (
                      <View
                        key={task.id}
                        style={[
                          styles.taskDot,
                          { backgroundColor: task.color || COLOR_SCHEMES[colorScheme][0] }
                        ]}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <Text style={styles.taskMoreText}>+{dayTasks.length - 3}</Text>
                    )}
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
          {showAudreyButton && day === 28 && (
            <View style={styles.audreyButtonContainer}>
              <TouchableOpacity
                style={styles.audreyButtonInCalendar}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  router.push("/ai-assistant");
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#00D9FF", "#00A8CC"]}
                  style={styles.audreyButtonGradient}
                >
                  <Image
                    source={{ uri: 'https://r2-pub.rork.com/generated-images/5a3f4488-9b7f-42f7-bd4f-cbcf57086ee9.png' }}
                    style={{ width: 28, height: 28 }}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.calendarGrid}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
          <View key={idx} style={styles.calendarHeader}>
            <Text style={[styles.calendarHeaderText, { color: theme.colors.text.secondary }]}>
              {day}
            </Text>
          </View>
        ))}
        <>{days}</>
      </View>
    );
  };

  const renderTaskCard = (task: MonthlyTask) => {
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
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] }]}>
              <Text style={styles.priorityText}>{task.priority.toUpperCase()}</Text>
            </View>
          </View>

          {task.description && (
            <Text style={[styles.taskDescription, { color: theme.colors.text.secondary }]} numberOfLines={2}>
              {task.description}
            </Text>
          )}

          {task.date && (
            <View style={styles.dateRow}>
              <Calendar color={theme.colors.text.secondary} size={14} />
              <Text style={[styles.dateText, { color: theme.colors.text.secondary }]}>
                {new Date(task.date).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: theme.colors.text.secondary }]}>Progress</Text>
              <Text style={[styles.progressValue, { color: cardColor }]}>{task.progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${task.progress}%`, backgroundColor: cardColor }]} />
            </View>
          </View>

          {task.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {task.tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={[styles.tagChip, { backgroundColor: `${cardColor}30` }]}>
                  <Text style={[styles.tagText, { color: cardColor }]}>{tag}</Text>
                </View>
              ))}
              {task.tags.length > 3 && (
                <Text style={[styles.moreTagsText, { color: theme.colors.text.light }]}>
                  +{task.tags.length - 3}
                </Text>
              )}
            </View>
          )}

          <View style={[styles.statusBadge, { backgroundColor: `${cardColor}20` }]}>
            <Text style={[styles.statusText, { color: cardColor }]}>{STATUS_LABELS[task.status]}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTaskList = (task: MonthlyTask) => {
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
              <Text style={[styles.listCategoryText, { color: cardColor }]}>{task.category}</Text>
            </View>
            <Text style={[styles.listStatusText, { color: theme.colors.text.secondary }]}>
              {STATUS_LABELS[task.status]}
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
            <Text style={styles.headerTitle}>Monthly Planner</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings color="#FFFFFF" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={[styles.monthSelector, { backgroundColor: theme.colors.cardBackground }]}>
          <TouchableOpacity onPress={previousMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft color={theme.colors.primary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: theme.colors.text.primary }]}>
            {MONTHS[selectedMonth]} {selectedYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronRight color={theme.colors.primary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Target color={theme.colors.primary} size={24} />
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{monthStats.total}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Total Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <CheckCircle2 color="#30CFD0" size={24} />
              <Text style={[styles.statValue, { color: "#30CFD0" }]}>{monthStats.completed}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp color="#FFB84D" size={24} />
              <Text style={[styles.statValue, { color: "#FFB84D" }]}>{monthStats.inProgress}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Star color="#FA709A" size={24} />
              <Text style={[styles.statValue, { color: "#FA709A" }]}>{monthStats.avgProgress}%</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Avg Progress</Text>
            </View>
          </View>
        </View>

        <View style={[styles.filtersCard, { backgroundColor: theme.colors.cardBackground }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === "calendar" && { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode("calendar");
              }}
            >
              <Calendar color={viewMode === "calendar" ? "#FFFFFF" : theme.colors.text.secondary} size={18} />
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
          {viewMode === "calendar" ? (
            <>
              {renderCalendarView()}
              {selectedDay !== null && (
                <View style={styles.selectedDayContainer}>
                  <View style={styles.selectedDayHeaderRow}>
                    <Text style={[styles.selectedDayHeader, { color: theme.colors.text.primary }]}>
                      {MONTHS[selectedMonth]} {selectedDay}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setSelectedDay(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X color={theme.colors.text.secondary} size={16} />
                    </TouchableOpacity>
                  </View>
                  
                  {getTasksForDate(selectedDay).length > 0 ? (
                    <View style={styles.tasksGrid}>
                      {getTasksForDate(selectedDay).map(renderTaskCard)}
                    </View>
                  ) : (
                    <View style={styles.emptyDayState}>
                      <Calendar color={theme.colors.text.light} size={40} />
                      <Text style={[styles.emptyDayText, { color: theme.colors.text.secondary }]}>
                        No tasks for this day
                      </Text>
                      <Text style={[styles.emptyDaySubtext, { color: theme.colors.text.light }]}>
                        Long press the day to add a task
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          ) : filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Target color={theme.colors.text.light} size={64} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>No Tasks Yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                Start planning your month by adding your first task
              </Text>
            </View>
          ) : viewMode === "grid" ? (
            <View style={styles.tasksGrid}>{filteredTasks.map(renderTaskCard)}</View>
          ) : (
            <View style={styles.tasksList}>{filteredTasks.map(renderTaskList)}</View>
          )}
        </ScrollView>
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
                  <Text style={[styles.modalTitle, { color: modalColors.text }]}>{editModalVisible ? "Edit Task" : "Create Task"}</Text>
                  <View style={styles.modalHeaderActions}>
                    {keyboardVisible && (
                      <TouchableOpacity 
                        onPress={() => Keyboard.dismiss()}
                        style={styles.modernIconButton}
                      >
                        <ChevronLeft 
                          color={modalColors.text} 
                          size={20}
                          style={{ transform: [{ rotate: '-90deg' }] }}
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => { setAddModalVisible(false); setEditModalVisible(false); }} style={styles.modernIconButton}>
                      <X color={modalColors.text} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Task Title *</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder="e.g., Complete project report"
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
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
                  placeholder="Describe your task..."
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
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
                          backgroundColor: taskCategory === cat ? theme.colors.primary : modalColors.inputBg,
                          borderColor: modalColors.inputBorder 
                        }]}
                        onPress={() => setTaskCategory(cat)}
                      >
                        <Text style={[styles.categoryChipText, { color: taskCategory === cat ? '#FFFFFF' : modalColors.textSecondary }, taskCategory === cat && styles.categoryChipTextActive]}>
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
                          backgroundColor: taskPriority === pri ? PRIORITY_COLORS[pri] : modalColors.inputBg,
                          borderColor: taskPriority === pri ? PRIORITY_COLORS[pri] : modalColors.inputBorder,
                        },
                      ]}
                      onPress={() => setTaskPriority(pri)}
                    >
                      <Text style={[styles.priorityChipText, { color: taskPriority === pri ? '#FFFFFF' : modalColors.textSecondary }, taskPriority === pri && styles.priorityChipTextActive]}>
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
                        backgroundColor: taskStatus === stat ? theme.colors.primary : modalColors.inputBg,
                        borderColor: modalColors.inputBorder 
                      }]}
                      onPress={() => setTaskStatus(stat)}
                    >
                      <Text style={[styles.statusChipText, { color: taskStatus === stat ? '#FFFFFF' : modalColors.textSecondary }, taskStatus === stat && styles.statusChipTextActive]}>
                        {STATUS_LABELS[stat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Progress: {taskProgress}%</Text>
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
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Color</Text>
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
                <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>Date</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: modalColors.inputBg, 
                    borderColor: modalColors.inputBorder,
                    color: modalColors.text 
                  }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={taskDate}
                  onChangeText={setTaskDate}
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
                  placeholder="e.g., urgent, meeting, review"
                  placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                  value={taskTags}
                  onChangeText={setTaskTags}
                />
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
                  value={taskNotes}
                  onChangeText={setTaskNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.repeatHeader}>
                  <View style={styles.repeatTitleRow}>
                    <Repeat color={theme.colors.primary} size={20} />
                    <Text style={styles.formLabel}>Repeat Monthly</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.repeatToggle, repeatEnabled && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setRepeatEnabled(!repeatEnabled)}
                  >
                    <View style={[styles.repeatToggleKnob, repeatEnabled && styles.repeatToggleKnobActive]} />
                  </TouchableOpacity>
                </View>
                
                {repeatEnabled && (
                  <View style={styles.repeatOptions}>
                    <Text style={[styles.repeatDescription, { color: modalColors.textSecondary }]}>
                      This task will repeat every month on the same date.
                    </Text>
                    
                    <View style={styles.repeatEndTypeContainer}>
                      <TouchableOpacity
                        style={[
                          styles.repeatEndTypeButton,
                          repeatEndType === "never" && { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={() => setRepeatEndType("never")}
                      >
                        <Text style={[
                          styles.repeatEndTypeText,
                          { color: repeatEndType === "never" ? '#FFFFFF' : modalColors.textSecondary },
                          repeatEndType === "never" && styles.repeatEndTypeTextActive,
                        ]}>
                          Repeat Indefinitely
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.repeatEndTypeButton,
                          repeatEndType === "after" && { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={() => setRepeatEndType("after")}
                      >
                        <Text style={[
                          styles.repeatEndTypeText,
                          { color: repeatEndType === "after" ? '#FFFFFF' : modalColors.textSecondary },
                          repeatEndType === "after" && styles.repeatEndTypeTextActive,
                        ]}>
                          End After
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {repeatEndType === "after" && (
                      <View style={styles.repeatEndAfterContainer}>
                        <Text style={[styles.repeatEndAfterLabel, { color: modalColors.textSecondary }]}>Number of months:</Text>
                        <TextInput
                          style={[styles.repeatEndAfterInput, { 
                            color: modalColors.text,
                            backgroundColor: modalColors.inputBg,
                            borderColor: modalColors.inputBorder 
                          }]}
                          placeholder="12"
                          placeholderTextColor={isNightMode ? '#999999' : colors.text.light}
                          value={repeatEndAfter}
                          onChangeText={setRepeatEndAfter}
                          keyboardType="number-pad"
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>

              {!editModalVisible && (
                <View style={styles.formGroup}>
                  <TouchableOpacity
                    style={[styles.starToggle, taskStarredForCalendar && styles.starToggleActive]}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTaskStarredForCalendar(!taskStarredForCalendar);
                    }}
                    activeOpacity={0.7}
                  >
                    <Star
                      color={taskStarredForCalendar ? "#FFD700" : theme.colors.text.secondary}
                      size={24}
                      fill={taskStarredForCalendar ? "#FFD700" : "none"}
                    />
                    <View style={styles.starToggleTextContainer}>
                      <Text style={[styles.starToggleTitle, { color: taskStarredForCalendar ? "#FFD700" : modalColors.text }]}>
                        Show in Main Calendar
                      </Text>
                      <Text style={[styles.starToggleDescription, { color: modalColors.textSecondary }]}>
                        This event will appear with a gold star in the calendar
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={editModalVisible ? handleUpdateTask : handleAddTask}
              >
                <LinearGradient colors={theme.gradients.primary as any} style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>{editModalVisible ? "Update Task" : "Create Task"}</Text>
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
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  monthSelector: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  monthText: {
    fontSize: 18,
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
  calendarGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
  },
  calendarHeader: {
    width: `${100 / 7}%`,
    paddingVertical: 12,
    alignItems: "center" as const,
  },
  calendarHeaderText: {
    fontSize: 14,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  calendarDayWrapper: {
    width: `${100 / 7}%`,
    position: "relative" as const,
  },
  calendarDay: {
    width: "100%",
    aspectRatio: 1,
    padding: 4,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 8,
  },
  calendarDayEmpty: {
    opacity: 0,
  },
  calendarDayToday: {
    backgroundColor: "rgba(102, 126, 234, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(102, 126, 234, 0.3)",
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  calendarDayTextToday: {
    fontWeight: "800" as const,
  },
  taskIndicators: {
    flexDirection: "row" as const,
    gap: 2,
    alignItems: "center" as const,
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  taskMoreText: {
    fontSize: 8,
    fontWeight: "600" as const,
    color: "#999",
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
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600" as const,
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
  selectedDayContainer: {
    marginTop: 24,
    gap: 16,
  },
  selectedDayHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  selectedDayHeader: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  emptyDayState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  emptyDayText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  emptyDaySubtext: {
    fontSize: 13,
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
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    minHeight: SCREEN_WIDTH * 1.2,
    borderTopWidth: 2,
    borderTopColor: "rgba(157, 78, 221, 0.3)",
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
  modernIconButton: {
    padding: 8,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 0.3,
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
    elevation: 4,
    shadowColor: "#9D4EDD",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
  repeatTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  repeatToggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0E0E0",
    padding: 2,
    justifyContent: "center" as const,
  },
  repeatToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    transform: [{ translateX: 0 }],
  },
  repeatToggleKnobActive: {
    transform: [{ translateX: 24 }],
  },
  repeatOptions: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  repeatDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  repeatEndTypeContainer: {
    flexDirection: "row" as const,
    gap: 8,
  },
  repeatEndTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center" as const,
  },
  repeatEndTypeText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.text.secondary,
  },
  repeatEndTypeTextActive: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  repeatEndAfterContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  repeatEndAfterLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    flex: 1,
  },
  repeatEndAfterInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "600" as const,
    width: 80,
    textAlign: "center" as const,
    borderWidth: 1.5,
    borderColor: "rgba(157, 78, 221, 0.3)",
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
  audreyButtonContainer: {
    position: "absolute" as const,
    right: -16,
    top: "50%",
    transform: [{ translateY: -20 }],
    zIndex: 100,
  },
  audreyButtonInCalendar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden" as const,
    elevation: 6,
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  audreyButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
    borderColor: "#00D9FF",
  },
});
