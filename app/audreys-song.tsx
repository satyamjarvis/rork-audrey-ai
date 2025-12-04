import { useEffect, useRef, useState } from 'react';
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
import { Audio } from 'expo-av';
import { router, Stack } from 'expo-router';
import { X, Music2, Sparkles, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function AudreysSong() {
  const insets = useSafeAreaInsets();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAndPlayAudio();

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
          toValue: 1.1,
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch((error) => {
          console.error('Error unloading sound on unmount:', error);
        });
      }
    };
  }, [glowAnim, pulseAnim, floatAnim]);

  const loadAndPlayAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://rork.app/pa/ier8mze8ucoqq9oktvadp/audrey_beautiful_smart_1' },
        { shouldPlay: true, isLooping: true, volume: 0.8 }
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setIsLoading(false);
      console.log('[AudreysSong] Audio started playing');
    } catch (error) {
      console.error('[AudreysSong] Error loading audio:', error);
      setIsLoading(false);
    }
  };

  const handleTogglePlay = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!soundRef.current) return;

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('[AudreysSong] Error toggling play:', error);
    }
  };

  const handleClose = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.error('[AudreysSong] Error stopping audio:', error);
      }
    }

    router.back();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#1a0a2e', '#3d1e6d', '#5a2d82', '#7b3f9e', '#3d1e6d', '#1a0a2e']}
        style={styles.container}
      >
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 10 }]}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <View style={styles.closeButtonInner}>
            <X color="#FFFFFF" size={24} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.musicIconContainer,
              {
                transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.glowCircle,
                {
                  opacity: glowOpacity,
                },
              ]}
            />
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF69B4']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Music2 color="#FFFFFF" size={80} strokeWidth={2} />
            </LinearGradient>
          </Animated.View>

          <View style={styles.titleContainer}>
            <View style={styles.sparklesRow}>
              <Sparkles color="#FFD700" size={20} strokeWidth={2} />
              <Text style={styles.title}>Audrey&apos;s Song</Text>
              <Sparkles color="#FFD700" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.subtitle}>A beautiful melody for your journey</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.playButton}
              onPress={handleTogglePlay}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isPlaying ? ['#FF69B4', '#FF1493'] : ['#FFD700', '#FFA500']}
                style={styles.playButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.playButtonText}>
                  {isPlaying ? 'Pause' : 'Play'}
                </Text>
                <Heart
                  color="#FFFFFF"
                  size={20}
                  fill={isPlaying ? '#FFFFFF' : 'transparent'}
                  strokeWidth={2}
                />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              This enchanting composition was created to inspire and uplift you throughout your
              journey with Audrey. Let the melody guide your thoughts and bring peace to your day.
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Music2 color="rgba(255, 255, 255, 0.3)" size={16} strokeWidth={2} />
          <Text style={styles.footerText}>Made with love for you</Text>
          <Heart color="rgba(255, 255, 255, 0.3)" size={16} strokeWidth={2} />
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  closeButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  musicIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  glowCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFD700',
    opacity: 0.3,
  },
  iconGradient: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sparklesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  playButton: {
    borderRadius: 50,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    marginBottom: 40,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
    gap: 12,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  descriptionContainer: {
    maxWidth: width * 0.85,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
});
