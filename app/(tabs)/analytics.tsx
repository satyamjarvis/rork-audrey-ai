import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
  Dimensions,
  Animated,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as MailComposer from "expo-mail-composer";
import * as XLSX from "xlsx";
import AnalyticsExportModal, { ExportOptions } from "@/components/AnalyticsExportModal";
import {
  Plus,
  X,
  Trash2,
  Download,
  Mail,
  BarChart3,
  PlusCircle,
  TrendingUp,
  Phone,
  Handshake,
  Shield,
  Trophy,
  Clapperboard,
  Camera,
  Music,
  Mic,
  Settings2,
  RefreshCw,
  List,
  Save,
  Lock,
  ArrowLeft,
  Table2,
  Sparkles,
  ShieldCheck,
  ArrowDown,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/contexts/ThemeContext";
import { useStatistics, TemplateType, Tracker, TRACKERS_KEY } from "@/contexts/StatisticsContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCalendar } from "@/contexts/CalendarContext";
import { useChat } from "@/contexts/ChatContext";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useSharing } from "@/contexts/SharingContext";
import { useLanguage } from "@/contexts/LanguageContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { translations } = useLanguage();
  const params = useLocalSearchParams<{ sharedItemId?: string; readOnly?: string }>();
  const { createShareableFromSpreadsheet, shareItemToChat, sharedItems } = useSharing();
  const {
    columns,
    rows,
    selectedTemplate,
    activeTrackerId,
    addColumn,
    deleteColumn,
    addRow,
    updateCell,
    deleteRow,
    evaluateFormula,
    exportAsSpreadsheet,
    selectTemplate,
    loadTracker,
    resetTemplate,
    clearAllStoredData,
  } = useStatistics();

  const [activeTab, setActiveTab] = useState<"templates" | "active">("templates");
  const [savedTrackers, setSavedTrackers] = useState<Tracker[]>([]);
  const [loadedSharedItem, setLoadedSharedItem] = useState<any>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  
  const [addColumnModalVisible, setAddColumnModalVisible] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [cellValue, setCellValue] = useState("");
  const [showFormulaPicker, setShowFormulaPicker] = useState(false);
  // const [showShareModal, setShowShareModal] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportType, setExportType] = useState<"download" | "email" | "chat">("download");
  
  const { calendars } = useCalendar();
  const { sendFileAttachment } = useChat();

  const isDark = useMemo(() => 
    theme.name.toLowerCase().includes('night') || 
    theme.name.toLowerCase().includes('dark') || 
    theme.colors.background === '#000000', 
  [theme.name, theme.colors.background]);

  // Animations
  const heartPulse = useRef(new Animated.Value(1)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const starsRotate = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  const starPositions = useMemo(() => {
    return Array.from({ length: 25 }, () => ({
      left: Math.random() * SCREEN_WIDTH,
      top: Math.random() * 350,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

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

    // Glitter particles animation
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
  }, [fadeAnim, slideAnim, heartPulse, starsRotate, sparkleOpacity, glitterParticles]);

  const starsRotateInterpolate = starsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    loadSavedTrackers();
    if (params.sharedItemId) {
      loadSharedSpreadsheet(params.sharedItemId);
    }
    if (params.readOnly === "true") {
      setIsReadOnly(true);
    }
  }, [params.sharedItemId, params.readOnly]);

  useEffect(() => {
    if (activeTab === "active") {
      console.log('Switching to Active Analytics tab, refreshing trackers');
      loadSavedTrackers();
    }
  }, [activeTab]);

  const loadSharedSpreadsheet = useCallback(async (sharedItemId: string) => {
    try {
      const chatSharedItem = sharedItems.find(item => item.id === sharedItemId);
      if (!chatSharedItem || chatSharedItem.sharedItem.type !== "analytics_spreadsheet") {
        console.error("Shared spreadsheet not found");
        Alert.alert("Error", "Shared spreadsheet not found");
        return;
      }

      const sharedItem = chatSharedItem.sharedItem;
      const spreadsheetData = sharedItem.data as any;
      const exportOptions = sharedItem.exportOptions;

      if (!spreadsheetData || typeof spreadsheetData !== 'object') {
        console.error("Spreadsheet data is null or invalid");
        Alert.alert("Error", "Spreadsheet data is invalid");
        return;
      }

      console.log("Loading shared spreadsheet:", spreadsheetData.name);
      console.log("Export options:", exportOptions);

      setLoadedSharedItem(sharedItem);
      setIsReadOnly(exportOptions?.permission === "view");

      if (spreadsheetData.type) {
        selectTemplate(spreadsheetData.type as TemplateType);
      } else {
        selectTemplate("custom" as TemplateType);
      }

      const tracker: Tracker = {
        id: `shared_${Date.now()}`,
        name: spreadsheetData.name || "Untitled",
        customName: spreadsheetData.name || "Untitled",
        type: (spreadsheetData.type || "custom") as TemplateType,
        columns: spreadsheetData.columns || [],
        rows: spreadsheetData.rows || [],
        createdAt: Date.now(),
      };
      
      loadTracker(tracker);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Shared Spreadsheet Loaded",
        exportOptions?.permission === "view" 
          ? "This spreadsheet is view-only. You cannot edit or save changes."
          : "This spreadsheet has been loaded. You can view and edit it.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error loading shared spreadsheet:", error);
      Alert.alert("Error", "Failed to load shared spreadsheet");
    }
  }, [sharedItems, selectTemplate, loadTracker]);

  const loadSavedTrackers = async () => {
    try {
      const stored = await AsyncStorage.getItem(TRACKERS_KEY);
      if (!stored || stored === 'null' || stored === 'undefined' || stored.trim() === '' || stored.includes('[object')) {
        setSavedTrackers([]);
        if (stored && stored !== 'null' && stored !== 'undefined' && stored.trim() !== '') {
          await AsyncStorage.removeItem(TRACKERS_KEY);
        }
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedTrackers(parsed);
        } else {
          setSavedTrackers([]);
          await AsyncStorage.removeItem(TRACKERS_KEY);
        }
      } catch (error) {
        setSavedTrackers([]);
      }
    } catch (error) {
      setSavedTrackers([]);
    }
  };

  const handleDeleteTracker = async (trackerId: string) => {
    Alert.alert(
      "Delete Tracker",
      "Are you sure you want to delete this saved tracker?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updated = savedTrackers.filter(t => t.id !== trackerId);
              await AsyncStorage.setItem(TRACKERS_KEY, JSON.stringify(updated));
              setSavedTrackers(updated);
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error("Error deleting tracker:", error);
            }
          },
        },
      ]
    );
  };

  const handleLoadTracker = (tracker: Tracker) => {
    loadTracker(tracker);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSaveTracker = async () => {
    if (columns.length === 0) {
      Alert.alert("Error", "Cannot save an empty tracker. Please add at least one column.");
      return;
    }

    if (activeTrackerId) {
      try {
        const existingTracker = savedTrackers.find(t => t.id === activeTrackerId);
        if (!existingTracker) return;

        const updatedTracker: Tracker = {
          ...existingTracker,
          columns: columns,
          rows: rows,
          type: selectedTemplate || "custom",
        };

        const updated = savedTrackers.map(t => 
          t.id === activeTrackerId ? updatedTracker : t
        );
        
        await AsyncStorage.setItem(TRACKERS_KEY, JSON.stringify(updated));
        setSavedTrackers(updated);
        
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", `Tracker "${existingTracker.customName}" updated successfully!`);
      } catch (error) {
        Alert.alert("Error", "Failed to update tracker");
      }
    } else {
      Alert.prompt(
        "Save Tracker",
        "Give your tracker a name:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: async (name: string | undefined) => {
              if (!name || !name.trim()) return;

              try {
                const newTracker: Tracker = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  name: selectedTemplate || "custom",
                  customName: name.trim(),
                  type: selectedTemplate || "custom",
                  columns: columns,
                  rows: rows,
                  createdAt: Date.now(),
                };

                const updated = [...savedTrackers, newTracker];
                await AsyncStorage.setItem(TRACKERS_KEY, JSON.stringify(updated));
                setSavedTrackers(updated);
                
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Tracker saved successfully!");
              } catch (error) {
                Alert.alert("Error", "Failed to save tracker");
              }
            },
          },
        ],
        "plain-text"
      );
    }
  };

  const [columnFormData, setColumnFormData] = useState({
    name: "",
    type: "number" as "text" | "number" | "formula" | "date",
    width: 120,
  });

  const handleAddColumn = useCallback(() => {
    if (isReadOnly) {
      Alert.alert("View Only", "This spreadsheet is view-only. You cannot add columns.");
      setAddColumnModalVisible(false);
      return;
    }
    if (!columnFormData.name.trim()) {
      Alert.alert("Error", "Column name is required");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addColumn({
      name: columnFormData.name.trim(),
      type: columnFormData.type,
      width: columnFormData.width,
    });
    setColumnFormData({ name: "", type: "number", width: 120 });
    setAddColumnModalVisible(false);
  }, [columnFormData, addColumn, isReadOnly]);

  const handleDeleteColumn = useCallback((id: string) => {
    if (isReadOnly) {
      Alert.alert("View Only", "This spreadsheet is view-only. You cannot delete columns.");
      return;
    }
    Alert.alert("Delete Column", "Are you sure you want to delete this column?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        deleteColumn(id);
      }},
    ]);
  }, [deleteColumn, isReadOnly]);

  const handleDeleteRow = useCallback((id: string) => {
    if (isReadOnly) {
      Alert.alert("View Only", "This spreadsheet is view-only. You cannot delete rows.");
      return;
    }
    Alert.alert("Delete Row", "Are you sure you want to delete this row?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        deleteRow(id);
      }},
    ]);
  }, [deleteRow, isReadOnly]);

  const handleCellPress = useCallback((rowId: string, columnId: string) => {
    if (isReadOnly) {
      Alert.alert("View Only", "This spreadsheet is view-only. You cannot edit cells.");
      return;
    }
    const row = rows.find(r => r.id === rowId);
    const cell = row?.cells[columnId];
    setCellValue(cell?.formula || String(cell?.value || ""));
    setEditingCell({ rowId, columnId });
  }, [rows, isReadOnly]);

  const handleTemplateSelect = useCallback((template: TemplateType) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectTemplate(template);
  }, [selectTemplate]);

  const handleResetTemplate = useCallback(async () => {
    Alert.alert("Reset Template", "This will clear all data and allow you to choose a new template. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        resetTemplate();
      }},
    ]);
  }, [resetTemplate]);

  const handleClearAllData = useCallback(async () => {
    Alert.alert("Clear All Analytics Data", "This will permanently delete ALL stored spreadsheets, trackers, and analytics data. This action cannot be undone. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete All", style: "destructive", onPress: async () => {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await clearAllStoredData();
        Alert.alert("Success", "All analytics data has been cleared");
      }},
    ]);
  }, [clearAllStoredData]);

  const insertFormula = useCallback((formula: string) => {
    setCellValue(formula);
    setShowFormulaPicker(false);
  }, []);

  const handleCellUpdate = useCallback(() => {
    if (!editingCell) return;
    const isFormula = cellValue.trim().startsWith("=");
    let finalValue: string | number = cellValue.trim();

    if (isFormula) {
      const calculated = evaluateFormula(cellValue.trim(), editingCell.rowId);
      finalValue = calculated;
      updateCell(editingCell.rowId, editingCell.columnId, calculated, cellValue.trim());
    } else {
      const column = columns.find(c => c.id === editingCell.columnId);
      if (column?.type === "number" || column?.type === "formula") {
        finalValue = parseFloat(cellValue) || 0;
      }
      updateCell(editingCell.rowId, editingCell.columnId, finalValue);
    }
    setEditingCell(null);
    setCellValue("");
  }, [editingCell, cellValue, updateCell, evaluateFormula, columns]);

  const getCellDisplayValue = (rowId: string, columnId: string): string => {
    const row = rows.find(r => r.id === rowId);
    const cell = row?.cells[columnId];
    if (!cell) return "";
    const column = columns.find(c => c.id === columnId);
    if (cell.formula) {
      const result = evaluateFormula(cell.formula, rowId);
      return column?.type === "number" ? result.toFixed(2) : String(result);
    }
    return String(cell.value);
  };

  const handleExportRequest = (type: "download" | "email" | "chat") => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExportType(type);
    setExportModalVisible(true);
  };

  const performExport = async (options: ExportOptions) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `Analytics_${selectedTemplate || 'Custom'}_${timestamp}`;
      let fileUri = "";
      let mimeType = "";

      if (options.format === "xlsx") {
        const wb = XLSX.utils.book_new();
        const data = rows.map(row => {
          const rowData: any = {};
          // Add row number
          rowData["#"] = rows.indexOf(row) + 1;
          columns.forEach(col => {
            const cell = row.cells[col.id];
            let val = "";
            if (cell) {
               if (cell.formula) {
                 val = String(evaluateFormula(cell.formula, row.id));
               } else {
                 val = String(cell.value);
                 // Try to convert to number if possible for Excel to recognize it
                 if (!isNaN(Number(val)) && val.trim() !== "") {
                   val = Number(val) as any;
                 }
               }
            }
            rowData[col.name] = val;
          });
          return rowData;
        });
        
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Analytics");
        const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
        fileUri = (FileSystem as any).documentDirectory + fileName + ".xlsx";
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: (FileSystem as any).EncodingType.Base64 });
        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (options.format === "csv") {
         const csv = exportAsSpreadsheet();
         fileUri = (FileSystem as any).documentDirectory + fileName + ".csv";
         await FileSystem.writeAsStringAsync(fileUri, csv);
         mimeType = "text/csv";
      } else if (options.format === "pdf") {
         const html = `
           <html>
             <head>
               <style>
                 body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                 table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                 th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                 th { background-color: ${isDark ? '#333' : '#f2f2f2'}; color: ${isDark ? '#fff' : '#000'}; }
                 h1 { text-align: center; color: ${theme.colors.primary}; }
                 .subtitle { text-align: center; color: grey; margin-bottom: 20px; }
                 .footer { margin-top: 40px; font-size: 10px; color: grey; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                 .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: rgba(78, 205, 196, 0.2); color: #2A9D8F; font-size: 10px; font-weight: bold; }
               </style>
             </head>
             <body>
               <h1>Analytics Report</h1>
               <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
               
               <div style="text-align: center; margin-bottom: 20px;">
                 <span class="badge">CERTIFIED FULLY ENCRYPTED</span>
                 ${options.permission === 'view' ? '<span class="badge" style="background-color: #eee; color: #555; margin-left: 10px;">VIEW ONLY</span>' : ''}
               </div>

               <table>
                 <thead>
                   <tr>
                     <th style="width: 40px;">#</th>
                     ${columns.map(c => `<th>${c.name}</th>`).join('')}
                   </tr>
                 </thead>
                 <tbody>
                   ${rows.map((r, i) => `
                     <tr>
                       <td>${i + 1}</td>
                       ${columns.map(c => `<td>${getCellDisplayValue(r.id, c.id)}</td>`).join('')}
                     </tr>
                   `).join('')}
                 </tbody>
               </table>
               
               <div class="footer">
                  <p>Secured by Rork App</p>
                  ${options.password ? '<p>🔒 Protected Document</p>' : ''}
               </div>
             </body>
           </html>
         `;
         const { uri } = await Print.printToFileAsync({ html });
         fileUri = uri;
         mimeType = "application/pdf";
      }

      if (Platform.OS === "web") {
        Alert.alert("Notice", "File generated. Download not fully supported in web preview.");
      } else {
        if (exportType === 'email') {
           if (options.email && await MailComposer.isAvailableAsync()) {
              await MailComposer.composeAsync({
                recipients: [options.email],
                subject: `Analytics Export - ${selectedTemplate || 'Custom Tracker'}`,
                body: "Please find attached the analytics export.",
                attachments: [fileUri],
              });
           } else if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: "Send Analytics via Email", UTI: mimeType });
           } else {
              Alert.alert("Error", "Sharing is not available on this device");
           }
        } else {
           // Download / Share
           await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: "Export Analytics", UTI: mimeType });
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to export file");
    }
  };

  const handleShareToChat = useCallback(() => {
    if (calendars.length === 0) {
      Alert.alert("No Calendars", "Please create a calendar first to share analytics");
      return;
    }
    handleExportRequest('chat');
  }, [calendars]);

  const handleShareToChatWithSettings = useCallback(async (calendarId: string, options: ExportOptions) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `Analytics_${selectedTemplate || 'Custom'}_${timestamp}`;
      let fileData = "";
      let mimeType = "";
      let fullFileName = "";

      if (options.format === "xlsx") {
        const wb = XLSX.utils.book_new();
        const data = rows.map(row => {
          const rowData: any = {};
          // Add row number
          rowData["#"] = rows.indexOf(row) + 1;
          columns.forEach(col => {
            const cell = row.cells[col.id];
            let val = "";
            if (cell) {
               if (cell.formula) {
                 val = String(evaluateFormula(cell.formula, row.id));
               } else {
                 val = String(cell.value);
                 // Try to convert to number if possible for Excel to recognize it
                 if (!isNaN(Number(val)) && val.trim() !== "") {
                   val = Number(val) as any;
                 }
               }
            }
            rowData[col.name] = val;
          });
          return rowData;
        });
        
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Analytics");
        fileData = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
        fullFileName = fileName + ".xlsx";
      } else if (options.format === "csv") {
         fileData = exportAsSpreadsheet();
         fullFileName = fileName + ".csv";
      } else if (options.format === "pdf") {
         const html = `
           <html>
             <head>
               <style>
                 body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                 table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                 th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                 th { background-color: ${isDark ? '#333' : '#f2f2f2'}; color: ${isDark ? '#fff' : '#000'}; }
                 h1 { text-align: center; color: ${theme.colors.primary}; }
                 .subtitle { text-align: center; color: grey; margin-bottom: 20px; }
                 .footer { margin-top: 40px; font-size: 10px; color: grey; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                 .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: rgba(78, 205, 196, 0.2); color: #2A9D8F; font-size: 10px; font-weight: bold; }
               </style>
             </head>
             <body>
               <h1>Analytics Report</h1>
               <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
               
               <div style="text-align: center; margin-bottom: 20px;">
                 <span class="badge">CERTIFIED FULLY ENCRYPTED</span>
                 ${options.permission === 'view' ? '<span class="badge" style="background-color: #eee; color: #555; margin-left: 10px;">VIEW ONLY</span>' : ''}
               </div>

               <table>
                 <thead>
                   <tr>
                     <th style="width: 40px;">#</th>
                     ${columns.map(c => `<th>${c.name}</th>`).join('')}
                   </tr>
                 </thead>
                 <tbody>
                   ${rows.map((r, i) => `
                     <tr>
                       <td>${i + 1}</td>
                       ${columns.map(c => `<td>${getCellDisplayValue(r.id, c.id)}</td>`).join('')}
                     </tr>
                   `).join('')}
                 </tbody>
               </table>
               
               <div class="footer">
                  <p>Secured by Rork App</p>
                  ${options.password ? '<p>🔒 Protected Document</p>' : ''}
               </div>
             </body>
           </html>
         `;
         const { uri } = await Print.printToFileAsync({ html });
         fileData = await FileSystem.readAsStringAsync(uri, { encoding: (FileSystem as any).EncodingType.Base64 });
         fullFileName = fileName + ".pdf";
      }

      await sendFileAttachment(
        calendarId, 
        fileData, 
        fullFileName, 
        `📊 Shared encrypted analytics ${options.format.toUpperCase()}`,
        "me",
        true,
        "analytics",
        activeTrackerId || undefined
      );
      
      const trackerName = activeTrackerId 
        ? savedTrackers.find(t => t.id === activeTrackerId)?.customName || selectedTemplate || "Custom"
        : selectedTemplate || "Custom";

      const shareableSpreadsheet = createShareableFromSpreadsheet(
        {
          columns,
          rows,
          name: trackerName,
          type: selectedTemplate || undefined,
        },
        options
      );

      await shareItemToChat(calendarId, shareableSpreadsheet);
      
      Alert.alert("Success", "Analytics has been encrypted and shared to the chat!", [
        { text: "OK" },
        { text: "Open Chat", onPress: () => router.push(`/calendar-chat?calendarId=${calendarId}`) },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to share analytics to chat");
    }
  }, [exportAsSpreadsheet, selectedTemplate, sendFileAttachment, rows, columns, evaluateFormula, getCellDisplayValue, isDark, theme.colors.primary, savedTrackers, activeTrackerId, createShareableFromSpreadsheet, shareItemToChat]);

  const templates = [
    { type: "sales-general" as const, label: (translations as any).metrics?.templates?.salesGeneral || "Sales General", icon: TrendingUp, color: "#FF6B6B" },
    { type: "cold-calling" as const, label: (translations as any).metrics?.templates?.coldCalling || "Cold Calling", icon: Phone, color: "#4ECDC4" },
    { type: "closing-sales" as const, label: (translations as any).metrics?.templates?.closingSales || "Closing Sales", icon: Handshake, color: "#95E1D3" },
    { type: "insurance-sales" as const, label: (translations as any).metrics?.templates?.insuranceSales || "Insurance Sales", icon: Shield, color: "#F38181" },
    { type: "sports-performance" as const, label: (translations as any).metrics?.templates?.sportsPerformance || "Sports Performance", icon: Trophy, color: "#FEA47F" },
    { type: "actors-career" as const, label: (translations as any).metrics?.templates?.actorsCareer || "Actors Career", icon: Clapperboard, color: "#B388EB" },
    { type: "modeling-career" as const, label: (translations as any).metrics?.templates?.modelingCareer || "Modeling Career", icon: Camera, color: "#FF85A1" },
    { type: "music-career" as const, label: (translations as any).metrics?.templates?.musicCareer || "Music Career", icon: Music, color: "#FFD93D" },
    { type: "singing-career" as const, label: (translations as any).metrics?.templates?.singingCareer || "Singing Career", icon: Mic, color: "#A8E6CF" },
    { type: "custom" as const, label: (translations as any).metrics?.templates?.custom || "Custom", icon: Settings2, color: "#6C5CE7" },
  ];

  const commonFormulas = [
    { label: (translations as any).metrics?.formulaDescriptions?.sumColumn || "Sum Column", formula: "=SUM(ColumnName)", description: (translations as any).metrics?.formulaDescriptions?.sumColumnDesc || "Total of all values" },
    { label: (translations as any).metrics?.formulaDescriptions?.average || "Average", formula: "=AVG(ColumnName)", description: (translations as any).metrics?.formulaDescriptions?.averageDesc || "Average value" },
    { label: (translations as any).metrics?.formulaDescriptions?.count || "Count", formula: "=COUNT(ColumnName)", description: (translations as any).metrics?.formulaDescriptions?.countDesc || "Count non-empty cells" },
    { label: (translations as any).metrics?.formulaDescriptions?.minValue || "Min Value", formula: "=MIN(ColumnName)", description: (translations as any).metrics?.formulaDescriptions?.minValueDesc || "Minimum value" },
    { label: (translations as any).metrics?.formulaDescriptions?.maxValue || "Max Value", formula: "=MAX(ColumnName)", description: (translations as any).metrics?.formulaDescriptions?.maxValueDesc || "Maximum value" },
    { label: (translations as any).metrics?.formulaDescriptions?.percentage || "Percentage", formula: "=(Col1/Col2)*100", description: (translations as any).metrics?.formulaDescriptions?.percentageDesc || "Calculate percentage" },
  ];

  const cardStyle = isDark ? styles.darkCard : styles.lightCard;
  const textColor = isDark ? "#FFFFFF" : theme.colors.text.primary;
  const subTextColor = isDark ? "#d4c4f0" : theme.colors.text.secondary;

  if (selectedTemplate === null) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={theme.gradients.background as any} style={styles.gradient}>
          {isDark && starPositions.map((star, index) => (
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

          {isDark && glitterParticles.map((particle, index) => (
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

          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8, backgroundColor: isDark ? "rgba(255, 192, 203, 0.15)" : theme.colors.cardBackground }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.selectionAsync();
              router.replace('/(tabs)/track');
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft color={isDark ? "#ffc0cb" : theme.colors.primary} size={28} strokeWidth={2.5} />
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
                    <BarChart3
                      color={isDark ? "#ffc0cb" : theme.colors.primary}
                      size={48}
                      strokeWidth={2}
                    />
                  </Animated.View>
                  <View>
                    <Text style={[styles.headerTitle, { color: isDark ? "#ffc0cb" : theme.colors.text.primary }]}>{translations.metrics.metrics}</Text>
                    <Text style={[styles.headerSubtitle, { color: subTextColor }]}>{translations.metrics.trackYourProgress}</Text>
                  </View>
                </View>
                <Animated.View style={{ transform: [{ rotate: starsRotateInterpolate }] }}>
                  <Sparkles color={isDark ? "#e0b8f0" : theme.colors.secondary} size={32} strokeWidth={1.5} />
                </Animated.View>
              </View>
            </Animated.View>

            <View style={styles.filtersSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    activeTab === "templates" && styles.filterPillActive,
                    { borderColor: isDark ? "rgba(255, 192, 203, 0.3)" : theme.colors.border }
                  ]}
                  onPress={() => setActiveTab("templates")}
                >
                  <Table2 color={activeTab === "templates" ? "#FFFFFF" : (isDark ? "#ffc0cb" : theme.colors.text.primary)} size={16} />
                  <Text style={[
                    styles.filterText,
                    activeTab === "templates" && styles.filterTextActive,
                    { color: activeTab === "templates" ? "#FFFFFF" : (isDark ? "#ffc0cb" : theme.colors.text.primary) }
                  ]}>{translations.metrics.templates.title}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    activeTab === "active" && styles.filterPillActive,
                    { borderColor: isDark ? "rgba(255, 192, 203, 0.3)" : theme.colors.border }
                  ]}
                  onPress={() => setActiveTab("active")}
                >
                  <List color={activeTab === "active" ? "#FFFFFF" : (isDark ? "#ffc0cb" : theme.colors.text.primary)} size={16} />
                  <Text style={[
                    styles.filterText,
                    activeTab === "active" && styles.filterTextActive,
                    { color: activeTab === "active" ? "#FFFFFF" : (isDark ? "#ffc0cb" : theme.colors.text.primary) }
                  ]}>{translations.metrics.templates.active} ({savedTrackers.length})</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                {activeTab === "templates" ? (
                  <View>
                    <View style={{ alignItems: 'flex-end', marginBottom: 16, paddingRight: 4 }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 6, 
                        backgroundColor: isDark ? 'rgba(78, 205, 196, 0.15)' : 'rgba(78, 205, 196, 0.1)', 
                        paddingHorizontal: 12, 
                        paddingVertical: 6, 
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(78, 205, 196, 0.3)' : 'rgba(78, 205, 196, 0.2)'
                      }}>
                        <ShieldCheck size={14} color={isDark ? '#4ECDC4' : '#2A9D8F'} strokeWidth={2.5} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#4ECDC4' : '#2A9D8F', letterSpacing: 0.5 }}>
                          {translations.metrics.certifiedFullyEncrypted}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.gridContainer}>
                    {templates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <TouchableOpacity
                          key={template.type}
                          style={[cardStyle, styles.templateCard]}
                          onPress={() => handleTemplateSelect(template.type)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : `${template.color}20` }]}>
                            <Icon color={template.color} size={22} strokeWidth={2.5} />
                          </View>
                          <Text style={[styles.templateCardLabel, { color: textColor }]}>
                            {template.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  </View>
                ) : (
                  <View style={styles.listContainer}>
                    <View style={{ alignItems: 'flex-end', marginBottom: 16, paddingRight: 4 }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 6, 
                        backgroundColor: isDark ? 'rgba(78, 205, 196, 0.15)' : 'rgba(78, 205, 196, 0.1)', 
                        paddingHorizontal: 12, 
                        paddingVertical: 6, 
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(78, 205, 196, 0.3)' : 'rgba(78, 205, 196, 0.2)'
                      }}>
                        <ShieldCheck size={14} color={isDark ? '#4ECDC4' : '#2A9D8F'} strokeWidth={2.5} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#4ECDC4' : '#2A9D8F', letterSpacing: 0.5 }}>
                          {translations.metrics.certifiedFullyEncrypted}
                        </Text>
                      </View>
                    </View>
                     {savedTrackers.length === 0 ? (
                      <View style={styles.emptyState}>
                        <List color={isDark ? "#d4c4f0" : theme.colors.text.light} size={64} strokeWidth={1.5} />
                        <Text style={[styles.emptyTitle, { color: isDark ? "#ffc0cb" : theme.colors.text.primary }]}>{translations.metrics.noTrackersYet}</Text>
                        <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
                          {translations.metrics.startTracking}
                        </Text>
                      </View>
                    ) : (
                      savedTrackers.map((tracker) => {
                        const template = templates.find(t => t.type === tracker.type);
                        const Icon = template?.icon || Table2;
                        const color = template?.color || theme.colors.primary;
                        
                        return (
                          <View key={tracker.id} style={[cardStyle, styles.trackerItemCard]}>
                             <View style={styles.trackerItemOverlay}>
                                <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : `${color}20`, width: 40, height: 40 }]}>
                                  <Icon color={color} size={20} strokeWidth={2.5} />
                                </View>
                                <View style={styles.trackerContent}>
                                  <Text style={[styles.trackerTitle, { color: textColor }]}>
                                    {tracker.customName || template?.label || "Custom"}
                                  </Text>
                                  <Text style={[styles.trackerMeta, { color: subTextColor }]}>
                                    {tracker.rows.length} {translations.metrics.rows} • {tracker.columns.length} {translations.metrics.cols}
                                  </Text>
                                </View>
                                <View style={styles.trackerActions}>
                                  <TouchableOpacity 
                                    onPress={() => handleLoadTracker(tracker)}
                                    style={[styles.actionButton, { backgroundColor: isDark ? "rgba(255, 192, 203, 0.15)" : `${theme.colors.primary}20` }]}
                                  >
                                    <Text style={{ color: isDark ? "#ffc0cb" : theme.colors.primary, fontWeight: "700", fontSize: 12 }}>{translations.metrics.load}</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    onPress={() => handleDeleteTracker(tracker.id)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  >
                                    <Trash2 color="#f87171" size={18} />
                                  </TouchableOpacity>
                                </View>
                             </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
                
                <View style={{ height: 100 }} />
              </Animated.View>
            </ScrollView>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Spreadsheet View
  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background as any} style={styles.gradient}>
        <View style={[styles.safeArea, { paddingTop: insets.top }]}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity
                  style={[styles.backButtonSmall, { backgroundColor: isDark ? "rgba(255, 192, 203, 0.15)" : theme.colors.cardBackground }]}
                  onPress={() => selectTemplate(null as any)}
                >
                  <ArrowLeft color={isDark ? "#ffc0cb" : theme.colors.primary} size={20} strokeWidth={2.5} />
                </TouchableOpacity>
                <View>
                  <Text style={[styles.headerTitleSmall, { color: textColor }]}>
                    {selectedTemplate === "custom" ? "Custom" : templates.find(t => t.type === selectedTemplate)?.label}
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: subTextColor, fontSize: 12 }]}>
                    {translations.metrics.metrics}
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                {isReadOnly ? (
                  <View style={[styles.readOnlyBadge, { backgroundColor: isDark ? "rgba(255, 192, 203, 0.15)" : "rgba(255, 152, 0, 0.15)" }]}>
                    <Text style={[styles.readOnlyText, { color: isDark ? "#ffc0cb" : "#FF9800" }]}>{translations.metrics.viewOnly.toUpperCase()}</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : theme.colors.cardBackground }]} onPress={handleSaveTracker}>
                      <Save color={isDark ? "#ffc0cb" : theme.colors.primary} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : theme.colors.cardBackground }]} onPress={handleClearAllData}>
                      <Trash2 color="#F77F8B" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : theme.colors.cardBackground }]} onPress={handleResetTemplate}>
                      <RefreshCw color={subTextColor} size={18} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <ScrollView horizontal style={styles.horizontalScroll} showsHorizontalScrollIndicator={true}>
              <View style={styles.tableContainer}>
                 {columns.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Table2 color={subTextColor} size={64} strokeWidth={1.5} />
                    <Text style={[styles.emptyTitle, { color: textColor }]}>No columns yet</Text>
                    <Text style={[styles.emptySubtitle, { color: subTextColor }]}>Add a column to start</Text>
                  </View>
                ) : (
                  <View style={styles.spreadsheet}>
                    <View style={styles.headerRow}>
                       <View style={[styles.headerCell, { width: 50, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : theme.colors.cardBackground }]}>
                          <Text style={{ color: subTextColor, fontWeight: "bold" }}>#</Text>
                       </View>
                       {columns.map((column) => (
                          <View key={column.id} style={[styles.headerCell, { width: column.width, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : theme.colors.cardBackground, justifyContent: 'space-between' }]}>
                             <Text style={{ color: textColor, fontWeight: "bold" }}>{column.name}</Text>
                             <TouchableOpacity onPress={() => handleDeleteColumn(column.id)}>
                                <X color="#F77F8B" size={14} />
                             </TouchableOpacity>
                          </View>
                       ))}
                       <TouchableOpacity
                          style={[styles.headerCell, { width: 50, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }]}
                          onPress={() => setAddColumnModalVisible(true)}
                       >
                          <PlusCircle color={isDark ? "#ffc0cb" : theme.colors.primary} size={20} />
                       </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.6 }}>
                       {rows.map((row, index) => (
                          <View key={row.id} style={styles.dataRow}>
                             <View style={[styles.cell, { width: 50, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.colors.cardBackground, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: subTextColor }}>{index + 1}</Text>
                                <TouchableOpacity onPress={() => handleDeleteRow(row.id)} style={{ position: 'absolute', right: 2, top: 2 }}>
                                   <Trash2 color="#F77F8B" size={10} />
                                </TouchableOpacity>
                             </View>
                             {columns.map((col) => (
                                <TouchableOpacity
                                  key={`${row.id}-${col.id}`}
                                  style={[
                                    styles.cell,
                                    { width: col.width, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.colors.cardBackground },
                                    editingCell?.rowId === row.id && editingCell?.columnId === col.id && { borderWidth: 1, borderColor: theme.colors.primary }
                                  ]}
                                  onPress={() => handleCellPress(row.id, col.id)}
                                >
                                   <Text style={{ color: textColor }}>{getCellDisplayValue(row.id, col.id)}</Text>
                                </TouchableOpacity>
                             ))}
                          </View>
                       ))}
                       {!isReadOnly && (
                         <TouchableOpacity
                            style={[styles.addRowButton, { borderColor: isDark ? "rgba(255,255,255,0.2)" : theme.colors.border }]}
                            onPress={() => addRow()}
                         >
                            <Plus color={isDark ? "#ffc0cb" : theme.colors.primary} size={16} />
                            <Text style={{ color: isDark ? "#ffc0cb" : theme.colors.primary, fontWeight: "600" }}>Add Row</Text>
                         </TouchableOpacity>
                       )}
                    </ScrollView>
                  </View>
                )}

                {(columns.length > 0 || rows.length > 0) && (
                   <View style={styles.exportSection}>
                      <TouchableOpacity style={[cardStyle, styles.exportButton]} onPress={() => handleExportRequest('download')}>
                         <Download color={isDark ? "#ffc0cb" : theme.colors.primary} size={24} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[cardStyle, styles.exportButton]} onPress={() => handleExportRequest('email')}>
                         <Mail color={isDark ? "#ffc0cb" : theme.colors.primary} size={24} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[cardStyle, styles.exportButton]} onPress={handleShareToChat}>
                         <Lock color={isDark ? "#ffc0cb" : theme.colors.primary} size={24} />
                      </TouchableOpacity>
                   </View>
                )}
              </View>
            </ScrollView>

            {columns.length === 0 && !isReadOnly && (
              <View style={[styles.fab, { bottom: insets.bottom + 100 }]}>
                <TouchableOpacity
                  style={styles.fabButton}
                  onPress={() => setAddColumnModalVisible(true)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={theme.gradients.primary as any}
                    style={styles.fabGradient}
                  >
                    <Plus color="#FFFFFF" size={32} strokeWidth={3} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
        </View>

        <AnalyticsExportModal
          visible={exportModalVisible}
          onClose={() => setExportModalVisible(false)}
          onExport={performExport}
          type={exportType}
          calendars={calendars}
          onShareToChat={handleShareToChatWithSettings}
        />

        <Modal visible={addColumnModalVisible} transparent animationType="slide" onRequestClose={() => setAddColumnModalVisible(false)}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setAddColumnModalVisible(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, { backgroundColor: isDark ? "#1E1E1E" : theme.colors.cardBackground }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: textColor }]}>Add Column</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                   <TouchableOpacity onPress={() => {
                     if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                     Keyboard.dismiss();
                   }}>
                     <ArrowDown color={isDark ? "#ffc0cb" : theme.colors.primary} size={20} strokeWidth={2} />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => setAddColumnModalVisible(false)}>
                     <X color={textColor} size={24} />
                   </TouchableOpacity>
                 </View>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput 
                  style={[styles.modalInput, { color: textColor, borderColor: isDark ? "rgba(255,255,255,0.2)" : theme.colors.border }]}
                  placeholder="Column Name"
                  placeholderTextColor={subTextColor}
                  value={columnFormData.name}
                  onChangeText={(t) => setColumnFormData({...columnFormData, name: t})}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                   {(["text", "number", "formula", "date"] as const).map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeChip, columnFormData.type === type && { backgroundColor: theme.colors.primary }]}
                        onPress={() => setColumnFormData({...columnFormData, type})}
                      >
                         <Text style={{ color: columnFormData.type === type ? "#FFF" : subTextColor, textTransform: 'capitalize' }}>{type}</Text>
                      </TouchableOpacity>
                   ))}
                </View>
                <TouchableOpacity style={styles.modalButton} onPress={handleAddColumn}>
                   <LinearGradient colors={theme.gradients.primary as any} style={styles.modalButtonGradient}>
                      <Text style={styles.modalButtonText}>Add</Text>
                   </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <Modal visible={editingCell !== null} transparent animationType="fade" onRequestClose={() => setEditingCell(null)}>
           <TouchableOpacity 
             style={styles.modalOverlay}
             activeOpacity={1}
             onPress={() => setEditingCell(null)}
           >
              <TouchableOpacity 
                style={[styles.modalContent, { backgroundColor: isDark ? "#1E1E1E" : theme.colors.cardBackground }]}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                 <View style={styles.modalHeader}>
                   <Text style={[styles.modalTitle, { color: textColor }]}>Edit Cell</Text>
                   <TouchableOpacity onPress={() => {
                     if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                     Keyboard.dismiss();
                   }}>
                     <ArrowDown color={isDark ? "#ffc0cb" : theme.colors.primary} size={20} strokeWidth={2} />
                   </TouchableOpacity>
                 </View>
                 <ScrollView showsVerticalScrollIndicator={false}>
                   <TextInput 
                      style={[styles.modalInput, { color: textColor, borderColor: isDark ? "rgba(255,255,255,0.2)" : theme.colors.border }]}
                      value={cellValue}
                      onChangeText={setCellValue}
                      autoFocus
                      placeholder="Value or =Formula"
                      placeholderTextColor={subTextColor}
                   />
                   {selectedTemplate === "custom" && (
                      <TouchableOpacity onPress={() => setShowFormulaPicker(true)} style={{ marginBottom: 15 }}>
                         <Text style={{ color: theme.colors.primary }}>Quick Formulas</Text>
                      </TouchableOpacity>
                   )}
                   <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity style={[styles.modalButton, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: subTextColor }]} onPress={() => setEditingCell(null)}>
                         <Text style={{ color: subTextColor, textAlign: 'center', fontWeight: '600' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalButton, { flex: 1 }]} onPress={handleCellUpdate}>
                         <LinearGradient colors={theme.gradients.primary as any} style={styles.modalButtonGradient}>
                            <Text style={styles.modalButtonText}>Save</Text>
                         </LinearGradient>
                      </TouchableOpacity>
                   </View>
                 </ScrollView>
              </TouchableOpacity>
           </TouchableOpacity>
        </Modal>

        <Modal visible={showFormulaPicker} transparent animationType="slide" onRequestClose={() => setShowFormulaPicker(false)}>
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowFormulaPicker(false)}
            >
               <TouchableOpacity 
                 style={[styles.modalContent, { backgroundColor: isDark ? "#1E1E1E" : theme.colors.cardBackground, maxHeight: SCREEN_HEIGHT * 0.6 }]}
                 activeOpacity={1}
                 onPress={(e) => e.stopPropagation()}
               >
                  <View style={styles.modalHeader}>
                     <Text style={[styles.modalTitle, { color: textColor }]}>Formulas</Text>
                     <TouchableOpacity onPress={() => setShowFormulaPicker(false)}>
                        <X color={textColor} size={24} />
                     </TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                     {commonFormulas.map((f, i) => (
                        <TouchableOpacity key={i} style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} onPress={() => insertFormula(f.formula)}>
                           <Text style={{ color: textColor, fontWeight: 'bold' }}>{f.label}</Text>
                           <Text style={{ color: theme.colors.primary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{f.formula}</Text>
                           <Text style={{ color: subTextColor, fontSize: 12 }}>{f.description}</Text>
                        </TouchableOpacity>
                     ))}
                  </ScrollView>
               </TouchableOpacity>
            </TouchableOpacity>
        </Modal>



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
  safeArea: {
    flex: 1,
  },
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 50,
  },
  glitterDot: {
    position: "absolute",
    backgroundColor: "#C0C0C0",
    borderRadius: 50,
    shadowColor: "#C0C0C0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
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
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 4,
  },
  filtersSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  filterContainer: {
    gap: 12,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: "#d946ef",
    borderColor: "#d946ef",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 100,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  listContainer: {
    gap: 12,
  },
  darkCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 192, 203, 0.2)",
    borderRadius: 24,
  },
  lightCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  templateCard: {
    width: (SCREEN_WIDTH - 48 - 24) / 3,
    aspectRatio: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  templateCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  trackerItemCard: {
    overflow: "hidden",
  },
  trackerItemOverlay: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  trackerContent: {
    flex: 1,
  },
  trackerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  trackerMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  trackerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  // Spreadsheet specific
  backButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleSmall: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalScroll: {
    marginTop: 20,
    flex: 1,
  },
  tableContainer: {
    paddingHorizontal: 20,
  },
  spreadsheet: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  headerCell: {
    height: 40,
    borderRadius: 8,
    marginRight: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cell: {
    height: 40,
    borderRadius: 8,
    marginRight: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  exportSection: {
    marginTop: 30,
    gap: 16,
    paddingBottom: 50,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  exportButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  fab: {
    position: "absolute",
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
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    paddingTop: SCREEN_HEIGHT * 0.2,
  },
  modalContent: {
    borderRadius: 28,
    marginHorizontal: 16,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
  },
  typeChip: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(100,100,100,0.1)",
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 50,
  },
  modalButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  readOnlyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
