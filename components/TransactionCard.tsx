import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Transaction } from "@/types";
import { formatDate, formatCurrency } from "@/utils/helpers";
import Colors from "@/constants/colors";
import Card from "./Card";

interface TransactionCardProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

export default function TransactionCard({
  transaction,
  onPress,
}: TransactionCardProps) {
  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Income":
        return Colors.light.success;
      case "Expense":
        return Colors.light.danger;
      default:
        return Colors.light.muted;
    }
  };

  // Get category icon or color with nature theme
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Feed":
        return Colors.light.nature.wheat; // Golden wheat color
      case "Medication":
        return Colors.light.nature.sky; // Sky blue
      case "Equipment":
        return Colors.light.nature.bark; // Tree bark brown
      case "Veterinary":
        return Colors.light.secondary; // Golden yellow
      case "Labor":
        return Colors.light.nature.earth; // Rich earth brown
      case "Sales":
        return Colors.light.nature.grass; // Fresh grass green
      case "Purchase":
        return Colors.light.danger; // Natural red
      case "Utilities":
        return Colors.light.nature.soil; // Rich soil brown
      default:
        return Colors.light.muted;
    }
  };

  return (
    <TouchableOpacity onPress={() => onPress(transaction)} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: getTypeColor(transaction.type) },
              ]}
            >
              <Text style={styles.typeText}>{transaction.type}</Text>
            </View>
            <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          </View>
          <Text
            style={[
              styles.amount,
              {
                color:
                  transaction.type === "Income"
                    ? Colors.light.success
                    : Colors.light.danger,
              },
            ]}
          >
            {transaction.type === "Income" ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description} numberOfLines={2}>
            {transaction.description}
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailColumn}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <View style={styles.categoryContainer}>
                  <View
                    style={[
                      styles.categoryDot,
                      {
                        backgroundColor: getCategoryColor(transaction.category),
                      },
                    ]}
                  />
                  <Text style={styles.detailValue}>{transaction.category}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment:</Text>
                <Text style={styles.detailValue}>
                  {transaction.paymentMethod}
                </Text>
              </View>
            </View>

            {transaction.reference && (
              <View style={styles.detailColumn}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {transaction.reference}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(56, 161, 105, 0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: "column",
  },
  typeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 14,
    color: Colors.light.muted,
    fontWeight: "500",
  },
  amount: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  content: {
    marginTop: 6,
  },
  description: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(56, 161, 105, 0.03)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(56, 161, 105, 0.08)",
  },
  detailColumn: {
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.muted,
    width: 75,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
    fontWeight: "500",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
});
