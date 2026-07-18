import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";
import Card from "./Card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  style?: ViewStyle;
  healthId?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color,
  style,
  healthId,
}: StatCardProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const accentColor = color || colors.tint;

  return (
    <Card style={{ ...styles.card, ...style }}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.muted }]}>{title}</Text>
          <Text style={{ ...styles.value, color: accentColor }}>{value}</Text>
        </View>
        {icon && (
          <View
            style={{
              ...styles.iconContainer,
              backgroundColor: accentColor + "20",
            }}
          >
            {icon}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    flex: 1,
    marginHorizontal: 4,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
