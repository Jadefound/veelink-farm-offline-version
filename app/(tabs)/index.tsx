import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  PawPrint,
  Stethoscope,
  DollarSign,
  Search,
  TrendingUp,
  TrendingDown,
  Database,
} from "lucide-react-native";
import { useFarmStore } from "@/store/farmStore";
import { useAnimalStore } from "@/store/animalStore";
import { useHealthStore } from "@/store/healthStore";
import { useFinancialStore } from "@/store/financialStore";
import { useThemeStore } from "@/store/themeStore";
import { formatCurrency } from "@/utils/helpers";
import Colors from "@/constants/colors";
import TopNavigation from "@/components/TopNavigation";
import StatCard from "@/components/StatCard";
import Card from "@/components/Card";
import Button from "@/components/Button";
import LoadingIndicator from "@/components/LoadingIndicator";
import EmptyState from "@/components/EmptyState";
import AnimalCard from "@/components/AnimalCard";

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    farms,
    currentFarm,
    setCurrentFarm,
    isLoading: farmsLoading,
  } = useFarmStore();
  const {
    fetchAnimals,
    getAnimalStats,
    searchAnimals,
    isLoading: animalsLoading,
  } = useAnimalStore();
  const {
    fetchHealthRecords,
    getHealthStats,
    isLoading: healthLoading,
  } = useHealthStore();
  const {
    fetchTransactions,
    getFinancialStats,
    isLoading: financialLoading,
  } = useFinancialStore();
  const { isDarkMode } = useThemeStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  const isLoading =
    farmsLoading || animalsLoading || healthLoading || financialLoading;

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

  const handleAnimalPress = (animal: any) => {
    router.push(`/animal/${animal.id}`);
  };

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

  // Get stats
  const animalStats = currentFarm
    ? getAnimalStats(currentFarm.id)
    : { total: 0, bySpecies: [], byStatus: [] };
  const healthStats = currentFarm
    ? getHealthStats(currentFarm.id)
    : { total: 0, totalCost: 0, recentRecords: 0 };
  const financialStats = currentFarm
    ? getFinancialStats(currentFarm.id)
    : {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      recentTransactions: 0,
    };

  // Get search results
  const searchResults = searchQuery.trim() ? searchAnimals(searchQuery) : [];

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
            {/* Farm Welcome Card */}
            <Card
              variant="outlined"
              style={[
                styles.welcomeCard,
                { backgroundColor: colors.tint + "08" },
              ]}
            >
              <View style={styles.welcomeContent}>
                <View
                  style={[
                    styles.farmIcon,
                    { backgroundColor: colors.tint + "15" },
                  ]}
                >
                  <PawPrint size={28} color={colors.tint} />
                </View>
                <View style={styles.welcomeText}>
                  <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                    Welcome back!
                  </Text>
                  <Text style={[styles.farmName, { color: colors.tint }]}>
                    {currentFarm.name}
                  </Text>
                  <Text style={[styles.farmDetails, { color: colors.muted }]}>
                    {currentFarm.location} • {animalStats.total} animals
                  </Text>
                </View>
              </View>
            </Card>

            {/* Search Card */}
            <Card variant="outlined" style={styles.searchCard}>
              <View
                style={[
                  styles.searchContainer,
                  { backgroundColor: colors.background },
                ]}
              >
                <Search
                  size={20}
                  color={colors.muted}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search animals..."
                  placeholderTextColor={colors.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {searchQuery.length > 0 && (
                <View style={styles.searchResults}>
                  <Text
                    style={[styles.searchResultsTitle, { color: colors.text }]}
                  >
                    Search Results
                  </Text>
                  {searchAnimals(searchQuery)
                    .slice(0, 3)
                    .map((animal) => (
                      <AnimalCard
                        key={animal.id}
                        animal={animal}
                        onPress={handleAnimalPress}
                      />
                    ))}
                </View>
              )}
            </Card>

            {/* Financial Overview */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Financial Overview
            </Text>
            <View style={styles.statsContainer}>
              <Card variant="success" style={styles.statCard}>
                <View style={styles.statContent}>
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: colors.success + "20" },
                    ]}
                  >
                    <DollarSign size={20} color={colors.success} />
                  </View>
                  <View style={styles.statText}>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      Net Profit
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
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
                </View>
              </Card>

              <Card variant="warning" style={styles.statCard}>
                <View style={styles.statContent}>
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: colors.info + "20" },
                    ]}
                  >
                    <Stethoscope size={20} color={colors.info} />
                  </View>
                  <View style={styles.statText}>
                    <Text style={[styles.statLabel, { color: colors.muted }]}>
                      Health Costs
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatCurrency(healthStats.totalCost)}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Animal Stats Grid */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Livestock Overview
            </Text>
            <View style={styles.animalStatsGrid}>
              <Card variant="info" style={styles.totalAnimalsCard}>
                <View style={styles.totalAnimalsContent}>
                  <Text
                    style={[styles.totalAnimalsNumber, { color: colors.tint }]}
                  >
                    {animalStats.total}
                  </Text>
                  <Text
                    style={[styles.totalAnimalsLabel, { color: colors.text }]}
                  >
                    Total Animals
                  </Text>
                </View>
              </Card>

              {animalStats.bySpecies.slice(0, 3).map((species) => (
                <Card
                  key={species.species}
                  variant="outlined"
                  style={styles.speciesCard}
                >
                  <View style={styles.speciesContent}>
                    <Text style={[styles.speciesCount, { color: colors.text }]}>
                      {species.count}
                    </Text>
                    <Text style={[styles.speciesName, { color: colors.muted }]}>
                      {species.species}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>

            {/* Health Overview */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Health Summary
            </Text>
            <View style={styles.healthGrid}>
              <Card variant="success" style={styles.healthCard}>
                <View style={styles.healthContent}>
                  <View
                    style={[
                      styles.healthIcon,
                      { backgroundColor: colors.success + "15" },
                    ]}
                  >
                    <TrendingUp size={18} color={colors.success} />
                  </View>
                  <Text style={[styles.healthLabel, { color: colors.muted }]}>
                    Healthy
                  </Text>
                  <Text style={[styles.healthValue, { color: colors.text }]}>
                    {animalStats.byStatus.find((s) => s.status === "Healthy")
                      ?.count || 0}
                  </Text>
                </View>
              </Card>

              <Card variant="warning" style={styles.healthCard}>
                <View style={styles.healthContent}>
                  <View
                    style={[
                      styles.healthIcon,
                      { backgroundColor: colors.warning + "15" },
                    ]}
                  >
                    <TrendingDown size={18} color={colors.warning} />
                  </View>
                  <Text style={[styles.healthLabel, { color: colors.muted }]}>
                    Needs Attention
                  </Text>
                  <Text style={[styles.healthValue, { color: colors.text }]}>
                    {animalStats.byStatus.find((s) => s.status === "Sick")
                      ?.count || 0}
                  </Text>
                </View>
              </Card>

              <Card variant="info" style={styles.healthCard}>
                <View style={styles.healthContent}>
                  <View
                    style={[
                      styles.healthIcon,
                      { backgroundColor: colors.info + "15" },
                    ]}
                  >
                    <Stethoscope size={18} color={colors.info} />
                  </View>
                  <Text style={[styles.healthLabel, { color: colors.muted }]}>
                    Records
                  </Text>
                  <Text style={[styles.healthValue, { color: colors.text }]}>
                    {healthStats.total}
                  </Text>
                </View>
              </Card>
            </View>

            {/* Quick Actions */}
            <Card variant="elevated" style={styles.actionsCard}>
              <Text style={[styles.actionsTitle, { color: colors.text }]}>
                Quick Actions
              </Text>
              <View style={styles.buttonGrid}>
                <Button
                  title="Add Animal"
                  onPress={() => router.push("/animal/add")}
                  variant="primary"
                  style={styles.actionButton}
                />
                <Button
                  title="Record Health"
                  onPress={() => router.push("/health/add")}
                  variant="secondary"
                  style={styles.actionButton}
                />
                <Button
                  title="Add Transaction"
                  onPress={() => router.push("/financial/add")}
                  variant="outline"
                  style={styles.actionButton}
                />
                <Button
                  title="View Reports"
                  onPress={() => router.push("/reports")}
                  variant="outline"
                  style={styles.actionButton}
                />
              </View>
            </Card>
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
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: "transparent",
    elevation: 0,
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  farmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(56, 161, 105, 0.2)",
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  farmName: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  farmDetails: {
    fontSize: 14,
    fontWeight: "500",
  },
  searchCard: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  searchResults: {
    marginTop: 16,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  animalStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  totalAnimalsCard: {
    width: "100%",
    marginBottom: 8,
  },
  totalAnimalsContent: {
    alignItems: "center",
    paddingVertical: 8,
  },
  totalAnimalsNumber: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 4,
  },
  totalAnimalsLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  speciesCard: {
    flex: 1,
    minWidth: 100,
  },
  speciesContent: {
    alignItems: "center",
  },
  speciesCount: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  speciesName: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  healthGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  healthCard: {
    flex: 1,
  },
  healthContent: {
    alignItems: "center",
  },
  healthIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  healthValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  actionsCard: {
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 150,
  },
});
