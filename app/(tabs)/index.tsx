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
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
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
import CollapsibleCard from "@/components/CollapsibleCard";

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
  const [financialStats, setFinancialStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    recentTransactions: 0,
  });

  useEffect(() => {
    const loadFinancials = async () => {
      if (currentFarm) {
        const stats = await getFinancialStats(currentFarm.id);
        setFinancialStats(stats);
      }
    };
    loadFinancials();
  }, [currentFarm, getFinancialStats]);

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
            {/* Farm Welcome Card - Moved to Top Priority */}
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

            {/* Critical Alerts Section */}
            {(animalStats.byStatus.find((s) => s.status === "Sick")?.count ||
              0) > 0 && (
              <Card
                variant="warning"
                style={[
                  styles.alertCard,
                  { backgroundColor: colors.warning + "08" },
                ]}
                onPress={() => router.push("/health")}
              >
                <View style={styles.alertContent}>
                  <View
                    style={[
                      styles.alertIcon,
                      { backgroundColor: colors.warning + "20" },
                    ]}
                  >
                    <TrendingDown size={24} color={colors.warning} />
                  </View>
                  <View style={styles.alertText}>
                    <Text
                      style={[styles.alertTitle, { color: colors.warning }]}
                    >
                      Health Alert
                    </Text>
                    <Text style={[styles.alertMessage, { color: colors.text }]}>
                      {
                        animalStats.byStatus.find((s) => s.status === "Sick")
                          ?.count
                      }{" "}
                      animals need attention
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.alertChevron,
                      { backgroundColor: colors.warning + "15" },
                    ]}
                  >
                    <Text
                      style={[styles.chevronText, { color: colors.warning }]}
                    >
                      ›
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Key Performance Indicators */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Key Metrics
            </Text>
            <View style={styles.kpiGrid}>
              <Card
                variant="info"
                style={[styles.kpiCard, styles.totalAnimalsKPI]}
                onPress={() => router.push("/animals")}
              >
                <View style={styles.kpiContent}>
                  <Text style={[styles.kpiNumber, { color: colors.tint }]}>
                    {animalStats.total}
                  </Text>
                  <Text style={[styles.kpiLabel, { color: colors.text }]}>
                    Total Animals
                  </Text>
                  <View
                    style={[
                      styles.kpiChevron,
                      { backgroundColor: colors.tint + "15" },
                    ]}
                  >
                    <Text style={[styles.chevronText, { color: colors.tint }]}>
                      ›
                    </Text>
                  </View>
                </View>
              </Card>

              <Card
                variant={financialStats.netProfit >= 0 ? "success" : "warning"}
                style={[styles.kpiCard, styles.profitKPI]}
                onPress={() => router.push("/financial")}
              >
                <View style={styles.kpiContent}>
                  <Text
                    style={[
                      styles.kpiNumber,
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
                  <Text style={[styles.kpiLabel, { color: colors.text }]}>
                    Net Profit
                  </Text>
                  <View
                    style={[
                      styles.kpiChevron,
                      {
                        backgroundColor:
                          (financialStats.netProfit >= 0
                            ? colors.success
                            : colors.danger) + "15",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chevronText,
                        {
                          color:
                            financialStats.netProfit >= 0
                              ? colors.success
                              : colors.danger,
                        },
                      ]}
                    >
                      ›
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/animal/add")}
              >
                <Feather name="plus-circle" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Add Animal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/financial/add")}
              >
                <Feather name="dollar-sign" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Add Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/inventory/add")}
              >
                <Feather name="archive" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Add Item
                </Text>
              </TouchableOpacity>
            </View>

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

            {/* Detailed Statistics - Collapsible */}
            <CollapsibleCard title="Detailed Overview">



            {/* Livestock Breakdown */}
            <View style={styles.detailsSection}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                Livestock Breakdown
              </Text>
              <View style={styles.animalStatsGrid}>
                {animalStats.bySpecies.slice(0, 4).map((species) => (
                  <Card
                    key={species.species}
                    variant="outlined"
                    style={[styles.speciesCard, { backgroundColor: '#F9FAFB' }]}
                    onPress={() =>
                      router.push(`/animals?species=${species.species}`)
                    }
                  >
                    <View style={styles.speciesContent}>
                      <Text
                        style={[styles.speciesCount, { color: colors.text }]}
                      >
                        {species.count}
                      </Text>
                      <Text
                        style={[styles.speciesName, { color: colors.muted }]}
                      >
                        {species.species}
                      </Text>
                      <View
                        style={[
                          styles.speciesChevron,
                          { backgroundColor: colors.border + "30" },
                        ]}
                      >
                        <Text
                          style={[styles.chevronText, { color: colors.muted }]}
                        >
                          ›
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            </View>

            {/* Health Status */}
            <View style={styles.detailsSection}>
              <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                Health Status
              </Text>
              <View style={styles.healthGrid}>
                <Card
                  variant="success"
                  style={[styles.healthCard, { backgroundColor: '#F0FFF4' }]}
                  onPress={() => router.push("/animals?status=Healthy")}
                >
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
                    <View
                      style={[
                        styles.healthChevron,
                        { backgroundColor: colors.success + "15" },
                      ]}
                    >
                      <Text
                        style={[styles.chevronText, { color: colors.success }]}
                      >
                        ›
                      </Text>
                    </View>
                  </View>
                </Card>

                <Card
                  variant="warning"
                  style={[styles.healthCard, { backgroundColor: '#FFFBEB' }]}
                  onPress={() => router.push("/animals?status=Sick")}
                >
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
                      Sick
                    </Text>
                    <Text style={[styles.healthValue, { color: colors.text }]}>
                      {animalStats.byStatus.find((s) => s.status === "Sick")
                        ?.count || 0}
                    </Text>
                    <View
                      style={[
                        styles.healthChevron,
                        { backgroundColor: colors.warning + "15" },
                      ]}
                    >
                      <Text
                        style={[styles.chevronText, { color: colors.warning }]}
                      >
                        ›
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            </View>

            </CollapsibleCard>
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
    marginBottom: 30,
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
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
    marginLeft: 4
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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

  // Typography Improvements
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: -0.3,
  },

  // Alert Section
  alertCard: {
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  alertChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  // KPI Section
  kpiGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  kpiCard: {
    flex: 1,
    minHeight: 120,
  },
  totalAnimalsKPI: {
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  profitKPI: {
    borderLeftWidth: 4,
  },
  kpiContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    position: "relative",
  },
  kpiNumber: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -1,
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  kpiChevron: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Details Sections
  detailsSection: {
    marginBottom: 16,
    paddingHorizontal: 0, 
  },

  // Financial Stats
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minHeight: 100,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    position: "relative",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statText: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  statChevron: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Animal Stats
  animalStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 0,
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
    width: "47%",
    minWidth: 140,
    minHeight: 90,
  },
  speciesContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    position: "relative",
  },
  speciesCount: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  speciesName: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  speciesChevron: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Health Stats
  healthGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  healthCard: {
    flex: 1,
    minHeight: 110,
  },
  healthContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    position: "relative",
  },
  healthIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  healthChevron: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  quickActionButton: {
    alignItems: "center",
  },
  quickActionText: {
    marginTop: 5,
    fontSize: 12,
  },

  // Interactive States
  chevronText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 16,
  },
});
