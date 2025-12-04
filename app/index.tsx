import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Power } from 'lucide-react-native';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const router = useRouter();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;


  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

  useEffect(() => {
    const prepareApp = async () => {
      try {
        const value = await AsyncStorage.getItem('intro_shown');
        if (value === 'true') {
          setTargetRoute('/(tabs)/calendly');
        } else {
          setTargetRoute('/intro-splash');
        }
      } catch {
        setTargetRoute('/intro-splash');
      } finally {
        setIsReady(true);
        startEntranceAnimation();
      }
    };
    
    prepareApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = () => {
    if (!targetRoute) return;

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => {
      router.replace(targetRoute as any);
    });
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1A1A2E']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.brandText}>RORK</Text>
        </View>

        <TouchableOpacity 
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
            <LinearGradient
              colors={[colors.primary, '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Power size={24} color="#000" style={styles.icon} />
              <Text style={styles.buttonText}>Connect</Text>
            </LinearGradient>
            
            <View style={styles.buttonShadow} />
          </Animated.View>
        </TouchableOpacity>
        
        <Text style={styles.hintText}>Tap to initialize system</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 120,
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 8,
  },
  buttonContainer: {
    width: width * 0.7,
    height: 60,
    position: 'relative',
  },
  gradientButton: {
    flex: 1,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  buttonShadow: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    bottom: -4,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 30,
    zIndex: 1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  icon: {
    marginRight: 4,
  },
  hintText: {
    color: '#555',
    fontSize: 12,
    letterSpacing: 1,
  },
});
