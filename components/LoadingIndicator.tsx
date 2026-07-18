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
  color,
  style,
  fullScreen = false,
}: LoadingIndicatorProps) {
  const { isDarkMode } = useThemeStore();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const indicatorColor = color || themeColors.tint;
  const messageColor = themeColors.muted;
  const overlayBg = isDarkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(248, 250, 252, 0.9)";

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: overlayBg }, style]}>
        <ActivityIndicator size={size} color={indicatorColor} />
        {message && <Text style={[styles.message, { color: messageColor }]}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={indicatorColor} />
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
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },
});