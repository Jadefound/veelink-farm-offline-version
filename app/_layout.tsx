import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/store/authStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const { isAuthenticated } = useAuthStore();
  const { fetchFarms } = useFarmStore();
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFarms();
    }
  }, [isAuthenticated, fetchFarms]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "auto"} />
      <RootLayoutNav />
    </>
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
          <Stack.Screen name="animal/add" options={{ headerShown: false }} />
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