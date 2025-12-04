import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatTheme, ChatThemeAnimation } from '@/contexts/ChatContext';

const { width, height } = Dimensions.get('window');

interface ChatBackgroundProps {
  theme: ChatTheme;
  children?: React.ReactNode;
}

const Particle = ({ 
  animationType, 
  color, 
  index 
}: { 
  animationType: ChatThemeAnimation; 
  color: string; 
  index: number 
}) => {
  const positionAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Randomize initial properties
  const randomX = useMemo(() => Math.random() * width, []);
  const randomDuration = useMemo(() => Math.random() * 5000 + 5000, []);
  const randomSize = useMemo(() => Math.random() * 10 + 2, []);

  useEffect(() => {
    switch (animationType) {
      case 'stars':
        // Twinkling stars
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: Math.random() * 2000 + 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: Math.random() * 0.2,
              duration: Math.random() * 2000 + 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'bubbles':
        // Rising bubbles
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(positionAnim, {
                toValue: -height - 100,
                duration: randomDuration,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(opacityAnim, {
                  toValue: 0.6,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.delay(randomDuration - 1000),
                Animated.timing(opacityAnim, {
                  toValue: 0,
                  duration: 500,
                  useNativeDriver: true,
                }),
              ]),
            ]),
            Animated.timing(positionAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'rain':
        // Falling rain
        Animated.loop(
          Animated.sequence([
            Animated.timing(positionAnim, {
              toValue: height + 100,
              duration: randomDuration / 4, // Faster than bubbles
              useNativeDriver: true,
            }),
            Animated.timing(positionAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
        opacityAnim.setValue(0.4);
        break;

        case 'snow':
          // Falling snow
          Animated.loop(
            Animated.sequence([
              Animated.timing(positionAnim, {
                toValue: height + 100,
                duration: randomDuration * 1.5, // Slower
                useNativeDriver: true,
              }),
              Animated.timing(positionAnim, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ])
          ).start();
          opacityAnim.setValue(0.6);
          break;

      case 'floating-shapes':
        // Random floating
        const moveRandomly = () => {
          Animated.sequence([
            Animated.parallel([
              Animated.timing(positionAnim, {
                toValue: Math.random() * height,
                duration: randomDuration,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: Math.random() * 1.5 + 0.5,
                duration: randomDuration,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: Math.random() * 0.5 + 0.2,
                duration: randomDuration,
                useNativeDriver: true,
              })
            ]),
          ]).start(() => moveRandomly());
        };
        moveRandomly();
        break;
        
      case 'neon-grid':
        // Moving lines (simplified as particles for now, or just bars moving down)
        Animated.loop(
          Animated.sequence([
            Animated.timing(positionAnim, {
              toValue: height,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(positionAnim, {
              toValue: -height,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
        opacityAnim.setValue(0.3);
        break;
    }
  }, [animationType, randomDuration, opacityAnim, positionAnim, scaleAnim]);

  const getStyle = () => {
    switch (animationType) {
      case 'stars':
        return {
          position: 'absolute' as const,
          left: randomX,
          top: Math.random() * height,
          width: randomSize,
          height: randomSize,
          borderRadius: randomSize / 2,
          backgroundColor: color,
          opacity: opacityAnim,
        };
      case 'bubbles':
        return {
          position: 'absolute' as const,
          left: randomX,
          bottom: -50,
          width: randomSize * 4,
          height: randomSize * 4,
          borderRadius: randomSize * 2,
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [{ translateY: positionAnim }],
        };
      case 'rain':
        return {
          position: 'absolute' as const,
          left: randomX,
          top: -100,
          width: 1,
          height: randomSize * 5,
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [{ translateY: positionAnim }],
        };
      case 'snow':
        return {
          position: 'absolute' as const,
          left: randomX,
          top: -20,
          width: randomSize,
          height: randomSize,
          borderRadius: randomSize / 2,
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [{ translateY: positionAnim }],
        };
      case 'floating-shapes':
        return {
          position: 'absolute' as const,
          left: randomX,
          top: Math.random() * height,
          width: randomSize * 6,
          height: randomSize * 6,
          borderRadius: index % 2 === 0 ? randomSize * 3 : 0, // Circle or Square
          backgroundColor: color,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        };
      case 'neon-grid':
        // Horizontal lines moving down
        return {
           position: 'absolute' as const,
           left: 0,
           right: 0,
           top: -100 + (index * 100), // Spaced out
           height: 2,
           backgroundColor: color,
           opacity: opacityAnim,
           transform: [{ translateY: positionAnim }],
        };
      default:
        return {};
    }
  };

  return <Animated.View style={getStyle()} />;
};

export default function ChatBackground({ theme, children }: ChatBackgroundProps) {
  const isSolid = theme.type === 'solid';
  const isAnimated = theme.type === 'animated';
  const particleCount = theme.animation === 'rain' ? 100 : theme.animation === 'neon-grid' ? 20 : 40;

  // Solid Background
  if (isSolid) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors[0] }]}>
        {children}
      </View>
    );
  }

  // Gradient or Animated Background (Animated uses gradient as base)
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.colors as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {isAnimated && theme.animation && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: particleCount }).map((_, i) => (
            <Particle 
              key={i} 
              index={i}
              animationType={theme.animation!} 
              color={theme.animation === 'rain' ? '#AACCFF' : theme.animation === 'stars' ? '#FFFFFF' : theme.colors[theme.colors.length - 1] === '#000000' ? '#FFFFFF' : '#FFFFFF'} 
            />
          ))}
        </View>
      )}
      
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});
