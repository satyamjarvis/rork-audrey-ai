import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, Platform, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppBackground } from '@/contexts/AppBackgroundContext';

interface ScreenContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  noTabBar?: boolean;
  noGradient?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  contentStyle?: ViewStyle;
  useGlobalBackground?: boolean;
  skipGlobalBackground?: boolean;
}

export default function ScreenContainer({
  children,
  style,
  noPadding = false,
  noTabBar = false,
  noGradient = false,
  gradientColors,
  contentStyle,
  useGlobalBackground = true,
  skipGlobalBackground = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { selectedBackground, hasCustomBackground } = useAppBackground();
  
  const isNightMode = theme.id === 'night-mode';
  const defaultGradientColors: readonly [string, string, ...string[]] = isNightMode 
    ? ["#000000", "#0A0A0A", "#000000"] as const
    : ["#9D4EDD", "#FFFFFF", "#FFB6D9"] as const;
  
  const colors = gradientColors || defaultGradientColors;
  
  const paddingTop = noPadding ? 0 : insets.top + 24;
  const paddingBottom = noTabBar 
    ? (noPadding ? 0 : insets.bottom + 20)
    : (Platform.OS === 'ios' ? 110 : 105);
  
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

  const shouldUseGlobalBackground = useGlobalBackground && hasCustomBackground && !skipGlobalBackground;
  
  if (shouldUseGlobalBackground && selectedBackground.url !== 'default') {
    return (
      <View style={[styles.container, style]}>
        <ImageBackground
          source={{ uri: selectedBackground.url }}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            {contentView}
          </View>
        </ImageBackground>
      </View>
    );
  }
  
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
  imageBackground: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
