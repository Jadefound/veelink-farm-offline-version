import React from "react";
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";

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
  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, style]}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
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
    color: Colors.light.muted,
    textAlign: "center",
  },
});