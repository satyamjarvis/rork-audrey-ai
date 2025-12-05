import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  PanResponder,
  findNodeHandle,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActionSheetIOS,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar,
  Clock,
  X,
  Edit2,
  Trash2,
  Zap,
  Sparkles,
  TrendingUp,
  Paperclip,
  FileText,
  Image as ImageIcon,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCalendar, type Attachment, type AttachmentPermissions } from "@/contexts/CalendarContext";
import { useAppBackground } from "@/contexts/AppBackgroundContext";
import { Image } from 'expo-image';
import AttachmentPreviewModal from "@/components/AttachmentPreviewModal";
import { useSharing } from "@/contexts/SharingContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import ShareButton from "@/components/ShareButton";
import MoonFloatingButton from "@/components/MoonFloatingButton";
import SunFloatingButton from "@/components/SunFloatingButton";
import BrainFloatingButton from "@/components/BrainFloatingButton";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";
import { useTheme } from "@/contexts/ThemeContext";
import { useFontSize } from "@/contexts/FontSizeContext";
import { useUniverseMode } from "@/contexts/UniverseModeContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";

Dimensions.get("window");

const FUTURISTIC_COLORS = {
  primary: "#FFD700",
  secondary: "#FF00FF",
  accent: "#E91E63",
  background: ["#000000", "#0A0A0A", "#000000"],
  cardBg: "rgba(20, 20, 20, 0.85)",
  cardBorder: "rgba(255, 215, 0, 0.3)",
  text: {
    primary: "#FFFFFF",
    secondary: "#FFD700",
    light: "#999999",
  },
  glow: "rgba(255, 215, 0, 0.4)",
  purple: "#FF00FF",
  pink: "#E91E63",
  green: "#FFD700",
  orange: "#FF00FF",
};

type DateCell = {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  fullDate: Date;
};

export default function SolaraScreen() {
  const insets = useSafeAreaInsets();
  const { selectedCalendar, events, addEvent, deleteEvent, updateEvent } = useCalendar();
  const { selectedBackground, hasCustomBackground } = useAppBackground();
  const { createShareableFromAttachment, createShareableFromCalendarEvent } = useSharing();
  const { theme } = useTheme();
  const { getFontSize } = useFontSize();
  const { mode: universeMode } = useUniverseMode();
  const { markSolaraAccessed } = useUserProfile();
  const { notifyCalendarOpened } = useMusicPlayer();
  const { translations } = useLanguage();
  
  const isNightMode = theme.id === "night-mode";
  
  const backgroundImage = useMemo(() => {
    if (hasCustomBackground && selectedBackground && selectedBackground.url !== 'default') {
      return selectedBackground.url;
    }
    return null;
  }, [hasCustomBackground, selectedBackground]);
  
  const backgroundColors = isNightMode 
    ? FUTURISTIC_COLORS.background as any
    : ["#9D4EDD", "#FFFFFF", "#FFB6D9"];
  
  const modalColors = isNightMode 
    ? {
        background: ['rgba(10, 10, 10, 0.98)', 'rgba(0, 0, 0, 0.98)'],
        text: FUTURISTIC_COLORS.text.primary,
        textSecondary: FUTURISTIC_COLORS.text.secondary,
        inputBg: 'rgba(0, 240, 255, 0.05)',
        inputBorder: FUTURISTIC_COLORS.cardBorder,
        labelColor: FUTURISTIC_COLORS.text.secondary,
        iconPrimary: FUTURISTIC_COLORS.primary,
        iconSecondary: FUTURISTIC_COLORS.secondary,
        iconPurple: FUTURISTIC_COLORS.purple,
        iconPink: FUTURISTIC_COLORS.pink,
        attachmentBg: ['rgba(255, 215, 0, 0.15)', 'rgba(255, 0, 255, 0.1)'],
        attachmentIconBg: 'rgba(255, 215, 0, 0.2)',
        attachButtonBg: ['rgba(255, 215, 0, 0.2)', 'rgba(255, 0, 255, 0.15)'],
        attachButtonDisabled: ['rgba(255, 215, 0, 0.1)', 'rgba(255, 0, 255, 0.1)'],
        limitBadgeBg: 'rgba(255, 215, 0, 0.15)',
        closeButtonBg: 'rgba(255, 215, 0, 0.1)',
        dividerColor: 'rgba(255, 215, 0, 0.15)',
      }
    : {
        background: ['rgba(255, 255, 255, 0.98)', 'rgba(248, 248, 255, 0.98)'],
        text: '#1A1A1A',
        textSecondary: '#9D4EDD',
        inputBg: 'rgba(157, 78, 221, 0.05)',
        inputBorder: 'rgba(157, 78, 221, 0.3)',
        labelColor: '#9D4EDD',
        iconPrimary: '#9D4EDD',
        iconSecondary: '#FF6B9D',
        iconPurple: '#9D4EDD',
        iconPink: '#FF6B9D',
        attachmentBg: ['rgba(157, 78, 221, 0.08)', 'rgba(255, 107, 157, 0.08)'],
        attachmentIconBg: 'rgba(157, 78, 221, 0.15)',
        attachButtonBg: ['rgba(157, 78, 221, 0.12)', 'rgba(255, 107, 157, 0.12)'],
        attachButtonDisabled: ['rgba(157, 78, 221, 0.05)', 'rgba(255, 107, 157, 0.05)'],
        limitBadgeBg: 'rgba(157, 78, 221, 0.12)',
        closeButtonBg: 'rgba(157, 78, 221, 0.1)',
        dividerColor: 'rgba(157, 78, 221, 0.15)',
      };
  
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [plusIconPosition, setPlusIconPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [tempAttachment, setTempAttachment] = useState<Attachment | null>(null);
  
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const plusIconPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const eventsSectionRef = useRef<View>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasPlayedSound = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        plusIconPan.setOffset({
          x: plusIconPosition.x,
          y: plusIconPosition.y,
        });
        plusIconPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        plusIconPan.x.setValue(gestureState.dx);
        plusIconPan.y.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        plusIconPan.flattenOffset();
        setPlusIconPosition({
          x: plusIconPosition.x + gestureState.dx,
          y: plusIconPosition.y + gestureState.dy,
        });
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
    })
  ).current;

  useEffect(() => {
    // Notify music player that calendar page opened (starts 10 second timer)
    notifyCalendarOpened();
    
    const playFirstTimeSound = async () => {
      if (hasPlayedSound.current) return;
      
      // Skip audio autoplay on web due to browser autoplay policies
      if (Platform.OS === 'web') {
        console.log('[Solara] Skipping first-time sound on web (autoplay policy)');
        return;
      }
      
      try {
        const isFirstTime = await markSolaraAccessed();
        if (isFirstTime) {
          hasPlayedSound.current = true;
          console.log('[Solara] Playing first-time sound');
          
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });
          
          const { sound } = await Audio.Sound.createAsync(
            { uri: 'https://rork.app/pa/ier8mze8ucoqq9oktvadp/piano_2' },
            { shouldPlay: true, volume: 0.7 }
          );
          soundRef.current = sound;
          
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              console.log('[Solara] Piano sound finished');
              sound.unloadAsync();
            }
          });
        }
      } catch (error) {
        console.error('[Solara] Error playing first-time sound:', error);
      }
    };

    playFirstTimeSound();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [markSolaraAccessed, notifyCalendarOpened]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const monthNames = useMemo(() => [
    translations.calendar.january,
    translations.calendar.february,
    translations.calendar.march,
    translations.calendar.april,
    translations.calendar.may,
    translations.calendar.june,
    translations.calendar.july,
    translations.calendar.august,
    translations.calendar.september,
    translations.calendar.october,
    translations.calendar.november,
    translations.calendar.december,
  ], [translations]);

  const dayNames = useMemo(() => [
    translations.calendar.sunday,
    translations.calendar.monday,
    translations.calendar.tuesday,
    translations.calendar.wednesday,
    translations.calendar.thursday,
    translations.calendar.friday,
    translations.calendar.saturday,
  ], [translations]);

  const generateCalendarDays = useMemo((): DateCell[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: DateCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i;
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(year, month - 1, date),
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = new Date(year, month, i);
      fullDate.setHours(0, 0, 0, 0);
      days.push({
        date: i,
        isCurrentMonth: true,
        isToday: fullDate.getTime() === today.getTime(),
        fullDate,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(year, month + 1, i),
      });
    }

    return days;
  }, [currentMonth]);

  const getEventsForDate = useCallback((date: Date) => {
    if (!selectedCalendar) {
      console.log('[Solara] No calendar selected');
      return [];
    }
    const dateStr = date.toISOString().split('T')[0];
    const filteredEvents = events.filter(event => 
      event.calendarId === selectedCalendar.id && 
      event.date === dateStr
    );
    console.log(`[Solara] Events for ${dateStr} in calendar ${selectedCalendar.name}:`, filteredEvents.length);
    return filteredEvents;
  }, [events, selectedCalendar]);

  const handlePrevMonth = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }, [currentMonth]);

  const handleDatePress = useCallback((day: DateCell) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log('[Solara] Date selected:', day.fullDate.toISOString().split('T')[0]);
    setSelectedDate(day.fullDate);
    
    const eventsForDate = getEventsForDate(day.fullDate);
    if (eventsForDate.length > 0) {
      setTimeout(() => {
        if (eventsSectionRef.current && scrollViewRef.current) {
          eventsSectionRef.current.measureLayout(
            findNodeHandle(scrollViewRef.current) as number,
            (_x, y) => {
              scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
            },
            () => console.log('Failed to measure events section')
          );
        }
      }, 100);
    }
  }, [getEventsForDate]);

  const handleAddAttachment = async () => {
    if (attachments.length >= 10) {
      Alert.alert(translations.calendar.limitReached, translations.calendar.maxAttachmentsMessage);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAttachment: Attachment = {
          id: `attach_${Date.now()}`,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          uri: asset.uri,
          size: asset.size || 0,
          uploadedAt: new Date().toISOString(),
          permissions: 'view_download', // Default
        };

        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: [translations.common.cancel, translations.calendar.editableDownloadable, translations.calendar.viewOnlyDownloadable, translations.calendar.viewOnly],
              cancelButtonIndex: 0,
              title: translations.calendar.attachmentPermissions,
              message: translations.calendar.selectAccessLevel,
            },
            (buttonIndex) => {
              if (buttonIndex === 0) return;
              
              const permissions: AttachmentPermissions[] = ['edit_download', 'view_download', 'view_only'];
              newAttachment.permissions = permissions[buttonIndex - 1];
              setAttachments(prev => [...prev, newAttachment]);
            }
          );
        } else {
          setTempAttachment(newAttachment);
          setPermissionModalVisible(true);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(translations.common.error, translations.calendar.failedToAttachFile);
    }
  };

  const handlePermissionSelect = (permission: AttachmentPermissions) => {
    if (tempAttachment) {
      const attachmentWithPerm = { ...tempAttachment, permissions: permission };
      setAttachments(prev => [...prev, attachmentWithPerm]);
      setTempAttachment(null);
      setPermissionModalVisible(false);
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const selectedDateEvents = useMemo(() => getEventsForDate(selectedDate), [selectedDate, getEventsForDate]);

  const handleAddEvent = useCallback(async () => {
    if (!eventTitle.trim()) {
      Alert.alert(translations.calendar.validationError, translations.calendar.pleaseEnterEventTitle);
      return;
    }

    if (!selectedCalendar) {
      Alert.alert(translations.common.error, translations.calendar.noCalendarSelectedError);
      return;
    }

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      console.log('[Solara] Creating event:', {
        title: eventTitle.trim(),
        date: selectedDate.toISOString().split('T')[0],
        time: eventTime.trim() || 'No time',
        calendarId: selectedCalendar.id,
        attachments: attachments.length
      });

      await addEvent({
        title: eventTitle.trim(),
        date: selectedDate.toISOString().split('T')[0],
        time: eventTime.trim() || undefined,
        description: eventDescription.trim() || undefined,
        calendarId: selectedCalendar.id,
        attachments: attachments.length > 0 ? attachments : undefined,
      } as any);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      console.log('[Solara] Event created successfully');

      setEventTitle("");
      setEventTime("");
      setEventDescription("");
      setAttachments([]);
      setShowAddModal(false);
    } catch (error) {
      console.error('[Solara] Error creating event:', error);
      Alert.alert(translations.common.error, translations.calendar.failedToCreateEvent);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [eventTitle, eventTime, eventDescription, selectedDate, selectedCalendar, addEvent, attachments]);

  const handleEditEvent = useCallback((eventId: string) => {
    const event: any = events.find(e => e.id === eventId);
    if (!event) return;
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setEditingEventId(eventId);
    setEventTitle(event.title);
    setEventTime(event.time || "");
    setEventDescription(event.description || "");
    setAttachments(event.attachments || []);
    setShowEditModal(true);
  }, [events]);

  const handleUpdateEvent = useCallback(async () => {
    if (!eventTitle.trim()) {
      Alert.alert(translations.calendar.validationError, translations.calendar.pleaseEnterEventTitle);
      return;
    }

    if (!editingEventId) {
      Alert.alert(translations.common.error, translations.calendar.validationError);
      return;
    }

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      console.log('[Solara] Updating event:', editingEventId, {
        title: eventTitle.trim(),
        time: eventTime.trim() || 'No time',
        attachments: attachments.length
      });

      await updateEvent(editingEventId, {
        title: eventTitle.trim(),
        time: eventTime.trim() || undefined,
        description: eventDescription.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      } as any);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      console.log('[Solara] Event updated successfully');

      setEventTitle("");
      setEventTime("");
      setEventDescription("");
      setAttachments([]);
      setEditingEventId(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('[Solara] Error updating event:', error);
      Alert.alert(translations.common.error, translations.calendar.failedToUpdateEvent);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [eventTitle, eventTime, eventDescription, editingEventId, updateEvent, attachments]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    Alert.alert(
      translations.calendar.deleteEvent,
      translations.calendar.areYouSureDeleteEvent,
      [
        { text: translations.common.cancel, style: "cancel" },
        {
          text: translations.common.delete,
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteEvent(eventId);
          },
        },
      ]
    );
  }, [deleteEvent]);

  const handleFabPress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    Animated.sequence([
      Animated.spring(fabScale, {
        toValue: 0.85,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    setShowAddModal(true);
  }, [fabScale]);

  const monthStats = useMemo(() => {
    if (!selectedCalendar) return { total: 0, today: 0 };
    
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const monthEvents = events.filter(e => {
      if (e.calendarId !== selectedCalendar.id) return false;
      const eventDate = new Date(e.date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => 
      e.calendarId === selectedCalendar.id && e.date === todayStr
    );

    return { total: monthEvents.length, today: todayEvents.length };
  }, [events, selectedCalendar, currentMonth]);

  // Early return content when no calendar is selected
  if (!selectedCalendar) {
    return (
      <View style={styles.container}>
        {backgroundImage ? (
          <View style={styles.backgroundContainer}>
            <Image
              source={{ uri: backgroundImage }}
              style={styles.backgroundImage}
              contentFit="cover"
            />
            <View style={styles.backgroundOverlay} />
          </View>
        ) : (
          <LinearGradient colors={backgroundColors} style={styles.gradient} />
        )}
        <View style={[styles.emptyState, { paddingTop: insets.top + 24 }]}>
          <Zap color={FUTURISTIC_COLORS.primary} size={80} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>{translations.calendar.noCalendarSelected}</Text>
          <Text style={styles.emptySubtitle}>{translations.calendar.selectCalendarToContinue}</Text>
        </View>
        {universeMode !== 'universe' && <BrainFloatingButton />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {backgroundImage ? (
        <View style={styles.backgroundContainer}>
          <Image
            source={{ uri: backgroundImage }}
            style={styles.backgroundImage}
            contentFit="cover"
          />
          <View style={styles.backgroundOverlay} />
        </View>
      ) : (
        <LinearGradient colors={backgroundColors} style={styles.gradient} />
      )}
      <View style={styles.contentWrapper}>
        <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{translations.calendar.audreyCalendar}</Text>
            </View>
            <View>
              <Animated.View style={[styles.statsWidget, { transform: [{ scale: pulseAnim }] }]}>
                <Sparkles color={FUTURISTIC_COLORS.primary} size={18} strokeWidth={2.5} />
                <Text style={styles.statsText}>{monthStats.total}</Text>
              </Animated.View>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>{selectedCalendar.name}</Text>
        </View>

        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevMonth}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[FUTURISTIC_COLORS.cardBg, 'rgba(30, 35, 70, 0.4)']}
              style={styles.navButtonGradient}
            >
              <ChevronLeft color={FUTURISTIC_COLORS.primary} size={20} strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.monthDisplay}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 0, 255, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.monthDisplayGradient}
            >
              <Text style={[styles.monthText, { fontSize: Math.min(getFontSize(16), 18) }]}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
            </LinearGradient>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextMonth}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[FUTURISTIC_COLORS.cardBg, 'rgba(30, 35, 70, 0.4)']}
              style={styles.navButtonGradient}
            >
              <ChevronRight color={FUTURISTIC_COLORS.primary} size={20} strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statCard}>
            <TrendingUp color={FUTURISTIC_COLORS.green} size={16} strokeWidth={2.5} />
            <Text style={styles.statValue}>{monthStats.today}</Text>
            <Text style={styles.statLabel}>{translations.calendar.today}</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar color={FUTURISTIC_COLORS.purple} size={16} strokeWidth={2.5} />
            <Text style={styles.statValue}>{monthStats.total}</Text>
            <Text style={styles.statLabel}>{translations.calendar.month}</Text>
          </View>
          <View style={styles.statCard}>
            <Clock color={FUTURISTIC_COLORS.pink} size={16} strokeWidth={2.5} />
            <Text style={styles.statValue}>{selectedDateEvents.length}</Text>
            <Text style={styles.statLabel}>{translations.calendar.selected}</Text>
          </View>
        </View>

        <View style={styles.weekDaysHeader}>
          {dayNames.map((day, index) => (
            <View key={index} style={styles.weekDayCell}>
              <Text style={[styles.weekDayText, { color: isNightMode ? '#FFFFFF' : '#4A4A4A' }]}>{day}</Text>
            </View>
          ))}
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.calendarGrid}>
            {generateCalendarDays.map((day, index) => {
              const hasEvents = getEventsForDate(day.fullDate).length > 0;
              const isSelected = isSameDay(selectedDate, day.fullDate);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => handleDatePress(day)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Animated.View style={[styles.selectedGlow, { opacity: glowOpacity }]} />
                  )}
                  {day.isToday && (
                    <View style={styles.todayIndicator} />
                  )}
                  <Text
                    style={[
                      styles.dayText,
                      { fontSize: Math.min(getFontSize(14), 16), color: isNightMode ? '#FFFFFF' : '#000000' },
                      !day.isCurrentMonth && styles.dayTextInactive,
                      day.isToday && styles.dayTextToday,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {day.date}
                  </Text>
                  {hasEvents && (
                    <View style={styles.eventIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View ref={eventsSectionRef} style={styles.eventsSection}>
            <View style={styles.eventsSectionHeader}>
              <Text style={[styles.eventsSectionTitle, { color: isNightMode ? FUTURISTIC_COLORS.text.primary : '#000000' }]}>
                {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
              <View style={styles.eventCount}>
                <Text style={styles.eventCountText}>{selectedDateEvents.length}</Text>
              </View>
            </View>

            {selectedDateEvents.length === 0 ? (
              <View style={styles.noEvents}>
                <Calendar color={FUTURISTIC_COLORS.text.light} size={40} strokeWidth={1.5} />
                <Text style={styles.noEventsText}>{translations.calendar.noEventsScheduled}</Text>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {selectedDateEvents.map((event: any) => (
                  <View key={event.id} style={styles.eventCard}>
                    <LinearGradient
                      colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 0, 255, 0.1)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.eventCardGradient}
                    >
                      <View style={styles.eventCardContent}>
                        <View style={styles.eventInfo}>
                          <Text style={[styles.eventTitle, { color: isNightMode ? FUTURISTIC_COLORS.text.primary : '#000000' }]}>{event.title}</Text>
                          {event.time && (
                            <View style={styles.eventTimeRow}>
                              <Clock color={isNightMode ? FUTURISTIC_COLORS.text.secondary : '#000000'} size={12} strokeWidth={2} />
                              <Text style={[styles.eventTime, { color: isNightMode ? FUTURISTIC_COLORS.text.secondary : '#000000' }]}>{event.time}</Text>
                            </View>
                          )}
                          {event.description && (
                            <Text style={[styles.eventDescription, { color: isNightMode ? FUTURISTIC_COLORS.text.secondary : '#000000' }]} numberOfLines={2}>
                              {event.description}
                            </Text>
                          )}
                          {event.attachments && event.attachments.length > 0 && (
                            <View style={styles.eventAttachmentsList}>
                              {event.attachments.map((att: Attachment, idx: number) => (
                                <TouchableOpacity 
                                  key={idx}
                                  style={[styles.attachmentChip, { backgroundColor: isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
                                  onPress={() => setPreviewAttachment(att)}
                                >
                                  {att.type.startsWith('image/') ? (
                                    <ImageIcon size={12} color={isNightMode ? FUTURISTIC_COLORS.text.secondary : '#000000'} />
                                  ) : (
                                    <FileText size={12} color={isNightMode ? FUTURISTIC_COLORS.text.secondary : '#000000'} />
                                  )}
                                  <Text style={[styles.attachmentChipText, { color: isNightMode ? FUTURISTIC_COLORS.text.primary : '#000000' }]} numberOfLines={1}>
                                    {att.name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                        <View style={styles.eventActions}>
                          <ShareButton
                            shareableItem={createShareableFromCalendarEvent(event)}
                            size={16}
                            color={FUTURISTIC_COLORS.primary}
                          />
                          <TouchableOpacity
                            onPress={() => handleEditEvent(event.id)}
                            style={styles.eventActionButton}
                          >
                            <Edit2 color={FUTURISTIC_COLORS.primary} size={16} strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteEvent(event.id)}
                            style={styles.eventActionButton}
                          >
                            <Trash2 color={FUTURISTIC_COLORS.accent} size={16} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.floatingAddButton,
            {
              top: insets.top + 230,
              right: 20,
              transform: [
                { translateX: plusIconPan.x },
                { translateY: plusIconPan.y },
              ],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleFabPress}
            activeOpacity={0.7}
            style={{ width: '100%', height: '100%' }}
          >
            <LinearGradient
              colors={['#8B4513', '#CD7F32', '#FFD700', '#CD7F32', '#8B4513']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.floatingAddButtonGradient}
            >
              <Plus color="#FFFFFF" size={32} strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {universeMode !== 'universe' && (
        <>
          <MoonFloatingButton />
          <SunFloatingButton />
        </>
      )}
      {universeMode !== 'universe' && <BrainFloatingButton />}

      <Modal
        visible={showAddModal || showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowAddModal(false);
          setShowEditModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                  <LinearGradient
                    colors={[
                      isNightMode ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                      isNightMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(248, 248, 255, 0.85)'
                    ]}
                    style={styles.modalGradient}
                  >
                    <View style={[styles.modalHeader, { borderBottomColor: modalColors.dividerColor }]}>
                      <View style={styles.modalTitleContainer}>
                        <View style={[styles.modalIconContainer, { backgroundColor: modalColors.attachmentIconBg, borderColor: modalColors.inputBorder }]}>
                          <Calendar color={modalColors.iconPrimary} size={20} strokeWidth={2.5} />
                        </View>
                        <View style={styles.modalTitleTextContainer}>
                          <Text style={[styles.modalTitle, { color: modalColors.text }]}>
                            {showEditModal ? translations.calendar.editEvent : translations.calendar.newEvent}
                          </Text>
                          <Text style={[styles.modalSubtitle, { color: modalColors.textSecondary }]}>
                            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <KeyboardDismissButton color={modalColors.text} size={22} />
                        <TouchableOpacity
                          onPress={() => {
                            if (Platform.OS !== "web") {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            Keyboard.dismiss();
                            setShowAddModal(false);
                            setShowEditModal(false);
                            setEventTitle("");
                            setEventTime("");
                            setEventDescription("");
                            setAttachments([]);
                            setEditingEventId(null);
                          }}
                          style={styles.modalCloseButton}
                          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                          <X color={modalColors.text} size={22} strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <ScrollView
                      style={styles.modalScrollView}
                      contentContainerStyle={styles.modalScrollContent}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      <View style={styles.formGroup}>
                        <View style={styles.formLabelRow}>
                          <Sparkles color={modalColors.iconPrimary} size={16} strokeWidth={2} />
                          <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{translations.calendar.eventTitle}</Text>
                          <Text style={[styles.requiredIndicator, { color: FUTURISTIC_COLORS.accent }]}>*</Text>
                        </View>
                        <TextInput
                          style={[styles.textInput, { backgroundColor: modalColors.inputBg, borderColor: eventTitle.trim() ? modalColors.inputBorder : FUTURISTIC_COLORS.accent, color: modalColors.text }]}
                          placeholder={translations.calendar.enterEventTitle}
                          placeholderTextColor={isNightMode ? FUTURISTIC_COLORS.text.light : '#999'}
                          value={eventTitle}
                          onChangeText={setEventTitle}
                          returnKeyType="next"
                          blurOnSubmit={false}
                          autoFocus={!showEditModal}
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <View style={styles.formLabelRow}>
                          <Clock color={modalColors.iconSecondary} size={16} strokeWidth={2} />
                          <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{translations.calendar.time}</Text>
                        </View>
                        <TextInput
                          style={[styles.textInput, { backgroundColor: modalColors.inputBg, borderColor: modalColors.inputBorder, color: modalColors.text }]}
                          placeholder="e.g., 2:00 PM"
                          placeholderTextColor={isNightMode ? FUTURISTIC_COLORS.text.light : '#999'}
                          value={eventTime}
                          onChangeText={setEventTime}
                          returnKeyType="next"
                          blurOnSubmit={false}
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <View style={styles.formLabelRow}>
                          <FileText color={modalColors.iconPurple} size={16} strokeWidth={2} />
                          <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{translations.calendar.description}</Text>
                        </View>
                        <TextInput
                          style={[styles.textInput, styles.textArea, { backgroundColor: modalColors.inputBg, borderColor: modalColors.inputBorder, color: modalColors.text }]}
                          placeholder={translations.calendar.addDetails}
                          placeholderTextColor={isNightMode ? FUTURISTIC_COLORS.text.light : '#999'}
                          value={eventDescription}
                          onChangeText={setEventDescription}
                          multiline
                          numberOfLines={3}
                          returnKeyType="done"
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <View style={styles.attachmentHeader}>
                          <View style={styles.formLabelRow}>
                            <Paperclip color={modalColors.iconPink} size={16} strokeWidth={2} />
                            <Text style={[styles.formLabel, { color: modalColors.labelColor }]}>{translations.calendar.attachments}</Text>
                          </View>
                          <View style={[styles.attachmentLimitBadge, { backgroundColor: modalColors.limitBadgeBg, borderColor: modalColors.inputBorder }]}>
                            <Text style={[styles.attachmentLimit, { color: modalColors.iconPrimary }]}>{attachments.length}/10</Text>
                          </View>
                        </View>
                        
                        {attachments.length > 0 && (
                          <View style={styles.attachmentsList}>
                            {attachments.map((attachment, index) => {
                              const shareableAttachment = createShareableFromAttachment(attachment, {
                                eventId: editingEventId ?? undefined,
                                eventTitle: eventTitle || "Event Attachment",
                                calendarName: selectedCalendar?.name,
                              });

                              return (
                                <View key={attachment.id} style={[styles.attachmentItem, { borderColor: modalColors.inputBorder }]}>
                                  <LinearGradient
                                    colors={modalColors.attachmentBg as any}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.attachmentItemGradient}
                                  >
                                    <View style={styles.attachmentDetails}>
                                      <View style={[styles.attachmentIcon, { backgroundColor: modalColors.attachmentIconBg, borderColor: modalColors.inputBorder }]}>
                                        {attachment?.type?.startsWith('image/') ? (
                                          <ImageIcon color={modalColors.iconPrimary} size={20} strokeWidth={2} />
                                        ) : (
                                          <FileText color={modalColors.iconPrimary} size={20} strokeWidth={2} />
                                        )}
                                      </View>
                                      <View style={styles.attachmentInfo}>
                                        <Text style={[styles.attachmentName, { color: modalColors.text }]} numberOfLines={1}>
                                          {attachment.name}
                                        </Text>
                                        <Text style={[styles.attachmentSize, { color: modalColors.textSecondary }]}>
                                          {(attachment.size / 1024).toFixed(1)} KB
                                        </Text>
                                      </View>
                                    </View>
                                    <View style={styles.attachmentActions}>
                                      <ShareButton
                                        shareableItem={shareableAttachment}
                                        size={18}
                                        color={modalColors.iconSecondary}
                                        testID={`attachment-share-${attachment.id}`}
                                      />
                                      <TouchableOpacity
                                        onPress={() => {
                                          if (Platform.OS !== "web") {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                          }
                                          setAttachments(prev => prev.filter((_, i) => i !== index));
                                        }}
                                        style={styles.attachmentRemove}
                                        testID={`attachment-remove-${attachment.id}`}
                                      >
                                        <X color={FUTURISTIC_COLORS.accent} size={16} strokeWidth={2.5} />
                                      </TouchableOpacity>
                                    </View>
                                  </LinearGradient>
                                </View>
                              );
                            })}
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.attachButton, { borderColor: modalColors.inputBorder }]}
                          onPress={handleAddAttachment}
                          disabled={attachments.length >= 10}
                        >
                          <LinearGradient
                            colors={
                              attachments.length >= 10
                                ? modalColors.attachButtonDisabled as any
                                : modalColors.attachButtonBg as any
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.attachButtonGradient}
                          >
                            <Paperclip color={attachments.length >= 10 ? (isNightMode ? FUTURISTIC_COLORS.text.light : '#999') : modalColors.iconPrimary} size={20} strokeWidth={2} />
                            <Text style={[styles.attachButtonText, { color: attachments.length >= 10 ? (isNightMode ? FUTURISTIC_COLORS.text.light : '#999') : modalColors.iconPrimary }]}>{translations.calendar.addAttachment}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>

                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={() => {
                        Keyboard.dismiss();
                        if (showEditModal) {
                          handleUpdateEvent();
                        } else {
                          handleAddEvent();
                        }
                      }}
                    >
                      <LinearGradient
                        colors={isNightMode ? [FUTURISTIC_COLORS.primary, FUTURISTIC_COLORS.secondary] : ['#9D4EDD', '#FF6B9D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitButtonGradient}
                      >
                        <Sparkles color="#FFFFFF" size={16} strokeWidth={2.5} />
                        <Text style={styles.submitButtonText} numberOfLines={1}>
                          {showEditModal ? translations.calendar.updateEvent : translations.calendar.createEvent}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        visible={permissionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setTempAttachment(null);
          setPermissionModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.permissionModalContent, { backgroundColor: isNightMode ? '#1A1A1A' : '#FFFFFF' }]}>
            <Text style={[styles.permissionModalTitle, { color: isNightMode ? '#FFFFFF' : '#000000' }]}>
              {translations.calendar.attachmentPermissions}
            </Text>
            <Text style={[styles.permissionModalSubtitle, { color: isNightMode ? '#CCCCCC' : '#666666' }]}>
              {translations.calendar.selectAccessLevel}
            </Text>
            
            <TouchableOpacity 
              style={styles.permissionOption} 
              onPress={() => handlePermissionSelect('edit_download')}
            >
              <Text style={[styles.permissionOptionText, { color: isNightMode ? '#FFFFFF' : '#000000' }]}>{translations.calendar.editableDownloadable}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.permissionOption} 
              onPress={() => handlePermissionSelect('view_download')}
            >
              <Text style={[styles.permissionOptionText, { color: isNightMode ? '#FFFFFF' : '#000000' }]}>{translations.calendar.viewOnlyDownloadable}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.permissionOption, { borderBottomWidth: 0 }]} 
              onPress={() => handlePermissionSelect('view_only')}
            >
              <Text style={[styles.permissionOptionText, { color: isNightMode ? '#FFFFFF' : '#000000' }]}>{translations.calendar.viewOnly}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.permissionCancelButton, { marginTop: 10 }]}
              onPress={() => {
                setTempAttachment(null);
                setPermissionModalVisible(false);
              }}
            >
              <Text style={styles.permissionCancelText}>{translations.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AttachmentPreviewModal
        visible={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
        fileData={previewAttachment?.uri ? null : null} // Using URI logic in component
        canDownload={previewAttachment?.permissions ? previewAttachment.permissions.includes('download') : true}
        allowEditing={previewAttachment?.permissions ? previewAttachment.permissions.includes('edit') : true}
        calendarOwner={selectedCalendar?.owner || 'Unknown'}
        themeColors={{
          primary: isNightMode ? FUTURISTIC_COLORS.primary : '#9D4EDD',
          secondary: isNightMode ? FUTURISTIC_COLORS.secondary : '#FF6B9D',
          cardBg: isNightMode ? FUTURISTIC_COLORS.cardBg : '#FFFFFF',
          textPrimary: isNightMode ? FUTURISTIC_COLORS.text.primary : '#000000',
          textSecondary: isNightMode ? FUTURISTIC_COLORS.text.secondary : '#666666',
          border: isNightMode ? FUTURISTIC_COLORS.cardBorder : '#E0E0E0',
        }}
        isNightMode={isNightMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600' as const,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-condensed',
    color: FUTURISTIC_COLORS.text.primary,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  headerSubtitle: {
    fontSize: 14,
    color: FUTURISTIC_COLORS.text.secondary,
    marginTop: 4,
    fontWeight: '600' as const,
  },
  statsWidget: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: FUTURISTIC_COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FUTURISTIC_COLORS.cardBorder,
  },
  statsText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: FUTURISTIC_COLORS.primary,
  },
  monthNav: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  navButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: FUTURISTIC_COLORS.cardBorder,
    borderRadius: 20,
  },
  monthDisplay: {
    flex: 1,
    marginHorizontal: 12,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden' as const,
  },
  monthDisplayGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: FUTURISTIC_COLORS.cardBorder,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: FUTURISTIC_COLORS.text.primary,
    letterSpacing: 0.5,
  },
  statsBar: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: FUTURISTIC_COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center' as const,
    gap: 6,
    borderWidth: 1,
    borderColor: FUTURISTIC_COLORS.cardBorder,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: FUTURISTIC_COLORS.text.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: FUTURISTIC_COLORS.text.secondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  weekDaysHeader: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center' as const,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  calendarGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: 24,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 0.9,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: FUTURISTIC_COLORS.primary,
  },
  selectedGlow: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    backgroundColor: FUTURISTIC_COLORS.glow,
    borderRadius: 10,
  },
  todayIndicator: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FUTURISTIC_COLORS.green,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dayTextInactive: {
    color: FUTURISTIC_COLORS.text.light,
    opacity: 0.4,
  },
  dayTextToday: {
    color: FUTURISTIC_COLORS.green,
    fontWeight: '800' as const,
  },
  dayTextSelected: {
    color: FUTURISTIC_COLORS.primary,
    fontWeight: '800' as const,
  },
  eventIndicator: {
    position: 'absolute' as const,
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: FUTURISTIC_COLORS.accent,
  },
  eventsSection: {
    marginBottom: 16,
  },
  eventsSectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  eventCount: {
    backgroundColor: FUTURISTIC_COLORS.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FUTURISTIC_COLORS.cardBorder,
  },
  eventCountText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: FUTURISTIC_COLORS.primary,
  },
  noEvents: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    gap: 12,
  },
  noEventsText: {
    fontSize: 14,
    color: FUTURISTIC_COLORS.text.secondary,
    fontWeight: '600' as const,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: FUTURISTIC_COLORS.cardBorder,
  },
  eventCardGradient: {
    padding: 16,
  },
  eventCardContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  eventInfo: {
    flex: 1,
    gap: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  eventTimeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  eventDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  eventActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginLeft: 12,
  },
  eventActionButton: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FUTURISTIC_COLORS.cardBorder,
  },
  headerTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  floatingAddButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: FUTURISTIC_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  floatingAddButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 32,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end' as const,
    ...(Platform.OS === 'ios' && {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }),
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden' as const,
  },
  modalGradient: {
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 2,
    borderTopColor: FUTURISTIC_COLORS.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  modalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  modalTitleTextContainer: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    padding: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  modalScrollView: {
    maxHeight: 450,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  requiredIndicator: {
    fontSize: 16,
    fontWeight: '800' as const,
    marginLeft: 2,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500' as const,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  attachmentHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  attachmentLimitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  attachmentLimit: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  attachmentsList: {
    gap: 8,
    marginBottom: 12,
  },
  attachmentItem: {
    borderRadius: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
  },
  attachmentItemGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 12,
    gap: 12,
  },
  attachmentDetails: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  attachmentActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  attachmentInfo: {
    flex: 1,
    gap: 4,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  attachmentSize: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  attachmentRemove: {
    width: 28,
    height: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(233, 30, 99, 0.15)',
    borderRadius: 14,
  },
  attachButton: {
    borderRadius: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
  },
  attachButtonGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    gap: 8,
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  eventAttachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '100%',
  },
  attachmentChipText: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  permissionModalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  permissionModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionModalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  permissionOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  permissionCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  permissionCancelText: {
    fontSize: 16,
    color: 'red',
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 40,
    elevation: 4,
    shadowColor: FUTURISTIC_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: FUTURISTIC_COLORS.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: FUTURISTIC_COLORS.text.secondary,
    fontWeight: '600' as const,
  },
});
