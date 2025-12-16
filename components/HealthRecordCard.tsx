import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { HealthRecord } from "@/types";
import { formatDate, formatCurrency } from "@/utils/helpers";
import Colors from "@/constants/colors";
import Card from "./Card";
import { useThemeStore } from "@/store/themeStore";

interface HealthRecordCardProps {
  record: HealthRecord;
  onPress: (record: HealthRecord) => void;
}

export default function HealthRecordCard({ record, onPress }: HealthRecordCardProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Vaccination":
        return colors.info;
      case "Treatment":
        return colors.warning;
      case "Checkup":
        return colors.success;
      case "Surgery":
        return colors.danger;
      case "Medication":
        return colors.secondary;
      default:
        return colors.muted;
    }
  };

  return (
    <TouchableOpacity onPress={() => onPress(record)} activeOpacity={0.7}>
      <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border + "30" }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(record.type) }]}>
            <Text style={styles.typeText}>{record.type}</Text>
          </View>
          <Text style={[styles.date, { color: colors.muted }]}>
            {formatDate(record.date)}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.text }]} numberOfLines={2}>
            {record.description}
          </Text>

          {record.diagnosis && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Diagnosis:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{record.diagnosis}</Text>
            </View>
          )}

          {record.treatment && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Treatment:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{record.treatment}</Text>
            </View>
          )}

          {record.medication && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Medication:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{record.medication}</Text>
            </View>
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.veterinarian, { color: colors.muted }]}>
            {record.veterinarian ? `Dr. ${record.veterinarian}` : "No veterinarian"}
          </Text>
          <Text style={[styles.cost, { color: colors.text }]}>{formatCurrency(record.cost)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  typeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  date: {
    fontSize: 14,
  },
  content: {
    padding: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
  },
  veterinarian: {
    fontSize: 14,
  },
  cost: {
    fontSize: 16,
    fontWeight: "600",
  },
});