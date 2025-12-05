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
  Easing,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Palette, 
  Type, 
  ZoomIn,
  ZoomOut,
  Share2,
  MessageCircle,
  Download,
  FileImage,
  FileText,
  X,
  Check
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useMindMap, MindMap, Node, Edge } from '@/contexts/MindMapContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { useCalendar } from '@/contexts/CalendarContext';
import KeyboardDismissButton from '@/components/KeyboardDismissButton';

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
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isSelectChatModalVisible, setIsSelectChatModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'jpg' | 'pdf' | null>(null);

  const { sendFileAttachment } = useChat();
  const { calendars } = useCalendar();
  const snapshotRef = useRef<View>(null);

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

  const panSensitivity = 0.25;
  const canvasPosition = useRef({ x: translateX, y: translateY });

  useEffect(() => {
    canvasPosition.current = { x: translateX, y: translateY };
  }, [translateX, translateY]);

  const canvasPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8;
      },
      onPanResponderGrant: () => {
        isPanning.current = true;
        setSelectedNodeId(null);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isPanning.current) {
          const targetX = lastTranslate.current.x + gestureState.dx * panSensitivity;
          const targetY = lastTranslate.current.y + gestureState.dy * panSensitivity;
          
          const currentX = canvasPosition.current.x;
          const currentY = canvasPosition.current.y;
          const interpolationFactor = 0.3;
          
          const newX = currentX + (targetX - currentX) * interpolationFactor;
          const newY = currentY + (targetY - currentY) * interpolationFactor;
          
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

    const dragSensitivity = 0.15;

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const targetX = n.x + (deltaDx / scale) * dragSensitivity;
        const targetY = n.y + (deltaDy / scale) * dragSensitivity;
        
        const currentPos = nodePositions.current.get(nodeId) || { x: n.x, y: n.y };
        const smoothingFactor = 0.25;
        const newX = currentPos.x + (targetX - currentPos.x) * smoothingFactor;
        const newY = currentPos.y + (targetY - currentPos.y) * smoothingFactor;
        
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

  const generateMindMapText = useCallback(() => {
    if (!map) return '';
    
    let text = `Mind Map: ${map.title}\n`;
    text += `Created: ${new Date(map.createdAt).toLocaleDateString()}\n`;
    text += `Updated: ${new Date(map.updatedAt).toLocaleDateString()}\n\n`;
    text += `Nodes (${nodes.length}):\n`;
    text += '─'.repeat(40) + '\n\n';
    
    const rootNodes = nodes.filter(n => n.type === 'root');
    const childMap = new Map<string, Node[]>();
    
    edges.forEach(edge => {
      const children = childMap.get(edge.sourceId) || [];
      const child = nodes.find(n => n.id === edge.targetId);
      if (child) children.push(child);
      childMap.set(edge.sourceId, children);
    });
    
    const printNode = (node: Node, indent: number = 0): string => {
      const prefix = indent === 0 ? '●' : '├──';
      let result = ' '.repeat(indent * 3) + prefix + ' ' + node.text + '\n';
      const children = childMap.get(node.id) || [];
      children.forEach(child => {
        result += printNode(child, indent + 1);
      });
      return result;
    };
    
    rootNodes.forEach(root => {
      text += printNode(root);
    });
    
    const orphanNodes = nodes.filter(n => 
      n.type !== 'root' && !edges.some(e => e.targetId === n.id)
    );
    if (orphanNodes.length > 0) {
      text += '\nUnconnected Ideas:\n';
      orphanNodes.forEach(node => {
        text += '  • ' + node.text + '\n';
      });
    }
    
    return text;
  }, [map, nodes, edges]);

  const exportAsImage = useCallback(async () => {
    if (!map) return;
    
    setIsExporting(true);
    setExportFormat('jpg');
    
    // Allow React to render the snapshot view
    setTimeout(async () => {
      try {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        const uri = await captureRef(snapshotRef, {
          format: 'jpg',
          quality: 0.9,
          result: 'tmpfile'
        });

        if (Platform.OS === 'web') {
           // Web support for download
           const link = document.createElement('a');
           link.href = uri;
           link.download = `${map.title.replace(/[^a-z0-9]/gi, '_')}.jpg`;
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
        } else {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/jpeg',
              dialogTitle: 'Share Mind Map'
            });
          } else {
            Alert.alert("Saved", "Image saved to temporary storage");
          }
        }
      } catch (error) {
        console.error('Export error:', error);
        Alert.alert('Error', 'Failed to export mind map image');
      } finally {
        setIsExporting(false);
        setExportFormat(null);
        setIsShareModalVisible(false);
      }
    }, 500);
  }, [map]);

  const exportAsPDF = useCallback(async () => {
    if (!map) return;
    
    setIsExporting(true);
    setExportFormat('pdf');
    
    setTimeout(async () => {
      try {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Capture image first
        const imageUri = await captureRef(snapshotRef, {
          format: 'jpg',
          quality: 0.8,
          result: 'base64' // Get base64 for embedding in HTML
        });

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background-color: ${isNightMode ? '#0a0a0f' : '#ffffff'};
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  font-family: sans-serif;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                  border-radius: 8px;
                }
                .footer {
                  margin-top: 20px;
                  color: #888;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <img src="data:image/jpeg;base64,${imageUri}" />
              <div class="footer">Generated by Rork App</div>
            </body>
          </html>
        `;

        if (Platform.OS === 'web') {
           const printWindow = window.open('', '_blank');
           if (printWindow) {
             printWindow.document.write(html);
             printWindow.document.close();
             printWindow.print();
           }
        } else {
          const { uri: pdfUri } = await Print.printToFileAsync({ html });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(pdfUri, {
              UTI: 'com.adobe.pdf',
              mimeType: 'application/pdf',
              dialogTitle: 'Share Mind Map PDF'
            });
          } else {
            Alert.alert("Saved", "PDF saved");
          }
        }
      } catch (error) {
        console.error('Export error:', error);
        Alert.alert('Error', 'Failed to export mind map PDF');
      } finally {
        setIsExporting(false);
        setExportFormat(null);
        setIsShareModalVisible(false);
      }
    }, 500);
  }, [map, isNightMode]);

  const shareToChat = useCallback(async (calendarId: string) => {
    if (!map) return;
    
    setIsExporting(true);
    
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      const textContent = generateMindMapText();
      const messageText = `📊 Shared Mind Map: ${map.title}`;
      
      await sendFileAttachment(
        calendarId,
        textContent,
        `${map.title.replace(/[^a-z0-9]/gi, '_')}_mindmap.txt`,
        messageText,
        'me',
        false,
        'mindmap',
        map.id,
        { title: map.title, nodeCount: nodes.length }
      );
      
      Alert.alert('Success', 'Mind map shared to chat!');
      setIsSelectChatModalVisible(false);
      setIsShareModalVisible(false);
    } catch (error) {
      console.error('Share to chat error:', error);
      Alert.alert('Error', 'Failed to share mind map to chat');
    } finally {
      setIsExporting(false);
    }
  }, [map, nodes, generateMindMapText, sendFileAttachment]);

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
          <TouchableOpacity 
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setIsShareModalVisible(true);
            }} 
            style={styles.toolButton}
          >
            <Share2 color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScale(s => Math.min(s * 1.2, 3))} style={styles.toolButton}>
            <ZoomIn color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScale(s => Math.max(s / 1.2, 0.3))} style={styles.toolButton}>
            <ZoomOut color={theme.colors.text.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Snapshot Render View - Hidden but rendered for capture */}
      <View 
        style={{ 
          position: 'absolute', 
          zIndex: -100, 
          opacity: 0, // Keep it invisible but rendered
          left: 0,
          top: 0
        }} 
        pointerEvents="none"
      >
        <View collapsable={false} ref={snapshotRef}>
          <MindMapSnapshot 
            nodes={nodes} 
            edges={edges} 
            theme={theme} 
            isNightMode={isNightMode} 
            title={map.title} 
          />
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
               <KeyboardDismissButton isDark={isNightMode} />
               <View style={styles.modalButtonsRow}>
                 <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.modalButton}>
                   <Text style={{ color: theme.colors.text.secondary }}>Cancel</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={saveNodeText} style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}>
                   <Text style={{ color: "#FFF", fontWeight: "600" as const }}>Save</Text>
                 </TouchableOpacity>
               </View>
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

      <Modal
        visible={isShareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={[
            styles.shareModalContent,
            { backgroundColor: isNightMode ? "#1E1E24" : "#FFFFFF" }
          ]}>
            <View style={styles.shareModalHeader}>
              <Text style={[styles.shareModalTitle, { color: theme.colors.text.primary }]}>
                Share Mind Map
              </Text>
              <TouchableOpacity 
                onPress={() => setIsShareModalVisible(false)}
                style={styles.shareCloseButton}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.shareSubtitle, { color: theme.colors.text.secondary }]}>
              {map?.title}
            </Text>

            <View style={styles.shareOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.shareOption,
                  { backgroundColor: isNightMode ? 'rgba(255,215,0,0.1)' : 'rgba(102,126,234,0.1)' }
                ]}
                onPress={() => setIsSelectChatModalVisible(true)}
                disabled={isExporting}
              >
                <View style={[
                  styles.shareOptionIcon,
                  { backgroundColor: isNightMode ? 'rgba(255,215,0,0.2)' : 'rgba(102,126,234,0.2)' }
                ]}>
                  <MessageCircle size={24} color={isNightMode ? '#FFD700' : '#667EEA'} />
                </View>
                <Text style={[styles.shareOptionTitle, { color: theme.colors.text.primary }]}>
                  Share to Chat
                </Text>
                <Text style={[styles.shareOptionDesc, { color: theme.colors.text.secondary }]}>
                  Send to a calendar chat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.shareOption,
                  { backgroundColor: isNightMode ? 'rgba(0,255,127,0.1)' : 'rgba(76,175,80,0.1)' }
                ]}
                onPress={exportAsImage}
                disabled={isExporting}
              >
                <View style={[
                  styles.shareOptionIcon,
                  { backgroundColor: isNightMode ? 'rgba(0,255,127,0.2)' : 'rgba(76,175,80,0.2)' }
                ]}>
                  {isExporting && exportFormat === 'jpg' ? (
                    <Animated.View style={{ transform: [{ rotate: '45deg' }] }}>
                      <Download size={24} color={isNightMode ? '#00FF7F' : '#4CAF50'} />
                    </Animated.View>
                  ) : (
                    <FileImage size={24} color={isNightMode ? '#00FF7F' : '#4CAF50'} />
                  )}
                </View>
                <Text style={[styles.shareOptionTitle, { color: theme.colors.text.primary }]}>
                  {isExporting && exportFormat === 'jpg' ? 'Exporting...' : 'Export as Image'}
                </Text>
                <Text style={[styles.shareOptionDesc, { color: theme.colors.text.secondary }]}>
                  Save as text file with structure
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.shareOption,
                  { backgroundColor: isNightMode ? 'rgba(255,105,180,0.1)' : 'rgba(233,30,99,0.1)' }
                ]}
                onPress={exportAsPDF}
                disabled={isExporting}
              >
                <View style={[
                  styles.shareOptionIcon,
                  { backgroundColor: isNightMode ? 'rgba(255,105,180,0.2)' : 'rgba(233,30,99,0.2)' }
                ]}>
                  {isExporting && exportFormat === 'pdf' ? (
                    <Animated.View style={{ transform: [{ rotate: '45deg' }] }}>
                      <Download size={24} color={isNightMode ? '#FF69B4' : '#E91E63'} />
                    </Animated.View>
                  ) : (
                    <FileText size={24} color={isNightMode ? '#FF69B4' : '#E91E63'} />
                  )}
                </View>
                <Text style={[styles.shareOptionTitle, { color: theme.colors.text.primary }]}>
                  {isExporting && exportFormat === 'pdf' ? 'Exporting...' : 'Export as Document'}
                </Text>
                <Text style={[styles.shareOptionDesc, { color: theme.colors.text.secondary }]}>
                  Save as shareable document
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSelectChatModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSelectChatModalVisible(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={[
            styles.shareModalContent,
            { backgroundColor: isNightMode ? "#1E1E24" : "#FFFFFF", maxHeight: SCREEN_HEIGHT * 0.7 }
          ]}>
            <View style={styles.shareModalHeader}>
              <TouchableOpacity 
                onPress={() => setIsSelectChatModalVisible(false)}
                style={styles.shareBackButton}
              >
                <ArrowLeft size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.shareModalTitle, { color: theme.colors.text.primary, flex: 1, textAlign: 'center' }]}>
                Select Chat
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.chatListContainer} showsVerticalScrollIndicator={false}>
              {calendars.length === 0 ? (
                <View style={styles.emptyChatState}>
                  <MessageCircle size={48} color={theme.colors.text.secondary} />
                  <Text style={[styles.emptyChatText, { color: theme.colors.text.secondary }]}>
                    No chats available
                  </Text>
                </View>
              ) : (
                calendars.map((calendar) => (
                  <TouchableOpacity
                    key={calendar.id}
                    style={[
                      styles.chatItem,
                      { backgroundColor: isNightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
                    ]}
                    onPress={() => shareToChat(calendar.id)}
                    disabled={isExporting}
                  >
                    <View style={[styles.chatItemAvatar, { backgroundColor: calendar.color + '30' }]}>
                      <MessageCircle size={20} color={calendar.color} />
                    </View>
                    <View style={styles.chatItemInfo}>
                      <Text style={[styles.chatItemName, { color: theme.colors.text.primary }]}>
                        {calendar.name}
                      </Text>
                      <Text style={[styles.chatItemDesc, { color: theme.colors.text.secondary }]}>
                        {calendar.isShared ? `Shared with ${calendar.sharedWith.length} people` : 'Private chat'}
                      </Text>
                    </View>
                    {isExporting ? (
                      <View style={styles.chatItemCheck}>
                        <Download size={20} color={theme.colors.primary} />
                      </View>
                    ) : (
                      <View style={[styles.chatItemArrow, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Check size={16} color={theme.colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
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
        const smoothedDx = gestureState.dx * 0.4;
        const smoothedDy = gestureState.dy * 0.4;
        onDragRef.current(smoothedDx, smoothedDy);
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
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 16,
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
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  shareModalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  shareModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shareModalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  shareCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  shareBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  shareSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  shareOptionsContainer: {
    gap: 12,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  shareOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  shareOptionDesc: {
    fontSize: 12,
    position: 'absolute',
    bottom: 12,
    left: 78,
  },
  chatListContainer: {
    maxHeight: 400,
  },
  emptyChatState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyChatText: {
    fontSize: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  chatItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatItemInfo: {
    flex: 1,
    gap: 2,
  },
  chatItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatItemDesc: {
    fontSize: 12,
  },
  chatItemCheck: {
    padding: 8,
  },
  chatItemArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const MindMapSnapshot = React.memo(({ nodes, edges, theme, isNightMode, title }: {
  nodes: Node[];
  edges: Edge[];
  theme: any;
  isNightMode: boolean;
  title: string;
}) => {
  // Calculate bounding box including padding
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { x: 0, y: 0, width: 800, height: 600 };
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + (node.width || NODE_WIDTH));
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + (node.height || NODE_HEIGHT));
    });

    const padding = 100; // Generous padding
    const width = maxX - minX + (padding * 2);
    const height = maxY - minY + (padding * 2);

    return {
      x: minX - padding,
      y: minY - padding,
      width: Math.max(width, 800), // Minimum width
      height: Math.max(height, 600) // Minimum height
    };
  }, [nodes]);

  return (
    <View style={{
      width: bounds.width,
      height: bounds.height,
      backgroundColor: isNightMode ? '#0a0a0f' : '#ffffff',
    }}>
      <LinearGradient
        colors={isNightMode 
          ? ["#0a0a0f", "#1a0a1f", "#101015"] 
          : theme.gradients.background as any
        }
        style={StyleSheet.absoluteFill}
      />
      
      {/* Grid Pattern Background */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
         <Line x1="0" y1="0" x2={bounds.width} y2={bounds.height} stroke="transparent" />
         {/* Could add grid lines here if desired */}
      </Svg>

      <View style={{ flex: 1 }}>
        <Svg style={StyleSheet.absoluteFill}>
           {edges.map(edge => {
             const source = nodes.find(n => n.id === edge.sourceId);
             const target = nodes.find(n => n.id === edge.targetId);
             if (!source || !target) return null;

             const startX = source.x - bounds.x + (source.width || NODE_WIDTH) / 2;
             const startY = source.y - bounds.y + (source.height || NODE_HEIGHT) / 2;
             const endX = target.x - bounds.x + (target.width || NODE_WIDTH) / 2;
             const endY = target.y - bounds.y + (target.height || NODE_HEIGHT) / 2;

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
           <View
             key={node.id}
             style={{
               position: 'absolute',
               left: node.x - bounds.x,
               top: node.y - bounds.y,
               width: node.width || NODE_WIDTH,
               minHeight: node.height || NODE_HEIGHT,
               borderRadius: 16,
               backgroundColor: isNightMode ? '#1E1E24' : '#FFFFFF',
               shadowColor: node.color,
               shadowOffset: { width: 0, height: 4 },
               shadowOpacity: 0.5,
               shadowRadius: 8,
               elevation: 4,
             }}
           >
             {/* Replicating DraggableNode look but static */}
             <View style={{
               flex: 1,
               borderRadius: 16,
               borderWidth: 1,
               overflow: 'hidden',
               padding: 4,
               borderColor: node.color
             }}>
               <LinearGradient
                  colors={isNightMode 
                    ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0)'] 
                    : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0)']}
                  style={StyleSheet.absoluteFill}
               />
               <View style={{
                 height: 6,
                 width: '100%',
                 alignItems: 'center',
                 justifyContent: 'center',
                 marginBottom: 4,
                 borderBottomWidth: 1,
                 borderBottomColor: node.color + '40'
               }}>
                  <View style={{ width: 20, height: 3, borderRadius: 1.5, backgroundColor: node.color }} />
               </View>
               <Text style={{
                 textAlign: 'center',
                 fontSize: 14,
                 fontWeight: '600',
                 paddingHorizontal: 8,
                 paddingBottom: 8,
                 lineHeight: 20,
                 color: isNightMode ? "#FFF" : "#000"
               }}>
                 {node.text}
               </Text>
             </View>
           </View>
        ))}
      </View>

      {/* Header / Title */}
      <View style={{ position: 'absolute', top: 40, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '800', 
          color: theme.colors.text.primary,
          textShadowColor: isNightMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 4
        }}>
          {title}
        </Text>
      </View>

      {/* Footer / Watermark */}
      <View style={{ position: 'absolute', bottom: 30, right: 40, alignItems: 'flex-end' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary }} />
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: theme.colors.text.secondary,
            opacity: 0.8
          }}>
            Created with Rork
          </Text>
        </View>
      </View>
    </View>
  );
});

MindMapSnapshot.displayName = 'MindMapSnapshot';
