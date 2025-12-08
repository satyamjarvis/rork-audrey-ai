import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Platform, PanResponder, Dimensions, Easing } from 'react-native';
import { router, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Brain } from 'lucide-react-native';
import { useUniverseMode } from "@/contexts/UniverseModeContext";
import { getButtonPosition, saveButtonPosition, DEFAULT_POSITIONS } from '@/utils/floatingButtonPositions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 64;

export default function BrainFloatingButton() {
  const pathname = usePathname();
  const { mode: universeMode } = useUniverseMode();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  
  // Use default position from utils as initial state to avoid jump
  const initialPos = DEFAULT_POSITIONS.brain;
  
  const pan = useRef(new Animated.ValueXY(initialPos)).current;
  const lastTap = useRef<number>(0);
  const hasLoadedPosition = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimated = useRef(false);

  // Load saved position on mount
  useEffect(() => {
    if (!hasLoadedPosition.current) {
      hasLoadedPosition.current = true;
      const isUniversePage = pathname === '/universe';
      getButtonPosition('brain', isUniversePage).then(position => {
        pan.setValue(position);
      });
    }
  }, [pan, pathname]);

  // Force Universe Position (circular formation on Universe page in universe mode)
  // Keep classic position on calendly page in classic mode
  useEffect(() => {
    if (pathname === '/universe' && universeMode === 'universe') {
      // Universe mode: Always use saved position for universe page
      const isUniversePage = true;
      getButtonPosition('brain', isUniversePage).then(savedPos => {
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        if (Math.abs(currentX - savedPos.x) > 5 || Math.abs(currentY - savedPos.y) > 5) {
          Animated.spring(pan, {
            toValue: savedPos,
            useNativeDriver: false,
          }).start();
        }
      });
    } else if ((pathname === '/calendly' || pathname === '/(tabs)/calendly') && universeMode === 'classic') {
      // Classic mode on Solara calendar: use default position (left curve)
      const defaultPos = DEFAULT_POSITIONS.brain;
      Animated.spring(pan, {
        toValue: defaultPos,
        useNativeDriver: false,
      }).start();
    }
  }, [pathname, universeMode, pan]);

  // Trigger entrance animation on mount
  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      setIsVisible(true);
      
      // Show immediately with a friendly entrance
      const delay = 300;
      
      setTimeout(() => {
        Animated.parallel([
          // Fade in with scale
          Animated.timing(entranceAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: false,
          }),
          // Gentle bounce effect
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -20,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }),
            Animated.spring(bounceAnim, {
              toValue: 0,
              friction: 3,
              tension: 40,
              useNativeDriver: false,
            }),
          ]),
        ]).start(() => {
          // Start continuous animations after entrance
          Animated.loop(
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 6000,
              useNativeDriver: false,
            })
          ).start();

          Animated.loop(
            Animated.sequence([
              Animated.timing(glowAnim, {
                toValue: 1,
                duration: 2500,
                useNativeDriver: false,
              }),
              Animated.timing(glowAnim, {
                toValue: 0,
                duration: 2500,
                useNativeDriver: false,
              }),
            ])
          ).start();
        });
      }, delay);
    }
  }, [entranceAnim, bounceAnim, rotateAnim, glowAnim]);



  const handlePress = () => {
    if (pathname === '/learn' || pathname.includes('/learn')) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: false,
      }),
    ]).start();

    router.push('/learn');
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;

        const boundedX = Math.max(0, Math.min(SCREEN_WIDTH - BUTTON_SIZE, currentX));
        const boundedY = Math.max(0, Math.min(SCREEN_HEIGHT - BUTTON_SIZE, currentY));

        Animated.spring(pan, {
          toValue: { x: boundedX, y: boundedY },
          useNativeDriver: false,
        }).start(() => {
          // Save position after animation completes
          const isUniversePage = pathname === '/universe';
          saveButtonPosition('brain', { x: boundedX, y: boundedY }, isUniversePage);
        });

        const isMoving = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        if (!isMoving) {
          const now = Date.now();
          if (now - lastTap.current < 300) {
            lastTap.current = 0;
          } else {
            lastTap.current = now;
            handlePress();
          }
        }
      },
    })
  ).current;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  const entranceScale = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const entranceOpacity = entranceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: Animated.add(pan.y, bounceAnim) },
            { scale: entranceScale },
          ],
          opacity: entranceOpacity,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.glowOuter,
          {
            opacity: glowOpacity,
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.glowInner,
          {
            opacity: Animated.multiply(glowOpacity, 0.7),
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate },
            ],
          },
        ]}
      >
        <Brain 
          color="#FFFFFF" 
          size={32} 
          strokeWidth={2} 
          fill="#FFFFFF"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: 64,
    height: 64,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 999,
  },
  glowOuter: {
    position: 'absolute' as const,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00D9FF',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  glowInner: {
    position: 'absolute' as const,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4DFFFF',
    shadowColor: '#4DFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#006B7D',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#4DFFFF',
    shadowColor: '#4DFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
});
