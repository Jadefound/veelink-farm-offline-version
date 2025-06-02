import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Image } from 'react-native';

interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined' | 'success' | 'warning' | 'info';
  gradientColors?: readonly [string, string, ...string[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  title?: string;
  subtitle?: string;
  image?: string;
  value?: string;
  valueLabel?: string;
  status?: string;
  onPress?: () => void;
  onActionPress?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
}

export default function Card({
  children,
  style,
  variant = 'default',
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 0 },
  title,
  subtitle,
  image,
  value,
  valueLabel,
  status,
  onPress,
  onActionPress,
  actionIcon = 'chevron-forward',
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

  const getStatusColor = (status?: string) => {
    if (!status) return '#6B7280';

    switch (status.toLowerCase()) {
      case 'healthy':
      case 'active':
      case 'good':
        return '#10B981';
      case 'sick':
      case 'critical':
      case 'poor':
        return '#EF4444';
      case 'recovering':
      case 'moderate':
        return '#F59E0B';
      default:
        return '#6B7280';
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

  // If children are provided and no title, render children directly
  if (children && !title) {
    return (
      <View style={[getCardStyle(), style]}>
        {children}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[getCardStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      {image && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {status && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <View style={styles.statusDot} />
            </View>
          )}
        </View>
      )}

      <View style={styles.cardContent}>
        {title && (
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>

            {onActionPress && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onActionPress}
              >
                <Ionicons name={actionIcon} size={20} color="#059669" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {value && (
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{value}</Text>
            {valueLabel && (
              <Text style={styles.valueLabel}>{valueLabel}</Text>
            )}
          </View>
        )}

        {status && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        )}

        {children}
      </View>
    </TouchableOpacity>
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
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    marginBottom: 12,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  valueLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
