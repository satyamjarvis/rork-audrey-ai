import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { isValidJSON } from "@/utils/asyncStorageHelpers";
import { encrypt, decrypt } from "@/utils/encryption";

export type Priority = "low" | "medium" | "high";
export type TodoCategory = "personal" | "work" | "shopping" | "health" | "other";

export type TodoItem = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: TodoCategory;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "@todo_items";

export const [TodoListProvider, useTodoList] = createContextHook(() => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          if (!isValidJSON(stored)) {
            console.error("Invalid todos data format, resetting");
            await AsyncStorage.removeItem(STORAGE_KEY);
            setTodos([]);
          } else {
            let parsed;
            try {
              const decryptedData = await decrypt(stored);
              parsed = JSON.parse(decryptedData);
              console.log("🔓 Todos decrypted successfully");
            } catch {
              parsed = JSON.parse(stored);
              console.log("⚠️ Loaded unencrypted todos, will encrypt on next save");
            }
            if (Array.isArray(parsed)) {
              setTodos(parsed);
              console.log(`Loaded ${parsed.length} todo items`);
            } else {
              console.warn("Invalid todos format, resetting");
              await AsyncStorage.removeItem(STORAGE_KEY);
              setTodos([]);
            }
          }
        } catch (jsonError) {
          console.error("JSON parse error in todos, resetting:", jsonError);
          console.error("Corrupted data:", stored.substring(0, 100));
          await AsyncStorage.removeItem(STORAGE_KEY);
          setTodos([]);
        }
      } else {
        setTodos([]);
      }
    } catch (error) {
      console.error("Error loading todos:", error);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      setTodos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const saveTodos = useCallback(async (newTodos: TodoItem[]) => {
    try {
      const encryptedData = await encrypt(JSON.stringify(newTodos));
      await AsyncStorage.setItem(STORAGE_KEY, encryptedData);
      setTodos(newTodos);
      console.log("🔒 Todos encrypted and saved");
    } catch (error) {
      console.error("Error saving todos:", error);
    }
  }, []);

  const addTodo = useCallback(async (todo: Omit<TodoItem, "id" | "createdAt" | "updatedAt" | "completed">) => {
    const newTodo: TodoItem = {
      ...todo,
      id: `todo_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false,
    };
    const updatedTodos = [...todos, newTodo];
    await saveTodos(updatedTodos);
    console.log("Todo added:", newTodo);
    return newTodo;
  }, [todos, saveTodos]);

  const updateTodo = useCallback(async (todoId: string, updates: Partial<TodoItem>) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === todoId ? { ...todo, ...updates, updatedAt: new Date().toISOString() } : todo
    );
    await saveTodos(updatedTodos);
    console.log("Todo updated:", todoId);
  }, [todos, saveTodos]);

  const deleteTodo = useCallback(async (todoId: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== todoId);
    await saveTodos(updatedTodos);
    console.log("Todo deleted:", todoId);
  }, [todos, saveTodos]);

  const toggleTodoComplete = useCallback(async (todoId: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === todoId ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() } : todo
    );
    await saveTodos(updatedTodos);
    console.log("Todo toggled:", todoId);
  }, [todos, saveTodos]);

  const pendingTodos = useMemo(() => {
    return todos.filter(todo => !todo.completed);
  }, [todos]);

  const completedTodos = useMemo(() => {
    return todos.filter(todo => todo.completed);
  }, [todos]);

  const overdueTodos = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return todos.filter(todo => {
      if (todo.completed || !todo.dueDate) return false;
      const dueDate = new Date(todo.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < now;
    });
  }, [todos]);

  const todayTodos = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return todos.filter(todo => {
      if (todo.completed || !todo.dueDate) return false;
      const dueDate = new Date(todo.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate >= today && dueDate < tomorrow;
    });
  }, [todos]);

  return useMemo(
    () => ({
      todos,
      pendingTodos,
      completedTodos,
      overdueTodos,
      todayTodos,
      isLoading,
      addTodo,
      updateTodo,
      deleteTodo,
      toggleTodoComplete,
    }),
    [
      todos,
      pendingTodos,
      completedTodos,
      overdueTodos,
      todayTodos,
      isLoading,
      addTodo,
      updateTodo,
      deleteTodo,
      toggleTodoComplete,
    ]
  );
});
