import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen"; // Renamed import
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Platform, View, Text } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SplashScreen from "../components/SplashScreen";

const LOG_ENDPOINT = 'http://127.0.0.1:7246/ingest/79193bdc-f2c4-4e7b-8086-16038e987145';
const log = (location: string, message: string, data: Record<string, unknown>, hypothesisId: string) => {
  fetch(LOG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, message, data, timestamp: Date.now(), hypothesisId }) }).catch(() => {});
};

export default function RootLayout() {
  // #region agent log
  log('_layout.tsx:RootLayout', 'RootLayout mounted', {}, 'A');
  // #endregion
  // Add state for custom splash screen
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // Load fonts with error handling
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Safely access store values with fallbacks
  const {
    checkBiometricSupport,
    isAuthenticated = false,
    isFirstTimeUser = true
  } = useAuthStore() || {};

  const { fetchFarms } = useFarmStore() || {};
  const { isDarkMode = false } = useThemeStore() || {};

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check biometric support first
        if (typeof checkBiometricSupport === 'function') {
          await checkBiometricSupport();
        }

        if (fontsLoaded) {
          await ExpoSplashScreen.hideAsync(); // Change SplashScreen to ExpoSplashScreen

          // Load farms if authenticated
          if (isAuthenticated && !isFirstTimeUser && typeof fetchFarms === 'function') {
            await fetchFarms();
          }
        }
      } catch (error) {
        // #region agent log
        log('_layout.tsx:init', 'App init error', { error: String(error), message: error instanceof Error ? error.message : '' }, 'B');
        // #endregion
        console.error('App initialization error:', error);
        // Always hide splash screen even if there's an error
        await ExpoSplashScreen.hideAsync().catch(console.error); // Change SplashScreen to ExpoSplashScreen
      }
    };

    initializeApp();
  }, [fontsLoaded, isAuthenticated, isFirstTimeUser, checkBiometricSupport, fetchFarms]);

  useEffect(() => {
    // Configure navigation bar for Android
    const configureNavBar = async () => {
      try {
        if (Platform.OS === 'android' && NavigationBar) {
          await NavigationBar.setBackgroundColorAsync(isDarkMode ? '#0f172a' : '#f8fafc');
          await NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
        }
      } catch {
        // Silent fail - navigation bar styling is not critical
      }
    };
    configureNavBar();
  }, [isDarkMode]);

  // #region agent log
  if (fontsLoaded || fontError) {
    log('_layout.tsx:fonts', 'Font load result', { fontsLoaded: !!fontsLoaded, fontError: fontError?.message ?? null }, 'A');
  }
  // #endregion
  // Show loading state or error while fonts are loading
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Show error if fonts failed to load
  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Font loading error: {fontError.message}</Text>
      </View>
    );
  }

  // Show custom splash screen
  if (showCustomSplash) {
    return <SplashScreen onFinish={() => setShowCustomSplash(false)} />;
  }

  // #region agent log
  log('_layout.tsx:main', 'Rendering main Stack (past splash)', {}, 'A');
  // #endregion
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="animal/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="health/[id]" options={{ title: "Health Record" }} />
        <Stack.Screen name="financial/[id]" options={{ title: "Transaction Details" }} />
        <Stack.Screen name="farm/add" options={{ title: "Add Farm" }} />
        <Stack.Screen name="health/add" options={{ title: "Add Health Record" }} />
        <Stack.Screen name="transaction/add" options={{ title: "Add Transaction" }} />
        <Stack.Screen name="financial/add" options={{ title: "Add Transaction" }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </GestureHandlerRootView>
  );
}

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent splash screen from auto-hiding - wrapped in try/catch for production safety
try {
  ExpoSplashScreen.preventAutoHideAsync();
} catch {
  // Silent fail - not critical
}