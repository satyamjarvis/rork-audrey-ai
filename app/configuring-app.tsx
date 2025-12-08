import { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';




const INTRO_SHOWN_KEY = 'intro_shown';
const { width, height } = Dimensions.get('window');

const GlitterParticle = ({ initialX, initialY, size, duration, delay, isSilver, isAnimating }: { initialX: number, initialY: number, size: number, duration: number, delay: number, isSilver: boolean, isAnimating: boolean }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isAnimating) {
      animationRef.current = Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
          delay: delay,
        })
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
    }
    return () => animationRef.current?.stop();
  }, [progress, duration, delay, isAnimating]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60], // Float upwards
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [0, 0.8, 1, 0.8, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 0.5],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: initialX,
        top: initialY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isSilver ? '#C0C0C0' : '#FFFFFF',
        opacity,
        transform: [{ translateY }, { scale }],
        shadowColor: isSilver ? '#C0C0C0' : '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
        elevation: 2,
      }}
    />
  );
};

const GlitterOverlay = ({ isAnimating }: { isAnimating: boolean }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isAnimating) {
      animationRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 30000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
    }
    return () => animationRef.current?.stop();
  }, [rotateAnim, isAnimating]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const particles = useMemo(() => {
    return new Array(300).fill(0).map((_, i) => ({
      id: i,
      x: Math.random() * width * 1.5 - width * 0.25, // Spread wider to cover rotation corners
      y: Math.random() * height * 1.5 - height * 0.25,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 2000 + 3000, // 3000-5000ms
      delay: Math.random() * 2000,
      isSilver: Math.random() > 0.3,
    }));
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]} pointerEvents="none">
      {particles.map((p) => (
        <GlitterParticle
          key={p.id}
          initialX={p.x}
          initialY={p.y}
          size={p.size}
          duration={p.duration}
          delay={p.delay}
          isSilver={p.isSilver}
          isAnimating={isAnimating}
        />
      ))}
    </Animated.View>
  );
};


const AudreyLoadingIcon = ({ isAnimating }: { isAnimating: boolean }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isAnimating) {
      animationRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
    }
    return () => animationRef.current?.stop();
  }, [rotateAnim, isAnimating]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateReverse = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  return (
    <View style={styles.loadingIconContainer}>
      {/* Outer Ring - Pink */}
      <Animated.View
        style={[
          styles.loadingRing,
          {
            width: 80,
            height: 80,
            borderRadius: 40,
            borderWidth: 2,
            borderColor: '#F472B6', // Pink
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate }],
            shadowColor: '#F472B6',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
          },
        ]}
      />
      
      {/* Inner Ring - Purple */}
      <Animated.View
        style={[
          styles.loadingRing,
          {
            width: 60,
            height: 60,
            borderRadius: 30,
            borderWidth: 2,
            borderColor: '#C084FC', // Purple
            borderBottomColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: rotateReverse }],
            shadowColor: '#C084FC',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
          },
        ]}
      />
      
      {/* Center "A" */}
      <View style={styles.centerLetterContainer}>
        <Animated.Text style={styles.centerLetter}>A</Animated.Text>
      </View>
    </View>
  );
};

export default function ConfiguringApp() {
  const { theme } = useTheme();
  const { translate } = useLanguage();
  const params = useLocalSearchParams<{ fromIntro?: string }>();
  const isFromIntro = params.fromIntro === 'true';
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = true;


  const startAnimations = useMemo(() => () => {
    // Prefetch story images
    try {
      // Image.prefetch(STORY_IMAGES);
    } catch (e) {
      console.log('Error prefetching story images:', e);
    }

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, [fadeAnim, textFadeAnim, pulseAnim]);


  useEffect(() => {
    startAnimations();
  }, [startAnimations]);



  const onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      // Keep animating while we transition out
      await AsyncStorage.setItem(INTRO_SHOWN_KEY, 'true');
      
      // Fade out after a brief moment
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          // If coming from intro (rewatching from settings), go back to settings
          // Otherwise, go to the calendar (first time experience)
          if (isFromIntro) {
            router.replace('/(tabs)/settings');
          } else {
            router.replace('/(tabs)/calendly');
          }
        });
      }, 500);
    }
  };


  // Determine if using night mode
  const isNightMode = theme.id === 'night-mode';
  const backgroundColors = (isNightMode 
    ? ['#000000', '#0A0A0A', '#000000']
    : ['#F8F5FF', '#FFFFFF', '#FFE8F5']) as readonly [string, string, ...string[]];
  const overlayColors = (isNightMode
    ? ['rgba(0, 0, 0, 0.7)', 'rgba(10, 10, 10, 0.8)', 'rgba(0, 0, 0, 0.7)']
    : ['rgba(248, 245, 255, 0.7)', 'rgba(255, 255, 255, 0.8)', 'rgba(255, 232, 245, 0.7)']) as readonly [string, string, ...string[]];
  const textColor = isNightMode ? '#FFD700' : '#667eea';


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={backgroundColors}
        style={styles.gradient}
      >
        <Video
          ref={videoRef}
          source={{ uri: 'https://rork.app/pa/ier8mze8ucoqq9oktvadp/piano_classic_uplift_1' }}
          style={styles.backgroundVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          volume={0.7}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />


        <GlitterOverlay isAnimating={isAnimating} />

        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={overlayColors}
            style={styles.gradientOverlay}
          />

          <View style={styles.content}>
            <AudreyLoadingIcon isAnimating={isAnimating} />
            <Animated.Text
              style={[
                styles.configuringText,
                {
                  opacity: textFadeAnim,
                  transform: [{ scale: pulseAnim }],
                  color: textColor,
                },
              ]}
            >
              {translate('configuringApp.loadingExperience')}
            </Animated.Text>


          </View>
        </Animated.View>
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
    width: '100%',
    height: '100%',
  },
  backgroundVideo: {
    width: width,
    height: height,
    position: 'absolute' as const,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 40,
  },
  configuringText: {
    fontSize: 22,
    fontWeight: '300' as const,
    letterSpacing: 1.5,
    textAlign: 'center' as const,
    marginBottom: 32,
    textShadowColor: 'rgba(102, 126, 234, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    paddingHorizontal: 20,
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingRing: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#E879F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  centerLetterContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  centerLetter: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(232, 121, 249, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    marginBottom: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
  },
});
