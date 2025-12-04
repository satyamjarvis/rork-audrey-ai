import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { X, Video, Music2, Sparkles, Play, User, Cloud, HelpCircle, Sun, Smile } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function AppTour() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';

  const [showVideo, setShowVideo] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const scene1Opacity = useRef(new Animated.Value(0)).current;
  const scene2Opacity = useRef(new Animated.Value(0)).current;
  const scene3Opacity = useRef(new Animated.Value(0)).current;
  const scene4Opacity = useRef(new Animated.Value(0)).current;
  const whiteOverlayOpacity = useRef(new Animated.Value(0)).current;

  const userShake = useRef(new Animated.Value(0)).current;
  const cloud1Pos = useRef(new Animated.Value(0)).current;
  const cloud2Pos = useRef(new Animated.Value(0)).current;
  const questionOpacity = useRef(new Animated.Value(0)).current;

  const audreyScale = useRef(new Animated.Value(0)).current;
  const audreyGlow = useRef(new Animated.Value(0)).current;

  const pathProgress = useRef(new Animated.Value(0)).current;
  const userMove = useRef(new Animated.Value(0)).current;

  const userJump = useRef(new Animated.Value(0)).current;
  const sunScale = useRef(new Animated.Value(0)).current;

  const runAnimationSequence = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://rork.app/pa/ier8mze8ucoqq9oktvadp/song_hope_no_lyrics_1' },
        { shouldPlay: true, isLooping: false, volume: 0.7 }
      );
      
      soundRef.current = sound;
      console.log('[AppTour] Background music started playing');
    } catch (error) {
      console.error('[AppTour] Error loading background music:', error);
    }
    
    Animated.sequence([
      Animated.timing(scene1Opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(userShake, { toValue: -5, duration: 100, useNativeDriver: true }),
            Animated.timing(userShake, { toValue: 5, duration: 100, useNativeDriver: true }),
            Animated.timing(userShake, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]),
          { iterations: 10 }
        ),
        Animated.timing(cloud1Pos, { toValue: 20, duration: 3000, useNativeDriver: true }),
        Animated.timing(cloud2Pos, { toValue: -20, duration: 3000, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(questionOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.delay(1000),
        ])
      ]),

      Animated.timing(scene1Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),

      Animated.parallel([
        Animated.timing(scene2Opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(audreyScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(audreyGlow, { toValue: 1, duration: 750, useNativeDriver: true }),
            Animated.timing(audreyGlow, { toValue: 0.5, duration: 750, useNativeDriver: true }),
          ]),
          { iterations: 2 }
        )
      ]),
      Animated.delay(1500),
      Animated.timing(scene2Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),

      Animated.parallel([
        Animated.timing(scene3Opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pathProgress, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(userMove, { toValue: 1, duration: 2000, delay: 500, useNativeDriver: true }),
      ]),
      Animated.delay(1000),
      Animated.timing(scene3Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),

      Animated.parallel([
        Animated.timing(scene4Opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(sunScale, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.sequence([
            Animated.delay(500),
            Animated.spring(userJump, { toValue: -50, friction: 5, useNativeDriver: true }),
            Animated.spring(userJump, { toValue: 0, friction: 5, useNativeDriver: true }),
        ])
      ]),
      Animated.delay(2000),

      Animated.timing(whiteOverlayOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start(async () => {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            console.log('[AppTour] Background music stopped and unloaded');
          } catch (error) {
            console.error('[AppTour] Error stopping background music:', error);
          }
        }
        
        setShowVideo(false);
    });
  }, [whiteOverlayOpacity, scene1Opacity, userShake, cloud1Pos, cloud2Pos, questionOpacity, scene2Opacity, audreyScale, audreyGlow, scene3Opacity, pathProgress, userMove, scene4Opacity, sunScale, userJump]);

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handlePlayVideo = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowVideo(true);
    runAnimationSequence();
  };

  const handleOpenSong = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/audreys-song');
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch((error) => {
          console.error('[AppTour] Error unloading sound on unmount:', error);
        });
      }
    };
  }, []);

  if (showVideo) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.scene, { opacity: scene1Opacity }]}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={{ transform: [{ translateX: userShake }] }}>
              <User size={80} color="#8899a6" />
          </Animated.View>
          <Animated.View style={[styles.absolute, { top: height * 0.3, left: width * 0.2, transform: [{ translateX: cloud1Pos }] }]}>
              <Cloud size={100} color="#30475e" />
          </Animated.View>
          <Animated.View style={[styles.absolute, { top: height * 0.35, right: width * 0.2, transform: [{ translateX: cloud2Pos }] }]}>
              <Cloud size={120} color="#223344" />
          </Animated.View>
          <Animated.View style={[styles.absolute, { top: height * 0.45, right: width * 0.35, opacity: questionOpacity }]}>
              <HelpCircle size={40} color="#a6b1e1" />
          </Animated.View>
          <Text style={styles.textDistress}>Lost & Overwhelmed...</Text>
        </Animated.View>

        <Animated.View style={[styles.scene, { opacity: scene2Opacity }]}>
           <LinearGradient
            colors={['#1a1a2e', '#4a1e50', '#8a2be2']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={{ transform: [{ scale: audreyScale }] }}>
               <Sparkles size={120} color="#ffd700" />
          </Animated.View>
          <Text style={styles.textDiscovery}>Then you found Audrey</Text>
        </Animated.View>

        <Animated.View style={[styles.scene, { opacity: scene3Opacity }]}>
          <LinearGradient
            colors={['#2c3e50', '#3498db', '#8e44ad']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.pathContainer}>
              <Animated.View style={[styles.pathLine, { 
                  width: pathProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) 
              }]} />
          </View>
          <Animated.View style={{ 
              transform: [
                  { translateX: userMove.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] }) }
              ] 
          }}>
              <User size={80} color="#fff" />
          </Animated.View>
          <Text style={styles.textGuidance}>Showing you the way</Text>
        </Animated.View>

        <Animated.View style={[styles.scene, { opacity: scene4Opacity }]}>
          <LinearGradient
            colors={['#ff9a9e', '#fad0c4', '#fad0c4']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={{ position: 'absolute', top: height * 0.15, transform: [{ scale: sunScale }] }}>
              <Sun size={150} color="#ffcc00" />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: userJump }] }}>
              <Smile size={100} color="#fff" fill="#ff6b6b" />
          </Animated.View>
          <Text style={styles.textExcitement}>Ready for your journey!</Text>
        </Animated.View>

        <Animated.View style={[styles.whiteOverlay, { opacity: whiteOverlayOpacity }]} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={isNightMode ? ['#0a0a0f', '#1a0a1f', '#2a0a2f', '#1a0a1f', '#0a0a0f'] : theme.gradients.background as any}
        style={styles.container}
      >
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <X color={theme.colors.text.primary} size={28} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              style={styles.headerIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles color="#FFFFFF" size={28} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>App Tour</Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              Experience Audrey&apos;s journey
            </Text>
          </View>

          <View style={styles.cardsContainer}>
            <TouchableOpacity
              style={[styles.card, { 
                backgroundColor: isNightMode ? 'rgba(26, 10, 31, 0.8)' : theme.colors.cardBackground,
                borderWidth: 1,
                borderColor: isNightMode ? 'rgba(255, 215, 0, 0.2)' : theme.colors.border,
              }]}
              onPress={handlePlayVideo}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#8a2be2', '#9d4edd', '#c77dff']}
                style={styles.cardIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Video color="#FFFFFF" size={32} strokeWidth={2} />
              </LinearGradient>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                  Video Tour
                </Text>
                <Text style={[styles.cardDescription, { color: theme.colors.text.secondary }]}>
                  Watch the story of how you found Audrey
                </Text>
                <View style={styles.playButtonContainer}>
                  <View style={[styles.playButton, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Play color={theme.colors.primary} size={16} strokeWidth={2.5} fill={theme.colors.primary} />
                    <Text style={[styles.playButtonText, { color: theme.colors.primary }]}>
                      Play Video
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, { 
                backgroundColor: isNightMode ? 'rgba(26, 10, 31, 0.8)' : theme.colors.cardBackground,
                borderWidth: 1,
                borderColor: isNightMode ? 'rgba(255, 215, 0, 0.2)' : theme.colors.border,
              }]}
              onPress={handleOpenSong}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF69B4']}
                style={styles.cardIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Music2 color="#FFFFFF" size={32} strokeWidth={2} />
              </LinearGradient>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                  Audrey&apos;s Song
                </Text>
                <Text style={[styles.cardDescription, { color: theme.colors.text.secondary }]}>
                  Listen to a beautiful melody crafted for you
                </Text>
                <View style={styles.playButtonContainer}>
                  <View style={[styles.playButton, { backgroundColor: `${theme.colors.secondary}15` }]}>
                    <Music2 color={theme.colors.secondary} size={16} strokeWidth={2.5} />
                    <Text style={[styles.playButtonText, { color: theme.colors.secondary }]}>
                      Listen Now
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1000,
  },
  closeButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.65,
    letterSpacing: 0.2,
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  cardIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardContent: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    opacity: 0.65,
  },
  playButtonContainer: {
    marginTop: 14,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  scene: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absolute: {
    position: 'absolute',
  },
  whiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 999,
  },
  textDistress: {
    color: '#a6b1e1',
    fontSize: 24,
    fontWeight: '300',
    marginTop: 50,
    letterSpacing: 2,
  },
  textDiscovery: {
    color: '#ffd700',
    fontSize: 28,
    fontWeight: '600',
    marginTop: 50,
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  textGuidance: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '500',
    marginTop: 60,
  },
  textExcitement: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 50,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pathContainer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 40,
    borderRadius: 2,
    overflow: 'hidden',
  },
  pathLine: {
    height: '100%',
    backgroundColor: '#fff',
  },
});
