import React, { ReactNode } from 'react';
import { StyleSheet, View, ImageBackground } from 'react-native';
import { useAppBackground } from '@/contexts/AppBackgroundContext';

interface AppBackgroundWrapperProps {
  children: ReactNode;
  skip?: boolean;
  overlayOpacity?: number;
}

export default function AppBackgroundWrapper({
  children,
  skip = false,
  overlayOpacity = 0.3,
}: AppBackgroundWrapperProps) {
  const { selectedBackground, hasCustomBackground } = useAppBackground();

  if (skip || !hasCustomBackground || selectedBackground.url === 'default') {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: selectedBackground.url }}
        style={styles.imageBackground}
        resizeMode="cover"
      >
        <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }]}>
          {children}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
});
