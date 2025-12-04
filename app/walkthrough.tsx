import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  TouchableOpacity, 
  Text, 
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { X, Volume2, VolumeX, ChevronRight, PlayCircle, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const FIRST_LAUNCH_KEY = 'has_launched_before';

const SLIDES = [
  {
    image: 'https://r2-pub.rork.com/generated-images/48fa812c-fe27-4eb3-bf98-ec2f1b6efd57.png',
    title: "Welcome to Solara",
    subtitle: "Your All-in-One Personal Growth App",
    description: "Manage your time, tasks, and well-being in one beautiful place."
  },
  {
    image: 'https://r2-pub.rork.com/generated-images/ff0b327f-33cb-46c1-8417-84c2f67304d9.png',
    title: "Plan Your Success",
    subtitle: "Daily, Weekly, Yearly",
    description: "Use the Planner tab to organize your schedule, set intentions, and track your habits."
  },
  {
    image: 'https://r2-pub.rork.com/generated-images/be6e8bfc-f2e0-4f91-be46-9cea023ebe27.png',
    title: "Stay Organized",
    subtitle: "Never Miss a Task",
    description: "Keep track of your to-dos and goals with our smart list system. Prioritize what matters most."
  },
  {
    image: 'https://r2-pub.rork.com/generated-images/c14a3632-e890-48a2-8aad-4d3e7ada2b5b.png',
    title: "Meet Audrey",
    subtitle: "Your AI Companion",
    description: "Chat with Audrey for advice, planning help, or just to talk. Tap the Audrey icon anytime."
  },
  {
    image: 'https://r2-pub.rork.com/generated-images/63e79fb0-75ab-400c-95f7-20dc5cccdd69.png',
    title: "Make It Yours",
    subtitle: "Settings & Personalization",
    description: "Adjust themes, notifications, and more in the Settings tab to fit your style."
  }
];

const DURATION_PER_SLIDE = 5000; // 5 seconds per slide

export default function Walkthrough() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const isOnboarding = params.onboarding === 'true';
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentTranslateAnim = useRef(new Animated.Value(40)).current;
  const imageScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Ref to track active slide animations
  const slideAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const pausedAtRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const handleClose = useCallback(async () => {
    if (soundRef.current) {
        try {
            await soundRef.current.setVolumeAsync(0);
        } catch {}
    }
    
    if (isOnboarding) {
        try {
            await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
        } catch (e) {
            console.error('Error saving first launch key:', e);
        }
        router.replace('/(tabs)/calendly');
    } else {
        router.back();
    }
  }, [isOnboarding]);

  const goToNextSlide = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentIndex, handleClose]);

  const startProgressTimer = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION_PER_SLIDE, 1);
      
      progressAnim.setValue(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        goToNextSlide();
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [goToNextSlide, progressAnim]);

  const startSlideAnimation = useCallback(() => {
     startTimeRef.current = Date.now();
     startProgressTimer();
  }, [startProgressTimer]);

  // Prefetch images and setup audio
  useEffect(() => {
    const imageUrls = SLIDES.map(s => s.image);
    
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://rork.app/pa/ier8mze8ucoqq9oktvadp/violin_30s_1' },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        soundRef.current = sound;
      } catch (error) {
        console.log("Error playing promo music:", error);
      }
    };

    Promise.all([
        Image.prefetch(imageUrls),
        setupAudio()
    ]).then(() => {
        setIsLoaded(true);
    });

    return () => {
      if (soundRef.current) {
        try {
          soundRef.current.unloadAsync();
        } catch {}
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Trigger animations when slide changes or isLoaded becomes true
  useEffect(() => {
    if (!isLoaded) return;

    // Stop any running animations before resetting values
    if (slideAnimationRef.current) {
      slideAnimationRef.current.stop();
    }

    // Reset text animations
    contentFadeAnim.setValue(0);
    contentTranslateAnim.setValue(40);
    imageScaleAnim.setValue(1);
    
    // Animate text in
    const animation = Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
        delay: 100,
      }),
      Animated.spring(contentTranslateAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
        delay: 100,
      }),
      // Subtle zoom on image
      Animated.timing(imageScaleAnim, {
        toValue: 1.05,
        duration: DURATION_PER_SLIDE,
        useNativeDriver: false,
        easing: (t) => t, // Linear easing for smooth zoom
      })
    ]);

    slideAnimationRef.current = animation;
    animation.start();

    // Reset progress
    progressAnim.setValue(0);
    pausedAtRef.current = 0;
    startSlideAnimation();

    return () => {
      if (slideAnimationRef.current) {
        slideAnimationRef.current.stop();
      }
    };
  }, [currentIndex, isLoaded, contentFadeAnim, contentTranslateAnim, imageScaleAnim, progressAnim, startSlideAnimation]);

  // Handle Pause
  useEffect(() => {
    if (isPaused) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      pausedAtRef.current = Date.now() - startTimeRef.current;
    } else {
      startTimeRef.current = Date.now() - pausedAtRef.current;
      startProgressTimer();
    }
  }, [isPaused, startProgressTimer]);

  const goToPrevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(0);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      progressAnim.setValue(0);
      startTimeRef.current = Date.now();
      startProgressTimer();
    }
  };

  const toggleMute = async () => {
    if (soundRef.current) {
      if (isMuted) {
        await soundRef.current.setVolumeAsync(1.0);
      } else {
        await soundRef.current.setVolumeAsync(0);
      }
      setIsMuted(!isMuted);
    }
  };

  const handlePress = (evt: any) => {
    const locationX = evt.nativeEvent.locationX;
    if (locationX < width * 0.3) {
      goToPrevSlide();
    } else {
      goToNextSlide();
    }
  };

  const currentSlide = SLIDES[currentIndex];

  if (!isLoaded) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <StatusBar style="light" />
              <Sparkles color="#FFD700" size={48} />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Main Content Layer */}
      <TouchableWithoutFeedback
        onPress={handlePress}
        onLongPress={() => {
            setIsPaused(true);
            if (Platform.OS !== 'web') Haptics.selectionAsync();
        }}
        onPressOut={() => setIsPaused(false)}
      >
        <View style={StyleSheet.absoluteFill}>
            {/* Background Image */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: imageScaleAnim }] }]}>
                <Image
                    source={{ uri: currentSlide.image }}
                    style={styles.image}
                    contentFit="cover"
                    transition={300} // Faster transition for snappier feel
                />
            </Animated.View>

            {/* Gradients for text readability */}
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.1)']}
                style={[StyleSheet.absoluteFill, { height: '30%' }]}
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                style={[StyleSheet.absoluteFill, { top: '50%' }]}
            />
        </View>
      </TouchableWithoutFeedback>

      {/* UI Overlay */}
      <View style={[styles.overlay, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 30 }]}>
        
        {/* Top Progress Bars */}
        <View style={styles.header}>
            <View style={styles.progressContainer}>
                {SLIDES.map((_, index) => {
                    return (
                        <View key={index} style={styles.progressBarBg}>
                            <Animated.View 
                                style={[
                                    styles.progressBarFill, 
                                    {
                                        width: index === currentIndex 
                                            ? progressAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%']
                                            }) 
                                            : index < currentIndex ? '100%' : '0%'
                                    }
                                ]} 
                            />
                        </View>
                    );
                })}
            </View>

            <View style={styles.controlsRow}>
                <View style={styles.appTitleContainer}>
                     <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
                        <PlayCircle size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.appTitle}>Walkthrough</Text>
                     </BlurView>
                </View>

                <View style={styles.rightControls}>
                    <TouchableOpacity onPress={toggleMute} style={styles.iconButton}>
                        <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
                             {isMuted ? <VolumeX size={18} color="#FFF" /> : <Volume2 size={18} color="#FFF" />}
                        </BlurView>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
                        <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
                             <X size={20} color="#FFF" />
                        </BlurView>
                    </TouchableOpacity>
                </View>
            </View>
        </View>

        {/* Bottom Text Content */}
        <Animated.View 
            style={[
                styles.textContainer, 
                { 
                    opacity: contentFadeAnim,
                    transform: [{ translateY: contentTranslateAnim }]
                }
            ]}
        >
            <View style={styles.tagContainer}>
                 <Text style={styles.tagText}>{currentIndex + 1} / {SLIDES.length}</Text>
            </View>
            
            <Text style={styles.title}>{currentSlide.title}</Text>
            <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
            <Text style={styles.description}>{currentSlide.description}</Text>

            <TouchableOpacity 
                style={styles.getStartedButton} 
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // If it's the last slide, close (which handles onboarding)
                    // If not, just go next? No, user can tap screen.
                    // But if onboarding, maybe we want a big button on the last slide.
                    // This button is only shown on last slide in the original code?
                    // Let's check logic.
                    // The original code only showed it on the last slide.
                    // I will change it to be "Next" on other slides and "Get Started/Finish" on last.
                    if (currentIndex < SLIDES.length - 1) {
                        goToNextSlide();
                    } else {
                        handleClose();
                    }
                }}
            >
                <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.getStartedGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.getStartedText}>
                        {currentIndex < SLIDES.length - 1 ? "Next" : (isOnboarding ? "Get Started" : "Finish")}
                    </Text>
                    <ChevronRight size={20} color="#000" />
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 12,
    gap: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 2,
    height: 3,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  appTitleContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.3)', 
  },
  appTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconBlur: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  textContainer: {
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  tagContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tagText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 12,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  description: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    maxWidth: '95%',
  },
  getStartedButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  getStartedText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
