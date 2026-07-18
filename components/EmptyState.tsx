import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Button from "./Button";
import Colors from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";

interface EmptyStateProps {
  title: string;
  message: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export default function EmptyState({
  title,
  message,
  buttonTitle,
  onButtonPress,
  icon,
  style,
}: EmptyStateProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const tintColor = colors.tint;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${tintColor}05`,
          borderColor: `${tintColor}14`,
        },
        style,
      ]}
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${tintColor}14` },
          ]}
        >
          {icon}
        </View>
      )}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      {buttonTitle && onButtonPress && (
        <Button
          title={buttonTitle}
          onPress={onButtonPress}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    margin: 16,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 8,
  },
});
