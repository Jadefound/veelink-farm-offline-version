import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
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
  color = Colors.light.tint,
  style,
  healthId,
}: StatCardProps) {
  return (
    <Card style={{ ...styles.card, ...style }}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={{ ...styles.value, color }}>{value}</Text>
        </View>
        {icon && (
          <View
            style={{
              ...styles.iconContainer,
              backgroundColor: color + "20",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
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
    color: Colors.light.muted,
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
