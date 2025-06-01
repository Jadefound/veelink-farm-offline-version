import React from "react";
import { Tabs } from "expo-router";
import { Home, PawPrint, Stethoscope, DollarSign, Settings } from "lucide-react-native";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import { useColorScheme, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
  const { isDarkMode } = useThemeStore();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
            borderTopColor: colors.border,
            backgroundColor: colors.card,
            paddingTop: 8,
            height: 88,
          },
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.card,
            shadowColor: "transparent",
            elevation: 0,
          },
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 18,
            color: colors.text,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="animals"
          options={{
            title: "Animals",
            tabBarIcon: ({ color }) => <PawPrint size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: "Health",
            tabBarIcon: ({ color }) => <Stethoscope size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="financial"
          options={{
            title: "Financial",
            tabBarIcon: ({ color }) => <DollarSign size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}