import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { HealthRecord } from "@/types";
import { formatDate, formatCurrency } from "@/utils/helpers";
import Colors from "@/constants/colors";
import Card from "./Card";

interface HealthRecordCardProps {
  record: HealthRecord;
  onPress: (record: HealthRecord) => void;
}

export default function HealthRecordCard({ record, onPress }: HealthRecordCardProps) {
  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Vaccination":
        return Colors.light.info;
      case "Treatment":
        return Colors.light.warning;
      case "Checkup":
        return Colors.light.success;
      case "Surgery":
        return Colors.light.danger;
      case "Medication":
        return Colors.light.secondary;
      default:
        return Colors.light.muted;
    }
  };

  return (
    <TouchableOpacity onPress={() => onPress(record)} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(record.type) }]}>
            <Text style={styles.typeText}>{record.type}</Text>
          </View>
          <Text style={styles.date}>
            {formatDate(record.date)}
          </Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.description} numberOfLines={2}>
            {record.description}
          </Text>
          
          {record.diagnosis && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Diagnosis:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{record.diagnosis}</Text>
            </View>
          )}
          
          {record.treatment && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Treatment:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{record.treatment}</Text>
            </View>
          )}
          
          {record.medication && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Medication:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{record.medication}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.veterinarian}>
            {record.veterinarian ? `Dr. ${record.veterinarian}` : "No veterinarian"}
          </Text>
          <Text style={styles.cost}>{formatCurrency(record.cost)}</Text>
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
    borderBottomColor: Colors.light.border,
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
    color: Colors.light.muted,
  },
  content: {
    padding: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.muted,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  veterinarian: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  cost: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
});