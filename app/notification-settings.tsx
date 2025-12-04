import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Bell, Clock, Calendar, ChevronLeft, Music, Play, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/contexts/ThemeContext';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { NOTIFICATION_SOUNDS, getNotificationSound } from '@/constants/notificationSounds';

type SoundCategory = 'calendarSound' | 'messageSound' | 'notificationSound' | 'plannerSound';



type SnoozeOption = {
  label: string;
  value: number;
  unit: 'minutes' | 'hours';
};

const SNOOZE_OPTIONS: SnoozeOption[] = [
  { label: '5 minutes', value: 5, unit: 'minutes' },
  { label: '10 minutes', value: 10, unit: 'minutes' },
  { label: '15 minutes', value: 15, unit: 'minutes' },
  { label: '30 minutes', value: 30, unit: 'minutes' },
  { label: '1 hour', value: 1, unit: 'hours' },
  { label: '2 hours', value: 2, unit: 'hours' },
  { label: '3 hours', value: 3, unit: 'hours' },
];

type TimeBeforeOption = {
  label: string;
  value: number;
  unit: 'minutes' | 'hours' | 'days';
};

const TIME_BEFORE_OPTIONS: TimeBeforeOption[] = [
  { label: 'At time of event', value: 0, unit: 'minutes' },
  { label: '5 minutes before', value: 5, unit: 'minutes' },
  { label: '10 minutes before', value: 10, unit: 'minutes' },
  { label: '15 minutes before', value: 15, unit: 'minutes' },
  { label: '30 minutes before', value: 30, unit: 'minutes' },
  { label: '1 hour before', value: 1, unit: 'hours' },
  { label: '2 hours before', value: 2, unit: 'hours' },
  { label: '1 day before', value: 1, unit: 'days' },
  { label: '2 days before', value: 2, unit: 'days' },
  { label: '1 week before', value: 7, unit: 'days' },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { settings, updateSettings } = useNotificationSettings();
  const [showTimeBeforeOptions, setShowTimeBeforeOptions] = useState<boolean>(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState<boolean>(false);
  const [showSoundSelector, setShowSoundSelector] = useState<boolean>(false);
  const [activeSoundCategory, setActiveSoundCategory] = useState<SoundCategory | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [loadingSound, setLoadingSound] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const stopCurrentSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.log('Error stopping sound:', error);
      }
      soundRef.current = null;
    }
    setPlayingSound(null);
  };

  const handlePlayPreview = async (soundId: string, assetId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (playingSound === soundId) {
      await stopCurrentSound();
      return;
    }

    await stopCurrentSound();
    setLoadingSound(soundId);

    try {
      const soundUrl = `https://rork.app/pa/ier8mze8ucoqq9oktvadp/${assetId}`;
      console.log('Loading sound from:', soundUrl);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setPlayingSound(soundId);
      setLoadingSound(null);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingSound(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
      setLoadingSound(null);
      setPlayingSound(null);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleToggleNotifications = (value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    updateSettings({ enabled: value });
  };

  const handleToggleMessagesNotifications = (value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    updateSettings({ messagesEnabled: value });
  };

  const handleSelectTimeBefore = (option: TimeBeforeOption) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updateSettings({ 
      timeBefore: option.value, 
      timeBeforeUnit: option.unit 
    });
    setShowTimeBeforeOptions(false);
  };

  const handleSelectSnoozeTime = (option: SnoozeOption) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    updateSettings({ 
      snoozeTime: option.value, 
      snoozeUnit: option.unit 
    });
    setShowSnoozeOptions(false);
  };

  const handleSelectSound = async (soundId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await stopCurrentSound();
    if (activeSoundCategory) {
      updateSettings({ [activeSoundCategory]: soundId });
    }
    setShowSoundSelector(false);
    setActiveSoundCategory(null);
  };

  const openSoundSelector = (category: SoundCategory) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveSoundCategory(category);
    setShowSoundSelector(true);
  };

  const getTimeBeforeLabel = () => {
    const option = TIME_BEFORE_OPTIONS.find(
      opt => opt.value === settings.timeBefore && opt.unit === settings.timeBeforeUnit
    );
    return option?.label || 'At time of event';
  };

  const getSnoozeLabel = () => {
    const option = SNOOZE_OPTIONS.find(
      opt => opt.value === settings.snoozeTime && opt.unit === settings.snoozeUnit
    );
    return option?.label || '5 minutes';
  };

  const getSoundLabel = (soundId: string) => {
    return getNotificationSound(soundId).name;
  };



  if (showTimeBeforeOptions) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={theme.gradients.background as any} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowTimeBeforeOptions(false)}
              activeOpacity={0.7}
            >
              <ChevronLeft color={theme.colors.primary} size={28} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Clock color={theme.colors.primary} size={32} strokeWidth={2.5} />
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Notify Me
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Choose when to be notified before events
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.optionsGrid}>
              {TIME_BEFORE_OPTIONS.map((option, index) => {
                const isSelected = option.value === settings.timeBefore && option.unit === settings.timeBeforeUnit;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelectTimeBefore(option)}
                    activeOpacity={0.7}
                  >
                    <Clock 
                      color={isSelected ? theme.colors.primary : theme.colors.text.secondary} 
                      size={24} 
                      strokeWidth={2} 
                    />
                    <Text style={[styles.optionLabel, { color: theme.colors.text.primary }]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedDot, { backgroundColor: theme.colors.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  if (showSnoozeOptions) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={theme.gradients.background as any} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowSnoozeOptions(false)}
              activeOpacity={0.7}
            >
              <ChevronLeft color={theme.colors.primary} size={28} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Clock color={theme.colors.primary} size={32} strokeWidth={2.5} />
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Snooze Duration
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              How long to snooze notifications
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.optionsGrid}>
              {SNOOZE_OPTIONS.map((option, index) => {
                const isSelected = option.value === settings.snoozeTime && option.unit === settings.snoozeUnit;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelectSnoozeTime(option)}
                    activeOpacity={0.7}
                  >
                    <Clock 
                      color={isSelected ? theme.colors.primary : theme.colors.text.secondary} 
                      size={24} 
                      strokeWidth={2} 
                    />
                    <Text style={[styles.optionLabel, { color: theme.colors.text.primary }]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedDot, { backgroundColor: theme.colors.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  if (showSoundSelector) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={theme.gradients.background as any} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={async () => {
                await stopCurrentSound();
                setShowSoundSelector(false);
                setActiveSoundCategory(null);
              }}
              activeOpacity={0.7}
            >
              <ChevronLeft color={theme.colors.primary} size={28} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Music color={theme.colors.primary} size={32} strokeWidth={2.5} />
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Select Sound
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Choose a sound for this alert
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.optionsGrid}>
              {NOTIFICATION_SOUNDS.map((sound, index) => {
                const isSelected = activeSoundCategory ? settings[activeSoundCategory] === sound.id : false;
                const isPlaying = playingSound === sound.id;
                const isLoading = loadingSound === sound.id;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelectSound(sound.id)}
                    activeOpacity={0.7}
                  >
                    <Music 
                      color={isSelected ? theme.colors.primary : theme.colors.text.secondary} 
                      size={24} 
                      strokeWidth={2} 
                    />
                    <Text style={[styles.optionLabel, { color: theme.colors.text.primary }]}>
                      {sound.name}
                    </Text>
                    
                    <TouchableOpacity
                      style={[
                        styles.playButton,
                        {
                          backgroundColor: isPlaying 
                            ? `${theme.colors.primary}30` 
                            : `${theme.colors.text.secondary}15`,
                        },
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(sound.id, sound.assetId);
                      }}
                      activeOpacity={0.7}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : isPlaying ? (
                        <Square 
                          color={theme.colors.primary} 
                          size={16} 
                          strokeWidth={2.5}
                          fill={theme.colors.primary}
                        />
                      ) : (
                        <Play 
                          color={theme.colors.text.secondary} 
                          size={16} 
                          strokeWidth={2.5}
                          fill={theme.colors.text.secondary}
                        />
                      )}
                    </TouchableOpacity>
                    
                    {isSelected && (
                      <View style={[styles.selectedDot, { backgroundColor: theme.colors.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={theme.gradients.background as any} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ChevronLeft color={theme.colors.primary} size={28} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Bell color={theme.colors.primary} size={32} strokeWidth={2.5} />
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              Notifications
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
            Customize your notification preferences
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.audreyCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.audreyImage}
              resizeMode="cover"
            />
            <View style={styles.audreyInfo}>
              <Text style={[styles.audreyName, { color: theme.colors.text.primary }]}>
                Audrey AI
              </Text>
              <Text style={[styles.audreyDescription, { color: theme.colors.text.secondary }]}>
                Your intelligent assistant will remind you about your events
              </Text>
            </View>
          </View>

          <View style={[styles.toggleCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleTitle, { color: theme.colors.text.primary }]}>
                  Calendar Notifications
                </Text>
                <Text style={[styles.toggleDescription, { color: theme.colors.text.secondary }]}>
                  Get notified about upcoming events
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={[styles.toggleCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleTitle, { color: theme.colors.text.primary }]}>
                  Messages Notifications
                </Text>
                <Text style={[styles.toggleDescription, { color: theme.colors.text.secondary }]}>
                  Get notified when you receive a message
                </Text>
              </View>
              <Switch
                value={settings.messagesEnabled}
                onValueChange={handleToggleMessagesNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {settings.enabled && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Notification Timing
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                  When should Audrey remind you?
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.settingCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                onPress={() => setShowTimeBeforeOptions(true)}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Calendar color={theme.colors.primary} size={24} strokeWidth={2} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                      Notify Me
                    </Text>
                    <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                      {getTimeBeforeLabel()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Snooze Settings
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                  Audrey&apos;s reaction when you snooze
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.settingCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                onPress={() => setShowSnoozeOptions(true)}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
                    <Clock color={theme.colors.secondary} size={24} strokeWidth={2} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                      Snooze Duration
                    </Text>
                    <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                      {getSnoozeLabel()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Sound Settings
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                  Customize alert sounds
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.settingCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                onPress={() => openSoundSelector('calendarSound')}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Calendar color={theme.colors.primary} size={24} strokeWidth={2} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                      Calendar Alerts
                    </Text>
                    <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                      {getSoundLabel(settings.calendarSound)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                onPress={() => openSoundSelector('messageSound')}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
                    <Bell color={theme.colors.secondary} size={24} strokeWidth={2} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                      Message Alerts
                    </Text>
                    <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                      {getSoundLabel(settings.messageSound)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                onPress={() => openSoundSelector('notificationSound')}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Bell color={theme.colors.primary} size={24} strokeWidth={2} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                      Notification Sound
                    </Text>
                    <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                      {getSoundLabel(settings.notificationSound)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                onPress={() => openSoundSelector('plannerSound')}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
                    <Clock color={theme.colors.secondary} size={24} strokeWidth={2} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>
                      Planners Notification
                    </Text>
                    <Text style={[styles.settingValue, { color: theme.colors.text.secondary }]}>
                      {getSoundLabel(settings.plannerSound)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>


            </>
          )}
        </ScrollView>
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
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  audreyCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    marginBottom: 24,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  audreyImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  audreyInfo: {
    flex: 1,
    gap: 6,
  },
  audreyName: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  audreyDescription: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  toggleCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  toggleContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  toggleInfo: {
    flex: 1,
    gap: 6,
    paddingRight: 16,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  toggleDescription: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  settingCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  settingLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  settingIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  settingInfo: {
    flex: 1,
    gap: 6,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '500' as const,
  },

  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
