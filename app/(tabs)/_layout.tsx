import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import { useColorScheme, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
  const { isDarkMode } = useThemeStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            borderTopColor: "rgba(56, 161, 105, 0.1)",
            backgroundColor: colors.card,
            paddingTop: 12,
            paddingBottom: 8,
            height: 92,
            borderTopWidth: 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 8,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 0.2,
            marginTop: 4,
          },
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.card,
            shadowColor: "transparent",
            elevation: 0,
          },
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
            color: colors.text,
            letterSpacing: 0.3,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="animals"
          options={{
            title: "Animals",
            tabBarIcon: ({ color }) => (
              <Ionicons name="paw" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: "Health",
            tabBarIcon: ({ color }) => (
              <Ionicons name="medical" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="financial"
          options={{
            title: "Financial",
            tabBarIcon: ({ color }) => (
              <Ionicons name="card" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
