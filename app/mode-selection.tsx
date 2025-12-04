import { StyleSheet, Text, View, TouchableOpacity, Animated, Platform, Easing } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { LayoutGrid, CircleDot, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useUniverseMode, UniverseMode } from '@/contexts/UniverseModeContext';
import { useLanguage } from '@/contexts/LanguageContext';


export default function ModeSelectionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { setMode } = useUniverseMode();
  const { t } = useLanguage();

  const [selectedMode, setSelectedMode] = useState<UniverseMode>('universe');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const universeScaleAnim = useRef(new Animated.Value(1)).current;
  const classicScaleAnim = useRef(new Animated.Value(1)).current;
  const planetMotion = useRef(new Animated.Value(0)).current;

  const isNightMode = theme.id === 'night-mode';

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

  const handleModeSelect = (mode: UniverseMode) => {
    setSelectedMode(mode);
    
    const scaleAnim = mode === 'universe' ? universeScaleAnim : classicScaleAnim;
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
    await setMode(selectedMode);
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/theme-selection');
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
                    testID="mode-selection-symbol"
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
                {t.pickYourMode}
              </Text>
            </View>
          </View>

          <View style={styles.middleSection}>
            <View style={styles.previewContainer}>
              {/* Universe Mode Preview */}
              <Animated.View 
                style={[
                  styles.previewWrapper,
                  { transform: [{ scale: universeScaleAnim }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.previewCard,
                    selectedMode === 'universe' && styles.selectedCard,
                  ]}
                  onPress={() => handleModeSelect('universe')}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={isNightMode 
                      ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 215, 0, 0.03)']
                      : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.4)']}
                    style={styles.previewGradient}
                  >
                    <View style={styles.previewContent}>
                      <View style={styles.previewHeader}>
                        <CircleDot color={isNightMode ? '#FFD700' : '#764ba2'} size={32} strokeWidth={2} />
                        <Text style={[styles.modeLabel, { color: isNightMode ? '#FFD700' : '#764ba2' }]}>{t.universeModeTitle}</Text>
                      </View>
                      
                      {/* Mini preview of Universe UI */}
                      <View style={[styles.miniPreview, { backgroundColor: isNightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }]}>
                        <View style={styles.universeContainer}>
                          <View style={[styles.planetCircle, { width: 40, height: 40, backgroundColor: '#FFD700' }]} />
                          <View style={[styles.orbitDot, { top: 0, left: '50%', transform: [{ translateX: -4 }] }]} />
                          <View style={[styles.orbitDot, { bottom: 0, left: '50%', transform: [{ translateX: -4 }] }]} />
                          <View style={[styles.orbitDot, { left: 0, top: '50%', transform: [{ translateY: -4 }] }]} />
                          <View style={[styles.orbitDot, { right: 0, top: '50%', transform: [{ translateY: -4 }] }]} />
                        </View>
                      </View>
                    </View>
                    
                    {selectedMode === 'universe' && (
                      <View style={styles.selectedBadge}>
                        <LinearGradient
                          colors={['#FFD700', '#FDB931', '#FFD700']}
                          style={styles.selectedBadgeGradient}
                        >
                          <Text style={[styles.selectedText, { color: '#000000' }]}>{t.selected}</Text>
                        </LinearGradient>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Classic Mode Preview */}
              <Animated.View 
                style={[
                  styles.previewWrapper,
                  { transform: [{ scale: classicScaleAnim }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.previewCard,
                    selectedMode === 'classic' && styles.selectedCard,
                  ]}
                  onPress={() => handleModeSelect('classic')}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={isNightMode 
                      ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 215, 0, 0.03)']
                      : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.4)']}
                    style={styles.previewGradient}
                  >
                    <View style={styles.previewContent}>
                      <View style={styles.previewHeader}>
                        <LayoutGrid color={isNightMode ? '#FFD700' : '#764ba2'} size={32} strokeWidth={2} />
                        <Text style={[styles.modeLabel, { color: isNightMode ? '#FFD700' : '#764ba2' }]}>{t.classicModeTitle}</Text>
                      </View>
                      
                      {/* Mini preview of Classic UI */}
                      <View style={[styles.miniPreview, { backgroundColor: isNightMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }]}>
                        <View style={[styles.miniHeader, { backgroundColor: isNightMode ? '#FFD700' : '#764ba2', opacity: 0.5 }]} />
                        <View style={styles.miniContent}>
                           {/* Calendar grid simulation */}
                           <View style={{flexDirection: 'row', gap: 2, flexWrap: 'wrap'}}>
                              {[...Array(9)].map((_, i) => (
                                <View key={i} style={{width: 8, height: 8, backgroundColor: isNightMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', borderRadius: 1}} />
                              ))}
                           </View>
                        </View>
                        <View style={[styles.miniTabBar, { backgroundColor: isNightMode ? '#FFD700' : '#764ba2', opacity: 0.5 }]}>
                             {/* Curved formation simulation */}
                            <View style={{position: 'absolute', bottom: 5, left: '50%', marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', elevation: 2}} />
                        </View>
                      </View>
                    </View>
                    
                    {selectedMode === 'classic' && (
                      <View style={styles.selectedBadge}>
                        <LinearGradient
                          colors={['#FFD700', '#FDB931', '#FFD700']}
                          style={styles.selectedBadgeGradient}
                        >
                          <Text style={[styles.selectedText, { color: '#000000' }]}>{t.selected}</Text>
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
                {t.switchModesAnytime}
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
                }]}>{t.continue}</Text>
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
    marginTop: 20,
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
  modeLabel: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  miniPreview: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  miniHeader: {
    width: '100%',
    height: 15,
    borderRadius: 4,
    marginBottom: 8,
  },
  miniContent: {
    flex: 1,
    width: '100%',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTabBar: {
    width: '100%',
    height: 20,
    borderRadius: 10,
    marginTop: 8,
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
