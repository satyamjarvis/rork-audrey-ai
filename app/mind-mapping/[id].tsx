import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
  Alert,
  Modal,
  Easing
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Palette, 
  Type, 
  ZoomIn,
  ZoomOut
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useMindMap, MindMap, Node, Edge } from '@/contexts/MindMapContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const NODE_WIDTH = 140;
const NODE_HEIGHT = 70;
const CANVAS_SIZE = 5000;

const COLORS = [
  '#FFD700', // Gold
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF4500', // OrangeRed
  '#32CD32', // LimeGreen
  '#1E90FF', // DodgerBlue
  '#9370DB', // MediumPurple
  '#FF1493', // DeepPink
];

const GLITTER_COLORS = [
  '#CD7F32', // Bronze
  '#C0C0C0', // Silver
  '#FF00FF', // Magenta
  '#00BFFF', // Deep Sky Blue
];

const GlitterParticle = ({ initialX, initialY }: { initialX: number, initialY: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const color = useMemo(() => GLITTER_COLORS[Math.floor(Math.random() * GLITTER_COLORS.length)], []);
  const size = useMemo(() => Math.random() * 4 + 2, []);
  const duration = useMemo(() => Math.random() * 2000 + 1500, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [anim, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20]
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3]
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: initialX,
        top: initialY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: opacity,
        transform: [{ translateY }],
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      }}
    />
  );
};

const BackgroundGlitter = React.memo(() => {
  // Create a fixed number of particles
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
    }));
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => (
        <GlitterParticle key={p.id} initialX={p.x} initialY={p.y} />
      ))}
    </View>
  );
});

BackgroundGlitter.displayName = 'BackgroundGlitter';

export default function MindMapEditor() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';
  const insets = useSafeAreaInsets();
  const { getMindMap, updateMindMap, isLoading } = useMindMap();

  const [map, setMap] = useState<MindMap | undefined>(undefined);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(-CANVAS_SIZE / 2 + SCREEN_WIDTH / 2);
  const [translateY, setTranslateY] = useState(-CANVAS_SIZE / 2 + SCREEN_HEIGHT / 2);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [isColorModalVisible, setIsColorModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const lastGestures = useRef<Map<string, { dx: number; dy: number }>>(new Map());

  useEffect(() => {
    nodes.forEach(node => {
      if (!nodePositions.current.has(node.id)) {
        nodePositions.current.set(node.id, { x: node.x, y: node.y });
      }
    });
  }, [nodes]);

  useEffect(() => {
    if (isLoading) return;
    if (map) return;

    if (typeof id === 'string') {
      const foundMap = getMindMap(id);
      if (foundMap) {
        setMap(foundMap);
        setNodes(foundMap.nodes);
        setEdges(foundMap.edges);
        
        const root = foundMap.nodes.find(n => n.type === 'root');
        if (root) {
          setTranslateX(-root.x - NODE_WIDTH/2 + SCREEN_WIDTH/2);
          setTranslateY(-root.y - NODE_HEIGHT/2 + SCREEN_HEIGHT/2);
        }
      } else {
        Alert.alert("Error", "Mind map not found", [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    }
  }, [id, isLoading, map, getMindMap]);

  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      updateMindMap(map.id, { nodes, edges });
    }, 1000);
    return () => clearTimeout(timer);
  }, [nodes, edges, map, updateMindMap]);

  const isPanning = useRef(false);
  const lastTranslate = useRef({ x: translateX, y: translateY });

  useEffect(() => {
    lastTranslate.current = { x: translateX, y: translateY };
  }, [translateX, translateY]);

  const getBounds = useCallback(() => {
    if (nodes.length === 0) {
      return {
        minX: -SCREEN_WIDTH,
        maxX: SCREEN_WIDTH,
        minY: -SCREEN_HEIGHT,
        maxY: SCREEN_HEIGHT
      };
    }

    let minNodeX = Infinity;
    let maxNodeX = -Infinity;
    let minNodeY = Infinity;
    let maxNodeY = -Infinity;

    nodes.forEach(node => {
      minNodeX = Math.min(minNodeX, node.x);
      maxNodeX = Math.max(maxNodeX, node.x + (node.width || NODE_WIDTH));
      minNodeY = Math.min(minNodeY, node.y);
      maxNodeY = Math.max(maxNodeY, node.y + (node.height || NODE_HEIGHT));
    });

    const boundaryPadding = SCREEN_WIDTH * 0.3;
    
    return {
      minX: -(maxNodeX * scale) - boundaryPadding,
      maxX: -(minNodeX * scale) + SCREEN_WIDTH + boundaryPadding,
      minY: -(maxNodeY * scale) - boundaryPadding,
      maxY: -(minNodeY * scale) + SCREEN_HEIGHT + boundaryPadding
    };
  }, [nodes, scale]);

  const constrainTranslation = useCallback((x: number, y: number) => {
    const bounds = getBounds();
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, y))
    };
  }, [getBounds]);

  const canvasPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        isPanning.current = true;
        setSelectedNodeId(null);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isPanning.current) {
          const newX = lastTranslate.current.x + gestureState.dx;
          const newY = lastTranslate.current.y + gestureState.dy;
          const constrained = constrainTranslation(newX, newY);
          setTranslateX(constrained.x);
          setTranslateY(constrained.y);
        }
      },
      onPanResponderRelease: () => {
        isPanning.current = false;
        lastTranslate.current = { x: translateX, y: translateY };
      },
      onPanResponderTerminate: () => {
        isPanning.current = false;
        lastTranslate.current = { x: translateX, y: translateY };
      },
    })
  ).current;

  const handleNodeDrag = useCallback((nodeId: string, dx: number, dy: number) => {
    const lastGesture = lastGestures.current.get(nodeId) || { dx: 0, dy: 0 };
    const deltaDx = dx - lastGesture.dx;
    const deltaDy = dy - lastGesture.dy;
    
    lastGestures.current.set(nodeId, { dx, dy });

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const newX = n.x + deltaDx / scale;
        const newY = n.y + deltaDy / scale;
        nodePositions.current.set(nodeId, { x: newX, y: newY });
        return { ...n, x: newX, y: newY };
      }
      return n;
    }));
  }, [scale]);

  const handleNodeDragEnd = useCallback((nodeId: string) => {
    lastGestures.current.delete(nodeId);
  }, []);

  const addNode = useCallback((parentId?: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const parent = parentId ? nodes.find(n => n.id === parentId) : null;
    
    let baseX: number;
    let baseY: number;
    
    if (parent) {
      baseX = parent.x;
      baseY = parent.y;
    } else {
      baseX = (-translateX / scale) + (SCREEN_WIDTH / 2 / scale) - (NODE_WIDTH / 2);
      baseY = (-translateY / scale) + (SCREEN_HEIGHT / 2 / scale) - (NODE_HEIGHT / 2);
    }
    
    const offsetX = (Math.random() - 0.5) * 150 + (parent ? 180 : 0);
    const offsetY = (Math.random() - 0.5) * 150;

    const newNode: Node = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      text: "New Idea",
      x: baseX + offsetX,
      y: baseY + offsetY,
      color: parent ? parent.color : COLORS[Math.floor(Math.random() * COLORS.length)],
      type: parent ? 'child' : 'root',
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    };

    setNodes(prev => [...prev, newNode]);

    if (parent) {
      const newEdge: Edge = {
        id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceId: parent.id,
        targetId: newNode.id
      };
      setEdges(prev => [...prev, newEdge]);
    }
    
    setSelectedNodeId(newNode.id);
  }, [nodes, translateX, translateY, scale]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    Alert.alert(
      "Delete Node",
      "Are you sure? This will delete the node and its connections.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
            setEdges(prev => prev.filter(e => e.sourceId !== selectedNodeId && e.targetId !== selectedNodeId));
            setSelectedNodeId(null);
          }
        }
      ]
    );
  }, [selectedNodeId]);

  const startEditing = useCallback(() => {
    if (!selectedNodeId) return;
    const node = nodes.find(n => n.id === selectedNodeId);
    if (node) {
      setEditText(node.text);
      setEditingNodeId(selectedNodeId);
      setIsEditModalVisible(true);
    }
  }, [selectedNodeId, nodes]);

  const saveNodeText = useCallback(() => {
    if (editingNodeId && editText.trim()) {
      setNodes(prev => prev.map(n => 
        n.id === editingNodeId ? { ...n, text: editText.trim() } : n
      ));
    }
    setIsEditModalVisible(false);
    setEditingNodeId(null);
  }, [editingNodeId, editText]);

  const changeNodeColor = useCallback((color: string) => {
    if (selectedNodeId) {
      setNodes(prev => prev.map(n => 
        n.id === selectedNodeId ? { ...n, color } : n
      ));
      setIsColorModalVisible(false);
    }
  }, [selectedNodeId]);

  if (!map) return (
    <View style={[styles.container, { backgroundColor: isNightMode ? "#000" : "#FFF" }]}>
       <Text style={{color: isNightMode ? "#FFF" : "#000"}}>Loading...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isNightMode 
          ? ["#0a0a0f", "#1a0a1f", "#101015"] 
          : theme.gradients.background as any
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.toolbar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.toolButton}>
          <ArrowLeft color={theme.colors.text.primary} size={24} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.colors.text.primary }]} numberOfLines={1}>
          {map.title}
        </Text>

        <View style={styles.toolGroup}>
          <TouchableOpacity onPress={() => setScale(s => Math.min(s * 1.2, 3))} style={styles.toolButton}>
            <ZoomIn color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScale(s => Math.max(s / 1.2, 0.3))} style={styles.toolButton}>
            <ZoomOut color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <BackgroundGlitter />

      <View 
        style={styles.canvasContainer}
        {...canvasPanResponder.panHandlers}
      >
        <Animated.View
          style={{
            flex: 1,
            transform: [
              { translateX },
              { translateY },
              { scale }
            ]
          }}
        >
          <Svg style={StyleSheet.absoluteFill}>
             {edges.map(edge => {
               const source = nodes.find(n => n.id === edge.sourceId);
               const target = nodes.find(n => n.id === edge.targetId);
               if (!source || !target) return null;

               const startX = source.x + (source.width || NODE_WIDTH) / 2;
               const startY = source.y + (source.height || NODE_HEIGHT) / 2;
               const endX = target.x + (target.width || NODE_WIDTH) / 2;
               const endY = target.y + (target.height || NODE_HEIGHT) / 2;

               return (
                 <Line
                   key={edge.id}
                   x1={startX}
                   y1={startY}
                   x2={endX}
                   y2={endY}
                   stroke={isNightMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
                   strokeWidth="2"
                   strokeDasharray="5, 5"
                 />
               );
             })}
          </Svg>

          {nodes.map(node => (
             <DraggableNode
               key={node.id}
               node={node}
               isSelected={selectedNodeId === node.id}
               onSelect={() => setSelectedNodeId(node.id)}
               onDrag={(dx: number, dy: number) => handleNodeDrag(node.id, dx, dy)}
               onDragEnd={() => handleNodeDragEnd(node.id)}
               theme={theme}
               isNightMode={isNightMode}
               scale={scale}
             />
          ))}

        </Animated.View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20, backgroundColor: isNightMode ? "rgba(20,20,30,0.95)" : "rgba(255,255,255,0.95)" }]}>
        {selectedNodeId ? (
           <View style={styles.actionRow}>
             <TouchableOpacity style={styles.actionButton} onPress={() => setIsColorModalVisible(true)}>
               <Palette color={theme.colors.text.primary} size={20} />
               <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>Color</Text>
             </TouchableOpacity>
             
             <TouchableOpacity style={styles.actionButton} onPress={startEditing}>
               <Type color={theme.colors.text.primary} size={20} />
               <Text style={[styles.actionText, { color: theme.colors.text.primary }]}>Edit</Text>
             </TouchableOpacity>

             <TouchableOpacity style={[styles.actionButton, styles.mainActionButton]} onPress={() => addNode(selectedNodeId)}>
               <Plus color="#FFFFFF" size={24} />
               <Text style={[styles.actionText, { color: "#FFFFFF", fontWeight: "700" as const }]}>Add Child</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.actionButton} onPress={deleteSelectedNode}>
               <Trash2 color="#FF4500" size={20} />
               <Text style={[styles.actionText, { color: "#FF4500" }]}>Delete</Text>
             </TouchableOpacity>
           </View>
        ) : (
           <View style={styles.actionRow}>
             <Text style={[styles.hintText, { color: theme.colors.text.secondary }]}>
               Tap a node to edit or drag empty space to pan
             </Text>
             <TouchableOpacity style={[styles.actionButton, styles.mainActionButton]} onPress={() => addNode()}>
               <Plus color="#FFFFFF" size={24} />
               <Text style={[styles.actionText, { color: "#FFFFFF", fontWeight: "700" as const }]}>New Idea</Text>
             </TouchableOpacity>
           </View>
        )}
      </View>

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: isNightMode ? "#1E1E24" : "#FFFFFF" }]}>
             <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Edit Node</Text>
             <TextInput
               style={[
                 styles.modalInput, 
                 { 
                   color: theme.colors.text.primary,
                   backgroundColor: isNightMode ? "rgba(255,255,255,0.05)" : "#F5F5F5",
                   borderColor: theme.colors.border
                 }
               ]}
               value={editText}
               onChangeText={setEditText}
               autoFocus
               multiline
             />
             <View style={styles.modalActions}>
               <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.modalButton}>
                 <Text style={{ color: theme.colors.text.secondary }}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={saveNodeText} style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}>
                 <Text style={{ color: "#FFF", fontWeight: "600" as const }}>Save</Text>
               </TouchableOpacity>
             </View>
           </View>
        </View>
      </Modal>

      <Modal
        visible={isColorModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsColorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: isNightMode ? "#1E1E24" : "#FFFFFF" }]}>
             <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Choose Color</Text>
             <View style={styles.colorGrid}>
               {COLORS.map(color => (
                 <TouchableOpacity
                   key={color}
                   style={[styles.colorOption, { backgroundColor: color }]}
                   onPress={() => changeNodeColor(color)}
                 />
               ))}
             </View>
             <TouchableOpacity onPress={() => setIsColorModalVisible(false)} style={[styles.modalButton, { marginTop: 20 }]}>
                 <Text style={{ color: theme.colors.text.primary }}>Cancel</Text>
             </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </View>
  );
}

interface DraggableNodeProps {
  node: Node;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (dx: number, dy: number) => void;
  onDragEnd: () => void;
  theme: any;
  isNightMode: boolean;
  scale: number;
}

const DraggableNode = React.memo<DraggableNodeProps>(({ node, isSelected, onSelect, onDrag, onDragEnd, theme, isNightMode, scale }) => {
  const onDragRef = useRef(onDrag);
  const onSelectRef = useRef(onSelect);
  const onDragEndRef = useRef(onDragEnd);
  const isDragging = useRef(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    onDragRef.current = onDrag;
    onSelectRef.current = onSelect;
    onDragEndRef.current = onDragEnd;
  }, [onDrag, onSelect, onDragEnd]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isDragging.current ? 1.05 : 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      Animated.spring(shadowAnim, {
        toValue: isSelected ? 1 : 0,
        useNativeDriver: false,
        tension: 300,
        friction: 20,
      })
    ]).start();
  }, [isSelected, scaleAnim, shadowAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
         return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        isDragging.current = true;
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }).start();
        onSelectRef.current();
      },
      onPanResponderMove: (evt, gestureState) => {
        onDragRef.current(gestureState.dx, gestureState.dy);
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }).start();
        onDragEndRef.current();
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }).start();
        onDragEndRef.current();
      },
    })
  ).current;

  // Sophisticated Glow Animation
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (isSelected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: true })
        ])
      ).start();
    } else {
      glowOpacity.setValue(0.4);
    }
  }, [isSelected, glowOpacity]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.nodeContainer,
        {
          left: node.x,
          top: node.y,
          width: node.width || NODE_WIDTH,
          minHeight: node.height || NODE_HEIGHT,
          transform: [{ scale: scaleAnim }],
          // Initial Shadow
          shadowColor: node.color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          // Background handling
          backgroundColor: isNightMode ? '#1E1E24' : '#FFFFFF',
        }
      ]}
    >
      {/* Outer Glow Layer - Simulating sophisticated glow */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill, 
          { 
            borderRadius: 16, 
            backgroundColor: node.color,
            opacity: isSelected ? 0.3 : 0.1, // Always subtle glow, stronger when selected
            transform: [{ scale: isSelected ? 1.1 : 1.02 }],
            zIndex: -1,
          }
        ]} 
      />
      
      {/* Inner Gradient Border */}
      <View style={[styles.nodeInner, { borderColor: node.color }]}>
        <LinearGradient
           colors={isNightMode 
             ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)'] 
             : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0)']}
           style={StyleSheet.absoluteFill}
        />
        
        <View style={[styles.nodeHeader, { borderBottomColor: node.color + '40' }]}>
           <View style={[styles.nodeDot, { backgroundColor: node.color }]} />
        </View>

        <Text 
          style={[styles.nodeText, { color: isNightMode ? "#FFF" : "#000" }]}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {node.text}
        </Text>
      </View>
    </Animated.View>
  );
});

DraggableNode.displayName = 'DraggableNode';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  toolButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  toolGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  nodeContainer: {
    position: 'absolute',
    borderRadius: 16,
    // Note: Padding is handled in inner view to respect borders and gradients
    elevation: 8,
    zIndex: 10,
  },
  nodeInner: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 4,
  },
  nodeHeader: {
    height: 6,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nodeDot: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
  nodeText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingBottom: 8,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  mainActionButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: -20,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    padding: 10,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
});
