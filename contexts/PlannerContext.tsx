import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { encrypt, decrypt } from "@/utils/encryption";

export type RepeatConfig = {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  endType: "never" | "after" | "on";
  endAfterOccurrences?: number;
  endOnDate?: string;
  daysOfWeek?: number[];
  monthDay?: number;
};

export type PlannerTask = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  repeatConfig?: RepeatConfig;
};

const TASKS_KEY = "@planner_tasks";

export const [PlannerProvider, usePlanner] = createContextHook(() => {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const tasksData = await AsyncStorage.getItem(TASKS_KEY);
      
      if (tasksData) {
        if (tasksData.trim().length === 0) {
          console.log("Empty tasks data, initializing fresh");
          await AsyncStorage.removeItem(TASKS_KEY);
          setTasks([]);
          return;
        }
        
        try {
          let parsedTasks;
          try {
            const decryptedData = await decrypt(tasksData);
            parsedTasks = JSON.parse(decryptedData);
            console.log("🔓 Planner tasks decrypted successfully");
          } catch {
            parsedTasks = JSON.parse(tasksData);
            console.log("⚠️ Loaded unencrypted planner tasks, will encrypt on next save");
          }
          
          if (!Array.isArray(parsedTasks)) {
            console.warn("Tasks data is not an array, resetting. Type:", typeof parsedTasks);
            await AsyncStorage.removeItem(TASKS_KEY);
            setTasks([]);
            return;
          }
          
          const validTasks = parsedTasks.filter(task => {
            return task && typeof task === 'object' && 'id' in task && 'title' in task;
          });
          
          if (validTasks.length !== parsedTasks.length) {
            console.warn(`Filtered out ${parsedTasks.length - validTasks.length} invalid tasks`);
          }
          
          setTasks(validTasks);
          console.log(`Loaded ${validTasks.length} planner tasks`);
        } catch (jsonError) {
          console.error("JSON parse error in planner tasks. Corrupted data detected, clearing storage:", jsonError);
          console.log("Corrupted data sample:", tasksData.substring(0, 100));
          await AsyncStorage.removeItem(TASKS_KEY);
          setTasks([]);
        }
      } else {
        console.log("No tasks data found, starting fresh");
        setTasks([]);
      }
    } catch (error) {
      console.error("Critical error loading planner tasks:", error);
      try {
        await AsyncStorage.removeItem(TASKS_KEY);
      } catch (removeError) {
        console.error("Failed to remove corrupted data:", removeError);
      }
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const saveTasks = useCallback(async (newTasks: PlannerTask[]) => {
    try {
      const encryptedData = await encrypt(JSON.stringify(newTasks));
      await AsyncStorage.setItem(TASKS_KEY, encryptedData);
      setTasks(newTasks);
      console.log("🔒 Planner tasks encrypted and saved");
    } catch (error) {
      console.error("Error saving planner tasks:", error);
    }
  }, []);

  const addTask = useCallback(async (task: Omit<PlannerTask, "id" | "createdAt" | "completed">) => {
    const newTask: PlannerTask = {
      ...task,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    const updatedTasks = [...tasks, newTask];
    await saveTasks(updatedTasks);
    console.log("Task added:", newTask);
    return newTask;
  }, [tasks, saveTasks]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<PlannerTask>) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    await saveTasks(updatedTasks);
    console.log("Task updated:", taskId);
  }, [tasks, saveTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    await saveTasks(updatedTasks);
    console.log("Task deleted:", taskId);
  }, [tasks, saveTasks]);

  const toggleTaskComplete = useCallback(async (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    await saveTasks(updatedTasks);
    console.log("Task toggled:", taskId);
  }, [tasks, saveTasks]);

  const pendingTasks = useMemo(() => {
    return tasks.filter(task => !task.completed);
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < now;
    });
  }, [tasks]);

  const todayTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today && dueDate <= nextWeek;
    });
  }, [tasks]);

  return useMemo(
    () => ({
      tasks,
      pendingTasks,
      overdueTasks,
      todayTasks,
      upcomingTasks,
      isLoading,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
    }),
    [
      tasks,
      pendingTasks,
      overdueTasks,
      todayTasks,
      upcomingTasks,
      isLoading,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskComplete,
    ]
  );
});
