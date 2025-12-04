import { StyleSheet, Text, View, TouchableOpacity, Animated, Platform, Easing } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Moon, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useUniverseMode } from '@/contexts/UniverseModeContext';
import { DEFAULT_THEMES } from '@/constants/themes';



export default function ThemeSelectionScreen() {
  const insets = useSafeAreaInsets();
  const { theme, setTheme } = useTheme();
  const { mode } = useUniverseMode();
  const [selectedMode, setSelectedMode] = useState<'bright' | 'night'>('bright');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const brightScaleAnim = useRef(new Animated.Value(1)).current;
  const nightScaleAnim = useRef(new Animated.Value(1)).current;
  const planetMotion = useRef(new Animated.Value(0)).current;

  const isNightMode = theme.id === 'night-mode';
  const brightTheme = DEFAULT_THEMES.find(theme => theme.id === 'bright') || DEFAULT_THEMES[0];
  const nightTheme = DEFAULT_THEMES.find(theme => theme.id === 'night') || DEFAULT_THEMES[1];

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
    ]).start();
  }, [fadeAnim, slideAnim]);

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

  const handleModeSelect = (mode: 'bright' | 'night') => {
    setSelectedMode(mode);
    const themeToApply = mode === 'bright' ? brightTheme : nightTheme;
    setTheme(themeToApply.id);
    
    const scaleAnim = mode === 'bright' ? brightScaleAnim : nightScaleAnim;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = async () => {
    const themeToApply = selectedMode === 'bright' ? brightTheme : nightTheme;
    await setTheme(themeToApply.id);
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/account-creation');
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
        <Animated.View 
          style={[
            styles.content, 
            { 
              paddingTop: Math.max(insets.top - 6, 0),
              paddingBottom: Math.max(insets.bottom, 20),
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >


          <View style={styles.topSection}>
            <View style={styles.iconContainer}>
              <View
                style={styles.symbolBackdrop}
              >
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
                    testID="theme-selection-symbol"
                  />
                </Animated.View>
              </View>
            </View>
            <View style={styles.header}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.title,
                  {
                    width: '100%',
                    color: '#FFD700',
                    textShadowColor: '#996515',
                    textShadowOffset: { width: 1.5, height: 3 },
                    textShadowRadius: 1,
                    fontSize: 20,
                    letterSpacing: 1.2,
                    lineHeight: 28,
                    textTransform: 'uppercase',
                    fontWeight: '900',
                  }
                ]}
              >
                CHOOSE YOUR STYLE
              </Text>
            </View>
          </View>

          <View style={styles.middleSection}>
            <View style={styles.previewContainer}>
              {/* Bright Mode Preview */}
              <Animated.View 
                style={[
                  styles.previewWrapper,
                  { transform: [{ scale: brightScaleAnim }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.previewCard,
                    selectedMode === 'bright' && styles.selectedCard,
                  ]}
                  onPress={() => handleModeSelect('bright')}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={isNightMode 
                      ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 215, 0, 0.03)']
                      : ['#9D4EDD', '#FFFFFF', '#FFB6D9']}
                    style={styles.previewGradient}
                  >
                    <View style={styles.previewContent}>
                      <View style={styles.previewHeader}>
                        <Sun color={isNightMode ? '#FFD700' : '#FFD700'} size={32} strokeWidth={2} />
                        <Text style={[styles.brightModeLabel, { color: isNightMode ? '#FFD700' : '#764ba2' }]}>Bright Mode</Text>
                      </View>
                      
                      {/* Mini preview of app UI */}
                      <View style={[styles.miniPreview, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                        {mode === 'universe' ? (
                          <View style={styles.universeContainer}>
                            <View style={[styles.planetCircle, { width: 40, height: 40, backgroundColor: isNightMode ? '#FFD700' : '#667eea' }]} />
                            <View style={[styles.orbitDot, { top: 0, left: '50%', transform: [{ translateX: -4 }], backgroundColor: isNightMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)' }]} />
                            <View style={[styles.orbitDot, { bottom: 0, left: '50%', transform: [{ translateX: -4 }], backgroundColor: isNightMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)' }]} />
                            <View style={[styles.orbitDot, { left: 0, top: '50%', transform: [{ translateY: -4 }], backgroundColor: isNightMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)' }]} />
                            <View style={[styles.orbitDot, { right: 0, top: '50%', transform: [{ translateY: -4 }], backgroundColor: isNightMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)' }]} />
                          </View>
                        ) : (
                          <>
                            <View style={[styles.miniHeader, { backgroundColor: isNightMode ? '#FFD700' : '#667eea' }]} />
                            <View style={styles.miniContent}>
                              <View style={[styles.miniCard, { backgroundColor: isNightMode ? 'rgba(255, 215, 0, 0.1)' : '#FFFFFF' }]} />
                              <View style={[styles.miniCard, { backgroundColor: isNightMode ? 'rgba(255, 0, 255, 0.1)' : '#F093FB' }]} />
                            </View>
                            <View style={[styles.miniTabBar, { backgroundColor: isNightMode ? '#FF00FF' : '#764ba2' }]} />
                          </>
                        )}
                      </View>
                    </View>
                    
                    {selectedMode === 'bright' && (
                      <View style={styles.selectedBadge}>
                        <LinearGradient
                          colors={['#FFD700', '#FDB931', '#FFD700']}
                          style={styles.selectedBadgeGradient}
                        >
                          <Text style={[styles.selectedText, { color: '#000000' }]}>Selected</Text>
                        </LinearGradient>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Night Mode Preview */}
              <Animated.View 
                style={[
                  styles.previewWrapper,
                  { transform: [{ scale: nightScaleAnim }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.previewCard,
                    selectedMode === 'night' && styles.selectedCard,
                  ]}
                  onPress={() => handleModeSelect('night')}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#000000', '#0A0A0A', '#000000']}
                    style={styles.previewGradient}
                  >
                    <View style={styles.previewContent}>
                      <View style={styles.previewHeader}>
                        <Moon color="#FFD700" size={32} strokeWidth={2} />
                        <Text style={[styles.nightModeLabel, { color: '#FFD700' }]}>Night Mode</Text>
                      </View>
                      
                      {/* Mini preview of app UI */}
                      <View style={[styles.miniPreview, { backgroundColor: 'rgba(20, 20, 20, 0.85)' }]}>
                        {mode === 'universe' ? (
                          <View style={styles.universeContainer}>
                            <View style={[styles.planetCircle, { width: 40, height: 40, backgroundColor: '#FFD700' }]} />
                            <View style={[styles.orbitDot, { top: 0, left: '50%', transform: [{ translateX: -4 }], backgroundColor: 'rgba(255,255,255,0.6)' }]} />
                            <View style={[styles.orbitDot, { bottom: 0, left: '50%', transform: [{ translateX: -4 }], backgroundColor: 'rgba(255,255,255,0.6)' }]} />
                            <View style={[styles.orbitDot, { left: 0, top: '50%', transform: [{ translateY: -4 }], backgroundColor: 'rgba(255,255,255,0.6)' }]} />
                            <View style={[styles.orbitDot, { right: 0, top: '50%', transform: [{ translateY: -4 }], backgroundColor: 'rgba(255,255,255,0.6)' }]} />
                          </View>
                        ) : (
                          <>
                            <View style={[styles.miniHeader, { backgroundColor: '#FF00FF' }]} />
                            <View style={styles.miniContent}>
                              <View style={[styles.miniCard, { backgroundColor: 'rgba(255, 0, 255, 0.15)' }]} />
                              <View style={[styles.miniCard, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]} />
                            </View>
                            <View style={[styles.miniTabBar, { backgroundColor: '#FFD700' }]} />
                          </>
                        )}
                      </View>
                    </View>
                    
                    {selectedMode === 'night' && (
                      <View style={styles.selectedBadge}>
                        <LinearGradient
                          colors={['#FFD700', '#FDB931', '#FFD700']}
                          style={styles.selectedBadgeGradient}
                        >
                          <Text style={[styles.selectedText, { color: '#000000' }]}>Selected</Text>
                        </LinearGradient>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={[
                styles.infoText,
                { color: isNightMode ? theme.colors.text.light : theme.colors.text.secondary }
              ]}>
                You can change this anytime in Settings
              </Text>
            </View>
          </View>

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
                <Text style={[styles.buttonText, { 
                  color: '#000000' 
                }]}>Continue</Text>
                <ChevronRight color="#000000" size={20} strokeWidth={3} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  topSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  header: {
    alignItems: 'center' as const,
    marginTop: 10,
  },
  iconContainer: {
    marginBottom: 16,
    marginTop: 50,
    alignItems: 'center',
  },
  symbolBackdrop: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetOrbit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      web: 'system-ui, -apple-system, sans-serif',
    }),
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.2,
    lineHeight: 18,
  },

  middleSection: {
    flex: 1,
    justifyContent: 'center',
  },

  previewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  previewWrapper: {
    flex: 1,
  },
  previewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    height: 260,
  },
  selectedCard: {
    elevation: 8,
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  previewGradient: {
    flex: 1,
    padding: 16,
  },
  previewContent: {
    flex: 1,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brightModeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#764ba2',
    marginTop: 8,
  },
  nightModeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  miniPreview: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
  },
  miniHeader: {
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  miniContent: {
    flex: 1,
    gap: 6,
  },
  miniCard: {
    height: 40,
    borderRadius: 6,
  },
  miniTabBar: {
    height: 25,
    borderRadius: 4,
    marginTop: 8,
  },
  universeContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planetCircle: {
    borderRadius: 20,
  },
  orbitDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 40,
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