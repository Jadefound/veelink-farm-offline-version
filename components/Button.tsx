import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "gradient";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: readonly [string, string, ...string[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 0 },
}: ButtonProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const getButtonStyle = () => {
    const baseStyle: ViewStyle[] = [styles.button, styles[size]];
    if (fullWidth) {
      baseStyle.push(styles.fullWidth as ViewStyle);
    }

    if (disabled || loading) {
      baseStyle.push({
        ...(styles.disabled as ViewStyle),
        backgroundColor: colors.muted,
        borderColor: colors.muted,
      } as ViewStyle);
    } else {
      switch (variant) {
        case "primary":
          baseStyle.push({
            backgroundColor: colors.tint,
            borderColor: colors.tint,
          });
          break;
        case "secondary":
          baseStyle.push({
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
          });
          break;
        case "outline":
          baseStyle.push({
            backgroundColor: colors.card,
            borderColor: colors.border,
          });
          break;
        case "danger":
          baseStyle.push({
            backgroundColor: colors.danger,
            borderColor: colors.danger,
          });
          break;
      }
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: TextStyle[] = [styles.text, styles[`${size}Text`]];

    if (disabled || loading) {
      baseStyle.push({ color: colors.background });
    } else {
      switch (variant) {
        case "primary":
        case "secondary":
        case "danger":
          baseStyle.push({ color: "white" });
          break;
        case "outline":
          baseStyle.push({ color: colors.text });
          break;
      }
    }

    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  // For gradient buttons
  if (variant === "gradient" && !disabled && !loading) {
    const defaultGradientColors = isDarkMode
      ? Colors.dark.gradient.primary
      : Colors.light.gradient.primary;

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.buttonWrapper, fullWidth && styles.fullWidth, style]}
      >
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
          style={[styles.button, styles[size], styles.gradientButton]}
        >
          {icon && <Text style={styles.icon}>{icon}</Text>}
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={[getTextStyle(), { color: "white" }]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // For regular buttons
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? colors.tint : "white"}
          style={styles.loader}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
  button: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Sizes
  small: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 40,
    borderRadius: 14,
  },
  medium: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: 16,
  },
  large: {
    paddingHorizontal: 26,
    paddingVertical: 20,
    minHeight: 60,
    borderRadius: 18,
  },

  // Full width
  fullWidth: {
    width: "100%",
  },

  // Disabled
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Gradient button
  gradientButton: {
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },

  // Text styles
  text: {
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  // Icon
  icon: {
    marginRight: 10,
  },

  // Loader
  loader: {
    marginHorizontal: 10,
  },

  // Text sizes
  smallText: {
    fontSize: 14,
    fontWeight: "600",
  },
  mediumText: {
    fontSize: 16,
    fontWeight: "700",
  },
  largeText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
