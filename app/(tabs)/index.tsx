import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, RefreshControl, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { PawPrint, Stethoscope, DollarSign, Search, TrendingUp, TrendingDown } from "lucide-react-native";
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
  
  const { farms, currentFarm, setCurrentFarm, isLoading: farmsLoading } = useFarmStore();
  const { fetchAnimals, getAnimalStats, searchAnimals, isLoading: animalsLoading } = useAnimalStore();
  const { fetchHealthRecords, getHealthStats, isLoading: healthLoading } = useHealthStore();
  const { fetchTransactions, getFinancialStats, isLoading: financialLoading } = useFinancialStore();
  const { isDarkMode } = useThemeStore();
  
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  const isLoading = 
    farmsLoading || 
    animalsLoading || 
    healthLoading || 
    financialLoading;
  
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
        fetchTransactions(currentFarm.id)
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
          title="Welcome to Veelink Farm"
          message="Start by adding your first farm to manage your livestock, health records, and financial activities."
          buttonTitle="Add Your First Farm"
          onButtonPress={handleAddFarm}
          icon={<PawPrint size={48} color={colors.tint} />}
        />
      </View>
    );
  }
  
  // Get stats
  const animalStats = currentFarm ? getAnimalStats(currentFarm.id) : { total: 0, bySpecies: [], byStatus: [] };
  const healthStats = currentFarm ? getHealthStats(currentFarm.id) : { total: 0, totalCost: 0, recentRecords: 0 };
  const financialStats = currentFarm ? getFinancialStats(currentFarm.id) : { 
    totalIncome: 0, 
    totalExpenses: 0, 
    netProfit: 0, 
    recentTransactions: 0 
  };
  
  // Get search results
  const searchResults = searchQuery.trim() ? searchAnimals(searchQuery) : [];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading && !refreshing ? (
          <LoadingIndicator message="Loading farm data..." />
        ) : (
          <>
            {currentFarm && (
              <Card style={[styles.farmCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.farmName, { color: colors.text }]}>{currentFarm.name}</Text>
                <Text style={[styles.farmDetails, { color: colors.muted }]}>
                  {currentFarm.type} • {currentFarm.size} {currentFarm.sizeUnit} • {currentFarm.location}
                </Text>
              </Card>
            )}
            
            {/* Search Section */}
            <Card style={[styles.searchCard, { backgroundColor: colors.card }]}>
              <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <Search size={20} color={colors.muted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search animals by ID..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={colors.muted}
                />
              </View>
              
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  <Text style={[styles.searchResultsTitle, { color: colors.text }]}>
                    Search Results ({searchResults.length})
                  </Text>
                  {searchResults.slice(0, 3).map((animal) => (
                    <AnimalCard
                      key={animal.id}
                      animal={animal}
                      onPress={handleAnimalPress}
                      compact
                    />
                  ))}
                  {searchResults.length > 3 && (
                    <Button
                      title={`View all ${searchResults.length} results`}
                      onPress={() => router.push("/animals")}
                      variant="outline"
                      size="small"
                    />
                  )}
                </View>
              )}
            </Card>
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Farm Overview</Text>
            
            <View style={styles.statsContainer}>
              <StatCard
                title="Total Animals"
                value={animalStats.total}
                icon={<PawPrint size={20} color={colors.tint} />}
                color={colors.tint}
                style={styles.statCard}
              />
              <StatCard
                title="Health Records"
                value={healthStats.total}
                icon={<Stethoscope size={20} color={colors.secondary} />}
                color={colors.secondary}
                style={styles.statCard}
              />
            </View>
            
            {animalStats.bySpecies.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>By Species</Text>
                <View style={styles.speciesContainer}>
                  {animalStats.bySpecies.map((species, index) => (
                    <StatCard
                      key={species.species}
                      title={species.species}
                      value={species.count}
                      icon={<PawPrint size={16} color={colors.tint} />}
                      color={colors.tint}
                      style={styles.speciesCard}
                    />
                  ))}
                </View>
              </>
            )}
            
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Overview</Text>
            
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
            
            <View style={styles.statsContainer}>
              <StatCard
                title="Net Profit"
                value={formatCurrency(financialStats.netProfit)}
                icon={<DollarSign size={20} color={financialStats.netProfit >= 0 ? colors.success : colors.danger} />}
                color={financialStats.netProfit >= 0 ? colors.success : colors.danger}
                style={styles.statCard}
              />
              <StatCard
                title="Health Costs"
                value={formatCurrency(healthStats.totalCost)}
                icon={<Stethoscope size={20} color={colors.secondary} />}
                color={colors.secondary}
                style={styles.statCard}
              />
            </View>
            
            <View style={styles.actionsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
              <View style={styles.buttonRow}>
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
              </View>
              <View style={styles.buttonRow}>
                <Button
                  title="Add Transaction"
                  onPress={() => router.push("/financial/add")}
                  variant="outline"
                  style={styles.actionButton}
                />
                <Button
                  title="View Financial"
                  onPress={() => router.push("/financial")}
                  variant="outline"
                  style={styles.actionButton}
                />
              </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  farmCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  farmName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  farmDetails: {
    fontSize: 15,
    lineHeight: 20,
  },
  searchCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchResults: {
    marginTop: 16,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
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
  speciesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  speciesCard: {
    minWidth: 120,
    flex: 0,
  },
  actionsContainer: {
    marginTop: 12,
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
});