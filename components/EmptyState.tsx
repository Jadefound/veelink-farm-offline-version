import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Button from "./Button";
import Colors from "@/constants/colors";

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
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
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
    backgroundColor: "rgba(56, 161, 105, 0.02)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(56, 161, 105, 0.08)",
    margin: 16,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "rgba(56, 161, 105, 0.08)",
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
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: "#38A169",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 8,
  },
});
