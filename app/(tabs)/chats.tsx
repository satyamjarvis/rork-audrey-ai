import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MessageCircle,
  Lock,
  Bell,
  BellOff,
  Shield,
  ChevronRight,
  Calendar,
} from "lucide-react-native";
import { router, Stack } from "expo-router";
import * as Haptics from "expo-haptics";

import { useChat } from "@/contexts/ChatContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { getCalendarBackground } from '@/constants/calendarBackgrounds';
import { Image } from 'expo-image';
import { useTheme } from "@/contexts/ThemeContext";
import { useFontSize } from "@/contexts/FontSizeContext";
import AppBackgroundWrapper from "@/components/AppBackgroundWrapper";
import { useAppBackground } from "@/contexts/AppBackgroundContext";
import { useLanguage } from "@/contexts/LanguageContext";

const { width } = Dimensions.get("window");

type ChatItemData = {
  id: string;
  name: string;
  color: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: number;
  hasNotifications: boolean;
  memberCount: number;
  isEncrypted: boolean;
  sharedWith: string[];
};

export default function ChatsListScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { getFontSize } = useFontSize();
  const { getMessagesForCalendar, getDecryptedMessage } = useChat();
  const { calendars, selectedBackground } = useCalendar();
  const { hasCustomBackground } = useAppBackground();
  const { translations } = useLanguage();
  
  const [chatNotifications, setChatNotifications] = useState<{[key: string]: boolean}>({});
  const [lastMessagePreviews, setLastMessagePreviews] = useState<{[key: string]: string}>({});
  const [loadingPreviews, setLoadingPreviews] = useState<boolean>(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const isNightMode = theme.id === "night-mode" || theme.id === "night";

  const activeBackground = useMemo(() => {
    if (selectedBackground && selectedBackground !== 'default') {
      return getCalendarBackground(selectedBackground);
    }
    return null;
  }, [selectedBackground]);

  const shouldShowAppBackground = hasCustomBackground && !activeBackground;

  const glitterParticles = useMemo(() => {
    return Array.from({ length: 40 }, () => {
      const spreadX = (Math.random() - 0.5) * width;
      const spreadY = Math.random() * 800;
      return {
        x: spreadX,
        y: spreadY,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 3000,
        duration: Math.random() * 4000 + 3000,
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(0),
        scale: new Animated.Value(0),
      };
    });
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    glitterParticles.forEach((particle) => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: isNightMode ? Math.random() * 0.4 + 0.3 : Math.random() * 0.5 + 0.4,
              duration: 1500,
              delay: particle.delay,
              useNativeDriver: true,
            }),
            Animated.spring(particle.scale, {
              toValue: 1,
              tension: 20,
              friction: 7,
              delay: particle.delay,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: Math.random() * 150 - 75,
              duration: particle.duration,
              delay: particle.delay,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  }, [fadeAnim, slideAnim, shimmerAnim, glitterParticles, isNightMode]);

  useEffect(() => {
    const loadLastMessagePreviews = async () => {
      setLoadingPreviews(true);
      const previews: {[key: string]: string} = {};
      
      for (const cal of calendars) {
        const calMessages = getMessagesForCalendar(cal.id);
        const lastMessage = calMessages[calMessages.length - 1];
        
        if (lastMessage) {
          if (lastMessage.encrypted && lastMessage.encryptedData) {
            try {
              const decrypted = await getDecryptedMessage(lastMessage);
              if (decrypted.includes("🎤VOICE_MSG🎤")) {
                previews[cal.id] = `🎤 ${translations.chat.voiceMessage}`;
              } else {
                const truncated = decrypted.length > 45 
                  ? decrypted.substring(0, 45) + "..." 
                  : decrypted;
                previews[cal.id] = truncated;
              }
            } catch (error) {
              console.error("Error decrypting preview:", error);
              previews[cal.id] = `🔒 ${translations.chat.encryptedMessage}`;
            }
          } else {
            const text = lastMessage.text || `📎 ${translations.chat.attachment}`;
            previews[cal.id] = text.length > 45 ? text.substring(0, 45) + "..." : text;
          }
        }
      }
      
      setLastMessagePreviews(previews);
      setLoadingPreviews(false);
    };
    
    loadLastMessagePreviews();
  }, [calendars, getMessagesForCalendar, getDecryptedMessage, translations.chat]);

  const toggleNotifications = useCallback((chatId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setChatNotifications(prev => ({
      ...prev,
      [chatId]: !prev[chatId]
    }));
  }, []);

  const chatsWithMessages: ChatItemData[] = useMemo(() => {
    return calendars.map(cal => {
      const calMessages = getMessagesForCalendar(cal.id);
      const lastMessage = calMessages[calMessages.length - 1];
      const unreadCount = calMessages.filter(m => m.senderEmail !== "me").length;
      
      return {
        id: cal.id,
        name: cal.name,
        color: cal.color,
        lastMessage: lastMessagePreviews[cal.id],
        lastMessageTime: lastMessage?.timestamp,
        unreadCount: Math.min(unreadCount, 99),
        hasNotifications: chatNotifications[cal.id] !== false,
        memberCount: cal.sharedWith.length + 1,
        isEncrypted: true,
        sharedWith: cal.sharedWith,
      };
    }).sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
  }, [calendars, getMessagesForCalendar, lastMessagePreviews, chatNotifications]);

  const shimmerInterpolate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleChatPress = useCallback((chatId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/calendar-chat?calendarId=${chatId}`);
  }, []);

  const formatTime = useCallback((timestamp?: number) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? translations.chat.justNow : `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      return days === 1 ? translations.chat.yesterday : `${days}d`;
    }
  }, [translations.chat.justNow, translations.chat.yesterday]);

  const renderChatContent = useCallback((item: ChatItemData) => (
    <View style={styles.chatItemContent}>
      <View style={[styles.colorIndicator, { backgroundColor: item.color }]}>
        <View style={styles.colorGlow} />
      </View>

      <View style={styles.chatMainContent}>
        <View style={styles.chatTopRow}>
          <View style={styles.chatLeftSection}>
            <View style={styles.nameRow}>
              <Text 
                style={[
                  styles.chatName, 
                  { 
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                    fontSize: getFontSize(17),
                  }
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.isEncrypted && (
                <View style={styles.lockBadge}>
                  <Lock 
                    color={isNightMode ? "#C0C0C0" : theme.colors.primary} 
                    size={12} 
                    strokeWidth={2.5} 
                  />
                </View>
              )}
            </View>
            
            <View style={styles.metaRow}>
              <Calendar 
                color={isNightMode ? "#888888" : theme.colors.text.light} 
                size={12} 
                strokeWidth={2} 
              />
              <Text 
                style={[
                  styles.memberCount, 
                  { 
                    color: isNightMode ? "#888888" : theme.colors.text.light,
                    fontSize: getFontSize(12),
                  }
                ]}
              >
                {translations.chat.sharedCalendar}
              </Text>
            </View>
          </View>

          <View style={styles.chatRightSection}>
            {item.lastMessageTime && (
              <Text 
                style={[
                  styles.timeText, 
                  { 
                    color: isNightMode ? "#999999" : theme.colors.text.light,
                    fontSize: getFontSize(11),
                  }
                ]}
              >
                {formatTime(item.lastMessageTime)}
              </Text>
            )}
            <View style={styles.badgesRow}>
              {item.unreadCount > 0 && (
                <View 
                  style={[
                    styles.unreadBadge, 
                    { backgroundColor: isNightMode ? "#FF1493" : theme.colors.primary }
                  ]}
                >
                  <Text style={[styles.unreadText, { fontSize: getFontSize(11) }]}>
                    {item.unreadCount}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  toggleNotifications(item.id);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.notificationButton}
              >
                {item.hasNotifications ? (
                  <Bell 
                    color={isNightMode ? "#FF1493" : theme.colors.primary} 
                    size={18} 
                    strokeWidth={2} 
                  />
                ) : (
                  <BellOff 
                    color={isNightMode ? "#555555" : theme.colors.text.light} 
                    size={18} 
                    strokeWidth={2} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {item.lastMessage && (
          <Text 
            style={[
              styles.lastMessage, 
              { 
                color: isNightMode ? "#AAAAAA" : theme.colors.text.secondary,
                fontSize: getFontSize(14),
              }
            ]} 
            numberOfLines={2}
          >
            {loadingPreviews ? translations.chat.loading : item.lastMessage}
          </Text>
        )}
      </View>

      <View style={styles.chevronContainer}>
        <ChevronRight 
          color={isNightMode ? "#666666" : theme.colors.text.light} 
          size={20} 
          strokeWidth={2} 
        />
      </View>
    </View>
  ), [isNightMode, theme.colors, getFontSize, formatTime, loadingPreviews, toggleNotifications, translations.chat]);

  const renderChatItem = useCallback(({ item, index }: { item: ChatItemData; index: number }) => {
    const cardAnim = new Animated.Value(0);
    
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 50,
      useNativeDriver: true,
    }).start();

    return (
      <Animated.View
        style={[
          styles.chatItemWrapper,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => handleChatPress(item.id)}
          activeOpacity={0.8}
        >
          {Platform.OS === "web" ? (
            <View style={[
              styles.chatItemBackground,
              {
                backgroundColor: isNightMode 
                  ? "rgba(20, 10, 30, 0.85)" 
                  : "rgba(255, 255, 255, 0.95)",
              }
            ]}>
              {renderChatContent(item)}
            </View>
          ) : (
            <BlurView 
              intensity={isNightMode ? 30 : 40} 
              tint={isNightMode ? "dark" : "light"} 
              style={styles.chatItemBackground}
            >
              {renderChatContent(item)}
            </BlurView>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [isNightMode, handleChatPress, renderChatContent]);

  const renderContent = () => (
    <LinearGradient 
        colors={
          isNightMode 
            ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"]
            : theme.gradients.background as any
        } 
        style={styles.gradient}
      >
        <View style={styles.glitterContainer}>
          {glitterParticles.map((particle, index) => (
            <Animated.View
              key={index}
              style={[
                styles.glitterDot,
                {
                  width: particle.size,
                  height: particle.size,
                  left: particle.x + width / 2,
                  top: particle.y,
                  backgroundColor: isNightMode ? "#C0C0C0" : "#FFD700",
                  opacity: particle.opacity,
                  transform: [
                    { scale: particle.scale },
                    { translateY: particle.translateY },
                  ],
                },
              ]}
            />
          ))}
        </View>

        <Animated.View 
          style={[
            styles.header, 
            { 
              paddingTop: insets.top + 24,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Animated.View style={{ transform: [{ rotate: shimmerInterpolate }] }}>
                <MessageCircle 
                  color={isNightMode ? "#FFD700" : theme.colors.primary} 
                  size={36} 
                  strokeWidth={2.5} 
                />
              </Animated.View>
              <View>
                <Text 
                  style={[
                    styles.headerTitle, 
                    { 
                      color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                      fontSize: getFontSize(34),
                    }
                  ]}
                >
                  {translations.chat.messages}
                </Text>
                <Text 
                  style={[
                    styles.headerSubtitle, 
                    { 
                      color: isNightMode ? "#FF1493" : theme.colors.text.secondary,
                      fontSize: getFontSize(13),
                    }
                  ]}
                >
                  {chatsWithMessages.length} {chatsWithMessages.length === 1 ? translations.chat.conversation : translations.chat.conversations}
                </Text>
              </View>
            </View>
            
            <View 
              style={[
                styles.encryptionBadge,
                {
                  backgroundColor: isNightMode 
                    ? "rgba(192, 192, 192, 0.15)" 
                    : "rgba(107, 155, 209, 0.12)",
                  borderColor: isNightMode 
                    ? "rgba(192, 192, 192, 0.3)" 
                    : "rgba(107, 155, 209, 0.25)",
                }
              ]}
            >
              <Shield 
                color={isNightMode ? "#C0C0C0" : theme.colors.primary} 
                size={16} 
                strokeWidth={2.5} 
              />
              <Text 
                style={[
                  styles.encryptionText, 
                  { 
                    color: isNightMode ? "#C0C0C0" : theme.colors.primary,
                    fontSize: getFontSize(11),
                  }
                ]}
              >
                {translations.chat.encrypted}
              </Text>
            </View>
          </View>

          <View 
            style={[
              styles.securityNote,
              {
                backgroundColor: isNightMode 
                  ? "rgba(192, 192, 192, 0.08)" 
                  : "rgba(107, 155, 209, 0.08)",
              }
            ]}
          >
            <Lock 
              color={isNightMode ? "#C0C0C0" : theme.colors.primary} 
              size={14} 
              strokeWidth={2} 
            />
            <Text 
              style={[
                styles.securityNoteText, 
                { 
                  color: isNightMode ? "#AAAAAA" : theme.colors.text.secondary,
                  fontSize: getFontSize(12),
                }
              ]}
            >
              {translations.chat.endToEndEncrypted} • {translations.chat.syncedWithCalendars}
            </Text>
          </View>
        </Animated.View>

        <FlatList
          data={chatsWithMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={[
            styles.listContent, 
            { paddingBottom: insets.bottom + 120 }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View 
              style={[
                styles.emptyState,
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.emptyIconContainer}>
                <MessageCircle 
                  color={isNightMode ? "#555555" : theme.colors.text.light} 
                  size={72} 
                  strokeWidth={1.5} 
                />
              </View>
              <Text 
                style={[
                  styles.emptyTitle, 
                  { 
                    color: isNightMode ? "#FFD700" : theme.colors.text.primary,
                    fontSize: getFontSize(22),
                  }
                ]}
              >
                {translations.chat.noConversationsYet}
              </Text>
              <Text 
                style={[
                  styles.emptyText, 
                  { 
                    color: isNightMode ? "#888888" : theme.colors.text.secondary,
                    fontSize: getFontSize(15),
                  }
                ]}
              >
                {translations.chat.shareCalendarToStart}
              </Text>
            </Animated.View>
          }
        />
    </LinearGradient>
  );

  return (
    <AppBackgroundWrapper skip={!shouldShowAppBackground} overlayOpacity={0.15}>
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {activeBackground ? (
        <Image
          source={{ uri: activeBackground.url }}
          style={styles.backgroundImage}
          contentFit="cover"
        />
      ) : null}
      {renderContent()}
    </View>
    </AppBackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
  },
  glitterContainer: {
    position: "absolute" as const,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  glitterDot: {
    position: "absolute" as const,
    borderRadius: 50,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 1,
  },
  headerTop: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    justifyContent: "space-between" as const,
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginTop: 2,
    opacity: 0.8,
  },
  encryptionBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  encryptionText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  securityNote: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  securityNoteText: {
    fontSize: 12,
    fontWeight: "500" as const,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  chatItemWrapper: {
    marginBottom: 16,
  },
  chatItem: {
    borderRadius: 24,
    overflow: "hidden" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  chatItemBackground: {
    borderRadius: 24,
    overflow: "hidden" as const,
  },
  chatItemContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 18,
    gap: 14,
  },
  colorIndicator: {
    width: 6,
    height: 60,
    borderRadius: 8,
    position: "relative" as const,
  },
  colorGlow: {
    position: "absolute" as const,
    width: 6,
    height: 60,
    borderRadius: 8,
    opacity: 0.5,
  },
  chatMainContent: {
    flex: 1,
    gap: 8,
  },
  chatTopRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  chatLeftSection: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  chatName: {
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
    flex: 1,
  },
  lockBadge: {
    padding: 4,
  },
  metaRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  chatRightSection: {
    alignItems: "flex-end" as const,
    gap: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  badgesRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800" as const,
  },
  notificationButton: {
    padding: 4,
  },
  lastMessage: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
    opacity: 0.85,
  },
  chevronContainer: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    marginBottom: 12,
    textAlign: "center" as const,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500" as const,
    textAlign: "center" as const,
    lineHeight: 22,
    opacity: 0.8,
  },
});
