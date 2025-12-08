import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Platform,
  Alert,
  Dimensions,
  Easing
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, 
  Brain, 
  ArrowLeft, 
  Trash2, 
  Calendar,
  Sparkles,
  Search,
  X
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useMindMap, MindMap } from '@/contexts/MindMapContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import KeyboardDismissButton from '@/components/KeyboardDismissButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
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

const MindMapCard = React.memo(({ map, onPress, onDelete, index }: { 
  map: MindMap; 
  onPress: () => void; 
  onDelete: () => void;
  index: number;
}) => {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
        delay: index * 100,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, [scaleAnim, opacityAnim, index]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim, marginBottom: 16 }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          styles.card,
          {
            backgroundColor: isNightMode ? "rgba(30, 30, 40, 0.6)" : "rgba(255, 255, 255, 0.8)",
            // Enhanced border for sophistication
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(0, 0, 0, 0.08)",
            borderWidth: 1,
          }
        ]}
      >
        <LinearGradient
          colors={isNightMode 
            ? ["rgba(255, 215, 0, 0.08)", "rgba(255, 215, 0, 0.02)"] 
            : ["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.7)"]
          }
          style={styles.cardGradient}
        >
          {/* Subtle Glow Background */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isNightMode ? '#FFD700' : theme.colors.primary, opacity: 0.03, zIndex: -1 }]} />
          
          <View style={styles.cardHeader}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : theme.colors.primary + "20" }
            ]}>
              <Brain size={24} color={isNightMode ? "#FFD700" : theme.colors.primary} />
            </View>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                Alert.alert(
                  translate('mindMap.deleteMindMap'),
                  translate('mindMap.deleteMapConfirmation'),
                  [
                    { text: translate('common.cancel'), style: "cancel" },
                    { text: translate('mindMap.delete'), style: "destructive", onPress: onDelete }
                  ]
                );
              }}
              style={styles.deleteButton}
            >
              <Trash2 size={18} color={isNightMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
              {map.title}
            </Text>
            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <Calendar size={12} color={theme.colors.text.secondary} />
                <Text style={[styles.dateText, { color: theme.colors.text.secondary }]}>
                  {formatDate(map.updatedAt)}
                </Text>
              </View>
              <View style={styles.footerItem}>
                <View style={[styles.nodeCountBadge, { backgroundColor: theme.colors.primary + "15" }]}>
                  <Text style={[styles.nodeCountText, { color: theme.colors.primary }]}>
                    {map.nodes.length} {translate('mindMap.nodes')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

MindMapCard.displayName = 'MindMapCard';

export default function MindMappingList() {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';
  const insets = useSafeAreaInsets();
  const { mindMaps, createMindMap, deleteMindMap } = useMindMap();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredMaps = mindMaps.filter(map => 
    map.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newMapTitle.trim()) return;
    
    setIsCreating(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const id = await createMindMap(newMapTitle.trim());
      setNewMapTitle("");
      setIsModalVisible(false);
      router.push(`/mind-mapping/${id}` as any);
    } catch {
      Alert.alert(translate('mindMap.error'), translate('mindMap.failedToCreateMindMap'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isNightMode 
          ? ["#0a0a0f", "#1a0a1f", "#2a0a2f"] 
          : theme.gradients.background as any
        }
        style={styles.gradient}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color={theme.colors.text.primary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {translate('mindMap.title')}
          </Text>
          <View style={{ width: 40 }} /> 
        </View>

        <BackgroundGlitter />

        <View style={styles.searchContainer}>
          <View style={[
            styles.searchBar,
            { 
              backgroundColor: isNightMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
              borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
            }
          ]}>
            <Search size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder={translate('mindMap.searchYourThoughts')}
              placeholderTextColor={theme.colors.text.light}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {filteredMaps.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[
                styles.emptyIconContainer,
                { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "rgba(0, 0, 0, 0.05)" }
              ]}>
                <Sparkles size={48} color={theme.colors.text.secondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                {translate('mindMap.noMindMapsYet')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
                {translate('mindMap.startVisualizingIdeas')}
              </Text>
            </View>
          ) : (
            filteredMaps.map((map, index) => (
              <MindMapCard 
                key={map.id} 
                map={map} 
                index={index}
                onPress={() => router.push(`/mind-mapping/${map.id}` as any)}
                onDelete={() => deleteMindMap(map.id)}
              />
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setIsModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradients.primary as any}
            style={styles.fabGradient}
          >
            <Plus color="#FFFFFF" size={28} />
          </LinearGradient>
        </TouchableOpacity>

        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.modalContent,
              { backgroundColor: isNightMode ? "#1E1E24" : "#FFFFFF" }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                  {translate('mindMap.newMindMap')}
                </Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.modalLabel, { color: theme.colors.text.secondary }]}>
                {translate('mindMap.whatsOnYourMind')}
              </Text>
              
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    backgroundColor: isNightMode ? "rgba(255, 255, 255, 0.05)" : "#F5F5F5",
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border
                  }
                ]}
                placeholder={translate('mindMap.mapNamePlaceholder')}
                placeholderTextColor={theme.colors.text.light}
                value={newMapTitle}
                onChangeText={setNewMapTitle}
                autoFocus
              />

              <View style={styles.modalActions}>
                <KeyboardDismissButton isDark={isNightMode} />
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={handleCreate}
                  disabled={!newMapTitle.trim() || isCreating}
                >
                  <LinearGradient
                    colors={!newMapTitle.trim() ? ["#ccc", "#999"] : theme.gradients.primary as any}
                    style={styles.createButtonGradient}
                  >
                    <Text style={styles.createButtonText}>
                      {isCreating ? translate('mindMap.creating') : translate('mindMap.createMindMap')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  cardContent: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  nodeCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nodeCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
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
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    flex: 1,
    marginLeft: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
