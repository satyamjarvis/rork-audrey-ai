import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useMemo } from "react";
import { usePersistentStorage } from "@/utils/usePersistentStorage";
import { ensureArray, ensureString, safeFilterArray, safeFindInArray, safeMapArray } from "@/utils/resilience";

export interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  type: 'root' | 'child' | 'leaf';
  width?: number;
  height?: number;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface MindMap {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  nodes: Node[];
  edges: Edge[];
  themeId?: string; // For potential future theming
}

const STORAGE_KEY = "@mind_maps";

export const [MindMapProvider, useMindMap] = createContextHook(() => {
  const {
    data: mindMaps,
    saveData: setMindMaps,
    isLoading
  } = usePersistentStorage<MindMap[]>({
    key: STORAGE_KEY,
    initialValue: [],
    encryption: true,
  });

  const createMindMap = useCallback(async (title: string) => {
    try {
      const safeTitle = ensureString(title, 'New Mind Map');
      const newMap: MindMap = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        title: safeTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          {
            id: 'root',
            text: safeTitle,
            x: 0, 
            y: 0, // Center coordinate logic will be handled in view
            color: '#FFD700',
            type: 'root'
          }
        ],
        edges: []
      };

      setMindMaps((prevMaps) => {
        const safePrev = ensureArray<MindMap>(prevMaps, []);
        return [newMap, ...safePrev];
      });
      return newMap.id;
    } catch (error) {
      console.error('[MindMapContext] createMindMap error:', error);
      throw error;
    }
  }, [setMindMaps]);

  const updateMindMap = useCallback(async (id: string, updates: Partial<MindMap>) => {
    try {
      if (!id) {
        console.warn('[MindMapContext] updateMindMap: id is required');
        return;
      }
      setMindMaps((prevMaps) => {
        const safePrev = ensureArray<MindMap>(prevMaps, []);
        return safeMapArray(
          safePrev,
          map => map && map.id === id 
            ? { ...map, ...updates, updatedAt: new Date().toISOString() }
            : map,
          safePrev
        );
      });
    } catch (error) {
      console.error('[MindMapContext] updateMindMap error:', error);
    }
  }, [setMindMaps]);

  const deleteMindMap = useCallback(async (id: string) => {
    try {
      if (!id) {
        console.warn('[MindMapContext] deleteMindMap: id is required');
        return;
      }
      setMindMaps((prevMaps) => {
        const safePrev = ensureArray<MindMap>(prevMaps, []);
        return safeFilterArray(safePrev, map => map && map.id !== id, []);
      });
    } catch (error) {
      console.error('[MindMapContext] deleteMindMap error:', error);
    }
  }, [setMindMaps]);

  const getMindMap = useCallback((id: string): MindMap | undefined => {
    try {
      if (!id) return undefined;
      const safeMaps = ensureArray<MindMap>(mindMaps, []);
      return safeFindInArray(safeMaps, map => map && map.id === id, undefined);
    } catch (error) {
      console.error('[MindMapContext] getMindMap error:', error);
      return undefined;
    }
  }, [mindMaps]);

  return useMemo(() => ({
    mindMaps: ensureArray<MindMap>(mindMaps, []),
    isLoading,
    createMindMap,
    updateMindMap,
    deleteMindMap,
    getMindMap
  }), [mindMaps, isLoading, createMindMap, updateMindMap, deleteMindMap, getMindMap]);
});
