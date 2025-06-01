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
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    minWidth: 150,
  },
});