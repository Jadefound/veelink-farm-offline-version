import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...FontAwesome.font,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { isAuthenticated } = useAuthStore();
  const { fetchFarms } = useFarmStore();
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Load farms when app starts
      fetchFarms();
    }
  }, [fontsLoaded, fetchFarms]);

  useEffect(() => {
    // Configure navigation bar for Android
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(isDarkMode ? '#0f172a' : '#f8fafc');
      NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
    }
  }, [isDarkMode]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="farm" options={{ headerShown: false }} />
        <Stack.Screen name="animal" options={{ headerShown: false }} />
        <Stack.Screen name="health" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="farm/[id]" options={{ title: "Farm Details" }} />
          <Stack.Screen name="animal/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="health/[id]" options={{ title: "Health Record" }} />
          <Stack.Screen name="transaction/[id]" options={{ title: "Transaction Details" }} />
          <Stack.Screen name="farm/add" options={{ title: "Add Farm" }} />
          <Stack.Screen name="health/add" options={{ title: "Add Health Record" }} />
          <Stack.Screen name="transaction/add" options={{ title: "Add Transaction" }} />
          <Stack.Screen name="financial/add" options={{ title: "Add Transaction" }} />
          <Stack.Screen name="reports" options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}