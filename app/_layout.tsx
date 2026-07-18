import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Platform, View, Text } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const isWeb = Platform.OS === "web";

const RootLayout = () => {
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded, fontError] = useFonts(
    isWeb
      ? {}
      : {
          ...FontAwesome.font,
          SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
        }
  );

  const {
    checkBiometricSupport,
    isAuthenticated,
    isFirstTimeUser,
    authSettings,
    isBiometricSupported,
  } = useAuthStore();
  const { fetchFarms } = useFarmStore();
  const { isDarkMode } = useThemeStore();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkBiometricSupport();

        if (fontsLoaded || fontError) {
          await ExpoSplashScreen.hideAsync();
          setIsReady(true);
        }
      } catch (error) {
        console.error("App initialization error:", error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "auth";
    const shouldUseBiometric = authSettings.useBiometric && isBiometricSupported;

    if (isFirstTimeUser) {
      if (!inAuthGroup) {
        router.replace("/auth/register");
      }
    } else if (!isAuthenticated && shouldUseBiometric) {
      if (segments.join("/") !== "auth/login") {
        router.replace("/auth/login");
      }
    } else if (!isAuthenticated && !shouldUseBiometric) {
      useAuthStore.getState().unlockApp();
    }
  }, [isReady, isFirstTimeUser, isAuthenticated, authSettings.useBiometric, isBiometricSupported, segments]);

  useEffect(() => {
    if (isAuthenticated && !isFirstTimeUser) {
      fetchFarms();
    }
  }, [isAuthenticated, isFirstTimeUser]);

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
        // Silent fail
      }
    };
    configureNavBar();
  }, [isDarkMode]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
        <Stack.Screen name="health/[id]" options={{ title: "Health Record" }} />
        <Stack.Screen name="financial/[id]" options={{ title: "Transaction Details" }} />
        <Stack.Screen name="farm/add" options={{ title: "Add Farm", headerShown: true }} />
        <Stack.Screen name="health/add" options={{ title: "Add Health Record" }} />
        <Stack.Screen name="financial/add" options={{ title: "Add Transaction" }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </>
  );
};

export default RootLayout;
