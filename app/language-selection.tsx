import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Platform, Easing } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { languageInfo, supportedLanguages } from '@/utils/i18n';

type FontStyleOption = {
  id: 'modernSans' | 'elegantSerif' | 'roundedSoft';
  label: string;
  description: string;
  fontFamily: {
    ios: string;
    android: string;
    web: string;
  };
  fontSize: number;
  letterSpacing: number;
  textTransform?: 'none' | 'uppercase';
};

const languages = supportedLanguages.map((code) => ({
  code,
  ...languageInfo[code],
}));

const fontStyleOptions: FontStyleOption[] = [
  {
    id: 'modernSans',
    label: 'Modern Sans',
    description: 'Clean & easy to scan',
    fontFamily: {
      ios: 'System',
      android: 'sans-serif-medium',
      web: 'Inter, system-ui, -apple-system, sans-serif',
    },
    fontSize: 22,
    letterSpacing: 0.8,
  },
  {
    id: 'elegantSerif',
    label: 'Elegant Serif',
    description: 'Editorial & classic',
    fontFamily: {
      ios: 'Times New Roman',
      android: 'serif',
      web: '"Playfair Display", Georgia, serif',
    },
    fontSize: 24,
    letterSpacing: 0.6,
  },
  {
    id: 'roundedSoft',
    label: 'Rounded Soft',
    description: 'Friendly & warm',
    fontFamily: {
      ios: 'Helvetica Neue',
      android: 'sans-serif-light',
      web: '"Nunito", "Helvetica Neue", sans-serif',
    },
    fontSize: 21,
    letterSpacing: 0.4,
    textTransform: 'none',
  },
];

const getFontFamily = (option: FontStyleOption) =>
  Platform.select({
    ios: option.fontFamily.ios,
    android: option.fontFamily.android,
    web: option.fontFamily.web,
    default: option.fontFamily.ios,
  }) ?? option.fontFamily.ios;



export default function LanguageSelectionScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const { theme } = useTheme();
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const scaleAnims = useRef(languages.map(() => new Animated.Value(1))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const planetMotion = useRef(new Animated.Value(0)).current;

  const isNightMode = theme.id === 'night-mode';

  const activeFontOption = useMemo(
    () => fontStyleOptions.find((option) => option.id === 'roundedSoft') ?? fontStyleOptions[0],
    [],
  );

  const resolvedTitleFontFamily = useMemo(() => getFontFamily(activeFontOption), [activeFontOption]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, headerScale, slideAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(planetMotion, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(planetMotion, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [planetMotion]);

  const handleLanguageSelect = (lang: Language, index: number) => {
    setSelectedLang(lang);

    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = async () => {
    await setLanguage(selectedLang);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/mode-selection');
    });
  };

  const planetTranslateY = planetMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 6],
  });

  const planetRotate = planetMotion.interpolate({
    inputRange: [0, 1],
    outputRange: ['-4deg', '4deg'],
  });

  return (
    <LinearGradient
      colors={isNightMode ? ['#000000', '#0A0A0A', '#000000'] : (theme.gradients.background as unknown as readonly [string, string, ...string[]])}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Animated.View
          style={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, 8),
              paddingBottom: Math.max(insets.bottom, 20),
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View style={[styles.header, { transform: [{ scale: headerScale }] }]}>
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.planetOrbit,
                  {
                    transform: [
                      { translateY: planetTranslateY },
                      { rotate: planetRotate },
                    ],
                  },
                ]}
              >
                  <Image
                    source={{ uri: 'https://r2-pub.rork.com/generated-images/99be75bb-c483-4389-9089-5a7e697c1523.png' }}
                    style={{ width: 90, height: 90 }}
                    contentFit="contain"
                    testID="language-selection-symbol"
                  />
              </Animated.View>
            </View>
            <Text
              testID="language-selection-title"
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.title,
                {
                  width: '100%',
                  color: '#FFD700',
                  textShadowColor: '#996515', // Darker gold/brown for 3D depth
                  textShadowOffset: { width: 1.5, height: 3 },
                  textShadowRadius: 1,
                  fontFamily: resolvedTitleFontFamily,
                  letterSpacing: 1.2,
                  fontSize: 20,
                  lineHeight: 28,
                  textTransform: 'uppercase',
                  fontWeight: '900',
                },
              ]}
            >
              {t.selectLanguage}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: isNightMode ? 'rgba(233, 227, 255, 0.7)' : 'rgba(59, 29, 98, 0.7)' },
              ]}
            >
              {t.chooseYourPreferredLanguage}
            </Text>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.languageList}
            showsVerticalScrollIndicator={false}
          >
            {languages.map((lang, index) => {
              const isSelected = selectedLang === lang.code;
              return (
                <Animated.View
                  key={lang.code}
                  style={[
                    styles.languageCardWrapper,
                    {
                      transform: [{ scale: scaleAnims[index] }],
                      opacity: fadeAnim,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.languageCard,
                      {
                        backgroundColor: isNightMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                        borderColor: isSelected
                          ? isNightMode
                            ? '#FFD700'
                            : theme.colors.primary
                          : isNightMode
                            ? 'rgba(255, 215, 0, 0.2)'
                            : 'rgba(76, 175, 80, 0.3)',
                      },
                      isSelected && styles.languageCardSelected,
                    ]}
                    onPress={() => handleLanguageSelect(lang.code, index)}
                    activeOpacity={0.85}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={
                          isNightMode
                            ? ['rgba(255, 215, 0, 0.08)', 'rgba(255, 0, 255, 0.05)']
                            : ['rgba(76, 175, 80, 0.12)', 'rgba(129, 199, 132, 0.08)']
                        }
                        style={styles.selectedOverlay}
                      />
                    )}
                    <View style={styles.languageCardContent}>
                      <View
                        style={[
                          styles.flagContainer,
                          {
                            backgroundColor: isNightMode
                              ? 'rgba(255, 215, 0, 0.15)'
                              : 'rgba(76, 175, 80, 0.2)',
                            borderColor: isNightMode
                              ? 'rgba(255, 215, 0, 0.3)'
                              : 'rgba(102, 187, 106, 0.4)',
                          },
                        ]}
                      >
                        <Text style={styles.flag}>{lang.flag}</Text>
                      </View>
                      <View style={styles.languageInfo}>
                        <Text
                          style={[
                            styles.languageName,
                            { color: isNightMode ? '#FFFFFF' : '#1B5E20' },
                            isSelected && styles.languageNameSelected,
                          ]}
                        >
                          {languageInfo[lang.code].name}
                        </Text>
                        <Text
                          style={[
                            styles.languageNativeName,
                            { color: isNightMode ? theme.colors.text.light : '#558B2F' },
                            isSelected && styles.languageNativeNameSelected,
                          ]}
                        >
                          {languageInfo[lang.code].nativeName}
                        </Text>
                      </View>
                    </View>
                    {isSelected ? (
                      <View style={styles.checkContainer}>
                        <LinearGradient
                          colors={
                            isNightMode
                              ? ['#FFD700', '#FF00FF']
                              : (theme.gradients.primary as unknown as readonly [string, string, ...string[]])
                          }
                          style={styles.checkCircle}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Check color={isNightMode ? '#000000' : '#FFFFFF'} size={18} strokeWidth={3} />
                        </LinearGradient>
                      </View>
                    ) : (
                      <ChevronRight color={isNightMode ? '#FFD700' : theme.colors.primary} size={24} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FFD700', '#FDB931', '#FFD700']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: '#000000' },
                  ]}
                >
                  {t.continue}
                </Text>
                <ChevronRight color="#000000" size={20} strokeWidth={3} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 12,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  planetOrbit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
    marginBottom: 24,
  },
  languageList: {
    paddingBottom: 24,
  },
  languageCardWrapper: {
    marginBottom: 10,
  },
  languageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    padding: 12,
    paddingHorizontal: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    overflow: 'hidden',
  },
  languageCardSelected: {
    backgroundColor: 'rgba(200, 230, 201, 0.5)',
    borderColor: '#4CAF50',
    borderWidth: 1.5,
    elevation: 4,
    shadowColor: '#66BB6A',
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  selectedOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  languageCardContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  flagContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 187, 106, 0.4)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  flag: {
    fontSize: 24,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1B5E20',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  languageNameSelected: {
    color: '#2E7D32',
    fontWeight: '800' as const,
  },
  languageNativeName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#558B2F',
    letterSpacing: 0.2,
  },
  languageNativeNameSelected: {
    color: '#388E3C',
    fontWeight: '600' as const,
  },
  checkContainer: {
    marginLeft: 12,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    elevation: 4,
    shadowColor: '#66BB6A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  buttonContainer: {
    gap: 16,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      web: 'system-ui, -apple-system, sans-serif',
    }),
  },
});
