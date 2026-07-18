import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Search,
  X,
} from "lucide-react-native";
import { useFinancialStore } from "@/store/financialStore";
import { useFarmStore } from "@/store/farmStore";
import { useAnimalStore } from "@/store/animalStore";
import { useHealthStore } from "@/store/healthStore";
import { useThemeStore } from "@/store/themeStore";
import { Transaction, TransactionCategory } from "@/types";
import { formatCurrency } from "@/utils/helpers";
import Colors from "@/constants/colors";
import TransactionCard from "@/components/TransactionCard";
import EmptyState from "@/components/EmptyState";
import TopNavigation from "@/components/TopNavigation";
import Card from "@/components/Card";
import Button from "@/components/Button";

const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  "Feed", "Medication", "Equipment", "Veterinary", "Labor", "Sales", "Purchase", "Utilities", "Other",
];

export default function FinancialScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
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
  const animals = useAnimalStore(state => state.animals);
  const healthRecords = useHealthStore(state => state.healthRecords);
  const fetchHealthRecords = useHealthStore(state => state.fetchHealthRecords);
  const farmTransactions = useMemo(() => {
    if (!currentFarm?.id) return [];
    let txns = transactions.filter(t => t.farmId === currentFarm.id);
    if (typeFilter) {
      txns = txns.filter(t => t.type === typeFilter);
    }
    if (categoryFilter) {
      txns = txns.filter(t => t.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      txns = txns.filter(t =>
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.paymentMethod?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q)
      );
    }
    return txns;
  }, [transactions, currentFarm?.id, typeFilter, categoryFilter, searchQuery]);
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    if (currentFarm) {
      loadFinancialData();
    }
  }, [currentFarm?.id]);

  // Recompute stats when animals or transactions change (e.g. after editing an animal)
  useEffect(() => {
    if (currentFarm) {
      getFinancialStats(currentFarm.id)
        .then(setFinancialStats)
        .catch(() => {});
    }
  }, [animals, transactions, healthRecords, currentFarm?.id]);

  const loadFinancialData = useCallback(async () => {
    if (currentFarm) {
      await Promise.all([
        fetchTransactions(currentFarm.id),
        fetchHealthRecords(currentFarm.id),
      ]);
      const stats = await getFinancialStats(currentFarm.id);
      setFinancialStats(stats);
    }
  }, [currentFarm?.id, fetchTransactions, fetchHealthRecords, getFinancialStats]);

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
          Transactions ({farmTransactions.length})
        </Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={[styles.viewAllText, { color: colors.tint }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Search size={18} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search transactions..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter Pills */}
      <View style={styles.filterRow}>
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: !typeFilter ? colors.tint : colors.surface }]}
            onPress={() => setTypeFilter(null)}
          >
            <Text style={[styles.filterPillText, { color: !typeFilter ? "white" : colors.muted }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: typeFilter === "Income" ? colors.success : colors.surface }]}
            onPress={() => setTypeFilter(typeFilter === "Income" ? null : "Income")}
          >
            <Text style={[styles.filterPillText, { color: typeFilter === "Income" ? "white" : colors.muted }]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: typeFilter === "Expense" ? colors.danger : colors.surface }]}
            onPress={() => setTypeFilter(typeFilter === "Expense" ? null : "Expense")}
          >
            <Text style={[styles.filterPillText, { color: typeFilter === "Expense" ? "white" : colors.muted }]}>Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter Pills */}
      <View style={styles.filterRow}>
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: !categoryFilter ? colors.tint : colors.surface }]}
            onPress={() => setCategoryFilter(null)}
          >
            <Text style={[styles.filterPillText, { color: !categoryFilter ? "white" : colors.muted }]}>All Categories</Text>
          </TouchableOpacity>
          {TRANSACTION_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterPill, { backgroundColor: categoryFilter === cat ? colors.tint : colors.surface }]}
              onPress={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            >
              <Text style={[styles.filterPillText, { color: categoryFilter === cat ? "white" : colors.muted }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  ), [financialStats, colors, handleViewAll, searchQuery, typeFilter, categoryFilter, farmTransactions.length]);

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
        data={farmTransactions}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterRow: {
    marginBottom: 10,
  },
  filterPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filterPill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillText: {
    fontSize: 13,
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
