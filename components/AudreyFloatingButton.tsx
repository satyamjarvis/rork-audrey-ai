import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Platform, PanResponder, Dimensions, DeviceEventEmitter, Image } from 'react-native';
import { router, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';


import { useUniverseMode } from "@/contexts/UniverseModeContext";
import { getButtonPosition, saveButtonPosition, DEFAULT_POSITIONS } from '@/utils/floatingButtonPositions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 64;

export default function AudreyFloatingButton() {
  const pathname = usePathname();
  const { mode: universeMode } = useUniverseMode();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const offsetAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  
  // Use default position from utils as initial state to avoid jump
  const initialPos = DEFAULT_POSITIONS.audrey;
  
  const pan = useRef(new Animated.ValueXY(initialPos)).current;
  const lastTap = useRef<number>(0);
  const hasLoadedPosition = useRef(false);

  // Load saved position on mount
  useEffect(() => {
    if (!hasLoadedPosition.current) {
      hasLoadedPosition.current = true;
      getButtonPosition('audrey').then(position => {
        pan.setValue(position);
        panY.setValue(position.y);
      });
    }
  }, [pan, panY]);

  // Adjust vertical position for Universe page to sit lower
  useEffect(() => {
    if (pathname === '/universe' && universeMode === 'universe') {
      // Force position to bottom right for Universe Mode
      const targetX = SCREEN_WIDTH - BUTTON_SIZE - 20;
      const targetY = SCREEN_HEIGHT - BUTTON_SIZE - 40;
      
      Animated.parallel([
        Animated.spring(pan, {
          toValue: { x: targetX, y: targetY },
          useNativeDriver: false,
        }),
        Animated.timing(panY, {
          toValue: targetY,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(offsetAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        })
      ]).start();
    } else if ((pathname === '/calendly' || pathname === '/(tabs)/calendly') && universeMode === 'classic') {
      // Position between days 28 and 29 on calendar in classic mode
      
      const DAY_SIZE = (SCREEN_WIDTH - 40) / 7;
      const CALENDAR_START_Y = Platform.OS === 'ios' ? 320 : 280;
      
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      
      const day28Index = firstDay + 27;
      const day29Index = firstDay + 28;
      
      const getPos = (index: number) => {
        const row = Math.floor(index / 7);
        const col = index % 7;
        return {
          x: 20 + (col * DAY_SIZE) + (DAY_SIZE / 2) - (BUTTON_SIZE / 2),
          y: CALENDAR_START_Y + (row * (DAY_SIZE * 0.9)) + (DAY_SIZE * 0.9 / 2) - (BUTTON_SIZE / 2),
        };
      };
      
      const day28Pos = getPos(day28Index);
      const day29Pos = getPos(day29Index);
      
      const betweenPos = {
        x: (day28Pos.x + day29Pos.x) / 2,
        y: (day28Pos.y + day29Pos.y) / 2,
      };

      getButtonPosition('audrey').then(savedPosition => {
        const isNearCalendarPosition = 
          Math.abs(savedPosition.x - betweenPos.x) < 50 && 
          Math.abs(savedPosition.y - betweenPos.y) < 50;
        
        if (hasLoadedPosition.current && !isNearCalendarPosition) {
          return;
        }

        Animated.parallel([
          Animated.spring(pan, {
            toValue: betweenPos,
            useNativeDriver: false,
          }),
          Animated.spring(panY, {
            toValue: betweenPos.y,
            useNativeDriver: false,
          })
        ]).start();
      });
      
      Animated.timing(offsetAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();

    } else {
      Animated.timing(offsetAnim, {
        toValue: pathname === '/universe' ? 85 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      // Restore saved position if leaving universe mode/page
      if (hasLoadedPosition.current && (pathname !== '/universe' || universeMode !== 'universe') && pathname !== '/calendly' && pathname !== '/(tabs)/calendly') {
        getButtonPosition('audrey').then(position => {
            // Only restore if we are not in the "forced" state
             Animated.parallel([
               Animated.spring(pan, {
                  toValue: position,
                  useNativeDriver: false,
               }),
               Animated.spring(panY, {
                  toValue: position.y,
                  useNativeDriver: false,
               })
             ]).start();
        });
      }
    }
  }, [pathname, offsetAnim, universeMode, pan, panY]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();



    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim, glowAnim]);

  const handlePress = () => {
    if (pathname === '/ai-assistant' || pathname === '/ai') {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      
      DeviceEventEmitter.emit('scrollToTopAI');
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

    router.push('/ai-assistant');
  };

  const handlePanResponderMove = useRef(Animated.event([null, { dx: pan.x, dy: pan.y }], {
    useNativeDriver: false,
  })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (pathname === '/universe' && universeMode === 'universe') return false;
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (event, gestureState) => {
        handlePanResponderMove(event, gestureState);
        const currentY = (pan.y as any)._offset + gestureState.dy;
        panY.setValue(currentY);
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;

        const boundedX = Math.max(0, Math.min(SCREEN_WIDTH - BUTTON_SIZE, currentX));
        const boundedY = Math.max(0, Math.min(SCREEN_HEIGHT - BUTTON_SIZE, currentY));

        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: boundedX, y: boundedY },
            useNativeDriver: false,
            friction: 7,
            tension: 40,
          }),
          Animated.spring(panY, {
            toValue: boundedY,
            useNativeDriver: false,
            friction: 7,
            tension: 40,
          })
        ]).start(() => {
          saveButtonPosition('audrey', { x: boundedX, y: boundedY });
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



  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // Hide on AI pages and initial setup pages (but show on configuring page)
  if (pathname === '/ai-assistant' || 
      pathname === '/ai' || 
      pathname === '/intro-splash' || 
      pathname === '/intro-story' || 
      pathname === '/account-creation' || 
      pathname === '/subscription-selection' ||
      pathname === '/language-selection' ||
      pathname === '/mode-selection') {
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
            { translateY: Animated.add(panY, offsetAnim) },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.glowOuter,
          {
            opacity: glowOpacity,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.glowInner,
          {
            opacity: Animated.multiply(glowOpacity, 0.6),
          },
        ]}
      />
      
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
          },
        ]}
      >
        <Image 
          source={{ uri: 'https://r2-pub.rork.com/generated-images/5a3f4488-9b7f-42f7-bd4f-cbcf57086ee9.png' }}
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
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
    zIndex: 9999,
  },
  glowOuter: {
    position: 'absolute' as const,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
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
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
});
