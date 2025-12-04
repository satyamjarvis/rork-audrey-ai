import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useUniverseMode } from "@/contexts/UniverseModeContext";

import { Sparkles } from "lucide-react-native";


import MoonFloatingButton from "@/components/MoonFloatingButton";
import SunFloatingButton from "@/components/SunFloatingButton";
import BrainFloatingButton from "@/components/BrainFloatingButton";
import PlannerFloatingButton from "@/components/PlannerFloatingButton";
import TrackFloatingButton from "@/components/TrackFloatingButton";
import ChatFloatingButton from "@/components/ChatFloatingButton";
import SolaraFloatingButton from "@/components/CalendlyFloatingButton";
import ContactsFloatingButton from "@/components/ContactsFloatingButton";
import SettingsFloatingButton from "@/components/SettingsFloatingButton";



export default function UniverseScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { mode: universeMode } = useUniverseMode();

  const isNightMode = theme.id === "night-mode";


  const backgroundColors = isNightMode
    ? ["#000000", "#0A0A0A", "#000000"] as const
    : ["#9D4EDD", "#FFFFFF", "#FFB6D9"] as const;



  return (
    <View style={styles.container}>
      <LinearGradient colors={backgroundColors} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
          <Sparkles 
            size={36} 
            color={isNightMode ? "#FFD700" : "#FFFFFF"} 
            fill={isNightMode ? "#FFD700" : "#FFFFFF"}
            strokeWidth={1.5}
          />
          <Text style={[styles.headerTitle, { color: isNightMode ? "#FFD700" : "#FFFFFF" }]}>Universe</Text>
        </View>

        <View style={styles.content} />
      </LinearGradient>
      
      {/* Show floating buttons based on universe mode */}
      {universeMode === "universe" ? (
        <>
          <MoonFloatingButton />
          <SunFloatingButton />
          <BrainFloatingButton />
          <PlannerFloatingButton />
          <TrackFloatingButton />
          <ChatFloatingButton />
          <SolaraFloatingButton />
          <ContactsFloatingButton />
          <SettingsFloatingButton />
        </>
      ) : (
        <>
          <PlannerFloatingButton />
          <TrackFloatingButton />
          <ChatFloatingButton />
          <SolaraFloatingButton />
          <ContactsFloatingButton />
          <SettingsFloatingButton />
        </>
      )}

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
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: "300",
    letterSpacing: 4,
    textTransform: "uppercase",
    fontVariant: ["small-caps"],
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  content: {
    flex: 1,
  },

});
