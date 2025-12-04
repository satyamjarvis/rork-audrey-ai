import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { isValidJSON } from "@/utils/asyncStorageHelpers";
import { encrypt, decrypt } from "@/utils/encryption";

export type DrawingStroke = {
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  type: "pen" | "marker" | "highlighter" | "eraser";
};

export type NoteAttachment = {
  id: string;
  uri: string;
  type: "image";
  addedAt: string;
};

export type Note = {
  id: string;
  title: string;
  textContent: string;
  drawingStrokes: DrawingStroke[];
  attachments: NoteAttachment[];
  createdAt: string;
  lastEdited: string;
  isEncrypted: boolean;
};

const NOTES_KEY = "@notes_data";

export const [NotesProvider, useNotes] = createContextHook(() => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const notesData = await AsyncStorage.getItem(NOTES_KEY);
      
      if (notesData) {
        if (!isValidJSON(notesData)) {
          console.log("Invalid or empty notes data, initializing fresh");
          await AsyncStorage.removeItem(NOTES_KEY);
          setNotes([]);
          return;
        }
        
        try {
          let parsedNotes;
          try {
            const decryptedData = await decrypt(notesData);
            parsedNotes = JSON.parse(decryptedData);
            console.log("🔓 Notes decrypted successfully");
          } catch {
            parsedNotes = JSON.parse(notesData);
            console.log("⚠️ Loaded unencrypted notes, will encrypt on next save");
          }
          
          if (!Array.isArray(parsedNotes)) {
            console.warn("Notes data is not an array, resetting");
            await AsyncStorage.removeItem(NOTES_KEY);
            setNotes([]);
            return;
          }
          
          const validNotes = parsedNotes.filter(note => {
            return note && typeof note === 'object' && 'id' in note;
          });
          
          setNotes(validNotes);
          console.log(`Loaded ${validNotes.length} notes`);
        } catch (jsonError) {
          console.error("JSON parse error in notes:", jsonError);
          console.error("Corrupted data:", notesData.substring(0, 100));
          await AsyncStorage.removeItem(NOTES_KEY);
          setNotes([]);
        }
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveNotes = useCallback(async (newNotes: Note[]) => {
    try {
      const encryptedData = await encrypt(JSON.stringify(newNotes));
      await AsyncStorage.setItem(NOTES_KEY, encryptedData);
      setNotes(newNotes);
      console.log("🔒 Notes encrypted and saved");
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  }, []);

  const createNote = useCallback(async (title: string = "Untitled Note"): Promise<Note> => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title,
      textContent: "",
      drawingStrokes: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      isEncrypted: false,
    };
    const updatedNotes = [newNote, ...notes];
    await saveNotes(updatedNotes);
    console.log("Note created:", newNote.id);
    return newNote;
  }, [notes, saveNotes]);

  const updateNote = useCallback(async (
    noteId: string,
    updates: Partial<Omit<Note, "id" | "createdAt">>
  ) => {
    const updatedNotes = notes.map((note) =>
      note.id === noteId
        ? { ...note, ...updates, lastEdited: new Date().toISOString() }
        : note
    );
    await saveNotes(updatedNotes);
    console.log("Note updated:", noteId);
  }, [notes, saveNotes]);

  const deleteNote = useCallback(async (noteId: string) => {
    const updatedNotes = notes.filter((note) => note.id !== noteId);
    await saveNotes(updatedNotes);
    console.log("Note deleted:", noteId);
  }, [notes, saveNotes]);

  const addDrawingStroke = useCallback(async (noteId: string, stroke: DrawingStroke) => {
    const updatedNotes = notes.map((note) => {
      if (note.id === noteId) {
        return {
          ...note,
          drawingStrokes: [...note.drawingStrokes, stroke],
          lastEdited: new Date().toISOString(),
        };
      }
      return note;
    });
    await saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const clearDrawing = useCallback(async (noteId: string) => {
    const updatedNotes = notes.map((note) => {
      if (note.id === noteId) {
        return {
          ...note,
          drawingStrokes: [],
          lastEdited: new Date().toISOString(),
        };
      }
      return note;
    });
    await saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const addAttachment = useCallback(async (noteId: string, attachment: NoteAttachment) => {
    const updatedNotes = notes.map((note) => {
      if (note.id === noteId) {
        return {
          ...note,
          attachments: [...note.attachments, attachment],
          lastEdited: new Date().toISOString(),
        };
      }
      return note;
    });
    await saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  const encryptNote = useCallback(async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    try {
      const encrypted = await encrypt(JSON.stringify({
        textContent: note.textContent,
        drawingStrokes: note.drawingStrokes,
      }));

      const updatedNotes = notes.map((n) =>
        n.id === noteId
          ? {
              ...n,
              textContent: encrypted,
              drawingStrokes: [],
              isEncrypted: true,
              lastEdited: new Date().toISOString(),
            }
          : n
      );
      await saveNotes(updatedNotes);
      console.log("Note encrypted:", noteId);
    } catch (error) {
      console.error("Error encrypting note:", error);
      throw error;
    }
  }, [notes, saveNotes]);

  const decryptNote = useCallback(async (noteId: string): Promise<{ textContent: string; drawingStrokes: DrawingStroke[] } | null> => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || !note.isEncrypted) return null;

    try {
      const decrypted = await decrypt(note.textContent);
      const parsed = JSON.parse(decrypted);
      return parsed;
    } catch (error) {
      console.error("Error decrypting note:", error);
      return null;
    }
  }, [notes]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return useMemo(
    () => ({
      notes,
      isLoading,
      createNote,
      updateNote,
      deleteNote,
      addDrawingStroke,
      clearDrawing,
      addAttachment,
      encryptNote,
      decryptNote,
    }),
    [
      notes,
      isLoading,
      createNote,
      updateNote,
      deleteNote,
      addDrawingStroke,
      clearDrawing,
      addAttachment,
      encryptNote,
      decryptNote,
    ]
  );
});
