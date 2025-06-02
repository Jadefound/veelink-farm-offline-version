import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined' | 'success' | 'warning' | 'info';
  gradientColors?: readonly [string, string, ...string[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
}

export default function Card({
  children,
  style,
  variant = 'default',
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 0 },
}: CardProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6,
          borderWidth: 1,
          borderColor: colors.border + '20',
        };

      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: colors.background,
          borderWidth: 2,
          borderColor: colors.border,
        };

      case 'success':
        return {
          ...baseStyle,
          backgroundColor: colors.success + '10',
          borderWidth: 1,
          borderColor: colors.success + '30',
        };

      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: colors.warning + '10',
          borderWidth: 1,
          borderColor: colors.warning + '30',
        };

      case 'info':
        return {
          ...baseStyle,
          backgroundColor: colors.info + '10',
          borderWidth: 1,
          borderColor: colors.info + '30',
        };

      default:
        return {
          ...baseStyle,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: colors.border + '15',
        };
    }
  };

  if (variant === "gradient" as any) {
    const defaultGradientColors = isDarkMode
      ? Colors.dark.gradient.primary
      : Colors.light.gradient.primary;

    return (
      <LinearGradient
        colors={
          (gradientColors || defaultGradientColors) as unknown as readonly [
            string,
            string,
            ...string[],
          ]
        }
        start={gradientStart}
        end={gradientEnd}
        style={[getCardStyle(), style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  elevated: {
    // No shadow styles
  },
  flat: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  pressed: {
    // No shadow styles
  },
});
