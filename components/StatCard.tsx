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
}

export default function StatCard({
  title,
  value,
  icon,
  color = Colors.light.tint,
  style,
}: StatCardProps) {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, { color }]}>{value}</Text>
        </View>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
            {icon}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
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
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "600",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});