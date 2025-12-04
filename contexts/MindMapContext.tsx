import createContextHook from "@nkzw/create-context-hook";
import { useCallback } from "react";
import { usePersistentStorage } from "@/utils/usePersistentStorage";

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
    const newMap: MindMap = {
      id: Date.now().toString(),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'root',
          text: title,
          x: 0, 
          y: 0, // Center coordinate logic will be handled in view
          color: '#FFD700',
          type: 'root'
        }
      ],
      edges: []
    };

    setMindMaps((prevMaps) => [newMap, ...prevMaps]);
    return newMap.id;
  }, [setMindMaps]);

  const updateMindMap = useCallback(async (id: string, updates: Partial<MindMap>) => {
    setMindMaps((prevMaps) => 
      prevMaps.map(map => 
        map.id === id 
          ? { ...map, ...updates, updatedAt: new Date().toISOString() }
          : map
      )
    );
  }, [setMindMaps]);

  const deleteMindMap = useCallback(async (id: string) => {
    setMindMaps((prevMaps) => prevMaps.filter(map => map.id !== id));
  }, [setMindMaps]);

  const getMindMap = useCallback((id: string) => {
    return mindMaps.find(map => map.id === id);
  }, [mindMaps]);

  return {
    mindMaps,
    isLoading,
    createMindMap,
    updateMindMap,
    deleteMindMap,
    getMindMap
  };
});
