import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import { useColorScheme, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: React.ComponentProps<typeof Ionicons>["name"] = "home-outline";
            
            if (route.name === 'index') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'animals') {
              iconName = focused ? 'paw' : 'paw-outline';
            } else if (route.name === 'health') {
              iconName = focused ? 'medkit' : 'medkit-outline';
            } else if (route.name === 'financial') {
              iconName = focused ? 'card' : 'card-outline';
            } else if (route.name === 'settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary || '#38a169',
          tabBarInactiveTintColor: colors.tabIconDefault || '#A1A1AA',
          tabBarStyle: {
            backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF',
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }
        })}
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
