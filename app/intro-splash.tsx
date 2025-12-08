import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text, Easing } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sun, Moon, Calendar, Brain, Users, Sparkles, Star } from 'lucide-react-native';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

const INTRO_SHOWN_KEY = 'intro_shown';
const { width, height } = Dimensions.get('window');
const MUSIC_START_DELAY = 9000; // Delay background music by 9 seconds
const SPARKLE_COUNT = 14;

interface SparkleConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  rotateDirection: 1 | -1;
  size: number;
}

export default function IntroSplash() {
  const { startMusicAfterIntro } = useMusicPlayer();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleOpacityAnim = useRef(new Animated.Value(0.5)).current;
  
  const icon1Anim = useRef(new Animated.Value(0)).current;
  const icon2Anim = useRef(new Animated.Value(0)).current;
  const icon3Anim = useRef(new Animated.Value(0)).current;
  const icon4Anim = useRef(new Animated.Value(0)).current;
  const icon5Anim = useRef(new Animated.Value(0)).current;
  const icon6Anim = useRef(new Animated.Value(0)).current;
  
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioDurationRef = useRef<number>(7000);
  const sparkleConfigsRef = useRef<SparkleConfig[]>([]);
  const sparkleAnimationsRef = useRef<Animated.Value[]>([]);

  if (sparkleConfigsRef.current.length === 0) {
    sparkleConfigsRef.current = Array.from({ length: SPARKLE_COUNT }).map(() => ({
      startX: Math.random() * width,
      startY: Math.random() * height,
      endX: Math.random() * width,
      endY: Math.random() * height,
      duration: 3500 + Math.random() * 3000,
      delay: Math.random() * 1500,
      rotateDirection: Math.random() > 0.5 ? 1 : -1,
      size: 10 + Math.random() * 12,
    }));
  }

  if (sparkleAnimationsRef.current.length === 0) {
    sparkleAnimationsRef.current = sparkleConfigsRef.current.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    startIntro();
    const cleanupSparkles = startSparkleAnimations();
    return () => {
      cleanupSparkles();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startSparkleAnimations = () => {
    let isMounted = true;

    const animateSparkle = (anim: Animated.Value, config: SparkleConfig) => {
      anim.setValue(0);

      Animated.sequence([
        Animated.delay(config.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: config.duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && isMounted) {
          config.delay = Math.random() * 1500;
          config.duration = 3500 + Math.random() * 3000;
          config.endX = Math.random() * width;
          config.endY = Math.random() * height;
          animateSparkle(anim, config);
        }
      });
    };

    sparkleAnimationsRef.current.forEach((anim, index) => {
      animateSparkle(anim, sparkleConfigsRef.current[index]);
    });

    return () => {
      isMounted = false;
      sparkleAnimationsRef.current.forEach((anim) => {
        anim.stopAnimation();
      });
    };
  };

  const startIntro = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://rork.app/pa/ier8mze8ucoqq9oktvadp/piano_guitar_violin_1' },
        { shouldPlay: true, volume: 0.7 }
      );
      soundRef.current = sound;
      
      // Get audio duration
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        audioDurationRef.current = status.durationMillis;
        console.log('Audio duration:', audioDurationRef.current, 'ms');
      }
      
      // Set up playback status update to handle completion
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          handleIntroComplete();
        }
      });
      
      // Start background music after 9 seconds
      setTimeout(() => {
        console.log('[IntroSplash] Starting background music after', MUSIC_START_DELAY, 'ms delay');
        // Wrap in try-catch to prevent unhandled promise rejections if this triggers audio actions
        try {
            startMusicAfterIntro();
        } catch (e) {
            console.log("Error starting music after intro:", e);
        }
      }, MUSIC_START_DELAY);
    } catch (error) {
      console.log('Error loading audio (IntroSplash):', error);
      // Continue with animation even if audio fails
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 30,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.stagger(150, [
        createIconAnimation(icon1Anim),
        createIconAnimation(icon2Anim),
        createIconAnimation(icon3Anim),
        createIconAnimation(icon4Anim),
        createIconAnimation(icon5Anim),
        createIconAnimation(icon6Anim),
      ]),
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true }
    ).start();

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
        Animated.timing(sparkleOpacityAnim, {
          toValue: 0.8,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacityAnim, {
          toValue: 0.5,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Use audio duration for timing the intro
    setTimeout(() => {
      handleIntroComplete();
    }, audioDurationRef.current);
  };

  const handleIntroComplete = async () => {
    await AsyncStorage.setItem(INTRO_SHOWN_KEY, 'true');
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      router.replace('/language-selection');
    });
  };

  const createIconAnimation = (animValue: Animated.Value) => {
    return Animated.spring(animValue, {
      toValue: 1,
      tension: 20,
      friction: 5,
      useNativeDriver: true,
    });
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8F5FF', '#FFFFFF', '#FFE8F5', '#F5F0FF']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.centerCircle,
              {
                transform: [{ rotate }, { scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#667eea', '#F093FB', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCircle}
            >
              <Animated.View style={[styles.glowCircle, { opacity: glowOpacity }]} />
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.iconContainer,
              styles.icon1,
              {
                opacity: icon1Anim,
                transform: [
                  { scale: icon1Anim },
                  { translateY: Animated.multiply(icon1Anim, -20) },
                ],
              },
            ]}
          >
            <Sun size={32} color="#FFB84D" strokeWidth={2} />
          </Animated.View>

          <Animated.View
            style={[
              styles.iconContainer,
              styles.icon2,
              {
                opacity: icon2Anim,
                transform: [
                  { scale: icon2Anim },
                  { translateX: Animated.multiply(icon2Anim, 20) },
                ],
              },
            ]}
          >
            <Moon size={32} color="#764ba2" strokeWidth={2} />
          </Animated.View>

          <Animated.View
            style={[
              styles.iconContainer,
              styles.icon3,
              {
                opacity: icon3Anim,
                transform: [
                  { scale: icon3Anim },
                  { translateY: Animated.multiply(icon3Anim, 20) },
                ],
              },
            ]}
          >
            <Calendar size={32} color="#667eea" strokeWidth={2} />
          </Animated.View>

          <Animated.View
            style={[
              styles.iconContainer,
              styles.icon4,
              {
                opacity: icon4Anim,
                transform: [
                  { scale: icon4Anim },
                  { translateX: Animated.multiply(icon4Anim, -20) },
                ],
              },
            ]}
          >
            <Brain size={32} color="#F093FB" strokeWidth={2} />
          </Animated.View>

          <Animated.View
            style={[
              styles.iconContainer,
              styles.icon5,
              {
                opacity: icon5Anim,
                transform: [
                  { scale: icon5Anim },
                  { translateX: Animated.multiply(icon5Anim, -15) },
                  { translateY: Animated.multiply(icon5Anim, -15) },
                ],
              },
            ]}
          >
            <Users size={32} color="#6B9BD1" strokeWidth={2} />
          </Animated.View>

          <Animated.View
            style={[
              styles.iconContainer,
              styles.icon6,
              {
                opacity: icon6Anim,
                transform: [
                  { scale: icon6Anim },
                  { translateX: Animated.multiply(icon6Anim, 15) },
                  { translateY: Animated.multiply(icon6Anim, -15) },
                ],
              },
            ]}
          >
            <Sparkles size={32} color="#FFB84D" strokeWidth={2} />
          </Animated.View>

          <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
            <Text style={styles.title}>AUDREY</Text>
            <Text style={styles.subtitle}>Your AI Personal Assistant</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkleContainer,
              {
                opacity: sparkleOpacityAnim,
              },
            ]}
          >
            {sparkleConfigsRef.current.map((config, index) => {
              const progress = sparkleAnimationsRef.current[index];
              const translateX = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, config.endX - config.startX],
              });
              const translateY = progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, config.endY - config.startY],
              });
              const sparkleScale = progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.5, 1.2, 0.5],
              });
              const sparkleOpacity = progress.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              });
              const sparkleRotate = progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${config.rotateDirection * 360}deg`],
              });

              return (
                <Animated.View
                  key={`sparkle-${index}`}
                  style={[
                    styles.sparkle,
                    {
                      top: config.startY,
                      left: config.startX,
                      opacity: sparkleOpacity,
                      transform: [
                        { translateX },
                        { translateY },
                        { scale: sparkleScale },
                        { rotate: sparkleRotate },
                      ],
                    },
                  ]}
                >
                  <Star size={config.size} color="#FFB84D" fill="#FFB84D" />
                </Animated.View>
              );
            })}
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5FF',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    position: 'relative' as const,
  },
  centerCircle: {
    width: 180,
    height: 180,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  glowCircle: {
    position: 'absolute' as const,
    width: '120%',
    height: '120%',
    borderRadius: 110,
    backgroundColor: '#667eea',
    opacity: 0.2,
  },
  iconContainer: {
    position: 'absolute' as const,
    padding: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8E4F3',
  },
  icon1: {
    top: height * 0.25,
  },
  icon2: {
    right: width * 0.15,
  },
  icon3: {
    bottom: height * 0.25,
  },
  icon4: {
    left: width * 0.15,
  },
  icon5: {
    top: height * 0.32,
    left: width * 0.2,
  },
  icon6: {
    top: height * 0.32,
    right: width * 0.2,
  },
  textContainer: {
    position: 'absolute' as const,
    bottom: height * 0.15,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: '#667eea',
    letterSpacing: 3,
    textShadowColor: '#F093FB',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400' as const,
    color: '#5F6C7B',
    marginTop: 8,
    letterSpacing: 4,
  },
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none' as const,
  },
  sparkle: {
    position: 'absolute' as const,
  },
});
