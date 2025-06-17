import React, { useEffect } from "react";
import { StyleSheet, View, Image, Animated } from "react-native";
import { FARM_LOGO_BASE64 } from "@/assets/images/farm-logo"; // Remove .ts extension
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
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
        source={{ uri: FARM_LOGO_BASE64 }}
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