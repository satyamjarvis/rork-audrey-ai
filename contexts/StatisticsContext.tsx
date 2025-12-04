import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { isValidJSON } from "@/utils/asyncStorageHelpers";
import { encrypt, decrypt } from "@/utils/encryption";

export type SpreadsheetColumn = {
  id: string;
  name: string;
  type: "text" | "number" | "formula" | "date";
  width: number;
};

export type SpreadsheetCell = {
  rowId: string;
  columnId: string;
  value: string | number;
  formula?: string;
};

export type SpreadsheetRow = {
  id: string;
  cells: { [columnId: string]: SpreadsheetCell };
};

export type Tracker = {
  id: string;
  name: string;
  customName?: string;
  type: TemplateType;
  columns: SpreadsheetColumn[];
  rows: SpreadsheetRow[];
  createdAt: number;
};

const STORAGE_KEY = "statistics_data";
const TEMPLATE_KEY = "statistics_template";
export const TRACKERS_KEY = "trackers_list";
const ACTIVE_TRACKER_KEY = "active_tracker_id";
const PREMIUM_KEY = "is_premium_user";

export type TemplateType = 
  | "custom"
  | "sales-general"
  | "cold-calling"
  | "closing-sales"
  | "insurance-sales"
  | "sports-performance"
  | "actors-career"
  | "modeling-career"
  | "music-career"
  | "singing-career";

export const [StatisticsProvider, useStatistics] = createContextHook(() => {
  const [columns, setColumns] = useState<SpreadsheetColumn[]>([]);
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [activeTrackerId, setActiveTrackerId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [stored, templateStored] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(TEMPLATE_KEY),
      ]);
      
      if (stored && isValidJSON(stored)) {
        try {
          let data;
          try {
            const decryptedData = await decrypt(stored);
            data = JSON.parse(decryptedData);
            console.log("🔓 Statistics decrypted successfully");
          } catch {
            data = JSON.parse(stored);
            console.log("⚠️ Loaded unencrypted statistics, will encrypt on next save");
          }
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            setColumns(data.columns || []);
            setRows(data.rows || []);
          } else {
            console.error('Invalid data structure in storage');
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        } catch (parseError) {
          console.error('Error parsing statistics data:', parseError);
          console.error('Corrupted data:', stored.substring(0, 100));
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
      
      if (templateStored && templateStored !== 'null' && templateStored !== 'undefined' && templateStored.trim() !== '') {
        setSelectedTemplate(templateStored as TemplateType);
      }
    } catch (error) {
      console.error('Error loading statistics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = useCallback(async () => {
    try {
      const dataToSave = { columns, rows };
      console.log('Saving data to storage:', JSON.stringify(dataToSave).substring(0, 100));
      const encryptedData = await encrypt(JSON.stringify(dataToSave));
      await AsyncStorage.setItem(STORAGE_KEY, encryptedData);
      if (selectedTemplate) {
        await AsyncStorage.setItem(TEMPLATE_KEY, selectedTemplate);
      }
      console.log("🔒 Statistics encrypted and saved");
    } catch (error) {
      console.error('Error saving statistics data:', error);
    }
  }, [columns, rows, selectedTemplate]);

  useEffect(() => {
    if (!isLoading && (columns.length > 0 || rows.length > 0)) {
      console.log('Auto-saving data: columns:', columns.length, 'rows:', rows.length);
      saveData();
    }
  }, [columns, rows, isLoading, saveData]);

  const addColumn = useCallback((column: Omit<SpreadsheetColumn, "id">) => {
    const newColumn: SpreadsheetColumn = {
      ...column,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setColumns((prev) => [...prev, newColumn]);
  }, []);

  const updateColumn = useCallback((id: string, updates: Partial<SpreadsheetColumn>) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, ...updates } : col))
    );
  }, []);

  const deleteColumn = useCallback((id: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== id));
    setRows((prev) =>
      prev.map((row) => {
        const newCells = { ...row.cells };
        delete newCells[id];
        return { ...row, cells: newCells };
      })
    );
  }, []);

  const addRow = useCallback(() => {
    const newRow: SpreadsheetRow = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      cells: {},
    };
    setRows((prev) => [...prev, newRow]);
  }, []);

  const updateCell = useCallback((rowId: string, columnId: string, value: string | number, formula?: string) => {
    console.log('Updating cell:', { rowId, columnId, value, formula });
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            cells: {
              ...row.cells,
              [columnId]: { rowId, columnId, value, formula },
            },
          };
        }
        return row;
      })
    );
  }, []);

  const deleteRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const selectTemplate = useCallback((template: TemplateType) => {
    console.log('Selecting template:', template);
    setSelectedTemplate(template);
    setActiveTrackerId(null);
    
    if (template !== "custom") {
      const templateColumns = getTemplateColumns(template);
      console.log('Setting template columns:', templateColumns.length);
      setColumns(templateColumns);
      setRows([]);
    } else {
      setColumns([]);
      setRows([]);
    }
  }, []);

  const loadTracker = useCallback((tracker: Tracker) => {
    console.log('Loading tracker:', tracker.customName, 'with', tracker.columns.length, 'columns and', tracker.rows.length, 'rows');
    setSelectedTemplate(tracker.type);
    setColumns(tracker.columns);
    setRows(tracker.rows);
    setActiveTrackerId(tracker.id);
  }, []);

  const loadSpreadsheetData = useCallback((spreadsheetData: { columns: SpreadsheetColumn[]; rows: SpreadsheetRow[]; type?: TemplateType; name: string }) => {
    console.log('Loading spreadsheet data:', spreadsheetData.name, 'with', spreadsheetData.columns.length, 'columns and', spreadsheetData.rows.length, 'rows');
    if (spreadsheetData.type) {
      setSelectedTemplate(spreadsheetData.type);
    } else {
      setSelectedTemplate('custom');
    }
    setColumns(spreadsheetData.columns);
    setRows(spreadsheetData.rows);
    setActiveTrackerId(null);
  }, []);

  const resetTemplate = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(TEMPLATE_KEY);
      setColumns([]);
      setRows([]);
      setSelectedTemplate(null);
      setActiveTrackerId(null);
    } catch (error) {
      console.error("Error resetting template:", error);
    }
  }, []);

  const clearAllStoredData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(TEMPLATE_KEY);
      await AsyncStorage.removeItem(TRACKERS_KEY);
      await AsyncStorage.removeItem(ACTIVE_TRACKER_KEY);
      setColumns([]);
      setRows([]);
      setSelectedTemplate(null);
      setActiveTrackerId(null);
      console.log('All analytics storage cleared successfully');
    } catch (error) {
      console.error("Error clearing all stored data:", error);
    }
  }, []);

  const evaluateFormula = useCallback((formula: string, rowId: string): number => {
    try {
      let expression = formula.replace(/^=/, '');

      expression = expression.replace(/SUM\(([A-Z]+)\)/gi, (match, colName) => {
        const column = columns.find(c => c.name.toUpperCase() === colName.toUpperCase());
        if (!column) return '0';
        const sum = rows.reduce((acc, r) => {
          const cell = r.cells[column.id];
          return acc + (cell ? parseFloat(String(cell.value)) || 0 : 0);
        }, 0);
        return String(sum);
      });

      expression = expression.replace(/AVG\(([A-Z]+)\)/gi, (match, colName) => {
        const column = columns.find(c => c.name.toUpperCase() === colName.toUpperCase());
        if (!column) return '0';
        const values = rows.map(r => {
          const cell = r.cells[column.id];
          return cell ? parseFloat(String(cell.value)) || 0 : 0;
        }).filter(v => v !== 0);
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        return String(avg);
      });

      expression = expression.replace(/COUNT\(([A-Z]+)\)/gi, (match, colName) => {
        const column = columns.find(c => c.name.toUpperCase() === colName.toUpperCase());
        if (!column) return '0';
        const count = rows.filter(r => r.cells[column.id]?.value).length;
        return String(count);
      });

      expression = expression.replace(/MIN\(([A-Z]+)\)/gi, (match, colName) => {
        const column = columns.find(c => c.name.toUpperCase() === colName.toUpperCase());
        if (!column) return '0';
        const values = rows.map(r => {
          const cell = r.cells[column.id];
          return cell ? parseFloat(String(cell.value)) || 0 : 0;
        }).filter(v => v !== 0);
        const min = values.length > 0 ? Math.min(...values) : 0;
        return String(min);
      });

      expression = expression.replace(/MAX\(([A-Z]+)\)/gi, (match, colName) => {
        const column = columns.find(c => c.name.toUpperCase() === colName.toUpperCase());
        if (!column) return '0';
        const values = rows.map(r => {
          const cell = r.cells[column.id];
          return cell ? parseFloat(String(cell.value)) || 0 : 0;
        }).filter(v => v !== 0);
        const max = values.length > 0 ? Math.max(...values) : 0;
        return String(max);
      });

      expression = expression.replace(/([A-Z]+)/g, (match) => {
        const column = columns.find(c => c.name.toUpperCase() === match.toUpperCase());
        if (!column) return '0';
        const row = rows.find(r => r.id === rowId);
        if (!row) return '0';
        const cell = row.cells[column.id];
        return cell ? String(cell.value || 0) : '0';
      });

      const result = eval(expression);
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return 0;
    }
  }, [columns, rows]);

  const exportAsSpreadsheet = useCallback((): string => {
    let csv = columns.map(col => `"${col.name}"`).join(',') + '\n';
    
    rows.forEach((row) => {
      const values = columns.map(col => {
        const cell = row.cells[col.id];
        if (!cell) return '';
        if (cell.formula) return `"${cell.formula}"`;
        return cell.value;
      });
      csv += values.join(',') + '\n';
    });

    return csv;
  }, [columns, rows]);

  const saveTracker = useCallback(async (tracker: Tracker) => {
    try {
      const stored = await AsyncStorage.getItem(TRACKERS_KEY);
      let trackers: Tracker[] = [];
      if (stored && isValidJSON(stored)) {
        trackers = JSON.parse(stored);
        if (!Array.isArray(trackers)) trackers = [];
      }
      
      // Check if tracker already exists, update if so, otherwise append
      const existingIndex = trackers.findIndex(t => t.id === tracker.id);
      if (existingIndex >= 0) {
        trackers[existingIndex] = tracker;
      } else {
        trackers.push(tracker);
      }
      
      await AsyncStorage.setItem(TRACKERS_KEY, JSON.stringify(trackers));
      console.log("Tracker saved:", tracker.customName);
      return true;
    } catch (error) {
      console.error("Error saving tracker:", error);
      return false;
    }
  }, []);

  return useMemo(
    () => ({
      columns,
      rows,
      isLoading,
      selectedTemplate,
      activeTrackerId,
      addColumn,
      updateColumn,
      deleteColumn,
      addRow,
      updateCell,
      deleteRow,
      evaluateFormula,
      exportAsSpreadsheet,
      selectTemplate,
      loadTracker,
      loadSpreadsheetData,
      saveTracker,
      resetTemplate,
      clearAllStoredData,
    }),
    [
      columns,
      rows,
      isLoading,
      selectedTemplate,
      activeTrackerId,
      addColumn,
      updateColumn,
      deleteColumn,
      addRow,
      updateCell,
      deleteRow,
      evaluateFormula,
      exportAsSpreadsheet,
      selectTemplate,
      loadTracker,
      loadSpreadsheetData,
      saveTracker,
      resetTemplate,
      clearAllStoredData,
    ]
  );
});

function getTemplateColumns(template: TemplateType): SpreadsheetColumn[] {
  const baseId = Date.now();
  
  switch (template) {
    case "sales-general":
      return [
        { id: `${baseId}_1`, name: "Date", type: "date", width: 120 },
        { id: `${baseId}_2`, name: "Leads", type: "number", width: 100 },
        { id: `${baseId}_3`, name: "Contacts", type: "number", width: 100 },
        { id: `${baseId}_4`, name: "Sales", type: "number", width: 100 },
        { id: `${baseId}_5`, name: "Revenue", type: "number", width: 120 },
        { id: `${baseId}_6`, name: "Conversion%", type: "formula", width: 130 },
      ];
    
    case "cold-calling":
      return [
        { id: `${baseId}_1`, name: "Date", type: "date", width: 120 },
        { id: `${baseId}_2`, name: "Calls", type: "number", width: 100 },
        { id: `${baseId}_3`, name: "Connects", type: "number", width: 100 },
        { id: `${baseId}_4`, name: "Meetings", type: "number", width: 100 },
        { id: `${baseId}_5`, name: "Connect%", type: "formula", width: 120 },
        { id: `${baseId}_6`, name: "Meeting%", type: "formula", width: 120 },
      ];
    
    case "closing-sales":
      return [
        { id: `${baseId}_1`, name: "Date", type: "date", width: 120 },
        { id: `${baseId}_2`, name: "Proposals", type: "number", width: 110 },
        { id: `${baseId}_3`, name: "Closed", type: "number", width: 100 },
        { id: `${baseId}_4`, name: "Value", type: "number", width: 120 },
        { id: `${baseId}_5`, name: "Close%", type: "formula", width: 120 },
        { id: `${baseId}_6`, name: "AvgDeal", type: "formula", width: 120 },
      ];
    
    case "insurance-sales":
      return [
        { id: `${baseId}_1`, name: "Date", type: "date", width: 120 },
        { id: `${baseId}_2`, name: "Quotes", type: "number", width: 100 },
        { id: `${baseId}_3`, name: "Policies", type: "number", width: 100 },
        { id: `${baseId}_4`, name: "Premium", type: "number", width: 120 },
        { id: `${baseId}_5`, name: "Commission", type: "number", width: 130 },
        { id: `${baseId}_6`, name: "Rate%", type: "formula", width: 100 },
      ];
    
    case "sports-performance":
      return [
        { id: `${baseId}_1`, name: "Date", type: "date", width: 120 },
        { id: `${baseId}_2`, name: "Training", type: "number", width: 110 },
        { id: `${baseId}_3`, name: "Games", type: "number", width: 100 },
        { id: `${baseId}_4`, name: "Score", type: "number", width: 100 },
        { id: `${baseId}_5`, name: "Wins", type: "number", width: 100 },
        { id: `${baseId}_6`, name: "WinRate%", type: "formula", width: 120 },
      ];
    
    case "actors-career":
      return [
        { id: `${baseId}_1`, name: "Date", type: "date", width: 120 },
        { id: `${baseId}_2`, name: "Auditions", type: "number", width: 110 },
        { id: `${baseId}_3`, name: "Callbacks", type: "number", width: 110 },
        { id: `${baseId}_4`, name: "Bookings", type: "number", width: 110 },
        { id: `${baseId}_5`, name: "Pay", type: "number", width: 120 },
        { id: `${baseId}_6`, name: "Success%", type: "formula", width: 120 },
      ];
    
    case "modeling-career":
      return [
        { id: `${baseId}_1`, name: "Date", type: "date", width: 120 },
        { id: `${baseId}_2`, name: "Castings", type: "number", width: 110 },
        { id: `${baseId}_3`, name: "Shoots", type: "number", width: 100 },
        { id: `${baseId}_4`, name: "Payment", type: "number", width: 120 },
        { id: `${baseId}_5`, name: "Rate%", type: "formula", width: 100 },
        { id: `${baseId}_6`, name: "AvgPay", type: "formula", width: 120 },
      ];
    
    case "music-career":
      return [
        { id: `${baseId}_1`, name: "Date", type: "date", width: 120 },
        { id: `${baseId}_2`, name: "Streams", type: "number", width: 110 },
        { id: `${baseId}_3`, name: "Shows", type: "number", width: 100 },
        { id: `${baseId}_4`, name: "Merch", type: "number", width: 100 },
        { id: `${baseId}_5`, name: "Revenue", type: "number", width: 120 },
        { id: `${baseId}_6`, name: "Growth%", type: "formula", width: 120 },
      ];
    
    case "singing-career":
      return [
        { id: `${baseId}_1`, name: "Date", type: "date", width: 120 },
        { id: `${baseId}_2`, name: "Practice", type: "number", width: 110 },
        { id: `${baseId}_3`, name: "Gigs", type: "number", width: 100 },
        { id: `${baseId}_4`, name: "Income", type: "number", width: 120 },
        { id: `${baseId}_5`, name: "Followers", type: "number", width: 110 },
        { id: `${baseId}_6`, name: "AvgPay", type: "formula", width: 120 },
      ];
    
    default:
      return [];
  }
}

function getTemplateName(template: TemplateType): string {
  switch (template) {
    case "sales-general": return "Sales General";
    case "cold-calling": return "Cold Calling";
    case "closing-sales": return "Closing Sales";
    case "insurance-sales": return "Insurance Sales";
    case "sports-performance": return "Sports Performance";
    case "actors-career": return "Actors Career";
    case "modeling-career": return "Modeling Career";
    case "music-career": return "Music Career";
    case "singing-career": return "Singing Career";
    case "custom": return "Custom Analytics";
  }
}
