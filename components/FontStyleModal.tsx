import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Type, Bold, Italic, Palette } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface FontStyleModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStyle: (style: 'normal' | 'bold' | 'italic' | 'bold-italic') => void;
  onSelectColor: (color: string) => void;
  isNightMode: boolean;
  themeColor: string;
  currentStyle: 'normal' | 'bold' | 'italic' | 'bold-italic';
  currentColor: string;
}

const FONT_STYLES = [
  {
    id: 'normal' as const,
    name: 'Normal',
    icon: Type,
    preview: 'Hello, World!',
    fontWeight: '400',
    fontStyle: 'normal',
  },
  {
    id: 'bold' as const,
    name: 'Bold',
    icon: Bold,
    preview: 'Hello, World!',
    fontWeight: '700',
    fontStyle: 'normal',
  },
  {
    id: 'italic' as const,
    name: 'Italic',
    icon: Italic,
    preview: 'Hello, World!',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  {
    id: 'bold-italic' as const,
    name: 'Bold Italic',
    icon: Type,
    preview: 'Hello, World!',
    fontWeight: '700',
    fontStyle: 'italic',
  },
];

const TEXT_COLORS = [
  { id: 'black', color: '#000000', name: 'Black' },
  { id: 'white', color: '#FFFFFF', name: 'White' },
  { id: 'gray', color: '#666666', name: 'Gray' },
  { id: 'blue', color: '#2196F3', name: 'Blue' },
  { id: 'cyan', color: '#00BCD4', name: 'Cyan' },
  { id: 'teal', color: '#009688', name: 'Teal' },
  { id: 'green', color: '#4CAF50', name: 'Green' },
  { id: 'lime', color: '#CDDC39', name: 'Lime' },
  { id: 'yellow', color: '#FFEB3B', name: 'Yellow' },
  { id: 'amber', color: '#FFC107', name: 'Amber' },
  { id: 'orange', color: '#FF9800', name: 'Orange' },
  { id: 'red', color: '#F44336', name: 'Red' },
  { id: 'pink', color: '#E91E63', name: 'Pink' },
  { id: 'purple', color: '#9C27B0', name: 'Purple' },
  { id: 'indigo', color: '#3F51B5', name: 'Indigo' },
  { id: 'brown', color: '#795548', name: 'Brown' },
];

export default function FontStyleModal({
  visible,
  onClose,
  onSelectStyle,
  onSelectColor,
  isNightMode,
  themeColor,
  currentStyle,
  currentColor,
}: FontStyleModalProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'color'>('style');

  const handleStylePress = (styleId: 'normal' | 'bold' | 'italic' | 'bold-italic') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectStyle(styleId);
  };

  const handleColorPress = (color: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectColor(color);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
        
        {Platform.OS === 'web' ? (
          <View style={[
            styles.modalContent, 
            { backgroundColor: isNightMode ? '#1a1a1a' : '#ffffff' }
          ]}>
            <ModalInner 
              onClose={onClose}
              isNightMode={isNightMode}
              themeColor={themeColor}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              handleStylePress={handleStylePress}
              handleColorPress={handleColorPress}
              currentStyle={currentStyle}
              currentColor={currentColor}
            />
          </View>
        ) : (
          <BlurView
            intensity={isNightMode ? 40 : 60}
            tint={isNightMode ? 'dark' : 'light'}
            style={[styles.modalContent, styles.blurContent]}
          >
            <View style={[
              styles.modalBackground,
              { backgroundColor: isNightMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
            ]}>
              <ModalInner 
                onClose={onClose}
                isNightMode={isNightMode}
                themeColor={themeColor}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleStylePress={handleStylePress}
                handleColorPress={handleColorPress}
                currentStyle={currentStyle}
                currentColor={currentColor}
              />
            </View>
          </BlurView>
        )}
      </View>
    </Modal>
  );
}

interface ModalInnerProps {
  onClose: () => void;
  isNightMode: boolean;
  themeColor: string;
  activeTab: 'style' | 'color';
  setActiveTab: (tab: 'style' | 'color') => void;
  handleStylePress: (styleId: 'normal' | 'bold' | 'italic' | 'bold-italic') => void;
  handleColorPress: (color: string) => void;
  currentStyle: 'normal' | 'bold' | 'italic' | 'bold-italic';
  currentColor: string;
}

function ModalInner({ 
  onClose, 
  isNightMode, 
  themeColor, 
  activeTab, 
  setActiveTab,
  handleStylePress,
  handleColorPress,
  currentStyle,
  currentColor,
}: ModalInnerProps) {
  return (
    <>
      <View style={styles.header}>
        <Text style={[
          styles.title, 
          { color: isNightMode ? '#fff' : '#000' }
        ]}>
          Text Formatting
        </Text>
        <TouchableOpacity 
          onPress={onClose}
          style={[
            styles.closeButton,
            { backgroundColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
        >
          <X size={20} color={isNightMode ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'style' && [styles.activeTab, { backgroundColor: themeColor }],
            !activeTab && { backgroundColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
            setActiveTab('style');
          }}
        >
          <Type size={20} color={activeTab === 'style' ? '#fff' : (isNightMode ? '#aaa' : '#666')} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'style' ? '#fff' : (isNightMode ? '#aaa' : '#666') }
          ]}>
            Font Style
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'color' && [styles.activeTab, { backgroundColor: themeColor }],
            !activeTab && { backgroundColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
            setActiveTab('color');
          }}
        >
          <Palette size={20} color={activeTab === 'color' ? '#fff' : (isNightMode ? '#aaa' : '#666')} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'color' ? '#fff' : (isNightMode ? '#aaa' : '#666') }
          ]}>
            Text Color
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === 'style' ? (
          <View style={styles.stylesGrid}>
            {FONT_STYLES.map((style) => {
              const Icon = style.icon;
              const isSelected = currentStyle === style.id;
              return (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleCard,
                    { 
                      backgroundColor: isNightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      borderWidth: 2,
                      borderColor: isSelected ? themeColor : 'transparent',
                    }
                  ]}
                  onPress={() => handleStylePress(style.id)}
                >
                  <View style={[
                    styles.styleIconContainer,
                    { backgroundColor: isSelected ? `${themeColor}20` : (isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }
                  ]}>
                    <Icon size={24} color={isSelected ? themeColor : (isNightMode ? '#aaa' : '#666')} />
                  </View>
                  <Text style={[
                    styles.styleName,
                    { color: isNightMode ? '#fff' : '#000' }
                  ]}>
                    {style.name}
                  </Text>
                  <Text style={[
                    styles.stylePreview,
                    { 
                      color: isNightMode ? '#aaa' : '#666',
                      fontWeight: style.fontWeight as any,
                      fontStyle: style.fontStyle as any,
                    }
                  ]}>
                    {style.preview}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.colorsGrid}>
            {TEXT_COLORS.map((colorItem) => {
              const isSelected = currentColor === colorItem.color;
              return (
                <TouchableOpacity
                  key={colorItem.id}
                  style={[
                    styles.colorCard,
                    { 
                      backgroundColor: isNightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      borderWidth: 2,
                      borderColor: isSelected ? themeColor : 'transparent',
                    }
                  ]}
                  onPress={() => handleColorPress(colorItem.color)}
                >
                  <View style={[
                    styles.colorCircle,
                    { 
                      backgroundColor: colorItem.color,
                      borderWidth: colorItem.color === '#FFFFFF' ? 1 : 0,
                      borderColor: '#ddd',
                    }
                  ]}>
                    {isSelected && (
                      <View style={styles.selectedCheck}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.colorName,
                    { color: isNightMode ? '#fff' : '#000' }
                  ]}>
                    {colorItem.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[
        styles.footer,
        { 
          backgroundColor: isNightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderTopWidth: 1,
          borderTopColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }
      ]}>
        <Text style={[
          styles.previewLabel,
          { color: isNightMode ? '#aaa' : '#666' }
        ]}>
          Preview:
        </Text>
        <Text style={[
          styles.previewText,
          { 
            color: currentColor,
            fontWeight: currentStyle.includes('bold') ? '700' : '400',
            fontStyle: currentStyle.includes('italic') ? 'italic' : 'normal',
          }
        ]}>
          This is how your text will look
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '65%',
    overflow: 'hidden',
  },
  blurContent: {
  },
  modalBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  activeTab: {
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  styleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleName: {
    fontSize: 15,
    fontWeight: '600',
  },
  stylePreview: {
    fontSize: 13,
    textAlign: 'center',
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCard: {
    width: '22%',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 24,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  colorName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    gap: 8,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewText: {
    fontSize: 17,
    lineHeight: 24,
  },
});
