import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  User,
  Bell,
  Moon as MoonIcon,
  Sun,
  Palette,
  LogOut,
  UserCircle2,
  Sparkles,
  Check,
  Languages,
  Music2,
  Volume2,
  VolumeX,
  Crown,
  ChevronRight,
  Type,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage, Language as LanguageType } from "@/contexts/LanguageContext";
import { useAudioStyle, AudioStyle, AUDIO_STYLES } from "@/contexts/AudioStyleContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useCalendar } from "@/contexts/CalendarContext";
import { useAppBackground } from "@/contexts/AppBackgroundContext";
import { useFontSize, FontSizeScale } from "@/contexts/FontSizeContext";
import { useUniverseMode } from "@/contexts/UniverseModeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encrypt, decrypt } from "@/utils/encryption";

import { Image } from 'expo-image';
import AppBackgroundWrapper from "@/components/AppBackgroundWrapper";

type LanguageOption = {
  code: LanguageType;
  name: string;
  nativeName: string;
  flag: string;
};

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const [, setSettingsLoaded] = useState(false);

  useEffect(() => {
    loadEncryptedSettings();
  }, []);

  const loadEncryptedSettings = async () => {
    try {
      const encryptedData = await AsyncStorage.getItem('settings_encrypted_data');
      if (encryptedData) {
        const decrypted = await decrypt(encryptedData);
        const settings = JSON.parse(decrypted);
        console.log('[Settings] Loaded encrypted settings');
      }
      setSettingsLoaded(true);
    } catch (error) {
      console.error('[Settings] Error loading encrypted settings:', error);
      setSettingsLoaded(true);
    }
  };

  const saveEncryptedSettings = async (settings: any) => {
    try {
      const encrypted = await encrypt(JSON.stringify(settings));
      await AsyncStorage.setItem('settings_encrypted_data', encrypted);
      console.log('[Settings] Saved encrypted settings');
    } catch (error) {
      console.error('[Settings] Error saving encrypted settings:', error);
    }
  };
  const { theme, setTheme, autoThemeEnabled, toggleAutoTheme, availableThemes, activeHolidayTheme } = useTheme();
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';
  const { language, setLanguage, setLanguageWithRestart, pendingRestart } = useLanguage();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const { 
    audioStyle, 
    setAudioStyle, 
    currentStyleData, 
    getTracksForStyle, 
    getSelectedTrackForStyle, 
    setSelectedTrack 
  } = useAudioStyle();
  const { isMuted, toggleMute, isLoading: isMusicLoading, isDisabled: isMusicDisabled } = useMusicPlayer();
  const { calendars, selectedCalendar } = useCalendar();
  const { selectedBackgroundId: selectedBackground, setBackground, backgrounds: appBackgrounds } = useAppBackground();

  const { scale: fontSize, config: fontSizeConfig, options: fontSizeOptions, setFontSize } = useFontSize();
  const { mode: universeMode, setMode: setUniverseMode } = useUniverseMode();
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);
  const [showFontSizeSelector, setShowFontSizeSelector] = useState<boolean>(false);

  
  const [showLanguageSelector, setShowLanguageSelector] = useState<boolean>(false);
  const [showAudioStyleSelector, setShowAudioStyleSelector] = useState<boolean>(false);
  const [selectedStyleForTracks, setSelectedStyleForTracks] = useState<AudioStyle | null>(null);
  const name = "Sarah Wilson";
  const email = "sarah.wilson@example.com";





  const handleSettingPress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const handleThemePress = () => {
    handleSettingPress();
    setShowThemeSelector(true);
  };

  const handleLanguagePress = () => {
    handleSettingPress();
    setShowLanguageSelector(true);
  };

  const handleAudioStylePress = () => {
    handleSettingPress();
    setShowAudioStyleSelector(true);
  };

  const handleSelectTheme = (themeId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTheme(themeId);
    saveEncryptedSettings({ themeId, timestamp: Date.now() });
  };

  const handleToggleAutoTheme = (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleAutoTheme(value);
  };

  const handleSelectLanguage = async (lang: LanguageType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Check if language is actually changing
    if (lang === language) {
      setShowLanguageSelector(false);
      return;
    }
    
    // Show confirmation for language change with restart
    Alert.alert(
      'Restart Required',
      'The app needs to restart to apply the new language. This ensures all text is properly updated.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Restart Now',
          style: 'default',
          onPress: async () => {
            setIsChangingLanguage(true);
            console.log('[Settings] User confirmed language change to:', lang);
            await saveEncryptedSettings({ language: lang, timestamp: Date.now() });
            await setLanguageWithRestart(lang);
          },
        },
      ]
    );
  };

  const handleSelectAudioStyle = (style: AudioStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAudioStyle(style);
    saveEncryptedSettings({ audioStyle: style, timestamp: Date.now() });
  };

  const handleViewTracks = (style: AudioStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedStyleForTracks(style);
  };

  const handleSelectTrack = async (styleId: AudioStyle, trackIndex: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setSelectedTrack(styleId, trackIndex);
    if (audioStyle === styleId) {
      setAudioStyle(styleId);
    }
  };

  const handleFontSizePress = () => {
    handleSettingPress();
    setShowFontSizeSelector(true);
  };

  const handleSelectFontSize = async (size: FontSizeScale) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setFontSize(size);
    await saveEncryptedSettings({ fontSize: size, timestamp: Date.now() });
  };



  const currentLanguage = languages.find(lang => lang.code === language);



  if (selectedStyleForTracks) {
    const tracks = getTracksForStyle(selectedStyleForTracks);
    const selectedTrackIndex = getSelectedTrackForStyle(selectedStyleForTracks);
    return (
      <View style={styles.container}>
        <LinearGradient colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerContent}>
              <Music2 color={theme.colors.primary} size={32} strokeWidth={2.5} />
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                {AUDIO_STYLES.find(s => s.id === selectedStyleForTracks)?.name} Tracks
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Select which track to play
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {tracks.length > 0 ? (
              <View style={styles.audioStylesGrid}>
                {tracks.map((trackUri, index) => {
                  const isSelected = index === selectedTrackIndex;
                  const trackName = trackUri.split('/').pop()?.replace(/_/g, ' ') || `Track ${index + 1}`;
                  return (
                    <TouchableOpacity
                      key={`${trackUri}-${index}`}
                      style={[
                        styles.audioStyleCard,
                        { 
                          backgroundColor: theme.colors.cardBackground,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleSelectTrack(selectedStyleForTracks, index)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.audioStyleCardHeader}>
                        <Music2 color={isSelected ? theme.colors.primary : theme.colors.text.secondary} size={24} strokeWidth={2} />
                        {isSelected && (
                          <View style={[styles.selectedBadgeSmall, { backgroundColor: theme.colors.primary }]}>
                            <Check color="#FFFFFF" size={14} strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <View style={styles.audioStyleCardInfo}>
                        <Text style={[styles.audioStyleName, { color: theme.colors.text.primary, fontSize: 15 }]}>
                          {trackName}
                        </Text>
                        <Text style={[styles.audioStyleDescription, { color: theme.colors.text.secondary }]}>
                          Track {index + 1} of {tracks.length}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.emptyTracksCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
                <Music2 color={theme.colors.text.light} size={48} strokeWidth={1.5} />
                <Text style={[styles.emptyTracksText, { color: theme.colors.text.secondary }]}>
                  No tracks available for this style yet
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
              onPress={() => setSelectedStyleForTracks(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
                Back to Audio Styles
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  if (showAudioStyleSelector) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerContent}>
              <Music2 color={theme.colors.primary} size={32} strokeWidth={2.5} />
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Audio Style
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Choose your preferred audio style
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.audioStylesGrid}>
              {AUDIO_STYLES.map((style) => {
                const isSelected = style.id === audioStyle;
                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.audioStyleCard,
                      { 
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelectAudioStyle(style.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.audioStyleCardHeader}>
                      <Music2 color={isSelected ? theme.colors.primary : theme.colors.text.secondary} size={28} strokeWidth={2} />
                      {isSelected && (
                        <View style={[styles.selectedBadgeSmall, { backgroundColor: theme.colors.primary }]}>
                          <Check color="#FFFFFF" size={14} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <View style={styles.audioStyleCardInfo}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.audioStyleName, { color: theme.colors.text.primary }]}>
                          {style.name}
                        </Text>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleViewTracks(style.id);
                          }}
                          style={[styles.tracksButton, { backgroundColor: `${theme.colors.primary}15`, borderColor: theme.colors.primary }]}
                        >
                          <Text style={[styles.tracksButtonText, { color: theme.colors.primary }]}>
                            {getTracksForStyle(style.id).length} tracks
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.audioStyleDescription, { color: theme.colors.text.secondary }]}>
                        {style.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
              onPress={() => setShowAudioStyleSelector(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
                Back to Tools
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  if (showLanguageSelector) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerContent}>
              <Languages color={theme.colors.primary} size={32} strokeWidth={2.5} />
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Language
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Choose your preferred language
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {(isChangingLanguage || pendingRestart) && (
              <View style={[styles.restartOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.restartText}>
                  {pendingRestart ? 'Restarting app...' : 'Applying language...'}
                </Text>
              </View>
            )}

            <View style={styles.languagesGrid}>
              {languages.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageCard,
                      { 
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelectLanguage(lang.code)}
                    activeOpacity={0.7}
                    disabled={isChangingLanguage || pendingRestart}
                  >
                    <View style={styles.languageCardHeader}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      {isSelected && (
                        <View style={[styles.selectedBadgeSmall, { backgroundColor: theme.colors.primary }]}>
                          <Check color="#FFFFFF" size={14} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <View style={styles.languageCardInfo}>
                      <Text style={[styles.languageName, { color: theme.colors.text.primary }]}>
                        {lang.name}
                      </Text>
                      <Text style={[styles.languageNativeName, { color: theme.colors.text.secondary }]}>
                        {lang.nativeName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
              onPress={() => setShowLanguageSelector(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
                Back to Tools
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  if (showFontSizeSelector) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerContent}>
              <Type color={theme.colors.primary} size={32} strokeWidth={2.5} />
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Text Size
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Choose a comfortable reading size
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.audioStylesGrid}>
              {fontSizeOptions.map((option) => {
                const isSelected = option.scale === fontSize;
                const demoFontSize = Math.round(15 * option.multiplier);
                return (
                  <TouchableOpacity
                    key={option.scale}
                    style={[
                      styles.audioStyleCard,
                      { 
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelectFontSize(option.scale)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.audioStyleCardHeader}>
                      <Type color={isSelected ? theme.colors.primary : theme.colors.text.secondary} size={28} strokeWidth={2} />
                      {isSelected && (
                        <View style={[styles.selectedBadgeSmall, { backgroundColor: theme.colors.primary }]}>
                          <Check color="#FFFFFF" size={14} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <View style={styles.audioStyleCardInfo}>
                      <Text style={[styles.audioStyleName, { color: theme.colors.text.primary }]}>
                        {option.name}
                      </Text>
                      <Text style={[styles.audioStyleDescription, { color: theme.colors.text.secondary }]}>
                        {option.description}
                      </Text>
                      <View style={{ marginTop: 12, padding: 12, backgroundColor: `${theme.colors.primary}08`, borderRadius: 12 }}>
                        <Text style={{ fontSize: demoFontSize, color: theme.colors.text.primary, lineHeight: demoFontSize * 1.5 }}>
                          The quick brown fox jumps over the lazy dog
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
              onPress={() => setShowFontSizeSelector(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
                Back to Tools
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  if (showThemeSelector) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerContent}>
              <Palette color={theme.colors.primary} size={32} strokeWidth={2.5} />
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                Theme
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
              Customize your app appearance
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.autoThemeCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={styles.autoThemeHeader}>
                <Sparkles color={theme.colors.primary} size={24} strokeWidth={2} />
                <Text style={[styles.autoThemeTitle, { color: theme.colors.text.primary }]}>
                  Auto Theme
                </Text>
              </View>
              <Text style={[styles.autoThemeDescription, { color: theme.colors.text.secondary }]}>
                Automatically change theme based on holidays and seasons
              </Text>
              {activeHolidayTheme && autoThemeEnabled && (
                <View style={[styles.activeHolidayBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Text style={[styles.activeHolidayText, { color: theme.colors.primary }]}>
                    Active: {activeHolidayTheme.name}
                  </Text>
                </View>
              )}
              <View style={styles.switchContainer}>
                <Switch
                  value={autoThemeEnabled}
                  onValueChange={handleToggleAutoTheme}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Account
              </Text>
            </View>

            <View style={[styles.accountCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <View style={styles.accountRow}>
                <View style={[styles.accountIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <UserCircle2 color={theme.colors.primary} size={20} strokeWidth={2} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountLabel, { color: theme.colors.text.secondary }]}>Name</Text>
                  <Text style={[styles.accountValue, { color: theme.colors.text.primary }]}>{name}</Text>
                </View>
              </View>
              <View style={[styles.accountDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.accountRow}>
                <View style={[styles.accountIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
                  <User color={theme.colors.secondary} size={20} strokeWidth={2} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountLabel, { color: theme.colors.text.secondary }]}>Email</Text>
                  <Text style={[styles.accountValue, { color: theme.colors.text.primary }]}>{email}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                App Background
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                Choose a background for all app screens (except chats)
              </Text>
            </View>

            <View style={styles.backgroundGrid}>
              {appBackgrounds.map((bg) => {
                const isSelected = selectedBackground === bg.id;
                return (
                  <TouchableOpacity
                    key={bg.id}
                    style={[
                      styles.backgroundCard,
                      { 
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 3 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setBackground(bg.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.backgroundImageContainer}>
                      {bg.id === 'default' ? (
                        <View style={[styles.backgroundPlaceholder, { backgroundColor: theme.colors.border }]}>
                          <Text style={[styles.backgroundPlaceholderText, { color: theme.colors.text.secondary }]}>
                            {bg.name}
                          </Text>
                        </View>
                      ) : (
                        <Image
                          source={{ uri: bg.url }}
                          style={{ width: '100%', height: 100 }}
                          contentFit="cover"
                        />
                      )}
                      {isSelected && (
                        <View style={styles.backgroundSelectedBadge}>
                          <Check color="#FFFFFF" size={16} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.backgroundName, { color: theme.colors.text.primary }]}>
                      {bg.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Calendar Themes
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                Your calendars
              </Text>
            </View>

            <View style={styles.calendarThemesGrid}>
              {calendars.map((cal) => {
                const isSelected = selectedCalendar?.id === cal.id;
                return (
                  <TouchableOpacity
                    key={cal.id}
                    style={[
                      styles.calendarThemeCard,
                      { 
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.calendarColorPreview, { backgroundColor: cal.color }]}>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Check color="#FFFFFF" size={20} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <View style={styles.calendarThemeInfo}>
                      <Text style={[styles.calendarThemeName, { color: theme.colors.text.primary }]}>
                        {cal.name}
                      </Text>
                      {cal.isShared && (
                        <Text style={[styles.calendarSharedBadge, { color: theme.colors.text.secondary }]}>
                          Shared
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Color Themes
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
                {availableThemes.length} themes available
              </Text>
            </View>

            <View style={styles.themesGrid}>
              {availableThemes.map((themeItem) => {
                const isSelected = themeItem.id === theme.id;
                return (
                  <TouchableOpacity
                    key={themeItem.id}
                    style={[
                      styles.themeCard,
                      { 
                        backgroundColor: themeItem.colors.cardBackground,
                        borderColor: isSelected ? themeItem.colors.primary : themeItem.colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleSelectTheme(themeItem.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={themeItem.gradients.primary as any}
                      style={styles.themeColorPreview}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Check color="#FFFFFF" size={20} strokeWidth={3} />
                        </View>
                      )}
                    </LinearGradient>
                    <View style={styles.themeInfo}>
                      <Text style={[styles.themeName, { color: themeItem.colors.text.primary }]}>
                        {themeItem.name}
                      </Text>
                      <View style={styles.colorDots}>
                        <View style={[styles.colorDot, { backgroundColor: themeItem.colors.primary }]} />
                        <View style={[styles.colorDot, { backgroundColor: themeItem.colors.secondary }]} />
                        <View style={[styles.colorDot, { backgroundColor: themeItem.colors.morning }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
              onPress={() => setShowThemeSelector(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
                Back to Tools
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }



  return (
    <AppBackgroundWrapper overlayOpacity={0.15}>
    <View style={styles.container}>
      <LinearGradient colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTitleRow}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.headerIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles color="#FFFFFF" size={24} strokeWidth={2.5} />
            </LinearGradient>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Tools & Settings</Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
                Customize your experience
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.profileCard, { 
            backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
            borderWidth: 1,
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
          }]}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarInner}>
                <UserCircle2 color="#FFFFFF" size={28} strokeWidth={1.5} />
              </View>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>{name || "User"}</Text>
                <View style={[styles.verifiedBadge, { borderColor: theme.colors.primary, backgroundColor: isNightMode ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0,0,0,0.03)' }]}>
                  <Check color={theme.colors.primary} size={10} strokeWidth={2.5} />
                  <Text style={[styles.verifiedText, { color: theme.colors.primary }]}>Verified</Text>
                </View>
              </View>
              <Text style={[styles.profileEmail, { color: theme.colors.text.secondary }]}>{email || "user@example.com"}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Crown color={theme.colors.primary} size={18} strokeWidth={2.5} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Membership</Text>
            </View>
          </View>

          <View style={[styles.settingsCard, { 
            backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
            borderWidth: 1,
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
          }]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push("/membership");
              }}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: "#FFD70015" }]}>
                  <Crown color="#FFD700" size={22} strokeWidth={2} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>Premium Plan</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    Active subscription
                  </Text>
                </View>
              </View>
              <ChevronRight color={theme.colors.text.light} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${theme.colors.secondary}15` }]}>
                <Palette color={theme.colors.secondary} size={18} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Settings</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>Manage your preferences</Text>
              </View>
            </View>
          </View>

          <View style={[styles.settingsCard, { 
            backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
            borderWidth: 1,
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
          }]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push("/account-settings");
              }}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <UserCircle2 color={theme.colors.primary} size={22} strokeWidth={2} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>Account Settings</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    Manage your account information
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push("/app-tour");
              }}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Sparkles color={theme.colors.primary} size={22} strokeWidth={2} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>App Tour</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    Watch video tour & listen to Audrey&apos;s song
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                handleSettingPress();
                router.push("/notification-settings");
              }}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Bell color={theme.colors.primary} size={22} strokeWidth={2} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>Notifications</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    Manage event reminders
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: theme.id === "night-mode" ? "#FFD70015" : "#FFA50015" }]}>
                  {theme.id === "night-mode" ? (
                    <MoonIcon color="#FFD700" size={22} strokeWidth={2} />
                  ) : (
                    <Sun color="#FFA500" size={22} strokeWidth={2} />
                  )}
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>Night Mode</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    {theme.id === "night-mode" ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.modeSwitch,
                  { backgroundColor: theme.id === "night-mode" ? "#FFD70025" : "#FFA50025" }
                ]}
                onPress={() => {
                  handleSettingPress();
                  if (theme.id === "night-mode") {
                    setTheme("default");
                  } else {
                    setTheme("night-mode");
                  }
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.modeSwitchThumb,
                    {
                      transform: [{ translateX: theme.id === "night-mode" ? 28 : 0 }],
                      backgroundColor: theme.id === "night-mode" ? "#FFD700" : "#FFA500",
                    }
                  ]}
                >
                  {theme.id === "night-mode" ? (
                    <MoonIcon color="#1a0a1f" size={16} strokeWidth={2.5} />
                  ) : (
                    <Sun color="#FFFFFF" size={16} strokeWidth={2.5} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.settingDivider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleThemePress}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.morning}15` }]}>
                  <Palette color={theme.colors.morning} size={22} strokeWidth={2} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>Theme</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    {theme.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleLanguagePress}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
                  <Languages color={theme.colors.secondary} size={22} strokeWidth={2} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>Language</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    {currentLanguage?.nativeName || 'English'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleAudioStylePress}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <Music2 color={theme.colors.primary} size={22} strokeWidth={2} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>Audio Style</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    {currentStyleData.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={async () => {
                handleSettingPress();
                await toggleMute();
              }}
              activeOpacity={0.7}
              disabled={isMusicLoading || isMusicDisabled}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
                  {isMuted ? (
                    <VolumeX color={theme.colors.secondary} size={22} strokeWidth={2} />
                  ) : (
                    <Volume2 color={theme.colors.secondary} size={22} strokeWidth={2} />
                  )}
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>Sound</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    {isMusicDisabled ? 'Unavailable' : isMuted ? 'Muted' : 'Enabled'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleFontSizePress}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: `${theme.colors.morning}15` }]}>
                  <Type color={theme.colors.morning} size={22} strokeWidth={2} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>Text Size</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>  
                    {fontSizeConfig.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: universeMode === "universe" ? "#9D4EDD15" : "#4A90E215" }]}>
                  <Sparkles color={universeMode === "universe" ? "#9D4EDD" : "#4A90E2"} size={22} strokeWidth={2} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.text.primary }]}>App Mode</Text>
                  <Text style={[styles.settingSubtext, { color: theme.colors.text.secondary }]}>
                    {universeMode === "universe" ? "Universe Mode" : "Classic Mode"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.modeSwitch,
                  { backgroundColor: universeMode === "universe" ? "#9D4EDD25" : "#4A90E225" }
                ]}
                onPress={() => {
                  handleSettingPress();
                  setUniverseMode(universeMode === "universe" ? "classic" : "universe");
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.modeSwitchThumb,
                    {
                      transform: [{ translateX: universeMode === "universe" ? 28 : 0 }],
                      backgroundColor: universeMode === "universe" ? "#9D4EDD" : "#4A90E2",
                    }
                  ]}
                >
                  <Sparkles color="#FFFFFF" size={16} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, { 
              backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
              borderWidth: 1.5,
              borderColor: isNightMode ? "rgba(255, 20, 147, 0.3)" : "#F77F8B30",
            }]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              console.log("Logout disabled for demo account");
            }}
            activeOpacity={0.7}
            disabled={true}
          >
            <LogOut color="#F77F8B" size={20} strokeWidth={2} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={[styles.signedInBadge, { 
            backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground, 
            borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : theme.colors.border 
          }]}>
            <Text style={[styles.signedInText, { color: theme.colors.text.secondary }]}>
              You are signed in with a demo account
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
    </AppBackgroundWrapper>
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
    paddingHorizontal: 28,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 24,
  },
  headerIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  headerTextContainer: {
    flex: 1,
    gap: 8,
  },
  headerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900" as const,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
    opacity: 0.65,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
  },
  noAccountCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  noAccountTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginTop: 16,
    marginBottom: 8,
  },
  noAccountText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  createAccountButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createAccountGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  createAccountText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
  },
  submitButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  profileCard: {
    borderRadius: 32,
    padding: 22,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 18,
    marginBottom: 32,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  avatarGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 19,
    fontWeight: "600" as const,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: "400" as const,
    opacity: 0.7,
    marginTop: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  verifiedBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "900" as const,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    marginTop: 4,
    opacity: 0.6,
  },
  settingsCard: {
    borderRadius: 32,
    overflow: "hidden" as const,
    marginBottom: 32,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  settingItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: 22,
  },
  settingLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 18,
    flex: 1,
  },
  settingIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  settingTextContainer: {
    gap: 4,
    flex: 1,
  },
  settingText: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },
  settingSubtext: {
    fontSize: 14,
    fontWeight: "500" as const,
    opacity: 0.6,
    marginTop: 3,
  },
  settingDivider: {
    height: 1,
    marginLeft: 80,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingVertical: 18,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#F77F8B30",
    opacity: 0.5,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#F77F8B",
    letterSpacing: -0.2,
  },
  autoThemeCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
  },
  autoThemeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  autoThemeTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  autoThemeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  activeHolidayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  activeHolidayText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  switchContainer: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  themesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  themeCard: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  themeColorPreview: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  themeInfo: {
    padding: 12,
    gap: 8,
  },
  themeName: {
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  colorDots: {
    flexDirection: "row",
    gap: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  backButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  languagesGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 24,
  },
  languageCard: {
    width: "48%" as const,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  languageCardHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  languageFlag: {
    fontSize: 36,
  },
  selectedBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  languageCardInfo: {
    gap: 4,
  },
  languageName: {
    fontSize: 15,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  languageNativeName: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  audioStylesGrid: {
    gap: 16,
    marginBottom: 24,
  },
  audioStyleCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  audioStyleCardHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  audioStyleCardInfo: {
    gap: 6,
  },
  audioStyleName: {
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  audioStyleDescription: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  signedInBadge: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    marginTop: 12,
  },
  signedInText: {
    fontSize: 13,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  accountCard: {
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
  },
  accountRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  accountInfo: {
    flex: 1,
    gap: 4,
  },
  accountLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  accountDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  backgroundGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 24,
  },
  backgroundCard: {
    width: "48%" as const,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  backgroundImageContainer: {
    position: "relative" as const,
  },
  backgroundPlaceholder: {
    height: 100,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 8,
  },
  backgroundPlaceholderText: {
    fontSize: 12,
    fontWeight: "600" as const,
    textAlign: "center" as const,
  },
  backgroundSelectedBadge: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  backgroundName: {
    fontSize: 12,
    fontWeight: "600" as const,
    padding: 8,
    textAlign: "center" as const,
  },
  calendarThemesGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 24,
  },
  calendarThemeCard: {
    width: "48%" as const,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  calendarColorPreview: {
    height: 100,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  calendarThemeInfo: {
    padding: 12,
    gap: 4,
  },
  calendarThemeName: {
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  calendarSharedBadge: {
    fontSize: 11,
    fontWeight: "500" as const,
  },

  learnCard: {
    borderRadius: 32,
    padding: 26,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 20,
    marginBottom: 18,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  learnIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  learnInfo: {
    flex: 1,
    gap: 6,
  },
  learnTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    letterSpacing: -0.2,
  },
  learnSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    opacity: 0.65,
    lineHeight: 22,
  },
  emptyTracksCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  emptyTracksText: {
    fontSize: 15,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  tracksButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  tracksButtonText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  modeSwitch: {
    width: 64,
    height: 36,
    borderRadius: 18,
    padding: 4,
    justifyContent: "center" as const,
  },
  modeSwitchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  restartOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: 20,
    gap: 16,
  },
  restartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
