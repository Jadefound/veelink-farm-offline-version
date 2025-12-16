import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  PawPrint,
  TrendingDown,
  ChevronRight,
} from "lucide-react-native";
import { useFarmStore } from "@/store/farmStore";
import { useAnimalStore } from "@/store/animalStore";
import { useHealthStore } from "@/store/healthStore";
import { useFinancialStore } from "@/store/financialStore";
import { useThemeStore } from "@/store/themeStore";
import { formatCurrency } from "@/utils/helpers";
import Colors from "@/constants/colors";
import TopNavigation from "@/components/TopNavigation";
import EmptyState from "@/components/EmptyState";

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [financialStats, setFinancialStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    recentTransactions: 0,
  });

  const { farms, currentFarm, isLoading: farmsLoading } = useFarmStore();
  const { fetchAnimals, getAnimalStats } = useAnimalStore();
  const { fetchHealthRecords } = useHealthStore();
  const { fetchTransactions, getFinancialStats } = useFinancialStore();
  const { isDarkMode } = useThemeStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    if (currentFarm) {
      loadData();
    }
  }, [currentFarm]);

  const loadData = async () => {
    if (currentFarm) {
      await Promise.all([
        fetchAnimals(currentFarm.id),
        fetchHealthRecords(currentFarm.id),
        fetchTransactions(currentFarm.id),
      ]);
      const stats = await getFinancialStats(currentFarm.id);
      setFinancialStats(stats);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddFarm = () => {
    router.push("/farm/add");
  };

  // Get stats (safe defaults)
  const animalStats = currentFarm
    ? getAnimalStats(currentFarm.id)
    : { total: 0, bySpecies: [], byStatus: [], healthy: 0, needsAttention: 0 };

  if (farms.length === 0 && !farmsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="Welcome to Veelink Manager"
          message="Start by adding your first farm to manage your livestock, health records, and financial activities."
          buttonTitle="Add Your First Farm"
          onButtonPress={handleAddFarm}
          icon={
            <Image
              source={require("../../assets/images/adaptive-icon.png")}
              style={{ width: 72, height: 72, borderRadius: 20 }}
              resizeMode="contain"
            />
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {!currentFarm ? (
          <EmptyState
            title="Welcome to Veelink Manager"
            message="Start by adding your first farm to manage your livestock, health records, and financial activities."
            buttonTitle="Add Your First Farm"
            onButtonPress={handleAddFarm}
            icon={
              <Image
                source={require("../../assets/images/adaptive-icon.png")}
                style={{ width: 72, height: 72, borderRadius: 20 }}
                resizeMode="contain"
              />
            }
          />
        ) : (
          <>
            {/* Premium Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.heroContent}>
                <Text style={[styles.heroGreeting, { color: colors.muted }]}>
                  Welcome back
                </Text>
                <Text style={[styles.heroFarmName, { color: colors.text }]}>
                  {currentFarm.name}
                </Text>
                <Text style={[styles.heroLocation, { color: colors.muted }]}>
                  {currentFarm.location}
                </Text>
              </View>
              <View style={[styles.heroIcon, { backgroundColor: colors.tint + "12" }]}>
                <PawPrint size={32} color={colors.tint} />
              </View>
            </View>

            {/* Alert Banner - Only if needed */}
            {(animalStats.byStatus.find((s) => s.status === "Sick")?.count || 0) > 0 && (
              <TouchableOpacity
                style={[styles.alertBanner, { backgroundColor: colors.warning + "12" }]}
                onPress={() => router.push("/health")}
                activeOpacity={0.8}
              >
                <View style={styles.alertBannerContent}>
                  <TrendingDown size={18} color={colors.warning} />
                  <Text style={[styles.alertBannerText, { color: colors.warning }]}>
                    {animalStats.byStatus.find((s) => s.status === "Sick")?.count} animals need attention
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.warning} />
              </TouchableOpacity>
            )}

            {/* Key Stats - Compact Grid */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={[styles.statItem, { backgroundColor: colors.card }]}
                onPress={() => router.push("/animals")}
                activeOpacity={0.85}
              >
                <Text style={[styles.statValue, { color: colors.tint }]}>
                  {animalStats.total}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Total
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statItem, { backgroundColor: colors.card }]}
                onPress={() => router.push("/animals")}
                activeOpacity={0.85}
              >
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {animalStats.byStatus.find((s) => s.status === "Healthy")?.count || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Healthy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statItem, { backgroundColor: colors.card }]}
                onPress={() => router.push("/financial")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.statValue,
                    { color: financialStats.netProfit >= 0 ? colors.success : colors.danger },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(financialStats.netProfit)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Profit
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions - Minimal */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.tint }]}
                onPress={() => router.push("/animal/add")}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Animal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => router.push("/financial/add")}
                activeOpacity={0.85}
              >
                <Feather name="dollar-sign" size={20} color={colors.tint} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => router.push("/health/add")}
                activeOpacity={0.85}
              >
                <Feather name="activity" size={20} color={colors.tint} />
                <Text style={[styles.actionBtnText, { color: colors.text }]}>Health</Text>
              </TouchableOpacity>
            </View>

            {/* Navigation Links - Premium Style */}
            <View style={styles.navSection}>
              <TouchableOpacity
                style={[styles.navItem, { backgroundColor: colors.card }]}
                onPress={() => router.push("/animals")}
                activeOpacity={0.85}
              >
                <View style={styles.navItemLeft}>
                  <View style={[styles.navIcon, { backgroundColor: colors.tint + "15" }]}>
                    <Feather name="list" size={18} color={colors.tint} />
                  </View>
                  <Text style={[styles.navItemText, { color: colors.text }]}>All Animals</Text>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navItem, { backgroundColor: colors.card }]}
                onPress={() => router.push("/health")}
                activeOpacity={0.85}
              >
                <View style={styles.navItemLeft}>
                  <View style={[styles.navIcon, { backgroundColor: colors.success + "15" }]}>
                    <Feather name="heart" size={18} color={colors.success} />
                  </View>
                  <Text style={[styles.navItemText, { color: colors.text }]}>Health Records</Text>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navItem, { backgroundColor: colors.card }]}
                onPress={() => router.push("/financial")}
                activeOpacity={0.85}
              >
                <View style={styles.navItemLeft}>
                  <View style={[styles.navIcon, { backgroundColor: colors.info + "15" }]}>
                    <Feather name="trending-up" size={18} color={colors.info} />
                  </View>
                  <Text style={[styles.navItemText, { color: colors.text }]}>Financials</Text>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navItem, { backgroundColor: colors.card }]}
                onPress={() => router.push("/reports")}
                activeOpacity={0.85}
              >
                <View style={styles.navItemLeft}>
                  <View style={[styles.navIcon, { backgroundColor: colors.warning + "15" }]}>
                    <Feather name="bar-chart-2" size={18} color={colors.warning} />
                  </View>
                  <Text style={[styles.navItemText, { color: colors.text }]}>Reports</Text>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },

  // Hero Section
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingVertical: 8,
  },
  heroContent: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  heroFarmName: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroLocation: {
    fontSize: 14,
    fontWeight: "500",
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Alert Banner
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 24,
  },
  alertBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  alertBannerText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 32,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Navigation Section
  navSection: {
    gap: 10,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  navItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
