import { memo, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

export type PlanetBadgeProps = {
  size?: number;
  isNightMode?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const PlanetBadge = memo(({ size = 150, isNightMode = false, style, testID }: PlanetBadgeProps) => {
  const palette = useMemo(
    () =>
      isNightMode
        ? {
            planet: ['#120B2F', '#2A1558', '#5A2F86'] as const,
            highlight: 'rgba(255, 255, 255, 0.55)',
            glow: 'rgba(255, 0, 255, 0.5)',
            rings: 'rgba(205, 127, 50, 0.6)',
            band: 'rgba(255, 0, 255, 0.25)',
            cloud: 'rgba(255, 255, 255, 0.15)',
          }
        : {
            planet: ['#0F3D49', '#1FA094', '#35D2C2'] as const,
            highlight: 'rgba(255, 255, 255, 0.7)',
            glow: 'rgba(255, 255, 255, 0.45)',
            rings: 'rgba(255, 255, 255, 0.4)',
            band: 'rgba(255, 255, 255, 0.25)',
            cloud: 'rgba(255, 255, 255, 0.35)',
          },
    [isNightMode],
  );

  const glowSize = size + 32;
  const ringSize = size * 1.18;

  return (
    <View testID={testID} style={[styles.container, style]} pointerEvents="none">
      <View
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            borderColor: palette.glow,
          },
        ]}
      />
      <View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: palette.rings,
          },
        ]}
      />
      <LinearGradient
        colors={palette.planet}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.planet, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View
          style={[
            styles.highlight,
            {
              width: size * 0.55,
              height: size * 0.55,
              borderRadius: (size * 0.55) / 2,
              backgroundColor: palette.highlight,
            },
          ]}
        />
        <View
          style={[
            styles.band,
            {
              width: size * 1.05,
              height: size * 0.16,
              top: size * 0.45,
              backgroundColor: palette.band,
            },
          ]}
        />
        <View
          style={[
            styles.band,
            {
              width: size * 0.95,
              height: size * 0.12,
              top: size * 0.32,
              backgroundColor: palette.band,
              opacity: 0.7,
              transform: [{ rotate: '-12deg' }],
            },
          ]}
        />
        <View
          style={[
            styles.cloud,
            {
              width: size * 0.6,
              height: size * 0.22,
              top: size * 0.25,
              left: size * 0.35,
              backgroundColor: palette.cloud,
            },
          ]}
        />
        <View
          style={[
            styles.cloud,
            {
              width: size * 0.4,
              height: size * 0.18,
              top: size * 0.58,
              left: -size * 0.05,
              backgroundColor: palette.cloud,
              opacity: 0.6,
            },
          ]}
        />
      </LinearGradient>
    </View>
  );
});

PlanetBadge.displayName = 'PlanetBadge';

export default PlanetBadge;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.4,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.5,
    transform: [{ rotate: '-8deg' }],
  },
  planet: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: '12%',
    left: '18%',
    opacity: 0.35,
  },
  band: {
    position: 'absolute',
    borderRadius: 999,
  },
  cloud: {
    position: 'absolute',
    borderRadius: 999,
  },
});
