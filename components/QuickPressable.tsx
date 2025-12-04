import React, { useCallback } from "react";
import { Pressable, PressableProps, Platform, Animated } from "react-native";
import * as Haptics from "expo-haptics";

interface QuickPressableProps extends PressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  hapticStyle?: "light" | "medium" | "heavy" | "selection";
  scaleEffect?: boolean;
}

export default function QuickPressable({
  children,
  onPress,
  hapticStyle = "light",
  scaleEffect = true,
  ...props
}: QuickPressableProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (Platform.OS !== "web") {
      switch (hapticStyle) {
        case "light":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "selection":
          Haptics.selectionAsync();
          break;
      }
    }

    if (scaleEffect) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
    }
  }, [hapticStyle, scaleEffect, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (scaleEffect) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
    }
  }, [scaleEffect, scaleAnim]);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...props}
    >
      {scaleEffect ? (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {children}
        </Animated.View>
      ) : (
        children
      )}
    </Pressable>
  );
}
