import React from "react";
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";

interface LoadingIndicatorProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
  style?: ViewStyle;
  fullScreen?: boolean;
}

export default function LoadingIndicator({
  message,
  size = "large",
  color = Colors.light.tint,
  style,
  fullScreen = false,
}: LoadingIndicatorProps) {
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const messageColor = isDarkMode ? "#FFFFFF" : themeColors.muted;

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, style]}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={[styles.message, { color: messageColor }]}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={[styles.message, { color: messageColor }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },
});