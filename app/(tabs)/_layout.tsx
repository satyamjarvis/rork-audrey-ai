import { Tabs } from "expo-router";
import { TrendingUp, Users, CalendarRange, Star, MessageSquare, CalendarClock, Sparkles } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Platform, Animated, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";


import { useUniverseMode } from "@/contexts/UniverseModeContext";

import { useTheme } from "@/contexts/ThemeContext";

function FuturisticIcon({ Icon, color, focused, size = 24 }: { Icon: any; color: string; focused: boolean; size?: number }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    // Only animate if focused to save resources
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.1, // Reduced scale
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused, glowAnim, scaleAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5], // Reduced opacity
  });

  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {focused && (
        <Animated.View
          style={{
            position: 'absolute',
            width: size + 12,
            height: size + 12,
            borderRadius: (size + 12) / 2,
            backgroundColor: focused ? theme.colors.primary + '33' : 'transparent', // 33 is approx 20% opacity
            opacity: glowOpacity,
          }}
        />
      )}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon
          color={color}
          size={size}
          strokeWidth={focused ? 2.5 : 2}
        />
      </Animated.View>
    </View>
  );
}

function GlitterParticle({ color, delay, size = 4, distance = 15, angle }: { color: string, delay: number, size?: number, distance?: number, angle: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.delay(Math.random() * 500),
      ])
    ).start();
  }, [delay, anim]);

  const rad = (angle * Math.PI) / 180;
  const translateX = Math.cos(rad) * distance;
  const translateY = Math.sin(rad) * distance;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: anim,
        transform: [
          { translateX },
          { translateY },
          { scale: anim },
        ],
        zIndex: 5,
      }}
    />
  );
}

function AnimatedStarIcon({ color, focused }: { color: string; focused: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();
  
  useEffect(() => {
    if (focused) {
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [focused, scaleAnim]);

  const starColor = theme.colors.primary;

  return (
    <View style={animatedStarStyles.container}>
      {/* Glitter particles always visible */}
      <GlitterParticle color={starColor} delay={0} angle={45} distance={18} size={3} />
      <GlitterParticle color={starColor} delay={400} angle={135} distance={20} size={4} />
      <GlitterParticle color={starColor} delay={800} angle={225} distance={16} size={2} />
      <GlitterParticle color={starColor} delay={1200} angle={315} distance={22} size={3} />
      <GlitterParticle color={starColor} delay={600} angle={90} distance={24} size={2} />
      
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          shadowColor: starColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: focused ? 0.6 : 0,
          shadowRadius: focused ? 10 : 0,
          zIndex: 10,
        }}
      >
        <Star
          color={starColor}
          fill={focused ? starColor : 'transparent'}
          size={30}
          strokeWidth={3}
        />
      </Animated.View>
    </View>
  );
}

const animatedStarStyles = StyleSheet.create({
  container: {
    width: 60,
    height: '100%' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
  },
  starBeam: {
    position: 'absolute' as const,
    width: 70,
    height: '100%' as const,
    top: 0,
    bottom: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
  sparkle: {
    position: 'absolute' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sparkleInner: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default function TabLayout() {
  const { theme } = useTheme();
  const { mode: universeMode } = useUniverseMode();
  
  // Determine if theme is dark based on background color
  // Simple check: if background is black-ish
  const isDark = theme.colors.background.toLowerCase().includes('000') || 
                 theme.colors.background.toLowerCase().includes('1a') ||
                 theme.id === 'night-mode' || 
                 theme.id === 'midnight-blue';

  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.text.light;
  const backgroundColor = isDark ? 'rgba(10, 10, 15, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  
  console.log('[TabLayout] Rendering tabs');
  console.log('[TabLayout] Universe mode:', universeMode);
  console.log('[TabLayout] Theme:', theme.name, 'Dark:', isDark);

  const handleTabPress = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarStyle: universeMode === 'universe' ? { display: 'none' as const } : {
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 90 : 80,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : backgroundColor, // On iOS we use BlurView
          borderTopWidth: 1,
          borderTopColor: borderColor,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          shadowColor: isDark ? theme.colors.primary : '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.15 : 0.05,
          shadowRadius: 12,
          elevation: 10,
          zIndex: 1000,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600" as const,
          marginTop: 4,
          marginBottom: 0,
          letterSpacing: 0.2,
          // Only show text shadow in dark mode for readability
          textShadowColor: isDark ? theme.colors.primary + '80' : 'transparent',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: isDark ? 4 : 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isDark ? 'rgba(10, 10, 15, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                borderTopWidth: 1,
                borderColor: borderColor,
              }}
            >
              {/* Subtle top gradient line for both modes */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: theme.colors.primary,
                opacity: isDark ? 0.3 : 0.2,
              }} />
            </BlurView>
          ) : (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: backgroundColor,
              borderTopWidth: 1,
              borderColor: borderColor,
            }}>
               <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: theme.colors.primary,
                opacity: isDark ? 0.3 : 0.1,
              }} />
            </View>
          )
        ),
      }}
      screenListeners={{
        tabPress: handleTabPress,
      }}
    >
      <Tabs.Screen
        name="calendly"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, focused }) => (
            <FuturisticIcon Icon={CalendarClock} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: "Planner",
          tabBarIcon: ({ color, focused }) => (
            <FuturisticIcon Icon={CalendarRange} color={color} focused={focused} />
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600" as const,
            marginTop: 4,
            marginBottom: 0,
            letterSpacing: 0.2,
             textShadowColor: isDark ? theme.colors.primary + '80' : 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: isDark ? 4 : 0,
          },
        }}
      />

      <Tabs.Screen
        name="track"
        options={{
          title: "Track",
          tabBarIcon: ({ color, focused }) => (
            <FuturisticIcon Icon={TrendingUp} color={color} focused={focused} />
          ),
        }}
      />


      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <FuturisticIcon Icon={MessageSquare} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="phonebook"
        options={{
          title: "Phonebook",
          tabBarIcon: ({ color, focused }) => (
            <FuturisticIcon Icon={Users} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="universe"
        options={{
          href: universeMode === "classic" ? null : undefined,
          title: "Universe",
          tabBarIcon: ({ color, focused }) => (
            <FuturisticIcon Icon={Sparkles} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Tools",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedStarIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="morning"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="night"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Metrics Dashboard",
          href: null,
        }}
      />
    </Tabs>
  );
}
