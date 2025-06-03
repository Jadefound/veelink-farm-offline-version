import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react-native";
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
import Button from "@/components/Button";
import { mockTransactions, mockFarms } from "@/utils/mockData";

export default function FinancialScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [assetStats, setAssetStats] = useState({
    totalAnimalAssets: 0,
    totalAcquisitionCost: 0,
    assetAppreciation: 0,
    animalCount: 0,
    averageAnimalValue: 0,
  });

  // HARDCODED: Use mock data directly instead of store
  const transactions = mockTransactions;
  const farms = mockFarms;
  const currentFarm = mockFarms[0]; // Use first farm as current
  const isLoading = false;

  const { isDarkMode } = useThemeStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    if (currentFarm) {
      loadTransactions();
      loadAssetStats();
    }
  }, [currentFarm]);

  const loadTransactions = async () => {
    // Mock function - no longer needed
  };

  const loadAssetStats = async () => {
    // Mock function - no longer needed
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: '/financial/[id]',
      params: { id: transaction.id }
    });
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

  // HARDCODED: Calculate financial stats from mock data
  const financialStats = {
    totalIncome: mockTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: mockTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0),
    netProfit: mockTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0) -
      mockTransactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + t.amount, 0),
    healthCosts: mockTransactions
      .filter(t => t.category === 'Medication')
      .reduce((sum, t) => sum + t.amount, 0),
    acquisitionCosts: 0,
    animalSales: mockTransactions
      .filter(t => t.category === 'Sales')
      .reduce((sum, t) => sum + t.amount, 0),
    totalAssetValue: 15000, // Hardcoded total asset value
    recentTransactions: mockTransactions.length,
    byCategory: [],
  };

  const screenWidth = Dimensions.get("window").width;
  const isTablet = screenWidth > 768;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={[styles.overviewLabel, { color: colors.muted }]}>Income</Text>
            <Text style={[styles.overviewValue, { color: colors.text }]}>
              {formatCurrency(financialStats.totalIncome)}
            </Text>
          </Card>

          <Card variant="warning" style={styles.overviewCard}>
            <TrendingDown size={20} color={colors.danger} />
            <Text style={[styles.overviewLabel, { color: colors.muted }]}>Expenses</Text>
            <Text style={[styles.overviewValue, { color: colors.text }]}>
              {formatCurrency(financialStats.totalExpenses)}
            </Text>
          </Card>
        </View>

        {/* Asset Summary */}
        <Card variant="info" style={styles.assetCard}>
          <View style={styles.assetHeader}>
            <Text style={[styles.assetTitle, { color: colors.text }]}>Assets</Text>
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

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent
            </Text>
            <TouchableOpacity onPress={() => router.push("/reports")}>
              <Text style={[styles.viewAllText, { color: colors.tint }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading && !refreshing ? (
            <LoadingIndicator message="Loading..." />
          ) : transactions.length === 0 ? (
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
          ) : (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 5).map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onPress={handleTransactionPress}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={handleAddTransaction}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  netProfitCard: {
    marginBottom: 24,
    padding: 24,
  },
  netProfitContent: {
    alignItems: 'center',
  },
  netProfitLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  netProfitValue: {
    fontSize: 36,
    fontWeight: '900',
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  overviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  assetCard: {
    marginBottom: 24,
    padding: 20,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  assetValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  assetBreakdown: {
    gap: 4,
  },
  assetDetail: {
    fontSize: 14,
  },
  transactionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  transactionsList: {
    gap: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
