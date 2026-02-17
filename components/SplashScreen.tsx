import React, { useEffect } from "react";
import { StyleSheet, View, Image } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/79193bdc-f2c4-4e7b-8086-16038e987145', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'SplashScreen.tsx:render', message: 'SplashScreen rendering', data: { isDarkMode }, timestamp: Date.now(), hypothesisId: 'D' }) }).catch(() => {});
  // #endregion
  // Automatically hide after 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [onFinish]);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require("@/assets/images/splash-icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 150,
    height: 150,
  },
});