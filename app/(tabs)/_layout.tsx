import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import {
  useColorScheme,
  StatusBar,
  useWindowDimensions,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOG_ENDPOINT = "http://127.0.0.1:7246/ingest/79193bdc-f2c4-4e7b-8086-16038e987145";

const debugLog = (
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId: string
) => {
  fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId,
    }),
  }).catch(() => {});
};

const TabLayout = () => {
  // Use fallback for theme store in case it's undefined
  const { isDarkMode = false } = useThemeStore() || {};
  const systemColorScheme = useColorScheme();
  const { height } = useWindowDimensions();
  
  // Ensure we have a valid color scheme with fallback
  const colorScheme = systemColorScheme || "light";

  // #region agent log
  debugLog(
    "app/(tabs)/_layout.tsx:render",
    "TabLayout render",
    { isDarkMode, systemColorScheme },
    "H4",
    "post-fix-2"
  );
  // #endregion

  // Handle potential missing Colors constant
  const defaultColors = {
    tint: "#4ade80",
    tabIconDefault: "#86efac",
    card: "#ffffff",
    text: "#000000",
    background: "#ffffff",
  };

  // Safely access colors with fallback
  const colors = (Colors && Colors[colorScheme]) || defaultColors;

  // Calculate responsive vertical margins based on screen height
  const topMargin = Math.max(height * 0.015, 12);
  const bottomMargin = Math.max(height * 0.01, 8);

  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: isDarkMode ? colors.background : colors.background }
      ]} 
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.contentWrapper, { marginTop: topMargin, marginBottom: bottomMargin }]}>
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
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          })}
        >
          <Tabs.Screen name="index" options={{ title: "Home" }} />
          <Tabs.Screen name="animals" options={{ title: "Animals" }} />
          <Tabs.Screen name="health" options={{ title: "Health" }} />
          <Tabs.Screen name="financial" options={{ title: "Financial" }} />
          <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        </Tabs>
      </View>
    </SafeAreaView>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
});
