import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react-native";
import { useFinancialStore } from "@/store/financialStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Transaction } from "@/types";
import { formatCurrency } from "@/utils/helpers";
import Colors from "@/constants/colors";
import TransactionCard from "@/components/TransactionCard";
import EmptyState from "@/components/EmptyState";
import LoadingIndicator from "@/components/LoadingIndicator";
import TopNavigation from "@/components/TopNavigation";
import StatCard from "@/components/StatCard";
import Card from "@/components/Card";

export default function FinancialScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  const { transactions, fetchTransactions, getFinancialStats, isLoading } = useFinancialStore();
  const { farms, currentFarm } = useFarmStore();
  const { isDarkMode } = useThemeStore();
  
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  useEffect(() => {
    if (currentFarm) {
      loadTransactions();
    }
  }, [currentFarm]);
  
  const loadTransactions = async () => {
    if (currentFarm) {
      await fetchTransactions(currentFarm.id);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };
  
  const handleTransactionPress = (transaction: Transaction) => {
    router.push(`/financial/${transaction.id}`);
  };
  
  const handleAddTransaction = () => {
    router.push("/financial/add");
  };
  
  const handleAddFarm = () => {
    router.push("/farm/add");
  };
  
  if (farms.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No Farms Available"
          message="Add a farm before managing financial records"
          buttonTitle="Add Farm"
          onButtonPress={handleAddFarm}
        />
      </View>
    );
  }
  
  const financialStats = currentFarm ? getFinancialStats(currentFarm.id) : {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    recentTransactions: 0,
    byCategory: []
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      
      <View style={styles.header}>
        <Card style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Financial Summary</Text>
          
          <View style={styles.statsContainer}>
            <StatCard
              title="Total Income"
              value={formatCurrency(financialStats.totalIncome)}
              icon={<TrendingUp size={20} color={colors.success} />}
              color={colors.success}
              style={styles.statCard}
            />
            <StatCard
              title="Total Expenses"
              value={formatCurrency(financialStats.totalExpenses)}
              icon={<TrendingDown size={20} color={colors.danger} />}
              color={colors.danger}
              style={styles.statCard}
            />
          </View>
          
          <View style={styles.netProfitContainer}>
            <StatCard
              title="Net Profit"
              value={formatCurrency(financialStats.netProfit)}
              icon={<DollarSign size={24} color={financialStats.netProfit >= 0 ? colors.success : colors.danger} />}
              color={financialStats.netProfit >= 0 ? colors.success : colors.danger}
              style={styles.netProfitCard}
            />
          </View>
        </Card>
      </View>
      
      {isLoading && !refreshing ? (
        <LoadingIndicator message="Loading financial records..." />
      ) : (
        <>
          {transactions.length === 0 ? (
            <EmptyState
              title="No Financial Records"
              message="Add your first transaction to start tracking farm finances"
              buttonTitle="Add Transaction"
              onButtonPress={handleAddTransaction}
            />
          ) : (
            <View style={styles.listContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
              <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TransactionCard transaction={item} onPress={handleTransactionPress} />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.tint }]}
            onPress={handleAddTransaction}
            activeOpacity={0.8}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  netProfitContainer: {
    alignItems: "center",
  },
  netProfitCard: {
    minWidth: 200,
  },
  listContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});