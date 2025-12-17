import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";
import { useFinancialStore } from "@/store/financialStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Transaction } from "@/types";
import { formatCurrency } from "@/utils/helpers";
import Colors from "@/constants/colors";
import TransactionCard from "@/components/TransactionCard";
import EmptyState from "@/components/EmptyState";
import TopNavigation from "@/components/TopNavigation";
import Card from "@/components/Card";
import Button from "@/components/Button";

const ITEM_HEIGHT = 80; // Approximate height for transaction cards

export default function FinancialScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [financialStats, setFinancialStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    healthCosts: 0,
    acquisitionCosts: 0,
    animalSales: 0,
    totalAssetValue: 0,
    recentTransactions: 0,
    byCategory: [] as { category: string; amount: number; type: "Income" | "Expense" }[],
  });

  const transactions = useFinancialStore(state => state.transactions);
  const fetchTransactions = useFinancialStore(state => state.fetchTransactions);
  const getFinancialStats = useFinancialStore(state => state.getFinancialStats);
  const { farms, currentFarm } = useFarmStore();
  const farmTransactions = useMemo(() => {
    if (!currentFarm?.id) return [];
    return transactions.filter(t => t.farmId === currentFarm.id);
  }, [transactions, currentFarm?.id]);
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Load data on mount and when farm changes
  useEffect(() => {
    if (currentFarm) {
      loadFinancialData();
    }
  }, [currentFarm?.id]);

  const loadFinancialData = useCallback(async () => {
    if (currentFarm) {
      await fetchTransactions(currentFarm.id);
      const stats = await getFinancialStats(currentFarm.id);
      setFinancialStats(stats);
    }
  }, [currentFarm?.id, fetchTransactions, getFinancialStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFinancialData();
    setRefreshing(false);
  }, [loadFinancialData]);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    router.push({
      pathname: "/financial/[id]",
      params: { id: transaction.id },
    });
  }, [router]);

  const handleAddTransaction = useCallback(() => {
    router.push("/financial/add");
  }, [router]);

  const handleAddFarm = useCallback(() => {
    router.push("/farm/add");
  }, [router]);

  const handleViewAll = useCallback(() => {
    router.push({ pathname: "/reports", params: { reportType: "financial" } });
  }, [router]);

  // Memoize renderItem
  const renderItem = useCallback(({ item }: { item: Transaction }) => (
    <TransactionCard
      transaction={item}
      onPress={handleTransactionPress}
    />
  ), [handleTransactionPress]);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  // Memoize the header component
  const ListHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      {/* Net Profit Highlight */}
      <Card variant="elevated" style={styles.netProfitCard}>
        <View style={styles.netProfitContent}>
          <Text style={[styles.netProfitLabel, { color: colors.muted }]}>
            Net Profit
          </Text>
          <Text
            style={[
              styles.netProfitValue,
              {
                color:
                  financialStats.netProfit >= 0
                    ? colors.success
                    : colors.danger,
              },
            ]}
          >
            {formatCurrency(financialStats.netProfit)}
          </Text>
        </View>
      </Card>

      {/* Financial Overview */}
      <View style={styles.overviewGrid}>
        <Card variant="success" style={styles.overviewCard}>
          <TrendingUp size={20} color={colors.success} />
          <Text style={[styles.overviewLabel, { color: colors.muted }]}>
            Income
          </Text>
          <Text style={[styles.overviewValue, { color: colors.text }]}>
            {formatCurrency(financialStats.totalIncome)}
          </Text>
        </Card>

        <Card variant="warning" style={styles.overviewCard}>
          <TrendingDown size={20} color={colors.danger} />
          <Text style={[styles.overviewLabel, { color: colors.muted }]}>
            Expenses
          </Text>
          <Text style={[styles.overviewValue, { color: colors.text }]}>
            {formatCurrency(financialStats.totalExpenses)}
          </Text>
        </Card>
      </View>

      {/* Asset Summary */}
      <Card variant="info" style={styles.assetCard}>
        <View style={styles.assetHeader}>
          <Text style={[styles.assetTitle, { color: colors.text }]}>
            Assets
          </Text>
          <Text style={[styles.assetValue, { color: colors.tint }]}>
            {formatCurrency(financialStats.totalAssetValue)}
          </Text>
        </View>
        <View style={styles.assetBreakdown}>
          <Text style={[styles.assetDetail, { color: colors.muted }]}>
            Animal Sales: {formatCurrency(financialStats.animalSales)}
          </Text>
          <Text style={[styles.assetDetail, { color: colors.muted }]}>
            Health Costs: {formatCurrency(financialStats.healthCosts)}
          </Text>
        </View>
      </Card>

      {/* Recent Transactions Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent
        </Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={[styles.viewAllText, { color: colors.tint }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [financialStats, colors, handleViewAll]);

  const ListEmpty = useMemo(() => (
    <Card variant="outlined" style={styles.emptyCard}>
      <Text style={[styles.emptyText, { color: colors.muted }]}>
        No transactions yet
      </Text>
      <Button
        title="Add First Transaction"
        onPress={handleAddTransaction}
        variant="outline"
        size="small"
      />
    </Card>
  ), [colors.muted, handleAddTransaction]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />

      <FlatList
        data={farmTransactions.slice(0, 10)} // Show recent transactions for current farm
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={getItemLayout}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={handleAddTransaction}
        activeOpacity={0.8}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  netProfitCard: {
    marginBottom: 24,
    padding: 24,
  },
  netProfitContent: {
    alignItems: "center",
  },
  netProfitLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  netProfitValue: {
    fontSize: 36,
    fontWeight: "900",
  },
  overviewGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  overviewLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  assetCard: {
    marginBottom: 24,
    padding: 20,
  },
  assetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  assetTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  assetValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  assetBreakdown: {
    gap: 4,
  },
  assetDetail: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
