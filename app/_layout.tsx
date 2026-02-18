import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Platform, View, Text } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

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

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const RootLayout = () => {
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font,
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const {
    checkBiometricSupport,
    isAuthenticated = false,
    isFirstTimeUser = true,
  } = useAuthStore() || {};
  const { fetchFarms } = useFarmStore() || {};
  const { isDarkMode = false } = useThemeStore() || {};

  // #region agent log
  debugLog(
    "app/_layout.tsx:render",
    "RootLayout render",
    { fontsLoaded: !!fontsLoaded, fontError: !!fontError },
    "H1",
    "post-fix-2"
  );
  // #endregion

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // #region agent log
        debugLog(
          "app/_layout.tsx:init",
          "initializeApp start",
          {
            fontsLoaded: !!fontsLoaded,
            fontError: !!fontError,
            isAuthenticated,
            isFirstTimeUser,
          },
          "H2",
          "post-fix-2"
        );
        // #endregion

        if (typeof checkBiometricSupport === "function") {
          await checkBiometricSupport();
        }

        if (fontsLoaded || fontError) {
          await ExpoSplashScreen.hideAsync();

          if (
            isAuthenticated &&
            !isFirstTimeUser &&
            typeof fetchFarms === "function"
          ) {
            await fetchFarms();
          }
        }
      } catch (error) {
        // #region agent log
        debugLog(
          "app/_layout.tsx:initError",
          "App initialization error",
          {
            errorMessage:
              error instanceof Error ? error.message : String(error),
          },
          "H3",
          "post-fix-2"
        );
        // #endregion
        console.error("App initialization error:", error);
      }
    };

    initializeApp();
  }, [
    fontsLoaded,
    fontError,
    isAuthenticated,
    isFirstTimeUser,
    checkBiometricSupport,
    fetchFarms,
  ]);

  useEffect(() => {
    const configureNavBar = async () => {
      try {
        if (Platform.OS === "android" && NavigationBar) {
          await NavigationBar.setBackgroundColorAsync(
            isDarkMode ? "#0f172a" : "#f8fafc"
          );
          await NavigationBar.setButtonStyleAsync(
            isDarkMode ? "light" : "dark"
          );
        }
      } catch {
        // Silent fail - navigation bar styling is not critical
      }
    };
    configureNavBar();
  }, [isDarkMode]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fontError) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Font loading error</Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="animal/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="health/[id]"
          options={{ title: "Health Record" }}
        />
        <Stack.Screen
          name="financial/[id]"
          options={{ title: "Transaction Details" }}
        />
        <Stack.Screen name="farm/add" options={{ title: "Add Farm" }} />
        <Stack.Screen
          name="health/add"
          options={{ title: "Add Health Record" }}
        />
        <Stack.Screen
          name="transaction/add"
          options={{ title: "Add Transaction" }}
        />
        <Stack.Screen
          name="financial/add"
          options={{ title: "Add Transaction" }}
        />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </>
  );
};

export default RootLayout;