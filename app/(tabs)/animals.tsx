import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList, RefreshControl, TouchableOpacity, TextInput, Text } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Search } from "lucide-react-native";
import { useAnimalStore } from "@/store/animalStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Animal } from "@/types";
import Colors from "@/constants/colors";
import AnimalCard from "@/components/AnimalCard";
import EmptyState from "@/components/EmptyState";
import LoadingIndicator from "@/components/LoadingIndicator";
import TopNavigation from "@/components/TopNavigation";
import Card from "@/components/Card";

const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
const getStatusColor = (status: string) => {
  // Add your status color logic here
  return '#48bb78'; // Default color
};

export default function AnimalsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { animals, fetchAnimals, searchAnimals, isLoading } = useAnimalStore();
  const { farms, currentFarm } = useFarmStore();
  const { isDarkMode } = useThemeStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    if (currentFarm) {
      loadAnimals();
    }
  }, [currentFarm]);

  const loadAnimals = async () => {
    if (currentFarm) {
      await fetchAnimals(currentFarm.id);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnimals();
    setRefreshing(false);
  };

  const handleAnimalPress = (animal: Animal) => {
    router.push(`/animal/${animal.id}`);
  };

  const handleAddAnimal = () => {
    router.push("/animal/add");
  };

  const handleAddFarm = () => {
    router.push("/farm/add");
  };

  if (farms.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No Farms Available"
          message="Add a farm before managing animals"
          buttonTitle="Add Farm"
          onButtonPress={handleAddFarm}
        />
      </View>
    );
  }

  // Get filtered animals based on search
  const filteredAnimals = searchQuery.trim() ? searchAnimals(searchQuery) : animals;

  const renderItem = ({ item }: { item: Animal }) => (
    <Card style={styles.animalCard}>
      <View style={styles.animalHeader}>
        <Text style={[styles.animalId, { color: colors.text }]}>
          {item.identificationNumber}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.financialRow}>
        <View style={styles.financialItem}>
          <Text style={[styles.financialLabel, { color: colors.muted }]}>
            Acquired for
          </Text>
          <Text style={[styles.financialValue, { color: colors.text }]}>
            {item.acquisitionPrice ? formatCurrency(item.acquisitionPrice) : 'N/A'}
          </Text>
        </View>

        <View style={styles.financialItem}>
          <Text style={[styles.financialLabel, { color: colors.muted }]}>
            Current Value
          </Text>
          <Text style={[styles.financialValue, { color: colors.text }]}>
            {item.price ? formatCurrency(item.price) : 'N/A'}
          </Text>
        </View>

        {item.status === 'Sold' && (
          <View style={styles.financialItem}>
            <Text style={[styles.financialLabel, { color: colors.muted }]}>
              Sold for
            </Text>
            <Text style={[styles.financialValue, { color: colors.success }]}>
              {item.price ? formatCurrency(item.price) : 'N/A'}
            </Text>
          </View>
        )}
      </View>

      {/* ... rest of existing animal card ... */}
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />

      <View style={styles.header}>
        <Card style={[styles.searchCard, { backgroundColor: colors.card }]}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <Search size={20} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search animals by ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.muted}
            />
          </View>
        </Card>
      </View>

      {isLoading && !refreshing ? (
        <LoadingIndicator message="Loading animals..." />
      ) : (
        <>
          {filteredAnimals.length === 0 ? (
            <EmptyState
              title={searchQuery ? "No Animals Found" : "No Animals"}
              message={searchQuery ? `No animals found matching "${searchQuery}"` : "Add your first animal to start tracking"}
              buttonTitle={searchQuery ? "Clear Search" : "Add Animal"}
              onButtonPress={searchQuery ? () => setSearchQuery("") : handleAddAnimal}
            />
          ) : (
            <FlatList
              data={filteredAnimals}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.tint }]}
            onPress={handleAddAnimal}
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
  searchCard: {
    borderRadius: 16,
    padding: 16,
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
  listContent: {
    padding: 20,
    paddingTop: 16,
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
  animalCard: {
    // ... existing animal card styles ...
  },
  animalHeader: {
    // ... existing animal header styles ...
  },
  animalId: {
    // ... existing animal ID styles ...
  },
  statusBadge: {
    // ... existing status badge styles ...
  },
  statusText: {
    // ... existing status text styles ...
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});