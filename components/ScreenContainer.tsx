import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  noTabBar?: boolean;
  noGradient?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  contentStyle?: ViewStyle;
}

export default function ScreenContainer({
  children,
  style,
  noPadding = false,
  noTabBar = false,
  noGradient = false,
  gradientColors,
  contentStyle,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  const isNightMode = theme.id === 'night-mode';
  const defaultGradientColors: readonly [string, string, ...string[]] = isNightMode 
    ? ["#000000", "#0A0A0A", "#000000"] as const
    : ["#9D4EDD", "#FFFFFF", "#FFB6D9"] as const;
  
  const colors = gradientColors || defaultGradientColors;
  
  // Calculate proper padding
  const paddingTop = noPadding ? 0 : insets.top + 24;
  const paddingBottom = noTabBar 
    ? (noPadding ? 0 : insets.bottom + 20)
    : (Platform.OS === 'ios' ? 110 : 105); // Account for tab bar height
  
  const contentView = (
    <View style={[
      styles.content,
      {
        paddingTop,
        paddingBottom,
      },
      contentStyle
    ]}>
      {children}
    </View>
  );
  
  if (noGradient) {
    return (
      <View style={[styles.container, style]}>
        {contentView}
      </View>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      <LinearGradient colors={colors} style={styles.gradient}>
        {contentView}
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
  },
  content: {
    flex: 1,
  },
});