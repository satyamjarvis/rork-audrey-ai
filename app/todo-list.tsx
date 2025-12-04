import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Animated,
  Dimensions,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  ArrowLeft,
  Plus,
  X,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  Filter,
  Target,
  TrendingUp,
  Sparkles,
  ListTodo,
  CheckSquare,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";

import { useTheme } from "@/contexts/ThemeContext";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";
import QuickPressable from "@/components/QuickPressable";
import { useTodoList, Priority, TodoCategory, TodoItem } from "@/contexts/TodoListContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const NIGHT_MODE_PRIORITY_COLORS: Record<Priority, string> = {
  low: "#4CAF50",
  medium: "#FFC107",
  high: "#FF4444",
};

const BRIGHT_MODE_PRIORITY_COLORS: Record<Priority, string> = {
  low: "#BAFFC9",
  medium: "#FFDFBA",
  high: "#FFB3BA",
};

const NIGHT_MODE_CATEGORY_COLORS: Record<TodoCategory, string> = {
  personal: "#2196F3",
  work: "#9C27B0",
  shopping: "#00BCD4",
  health: "#4CAF50",
  other: "#607D8B",
};

const BRIGHT_MODE_CATEGORY_COLORS: Record<TodoCategory, string> = {
  personal: "#BAE1FF",
  work: "#E0BBE4",
  shopping: "#D4F1F4",
  health: "#BAFFC9",
  other: "#C9CCD5",
};

const CATEGORY_LABELS: Record<TodoCategory, string> = {
  personal: "Personal",
  work: "Work",
  shopping: "Shopping",
  health: "Health",
  other: "Other",
};

export default function TodoListScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { todos, addTodo, updateTodo, deleteTodo, toggleTodoComplete, isLoading } = useTodoList();

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

  const PRIORITY_COLORS = useMemo(() => {
    return isNightMode
      ? NIGHT_MODE_PRIORITY_COLORS
      : BRIGHT_MODE_PRIORITY_COLORS;
  }, [isNightMode]);

  const CATEGORY_COLORS = useMemo(() => {
    return isNightMode
      ? NIGHT_MODE_CATEGORY_COLORS
      : BRIGHT_MODE_CATEGORY_COLORS;
  }, [isNightMode]);

  const heartPulse = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<TodoCategory | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<TodoItem | null>(null);
  
  const [todoTitle, setTodoTitle] = useState("");
  const [todoDescription, setTodoDescription] = useState("");
  const [todoCategory, setTodoCategory] = useState<TodoCategory>("personal");
  const [todoPriority, setTodoPriority] = useState<Priority>("medium");
  const [todoTags, setTodoTags] = useState("");
  const [todoDueDate, setTodoDueDate] = useState("");

  const starPositions = useMemo(() => {
    return Array.from({ length: 15 }, () => ({
      left: Math.random() * SCREEN_WIDTH,
      top: Math.random() * 350,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

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

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (!showCompleted && todo.completed) return false;
      if (filterCategory && todo.category !== filterCategory) return false;
      if (filterPriority && todo.priority !== filterPriority) return false;
      return true;
    });
  }, [todos, showCompleted, filterCategory, filterPriority]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = todos.filter(t => {
      if (t.completed || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;

    return { total, completed, pending, completionRate, overdue };
  }, [todos]);

  const openAddModal = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetForm();
    setAddModalVisible(true);
  }, []);

  const resetForm = useCallback(() => {
    setTodoTitle("");
    setTodoDescription("");
    setTodoCategory("personal");
    setTodoPriority("medium");
    setTodoTags("");
    setTodoDueDate("");
  }, []);

  const handleAddTodo = useCallback(async () => {
    if (!todoTitle.trim()) {
      Alert.alert("Error", "Please enter a todo title");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await addTodo({
      title: todoTitle.trim(),
      description: todoDescription.trim(),
      priority: todoPriority,
      category: todoCategory,
      dueDate: todoDueDate || undefined,
      tags: todoTags.split(",").map((t) => t.trim()).filter((t) => t),
    });
    
    setAddModalVisible(false);
    resetForm();
  }, [todoTitle, todoDescription, todoPriority, todoCategory, todoDueDate, todoTags, addTodo, resetForm]);

  const handleEditTodo = useCallback((todo: TodoItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setTodoToEdit(todo);
    setTodoTitle(todo.title);
    setTodoDescription(todo.description || "");
    setTodoCategory(todo.category);
    setTodoPriority(todo.priority);
    setTodoTags(todo.tags.join(", "));
    setTodoDueDate(todo.dueDate || "");
    setEditModalVisible(true);
  }, []);

  const handleUpdateTodo = useCallback(async () => {
    if (!todoTitle.trim() || !todoToEdit) {
      Alert.alert("Error", "Please enter a todo title");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await updateTodo(todoToEdit.id, {
      title: todoTitle.trim(),
      description: todoDescription.trim(),
      category: todoCategory,
      priority: todoPriority,
      dueDate: todoDueDate || undefined,
      tags: todoTags.split(",").map((t) => t.trim()).filter((t) => t),
    });
    
    setEditModalVisible(false);
    setTodoToEdit(null);
    resetForm();
  }, [todoTitle, todoToEdit, todoDescription, todoCategory, todoPriority, todoDueDate, todoTags, updateTodo, resetForm]);

  const handleDeleteTodo = useCallback((todoId: string) => {
    Alert.alert("Delete Todo", "Are you sure you want to delete this todo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          await deleteTodo(todoId);
        },
      },
    ]);
  }, [deleteTodo]);

  const handleToggleComplete = useCallback(async (todoId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await toggleTodoComplete(todoId);
  }, [toggleTodoComplete]);

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

  const starsRotateInterpolate = starsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const renderTodoItem = useCallback(({ item: todo }: { item: TodoItem }) => {
    const categoryColor = CATEGORY_COLORS[todo.category];
    const priorityColor = PRIORITY_COLORS[todo.priority];
    const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();

    return (
      <View style={styles.todoItemCard}>
        <View style={[styles.todoItemOverlay, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <TouchableOpacity 
            onPress={() => handleToggleComplete(todo.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {todo.completed ? (
              <CheckCircle2 color={colors.primary} size={24} strokeWidth={2.5} />
            ) : (
              <Circle color={colors.secondary} size={24} strokeWidth={2.5} />
            )}
          </TouchableOpacity>

          <View style={styles.todoContent}>
            <Text 
              style={[
                styles.todoTitle,
                { color: colors.textPrimary },
                todo.completed && styles.todoTitleCompleted
              ]}
              numberOfLines={2}
            >
              {todo.title}
            </Text>

            {todo.description && (
              <Text 
                style={[styles.todoDescription, { color: colors.textSecondary }, todo.completed && { opacity: 0.6 }]}
                numberOfLines={2}
              >
                {todo.description}
              </Text>
            )}

            <View style={styles.todoMeta}>
              <View style={[styles.metaBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.metaBadgeText}>{CATEGORY_LABELS[todo.category]}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: priorityColor }]}>
                <Text style={styles.metaBadgeText}>{todo.priority.toUpperCase()}</Text>
              </View>
              {isOverdue && (
                <View style={[styles.metaBadge, { backgroundColor: "#E74C3C" }]}>
                  <Text style={styles.metaBadgeText}>OVERDUE</Text>
                </View>
              )}
            </View>

            {todo.dueDate && (
              <View style={styles.dueDateRow}>
                <Calendar color={colors.textSecondary} size={12} />
                <Text style={[styles.dueDateText, { color: colors.textSecondary }]}>
                  Due: {new Date(todo.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {todo.tags.length > 0 && (
              <View style={styles.tagsRow}>
                <Tag color={colors.textSecondary} size={12} />
                {todo.tags.slice(0, 3).map((tag, idx) => (
                  <Text key={idx} style={[styles.tagText, { color: colors.textSecondary }]}>
                    {tag}
                  </Text>
                ))}
                {todo.tags.length > 3 && (
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                    +{todo.tags.length - 3}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.todoActions}>
            <TouchableOpacity 
              onPress={() => handleEditTodo(todo)} 
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit2 color={colors.accent} size={18} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDeleteTodo(todo.id)} 
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 color="#f87171" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [CATEGORY_COLORS, PRIORITY_COLORS, handleToggleComplete, handleEditTodo, handleDeleteTodo, colors]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradientColors} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.primary }]}>Loading todos...</Text>
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
                  <ListTodo
                    color={colors.primary}
                    size={48}
                    strokeWidth={2}
                  />
                </Animated.View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Todo List</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{todos.length} tasks total</Text>
                </View>
              </View>
              <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                <Sparkles color={colors.accent} size={32} strokeWidth={1.5} />
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View
            style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          >
            <FlatList
              data={filteredTodos}
              renderItem={renderTodoItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <>
                  {/* Stats Card */}
                  {Platform.OS === "web" ? (
                    <View style={[styles.statsCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                      <View style={styles.statsOverlay}>
                        <View style={styles.statsRow}>
                          <View style={styles.statItem}>
                            <Target color={colors.primary} size={24} />
                            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
                          </View>
                          <View style={styles.statItem}>
                            <CheckCircle2 color="#30CFD0" size={24} />
                            <Text style={[styles.statValue, { color: "#30CFD0" }]}>{stats.completed}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Done</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Circle color="#FFB84D" size={24} />
                            <Text style={[styles.statValue, { color: "#FFB84D" }]}>{stats.pending}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
                          </View>
                          <View style={styles.statItem}>
                            <TrendingUp color="#FA709A" size={24} />
                            <Text style={[styles.statValue, { color: "#FA709A" }]}>{stats.completionRate}%</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rate</Text>
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
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
                          </View>
                          <View style={styles.statItem}>
                            <CheckCircle2 color="#30CFD0" size={24} />
                            <Text style={[styles.statValue, { color: "#30CFD0" }]}>{stats.completed}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Done</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Circle color="#FFB84D" size={24} />
                            <Text style={[styles.statValue, { color: "#FFB84D" }]}>{stats.pending}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
                          </View>
                          <View style={styles.statItem}>
                            <TrendingUp color="#FA709A" size={24} />
                            <Text style={[styles.statValue, { color: "#FA709A" }]}>{stats.completionRate}%</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rate</Text>
                          </View>
                        </View>
                      </View>
                    </BlurView>
                  )}

                  {/* Filters Section */}
                  <View style={styles.filtersSection}>
                    <TouchableOpacity 
                      style={[
                        styles.filterPill,
                        {
                          backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 192, 203, 0.15)",
                          borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(255, 192, 203, 0.3)"
                        }
                      ]}
                      onPress={() => setSettingsModalVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Filter color={colors.primary} size={16} />
                      <Text style={[styles.filterText, { color: colors.primary }]}>Filters</Text>
                    </TouchableOpacity>
                    
                    {(filterCategory || filterPriority || !showCompleted) && (
                      <View style={{ flex: 1 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.activeFilters}>
                            {!showCompleted && (
                              <TouchableOpacity
                                style={styles.activeFilterChip}
                                onPress={() => setShowCompleted(true)}
                              >
                                <Text style={styles.activeFilterText}>Hiding Completed</Text>
                                <X color="#FFFFFF" size={12} />
                              </TouchableOpacity>
                            )}
                            {filterCategory && (
                              <TouchableOpacity
                                style={[styles.activeFilterChip, { backgroundColor: CATEGORY_COLORS[filterCategory] }]}
                                onPress={() => setFilterCategory(null)}
                              >
                                <Text style={styles.activeFilterText}>{CATEGORY_LABELS[filterCategory]}</Text>
                                <X color="#FFFFFF" size={12} />
                              </TouchableOpacity>
                            )}
                            {filterPriority && (
                              <TouchableOpacity
                                style={[styles.activeFilterChip, { backgroundColor: PRIORITY_COLORS[filterPriority] }]}
                                onPress={() => setFilterPriority(null)}
                              >
                                <Text style={styles.activeFilterText}>{filterPriority}</Text>
                                <X color="#FFFFFF" size={12} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <CheckSquare color={colors.secondary} size={64} strokeWidth={1.5} />
                  <Text style={[styles.emptyTitle, { color: colors.primary }]}>No Todos Yet</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Start organizing your tasks by adding your first todo
                  </Text>
                </View>
              }
              ListFooterComponent={
                <View style={{ marginTop: 24 }}>
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    Stay organized and productive
                  </Text>
                </View>
              }
            />
          </Animated.View>
        </View>

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.9}>
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

      <Modal visible={addModalVisible || editModalVisible} transparent animationType="slide" onRequestClose={() => { setAddModalVisible(false); setEditModalVisible(false); }}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent} bounces={false}>
            <View style={[styles.modalContent, { backgroundColor: isNightMode ? "#1a0a1f" : theme.colors.cardBackground, paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>{editModalVisible ? "Edit Todo" : "New Todo"}</Text>
                <View style={styles.modalHeaderActions}>
                  <KeyboardDismissButton color={theme.colors.text.primary} size={20} />
                  <QuickPressable onPress={() => { setAddModalVisible(false); setEditModalVisible(false); }}>
                    <Text style={[styles.modalClose, { color: theme.colors.text.primary }]}>✕</Text>
                  </QuickPressable>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text.primary }]}>Todo Title *</Text>
                <TextInput
                  style={[styles.textInput, { color: isNightMode ? "#FFD700" : theme.colors.text.primary, backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background, borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border }]}
                  placeholder="e.g., Buy groceries"
                  placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                  value={todoTitle}
                  onChangeText={setTodoTitle}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text.primary }]}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { color: isNightMode ? "#FFD700" : theme.colors.text.primary, backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background, borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border }]}
                  placeholder="Add details..."
                  placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                  value={todoDescription}
                  onChangeText={setTodoDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text.primary }]}>Category</Text>
                <View style={styles.categoryGrid}>
                  {(Object.keys(CATEGORY_LABELS) as TodoCategory[]).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        { backgroundColor: todoCategory === cat ? CATEGORY_COLORS[cat] : (isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background) },
                      ]}
                      onPress={() => setTodoCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, { color: todoCategory === cat ? "#FFFFFF" : theme.colors.text.secondary }, todoCategory === cat && styles.categoryChipTextActive]}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text.primary }]}>Priority</Text>
                <View style={styles.priorityGrid}>
                  {(Object.keys(PRIORITY_COLORS) as Priority[]).map((pri) => (
                    <TouchableOpacity
                      key={pri}
                      style={[
                        styles.priorityChip,
                        { backgroundColor: todoPriority === pri ? PRIORITY_COLORS[pri] : (isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background) },
                      ]}
                      onPress={() => setTodoPriority(pri)}
                    >
                      <Text style={[styles.priorityChipText, { color: todoPriority === pri ? "#FFFFFF" : theme.colors.text.secondary }, todoPriority === pri && styles.priorityChipTextActive]}>
                        {pri.charAt(0).toUpperCase() + pri.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text.primary }]}>Due Date (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { color: isNightMode ? "#FFD700" : theme.colors.text.primary, backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background, borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                  value={todoDueDate}
                  onChangeText={setTodoDueDate}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.text.primary }]}>Tags (comma separated)</Text>
                <TextInput
                  style={[styles.textInput, { color: isNightMode ? "#FFD700" : theme.colors.text.primary, backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background, borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : theme.colors.border }]}
                  placeholder="e.g., urgent, home, weekend"
                  placeholderTextColor={isNightMode ? "rgba(255, 215, 0, 0.5)" : theme.colors.text.light}
                  value={todoTags}
                  onChangeText={setTodoTags}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={editModalVisible ? handleUpdateTodo : handleAddTodo}
              >
                <LinearGradient colors={["#d946ef", "#a855f7"]} style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>{editModalVisible ? "Update Todo" : "Create Todo"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={settingsModalVisible} transparent animationType="fade" onRequestClose={() => setSettingsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.settingsModal, { backgroundColor: isNightMode ? "#1a0a1f" : theme.colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Filter color={theme.colors.primary} size={22} />
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Filters</Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <KeyboardDismissButton color={theme.colors.text.primary} size={20} />
                <QuickPressable onPress={() => setSettingsModalVisible(false)}>
                  <Text style={[styles.modalClose, { color: theme.colors.text.primary }]}>✕</Text>
                </QuickPressable>
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.settingsLabel, { color: theme.colors.text.primary }]}>Visibility</Text>
              <TouchableOpacity
                style={[styles.toggleOption, { backgroundColor: showCompleted ? theme.colors.primary : (isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background) }]}
                onPress={() => setShowCompleted(!showCompleted)}
              >
                <Text style={[styles.toggleOptionText, { color: showCompleted ? "#FFFFFF" : theme.colors.text.secondary }]}>
                  Show Completed Tasks
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.settingsLabel, { color: theme.colors.text.primary }]}>Filter by Category</Text>
              <View style={styles.categoryGrid}>
                <TouchableOpacity
                  style={[styles.categoryChip, !filterCategory && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setFilterCategory(null)}
                >
                  <Text style={[styles.categoryChipText, { color: !filterCategory ? "#FFFFFF" : theme.colors.text.secondary }, !filterCategory && styles.categoryChipTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {(Object.keys(CATEGORY_LABELS) as TodoCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: filterCategory === cat ? CATEGORY_COLORS[cat] : (isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background) },
                    ]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, { color: filterCategory === cat ? "#FFFFFF" : theme.colors.text.secondary }, filterCategory === cat && styles.categoryChipTextActive]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingsGroup}>
              <Text style={[styles.settingsLabel, { color: theme.colors.text.primary }]}>Filter by Priority</Text>
              <View style={styles.priorityGrid}>
                <TouchableOpacity
                  style={[styles.priorityChip, !filterPriority && { backgroundColor: theme.colors.primary }]}
                  onPress={() => setFilterPriority(null)}
                >
                  <Text style={[styles.priorityChipText, { color: !filterPriority ? "#FFFFFF" : theme.colors.text.secondary }, !filterPriority && styles.priorityChipTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {(Object.keys(PRIORITY_COLORS) as Priority[]).map((pri) => (
                  <TouchableOpacity
                    key={pri}
                    style={[
                      styles.priorityChip,
                      { backgroundColor: filterPriority === pri ? PRIORITY_COLORS[pri] : (isNightMode ? "rgba(255, 215, 0, 0.1)" : theme.colors.background) },
                    ]}
                    onPress={() => setFilterPriority(pri)}
                  >
                    <Text style={[styles.priorityChipText, { color: filterPriority === pri ? "#FFFFFF" : theme.colors.text.secondary }, filterPriority === pri && styles.priorityChipTextActive]}>
                      {pri.charAt(0).toUpperCase() + pri.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeSettingsButton}
              onPress={() => setSettingsModalVisible(false)}
            >
              <LinearGradient colors={["#d946ef", "#a855f7"]} style={styles.closeSettingsButtonGradient}>
                <Text style={styles.closeSettingsButtonText}>Done</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#ffc0cb",
  },
  star: {
    position: "absolute" as const,
    backgroundColor: "#ffffff",
    borderRadius: 50,
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
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#ffc0cb",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
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
  statsCard: {
    borderRadius: 24,
    overflow: "hidden",
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
    color: "#ffc0cb",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    color: "#d4c4f0",
  },
  filtersSection: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 20,
    gap: 12,
  },
  filterPill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 192, 203, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.3)",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#ffc0cb",
  },
  activeFilters: {
    flexDirection: "row" as const,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#d946ef",
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  todoList: {
    gap: 12,
  },
  todoItemCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.2)",
    marginBottom: 12,
  },
  todoItemOverlay: {
    flexDirection: "row" as const,
    padding: 16,
    gap: 12,
  },
  todoContent: {
    flex: 1,
    gap: 8,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
    color: "#FFFFFF",
  },
  todoTitleCompleted: {
    textDecorationLine: "line-through" as const,
    opacity: 0.6,
  },
  todoDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#d4c4f0",
  },
  todoMeta: {
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
  dueDateRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#b8a8d8",
  },
  tagsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    flexWrap: "wrap" as const,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: "#b8a8d8",
  },
  todoActions: {
    gap: 12,
    justifyContent: "center" as const,
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
    color: "#ffc0cb",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center" as const,
    lineHeight: 22,
    color: "#d4c4f0",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#b8a8d8",
    textAlign: "center" as const,
    letterSpacing: 0.5,
    opacity: 0.7,
    fontStyle: "italic" as const,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end" as const,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
  },
  modalClose: {
    fontSize: 28,
    fontWeight: "300" as const,
  },
  modalHeaderActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  textInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500" as const,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top" as const,
  },
  categoryGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F5F7FA",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F5F7FA",
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  priorityChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
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
  settingsModal: {
    margin: 20,
    borderRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  settingsGroup: {
    marginBottom: 24,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  toggleOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  closeSettingsButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#d946ef",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginTop: 12,
  },
  closeSettingsButtonGradient: {
    paddingVertical: 14,
    alignItems: "center" as const,
  },
  closeSettingsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
