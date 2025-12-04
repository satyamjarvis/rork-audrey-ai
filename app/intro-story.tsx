import { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Cloud, HelpCircle, Sparkles, Sun, Smile } from 'lucide-react-native';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function IntroStory() {
  const params = useLocalSearchParams<{ fromSettings?: string }>();
  const isFromSettings = params.fromSettings === 'true';
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Animation Values
  const scene1Opacity = useRef(new Animated.Value(0)).current;
  const scene2Opacity = useRef(new Animated.Value(0)).current;
  const scene3Opacity = useRef(new Animated.Value(0)).current;
  const scene4Opacity = useRef(new Animated.Value(0)).current;
  const whiteOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Scene 1: Distress Elements
  const userShake = useRef(new Animated.Value(0)).current;
  const cloud1Pos = useRef(new Animated.Value(0)).current;
  const cloud2Pos = useRef(new Animated.Value(0)).current;
  const questionOpacity = useRef(new Animated.Value(0)).current;

  // Scene 2: Finding Audrey
  const audreyScale = useRef(new Animated.Value(0)).current;
  const audreyGlow = useRef(new Animated.Value(0)).current;

  // Scene 3: The Path
  const pathProgress = useRef(new Animated.Value(0)).current;
  const userMove = useRef(new Animated.Value(0)).current;

  // Scene 4: Excitement
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
      console.log('Background music started playing');
    } catch (error) {
      console.error('Error loading background music:', error);
    }
    
    // === SCENE 1: DISTRESS ===
    Animated.sequence([
      // Fade in Scene 1
      Animated.timing(scene1Opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      
      // Animate distress (shake user, move clouds)
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

      // Fade out Scene 1
      Animated.timing(scene1Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),

      // === SCENE 2: FINDING AUDREY ===
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

      // === SCENE 3: SHOWING THE WAY ===
      Animated.parallel([
        Animated.timing(scene3Opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pathProgress, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(userMove, { toValue: 1, duration: 2000, delay: 500, useNativeDriver: true }),
      ]),
      Animated.delay(1000),
      Animated.timing(scene3Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),

      // === SCENE 4: EXCITEMENT ===
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

      // === FINAL TRANSITION ===
      Animated.timing(whiteOverlayOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start(async () => {
        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            console.log('Background music stopped and unloaded');
          } catch (error) {
            console.error('Error stopping background music:', error);
          }
        }
        
        // If rewatching from settings, go back to settings
        // Otherwise, go to configuring-app page (first time flow)
        if (isFromSettings) {
          router.replace('/(tabs)/settings');
        } else {
          router.replace('/configuring-app');
        }
    });
  }, [isFromSettings, whiteOverlayOpacity, scene1Opacity, userShake, cloud1Pos, cloud2Pos, questionOpacity, scene2Opacity, audreyScale, audreyGlow, scene3Opacity, pathProgress, userMove, scene4Opacity, sunScale, userJump]);

  useEffect(() => {
    runAnimationSequence();
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch((error) => {
          console.error('Error unloading sound on unmount:', error);
        });
      }
    };
  }, [runAnimationSequence]);

  return (
    <View style={styles.container}>
      {/* SCENE 1: DISTRESS */}
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

      {/* SCENE 2: FINDING AUDREY */}
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

      {/* SCENE 3: THE WAY */}
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

      {/* SCENE 4: EXCITEMENT */}
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

      {/* FINAL WHITE OVERLAY */}
      <Animated.View style={[styles.whiteOverlay, { opacity: whiteOverlayOpacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  }
});
