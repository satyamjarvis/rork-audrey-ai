import { TouchableOpacity, Keyboard, Platform, StyleSheet } from "react-native";
import { ArrowDown } from "lucide-react-native";
import * as Haptics from "expo-haptics";

type KeyboardDismissButtonProps = {
  color?: string;
  size?: number;
  style?: any;
  isDark?: boolean;
};

export default function KeyboardDismissButton({
  color,
  size = 20,
  style,
  isDark = false,
}: KeyboardDismissButtonProps) {
  const arrowColor = color || (isDark ? "#FFFFFF" : "#666666");
  const dismissKeyboard = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Keyboard.dismiss();
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={dismissKeyboard}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.6}
    >
      <ArrowDown color={arrowColor} size={size} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
