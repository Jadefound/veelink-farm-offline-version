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

export default function TransactionCard({ transaction, onPress }: TransactionCardProps) {
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

  // Get category icon or color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Feed":
        return "#f59e0b";
      case "Medication":
        return "#3b82f6";
      case "Equipment":
        return "#6366f1";
      case "Veterinary":
        return "#ec4899";
      case "Labor":
        return "#8b5cf6";
      case "Sales":
        return "#10b981";
      case "Purchase":
        return "#ef4444";
      case "Utilities":
        return "#6b7280";
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
                { backgroundColor: getTypeColor(transaction.type) }
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
                color: transaction.type === "Income" 
                  ? Colors.light.success 
                  : Colors.light.danger 
              }
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
                      { backgroundColor: getCategoryColor(transaction.category) }
                    ]} 
                  />
                  <Text style={styles.detailValue}>{transaction.category}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment:</Text>
                <Text style={styles.detailValue}>{transaction.paymentMethod}</Text>
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
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "column",
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
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
  amount: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailColumn: {
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.muted,
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});