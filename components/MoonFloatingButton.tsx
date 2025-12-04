import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Platform, PanResponder, Dimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Moon } from 'lucide-react-native';
import { useUniverseMode } from "@/contexts/UniverseModeContext";
import { getButtonPosition, saveButtonPosition, DEFAULT_POSITIONS } from '@/utils/floatingButtonPositions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 64;

export default function MoonFloatingButton() {
  const pathname = usePathname();
  const { mode: universeMode } = useUniverseMode();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Use default position from utils as initial state to avoid jump
  const initialPos = DEFAULT_POSITIONS.moon;
  
  const pan = useRef(new Animated.ValueXY(initialPos)).current;
  const lastTap = useRef<number>(0);
  const hasLoadedPosition = useRef(false);

  // Load saved position on mount
  useEffect(() => {
    if (!hasLoadedPosition.current) {
      hasLoadedPosition.current = true;
      const isUniversePage = pathname === '/universe';
      getButtonPosition('moon', isUniversePage).then(position => {
        pan.setValue(position);
      });
    }
  }, [pan, pathname]);

  // Force Universe Position (circular formation on Universe page in universe mode)
  // Keep classic position on calendly page in classic mode
  useEffect(() => {
    if (pathname === '/universe' && universeMode === 'universe') {
      // Universe mode: Always use saved position for universe page
      // This allows user to manually organize and keep the formation
      const isUniversePage = true;
      getButtonPosition('moon', isUniversePage).then(savedPos => {
        // Only animate to saved position if it's different from current
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        if (Math.abs(currentX - savedPos.x) > 5 || Math.abs(currentY - savedPos.y) > 5) {
          Animated.spring(pan, {
            toValue: savedPos,
            useNativeDriver: false,
          }).start();
        }
      });
    } else if ((pathname === '/monthly-planner' || pathname === '/calendly' || pathname === '/(tabs)/calendly') && universeMode === 'classic') {
      // Classic mode on Solara calendar: Position between days 23 and 24 on calendar
      
      // Calculate approximate position based on screen width
      const DAY_SIZE = (SCREEN_WIDTH - 40) / 7; // 40 is approx padding
      const CALENDAR_START_Y = Platform.OS === 'ios' ? 320 : 280; // Approximate start Y of calendar grid
      
      // Calculate day 23/24 position for current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1).getDay(); // 0-6
      
      const day23Index = firstDay + 22; // 23rd day is index 22 + offset
      const day24Index = firstDay + 23;
      
      const getPos = (index: number) => {
        const row = Math.floor(index / 7);
        const col = index % 7;
        return {
          x: 20 + (col * DAY_SIZE) + (DAY_SIZE / 2) - (BUTTON_SIZE / 2),
          y: CALENDAR_START_Y + (row * (DAY_SIZE * 0.9)) + (DAY_SIZE * 0.9 / 2) - (BUTTON_SIZE / 2),
        };
      };
      
      const day23Pos = getPos(day23Index);
      const day24Pos = getPos(day24Index);
      
      const betweenPos = {
        x: (day23Pos.x + day24Pos.x) / 2,
        y: (day23Pos.y + day24Pos.y) / 2,
      };
      
      getButtonPosition('moon').then(savedPosition => {
        // Check if button has been manually moved from calendar position
        const isNearCalendarPosition = 
          Math.abs(savedPosition.x - betweenPos.x) < 50 && 
          Math.abs(savedPosition.y - betweenPos.y) < 50;
        
        // Only force position if it hasn't been manually moved away
        if (hasLoadedPosition.current && !isNearCalendarPosition) {
          // User has moved it, don't force position
          return;
        }
        
        Animated.spring(pan, {
          toValue: betweenPos,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [pathname, universeMode, pan]);

  useEffect(() => {
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
  }, [rotateAnim, glowAnim]);

  const handlePress = () => {
    if (pathname === '/night' || pathname.includes('/(tabs)/night')) {
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

    router.push('/(tabs)/night');
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
          saveButtonPosition('moon', { x: boundedX, y: boundedY }, isUniversePage);
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
        <Moon 
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
    backgroundColor: '#6B4FC4',
    shadowColor: '#6B4FC4',
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
    backgroundColor: '#9B7FD9',
    shadowColor: '#9B7FD9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E1B4B',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#9B7FD9',
    shadowColor: '#9B7FD9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
});
