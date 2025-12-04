import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface EmojiPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  isNightMode: boolean;
  themeColor: string;
}

interface EmojiCategory {
  id: string;
  name: string;
  emojis: string[];
}

const BASE_EMOJI_CATEGORIES = [
  {
    id: 'expressive',
    name: 'Expressive',
    emojis: ['🤯', '🤩', '🥳', '🫠', '🫣', '🫡', '🥹', '🤪', '😇', '🤫', '🫢', '🥱', '🤐', '🤨', '🧐', '😒', '🙄', '😮‍💨', '😤', '🤬', '🤡', '👻', '👽', '🤖', '💩']
  },
  {
    id: 'love',
    name: 'Love & Hearts',
    emojis: ['🥰', '😍', '😘', '😻', '🤍', '🤎', '💜', '💙', '💚', '💛', '🧡', '❤️', '❤️‍🔥', '❤️‍🩹', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔']
  },
  {
    id: 'hands',
    name: 'Hands',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '👍', '👎']
  },
  {
    id: 'nature',
    name: 'Nature & Magic',
    emojis: ['✨', '⭐️', '🌟', '💫', '⚡️', '🌙', '🌚', '🌝', '☀️', '🌈', '☁️', '❄️', '🔥', '💧', '🌊', '🍄', '🌺', '🌸', '🌼', '🌻', '🌞', '🪐', '🌍', '☄️', '🔮']
  },
  {
    id: 'animals',
    name: 'Creatures',
    emojis: ['🦄', '🦋', '🦕', '🦖', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛']
  },
  {
    id: 'food',
    name: 'Food & Drink',
    emojis: ['🥑', '🥥', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥐', '🥯', '🍞', '🥖', '🥨']
  },
  {
    id: 'activities',
    name: 'Activities',
    emojis: ['🎨', '🎭', '🎪', '🎟️', '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒']
  }
];

const HOLIDAY_EMOJIS: Record<string, { name: string; emojis: string[] }> = {
  'new-year': {
    name: '🎊 New Year',
    emojis: ['🎉', '🎊', '🥂', '🍾', '🎆', '🎇', '✨', '💫', '⭐', '🌟', '🎈', '🎀', '🎁', '🥳', '🤩', '😍', '🎶', '🎵', '🕛', '🕐', '⏰', '📆', '🗓️', '🎭', '🪅']
  },
  'valentines': {
    name: '💝 Valentine\'s Day',
    emojis: ['❤️', '💕', '💖', '💗', '💓', '💞', '💝', '💘', '💌', '💋', '😍', '🥰', '😘', '🌹', '🌷', '💐', '🎀', '🍫', '🍬', '🍭', '🧁', '🎂', '🍰', '💒', '💑']
  },
  'st-patricks': {
    name: '☘️ St. Patrick\'s',
    emojis: ['☘️', '🍀', '💚', '🌈', '🎩', '🍺', '🍻', '🎶', '🎵', '🎸', '🪘', '🎭', '🇮🇪', '🏰', '🌟', '✨', '💚', '💛', '🧡', '🤍', '🦄', '🌿', '🍃', '🌱', '🪴']
  },
  'easter': {
    name: '🐰 Easter',
    emojis: ['🐰', '🐇', '🥚', '🐣', '🐥', '🐤', '🌷', '🌸', '🌺', '🌼', '🌻', '🌹', '💐', '🌈', '☀️', '🌞', '🍫', '🍬', '🍭', '🎀', '🎁', '🧺', '🪺', '🦋', '🌱']
  },
  'earth-day': {
    name: '🌍 Earth Day',
    emojis: ['🌍', '🌎', '🌏', '🌱', '🌿', '🍃', '🌳', '🌲', '🌴', '🌵', '🌾', '🪴', '🌻', '🌺', '🌸', '🌼', '💚', '💙', '♻️', '🔋', '⚡', '☀️', '💧', '🌊', '🐝']
  },
  'mothers-day': {
    name: '👩 Mother\'s Day',
    emojis: ['👩', '💐', '🌹', '🌷', '🌸', '🌺', '🌼', '💕', '❤️', '💖', '💗', '💝', '💞', '🤱', '🤰', '👶', '💌', '🎁', '🎀', '🧁', '🍰', '🎂', '☕', '🫖', '✨']
  },
  'memorial-day': {
    name: '🇺🇸 Memorial Day',
    emojis: ['🇺🇸', '🎖️', '🏅', '⭐', '🌟', '💙', '❤️', '🤍', '🎗️', '🕊️', '🦅', '🗽', '🎆', '🎇', '🎉', '🎊', '🌹', '💐', '🙏', '🕯️', '🏛️', '⚓', '✈️', '🚢', '🪖']
  },
  'fathers-day': {
    name: '👨 Father\'s Day',
    emojis: ['👨', '👔', '🎩', '👞', '⌚', '🕶️', '🎁', '🎀', '🏆', '🥇', '⚽', '🏀', '🏈', '⚾', '🎾', '🏌️', '🎣', '🛠️', '🔧', '💙', '💚', '🧡', '❤️', '🤎', '💪']
  },
  'independence-day': {
    name: '🎆 Independence Day',
    emojis: ['🇺🇸', '🎆', '🎇', '🎉', '🎊', '🎈', '🎀', '🎁', '🗽', '🦅', '⭐', '🌟', '✨', '💥', '🔥', '🎯', '🎪', '🎭', '💙', '❤️', '🤍', '🍔', '🌭', '🍖', '🍉']
  },
  'halloween': {
    name: '🎃 Halloween',
    emojis: ['🎃', '👻', '🦇', '🕷️', '🕸️', '💀', '☠️', '🧙', '🧛', '🧟', '🤡', '👹', '👺', '😈', '👿', '🌙', '🌚', '🦉', '🐈‍⬛', '🕯️', '🔮', '⚰️', '🪦', '🍬', '🍭']
  },
  'thanksgiving': {
    name: '🦃 Thanksgiving',
    emojis: ['🦃', '🍂', '🍁', '🌰', '🥧', '🍰', '🥐', '🥖', '🍞', '🌽', '🥔', '🥕', '🎃', '🍊', '🍎', '🍏', '🍇', '🍷', '🥂', '🍴', '🔥', '🕯️', '🙏', '❤️', '🧡']
  },
  'hanukkah': {
    name: '🕎 Hanukkah',
    emojis: ['🕎', '🕯️', '✡️', '💙', '🤍', '⭐', '🌟', '✨', '💫', '🎁', '🎀', '🎉', '🎊', '🥖', '🥯', '🍩', '🫓', '🧈', '🍯', '🕊️', '🌈', '💜', '🎵', '🎶', '🪔']
  },
  'christmas': {
    name: '🎄 Christmas',
    emojis: ['🎄', '🎅', '🤶', '🎁', '🎀', '⭐', '✨', '🌟', '❄️', '☃️', '⛄', '🔔', '🕯️', '🦌', '🛷', '🎶', '🎵', '🎉', '🎊', '🍪', '🥛', '🧁', '🍰', '🎂', '💚']
  },
  'kwanzaa': {
    name: '🕯️ Kwanzaa',
    emojis: ['🕯️', '💚', '❤️', '🖤', '🌽', '🥁', '🪘', '🎵', '🎶', '🎨', '🖼️', '🎭', '📚', '✊', '👨‍👩‍👧‍👦', '🤝', '💪', '🌍', '🌎', '🌏', '⭐', '✨', '🎉', '🎊', '🎁']
  },
  'lunar-new-year': {
    name: '🧧 Lunar New Year',
    emojis: ['🧧', '🐉', '🐲', '🏮', '🎆', '🎇', '🎉', '🎊', '🥟', '🥠', '🍊', '🍋', '🍜', '🍲', '🥢', '🎋', '🎍', '🌸', '🌺', '💮', '💴', '💰', '🪙', '🐼', '🎭']
  },
};

function getCurrentHoliday(): string | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 1 && day <= 7) return 'new-year';
  if (month === 2 && day >= 1 && day <= 20) return 'lunar-new-year';
  if (month === 2 && day >= 10 && day <= 14) return 'valentines';
  if (month === 3 && day >= 14 && day <= 17) return 'st-patricks';
  if (month === 3 && day >= 20 || (month === 4 && day <= 25)) return 'easter';
  if (month === 4 && day >= 20 && day <= 22) return 'earth-day';
  if (month === 5 && day >= 8 && day <= 14) return 'mothers-day';
  if (month === 5 && day >= 26 && day <= 31) return 'memorial-day';
  if (month === 6 && day >= 15 && day <= 21) return 'fathers-day';
  if (month === 7 && day >= 1 && day <= 7) return 'independence-day';
  if (month === 10 && day >= 25 || (month === 10 && day <= 31)) return 'halloween';
  if (month === 11 && day >= 21 && day <= 28) return 'thanksgiving';
  if (month === 12 && day >= 1 && day <= 9) return 'hanukkah';
  if (month === 12 && day >= 18 && day <= 26) return 'christmas';
  if (month === 12 && day >= 26 || (month === 1 && day === 1)) return 'kwanzaa';
  
  return null;
}

function getEmojiCategories() {
  const holiday = getCurrentHoliday();
  
  if (holiday && HOLIDAY_EMOJIS[holiday]) {
    return [
      {
        id: 'holiday',
        name: HOLIDAY_EMOJIS[holiday].name,
        emojis: HOLIDAY_EMOJIS[holiday].emojis
      },
      ...BASE_EMOJI_CATEGORIES
    ];
  }
  
  return BASE_EMOJI_CATEGORIES;
}

const { width } = Dimensions.get('window');
const EMOJI_SIZE = 40;
const NUM_COLUMNS = Math.floor((width - 40) / EMOJI_SIZE);

export default function EmojiPickerModal({
  visible,
  onClose,
  onSelectEmoji,
  isNightMode,
  themeColor,
}: EmojiPickerModalProps) {
  const EMOJI_CATEGORIES = getEmojiCategories();
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].id);

  const handleEmojiPress = (emoji: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectEmoji(emoji);
  };

  const renderEmoji = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.emojiItem}
      onPress={() => handleEmojiPress(item)}
    >
      <Text style={styles.emojiText}>{item}</Text>
    </TouchableOpacity>
  );

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
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              renderEmoji={renderEmoji}
              emojiCategories={EMOJI_CATEGORIES}
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
              { backgroundColor: isNightMode ? 'rgba(20, 20, 20, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
            ]}>
              <ModalInner 
                onClose={onClose}
                isNightMode={isNightMode}
                themeColor={themeColor}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                renderEmoji={renderEmoji}
                emojiCategories={EMOJI_CATEGORIES}
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
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  renderEmoji: ({ item }: { item: string }) => React.ReactElement;
  emojiCategories: EmojiCategory[];
}

function ModalInner({ 
  onClose, 
  isNightMode, 
  themeColor, 
  activeCategory, 
  setActiveCategory,
  renderEmoji,
  emojiCategories
}: ModalInnerProps) {
  const EMOJI_CATEGORIES = emojiCategories;
  return (
    <>
      <View style={styles.header}>
        <Text style={[
          styles.title, 
          { color: isNightMode ? '#fff' : '#000' }
        ]}>
          Choose Emoji
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

      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {EMOJI_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                activeCategory === category.id && { backgroundColor: themeColor },
                !activeCategory && { backgroundColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                setActiveCategory(category.id);
              }}
            >
              <Text style={[
                styles.categoryText,
                { color: activeCategory === category.id ? '#fff' : (isNightMode ? '#aaa' : '#666') }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={EMOJI_CATEGORIES.find(c => c.id === activeCategory)?.emojis || []}
        renderItem={renderEmoji}
        keyExtractor={(item, index) => `${activeCategory}-${index}`}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.emojiList}
        showsVerticalScrollIndicator={false}
      />
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
    height: '50%',
    overflow: 'hidden',
  },
  blurContent: {
    // Extra styles for blur view if needed
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
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  categoryContainer: {
    height: 50,
    marginBottom: 10,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emojiList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emojiItem: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    margin: (width - 40 - (NUM_COLUMNS * EMOJI_SIZE)) / (NUM_COLUMNS * 2),
  },
  emojiText: {
    fontSize: 28,
  },
});
