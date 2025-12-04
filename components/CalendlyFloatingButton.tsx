import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Platform, PanResponder, Dimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Calendar } from 'lucide-react-native';
import { useUniverseMode } from "@/contexts/UniverseModeContext";
import { getButtonPosition, saveButtonPosition } from '@/utils/floatingButtonPositions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 64;

export default function SolaraFloatingButton() {
  const pathname = usePathname();
  const { mode: universeMode } = useUniverseMode();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastTap = useRef<number>(0);
  const hasLoadedPosition = useRef(false);

  // Load saved position on mount
  useEffect(() => {
    if (!hasLoadedPosition.current) {
      hasLoadedPosition.current = true;
      const isUniversePage = pathname === '/universe';
      getButtonPosition('calendly', isUniversePage).then(position => {
        pan.setValue(position);
      });
    }
  }, [pan, pathname]);

  // Force Universe Position
  useEffect(() => {
    if (pathname === '/universe' && universeMode === 'universe') {
      const isUniversePage = true;
      getButtonPosition('calendly', isUniversePage).then(savedPos => {
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        if (Math.abs(currentX - savedPos.x) > 5 || Math.abs(currentY - savedPos.y) > 5) {
          Animated.spring(pan, {
            toValue: savedPos,
            useNativeDriver: false,
          }).start();
        }
      });
    }
  }, [pathname, universeMode, pan]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [rotateAnim, glowAnim]);

  const handlePress = () => {
    if (pathname === '/calendly' || pathname.includes('/(tabs)/calendly')) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    router.push('/(tabs)/calendly');
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
          saveButtonPosition('calendly', { x: boundedX, y: boundedY }, isUniversePage);
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

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
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
        <Calendar 
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
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
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
    backgroundColor: '#FCD34D',
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D97706',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#FCD34D',
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
});
