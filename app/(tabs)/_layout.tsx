import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import { useColorScheme, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedTabBar from "../../components/AnimatedTabBar";

export default function TabLayout() {
  // Use fallback for theme store in case it's undefined
  const { isDarkMode = false } = useThemeStore() || {};
  const systemColorScheme = useColorScheme();
  // Ensure we have a valid color scheme with fallback
  const colorScheme = systemColorScheme || "light";

  // Handle potential missing Colors constant
  const defaultColors = {
    tint: "#4ade80",
    tabIconDefault: "#86efac",
    card: "#ffffff",
    text: "#000000"
  };

  // Safely access colors with fallback
  const colors = (Colors && Colors[colorScheme]) || defaultColors;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <Tabs
        tabBar={props => <AnimatedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="animals" options={{ title: "Animals" }} />
        <Tabs.Screen name="health" options={{ title: "Health" }} />
        <Tabs.Screen name="financial" options={{ title: "Financial" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>
    </SafeAreaView>
  );
}
