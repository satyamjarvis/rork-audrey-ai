import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { ChatTheme, ChatThemeType } from '@/contexts/ChatContext';
import ChatBackground from './ChatBackground';
import * as Haptics from 'expo-haptics';
import { getThemesByType } from '@/constants/chatBackgrounds';

const { width } = Dimensions.get('window');

interface ChatThemeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTheme: (theme: ChatTheme) => void;
  currentThemeId: string;
  isNightMode: boolean;
}



const TABS: { id: ChatThemeType; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'animated', label: 'Animated' },
];

export default function ChatThemeModal({
  visible,
  onClose,
  onSelectTheme,
  currentThemeId,
  isNightMode,
}: ChatThemeModalProps) {
  const [activeTab, setActiveTab] = useState<ChatThemeType>('gradient');

  const filteredThemes = getThemesByType(activeTab);

  const handleSelect = (theme: ChatTheme) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onSelectTheme(theme);
    onClose();
  };

  const renderThemeItem = ({ item }: { item: ChatTheme }) => {
    const isSelected = item.id === currentThemeId;
    return (
      <TouchableOpacity
        style={styles.themeItem}
        onPress={() => handleSelect(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.previewContainer, isSelected && styles.selectedPreview]}>
          <View style={styles.previewContent}>
            <ChatBackground theme={item}>
              {/* Fake message bubbles for preview */}
              <View style={styles.fakeMessageContainer}>
                <View style={[styles.fakeMessage, styles.fakeMessageLeft]} />
                <View style={[styles.fakeMessage, styles.fakeMessageRight]} />
              </View>
            </ChatBackground>
          </View>
          {isSelected && (
            <View style={styles.checkBadge}>
              <Check color="#FFFFFF" size={14} strokeWidth={3} />
            </View>
          )}
        </View>
        <Text style={[styles.themeName, { color: isNightMode ? '#FFF' : '#000' }]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container, 
          { backgroundColor: isNightMode ? '#1a1a1a' : '#FFFFFF' }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isNightMode ? '#FFF' : '#000' }]}>
              Chat Theme
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={isNightMode ? '#FFF' : '#000'} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab,
                  activeTab === tab.id && { borderBottomColor: isNightMode ? '#FFD700' : '#000' }
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveTab(tab.id);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isNightMode ? '#FFF' : '#000' },
                    activeTab === tab.id && styles.activeTabText
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filteredThemes}
            renderItem={renderThemeItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  tab: {
    marginRight: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    // borderBottomColor set dynamically
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.6,
  },
  activeTabText: {
    fontWeight: '700',
    opacity: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  themeItem: {
    width: (width - 45) / 2,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectedPreview: {
    borderColor: '#FFD700',
  },
  previewContent: {
    flex: 1,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fakeMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 10,
    gap: 8,
  },
  fakeMessage: {
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  fakeMessageLeft: {
    width: '60%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'flex-start',
  },
  fakeMessageRight: {
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignSelf: 'flex-end',
  },
});
