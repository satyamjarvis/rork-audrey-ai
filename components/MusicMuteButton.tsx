import { StyleSheet, Animated } from "react-native";
import { Volume2, VolumeX } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";

import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import QuickPressable from "@/components/QuickPressable";

export default function MusicMuteButton() {
  const { isMuted, toggleMute, isLoading, isDisabled } = useMusicPlayer();
  const insets = useSafeAreaInsets();
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const handlePress = React.useCallback(async () => {
    try {
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      await toggleMute();
    } catch (error) {
      console.error("Error in MusicMuteButton:", error);
    }
  }, [toggleMute, rotateAnim]);

  if (isLoading || isDisabled) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <QuickPressable
      style={[styles.muteButton, { top: insets.top + 10 }]}
      onPress={handlePress}
      hapticStyle="light"
      testID="music-mute-button"
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        {isMuted ? (
          <VolumeX color="rgba(240, 235, 238, 0.85)" size={24} strokeWidth={2.5} />
        ) : (
          <Volume2 color="rgba(240, 235, 238, 0.85)" size={24} strokeWidth={2.5} />
        )}
      </Animated.View>
    </QuickPressable>
  );
}

const styles = StyleSheet.create({
  muteButton: {
    position: "absolute",
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
