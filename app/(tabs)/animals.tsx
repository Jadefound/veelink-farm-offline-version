import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Text,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Search, FileBarChart, Download, Edit } from "lucide-react-native";
import { useAnimalStore } from "@/store/animalStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Animal, Farm } from "@/types";
import Colors from "@/constants/colors";
import EmptyState from "@/components/EmptyState";
import LoadingIndicator from "@/components/LoadingIndicator";
import TopNavigation from "@/components/TopNavigation";
import Card from "@/components/Card";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/Button";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 30) / 2;

// Generate species-based ID
const generateAnimalId = (species: string, existingAnimals: Animal[]) => {
  const speciesPrefixes = {
    Cattle: "C",
    Sheep: "S",
    Goat: "G",
    Pig: "P",
    Chicken: "CH",
    Duck: "D",
    Turkey: "T",
    Horse: "H",
    Rabbit: "R",
    Other: "O",
  };

  const prefix =
    speciesPrefixes[species as keyof typeof speciesPrefixes] || "O";

  // Count existing animals of the same species
  const sameSpeciesCount = existingAnimals.filter(
    (animal: Animal) => animal.species === species
  ).length;

  const nextNumber = (sameSpeciesCount + 1).toString().padStart(3, "0");
  return `${prefix}${nextNumber}`;
};

// Animal species images mapping
const getAnimalImage = (species: string) => {
  const animalImages = {
    Cattle:
      "https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    Sheep:
      "https://images.pexels.com/photos/2318466/pexels-photo-2318466.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    Goat: "https://images.pexels.com/photos/751689/pexels-photo-751689.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    Pig: "https://images.pexels.com/photos/1300361/pexels-photo-1300361.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    Chicken:
      "https://images.pexels.com/photos/1300358/pexels-photo-1300358.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    Duck: "https://images.pexels.com/photos/416179/pexels-photo-416179.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    Turkey:
      "https://images.pexels.com/photos/372166/pexels-photo-372166.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    Horse:
      "https://images.pexels.com/photos/52500/horse-herd-fog-nature-52500.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    Rabbit:
      "https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    Other:
      "https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
  };

  return (
    animalImages[species as keyof typeof animalImages] ||
    `https://via.placeholder.com/400x300/E5E7EB/6B7280?text=${encodeURIComponent(species || "Animal")}`
  );
};

// Get animal emoji for visual identification
const getAnimalEmoji = (species: string) => {
  const animalEmojis = {
    Cattle: "🐄",
    Sheep: "🐑",
    Goat: "🐐",
    Pig: "🐷",
    Chicken: "🐔",
    Duck: "🦆",
    Turkey: "🦃",
    Horse: "🐴",
    Rabbit: "🐰",
    Other: "🐾",
  };
  return animalEmojis[species as keyof typeof animalEmojis] || "🐾";
};

// FMIS-style styles (copied from reports.tsx)
const fmisStyles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f5f8fa',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 13,
    color: '#555',
    marginRight: 4,
  },
  filterPill: {
    backgroundColor: '#e0e7ef',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#3498db',
  },
  filterPillText: {
    color: '#555',
    fontSize: 13,
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flex: 1,
    minWidth: 120,
  },
  searchInput: {
    backgroundColor: '#f5f8fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: '#222',
    borderWidth: 1,
    borderColor: '#e0e7ef',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ef',
  },
  cell: {
    fontSize: 13,
    color: '#222',
  },
  actionsCell: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    marginHorizontal: 4,
    padding: 4,
    borderRadius: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default function AnimalsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [animalSpeciesFilter, setAnimalSpeciesFilter] = useState<string | null>(null);
  const [animalStatusFilter, setAnimalStatusFilter] = useState<string | null>(null);

  // Use the store instead:
  const animals = useAnimalStore(state => state.animals);
  const { farms, currentFarm } = useFarmStore();
  const isLoading = false;

  const { isDarkMode } = useThemeStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  const loadAnimals = async () => {
    // Implementation of loadAnimals function
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnimals();
    setRefreshing(false);
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

  // Compute summary stats
  const totalAnimals = animals.length;
  const soldCount = animals.filter(a => a.status === 'Sold').length;
  const speciesCount = Array.from(new Set(animals.map(a => a.species))).length;
  const allSpecies = Array.from(new Set(animals.map(a => a.species)));
  const allStatuses = Array.from(new Set(animals.map(a => a.status)));

  // Filtered animals for FMIS table
  let filteredAnimals = animals;
  if (animalSpeciesFilter) {
    filteredAnimals = filteredAnimals.filter(a => a.species === animalSpeciesFilter);
  }
  if (animalStatusFilter) {
    filteredAnimals = filteredAnimals.filter(a => a.status === animalStatusFilter);
  }
  if (searchQuery.trim()) {
    filteredAnimals = filteredAnimals.filter((animal) => {
      const animalId = generateAnimalId(animal.species || "Other", animals);
      return (
        animalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        animal.identificationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }

  // Card grid renderer (two-column)
  const renderAnimalCard = ({ item, index }: { item: Animal; index: number }) => {
    const animalId = generateAnimalId(item.species || "Other", animals.slice(0, index + 1));
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={() => router.push(`/animal/${item.id}`)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: getAnimalImage(item.species || "Other") }}
          style={styles.horizontalCardImage}
          resizeMode="cover"
        />
        <View style={styles.horizontalCardContent}>
          <Text style={styles.horizontalCardTitle} numberOfLines={1}>{animalId}</Text>
          <View style={styles.horizontalCardVitalsRow}>
            <Text style={styles.horizontalCardVital}>{item.species}</Text>
            <Text style={styles.horizontalCardDot}>•</Text>
            <Text style={styles.horizontalCardVital}>{item.gender}</Text>
            <Text style={styles.horizontalCardDot}>•</Text>
            <Text style={styles.horizontalCardVital}>{item.age || 0}y</Text>
            <Text style={styles.horizontalCardDot}>•</Text>
            <Text style={styles.horizontalCardVital}>{item.weight || 0}{item.weightUnit || "kg"}</Text>
          </View>
          <View style={styles.horizontalCardStatsRow}>
            <View style={styles.horizontalCardStatItem}>
              <Ionicons name="heart-outline" size={18} color="#10B981" />
              <Text style={styles.horizontalCardStatText}>{item.status}</Text>
            </View>
            <View style={styles.horizontalCardStatItem}>
              <Ionicons name="pricetag-outline" size={18} color="#10B981" />
              <Text style={styles.horizontalCardStatText}>${(item.estimatedValue || item.price || 0).toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.horizontalCardStatItem} onPress={() => router.push(`/animal/${item.id}`)}>
              <Ionicons name="eye-outline" size={18} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // FlatList ListHeaderComponent: summary + filter bar
  const listHeader = (
    <>
      <View style={fmisStyles.summaryRow}>
        <View style={fmisStyles.summaryCard}>
          <Text style={fmisStyles.summaryLabel}>Total Animals</Text>
          <Text style={fmisStyles.summaryValue}>{totalAnimals}</Text>
        </View>
        <View style={fmisStyles.summaryCard}>
          <Text style={fmisStyles.summaryLabel}>Sold</Text>
          <Text style={fmisStyles.summaryValue}>{soldCount}</Text>
        </View>
        <View style={fmisStyles.summaryCard}>
          <Text style={fmisStyles.summaryLabel}>Species</Text>
          <Text style={fmisStyles.summaryValue}>{speciesCount}</Text>
        </View>
      </View>
      <View style={fmisStyles.filterBar}>
        <View style={fmisStyles.filterDropdownContainer}>
          <Text style={fmisStyles.filterLabel}>Species:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity onPress={() => setAnimalSpeciesFilter(null)} style={[fmisStyles.filterPill, !animalSpeciesFilter && fmisStyles.filterPillActive]}>
              <Text style={[fmisStyles.filterPillText, !animalSpeciesFilter && fmisStyles.filterPillTextActive]}>All</Text>
            </TouchableOpacity>
            {allSpecies.map(species => (
              <TouchableOpacity key={species} onPress={() => setAnimalSpeciesFilter(species)} style={[fmisStyles.filterPill, animalSpeciesFilter === species && fmisStyles.filterPillActive]}>
                <Text style={[fmisStyles.filterPillText, animalSpeciesFilter === species && fmisStyles.filterPillTextActive]}>{species}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={fmisStyles.filterDropdownContainer}>
          <Text style={fmisStyles.filterLabel}>Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity onPress={() => setAnimalStatusFilter(null)} style={[fmisStyles.filterPill, !animalStatusFilter && fmisStyles.filterPillActive]}>
              <Text style={[fmisStyles.filterPillText, !animalStatusFilter && fmisStyles.filterPillTextActive]}>All</Text>
            </TouchableOpacity>
            {allStatuses.map(status => (
              <TouchableOpacity key={status} onPress={() => setAnimalStatusFilter(status)} style={[fmisStyles.filterPill, animalStatusFilter === status && fmisStyles.filterPillActive]}>
                <Text style={[fmisStyles.filterPillText, animalStatusFilter === status && fmisStyles.filterPillTextActive]}>{status}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={fmisStyles.searchContainer}>
          <TextInput
            style={fmisStyles.searchInput}
            placeholder="Search by ID..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      <View style={{ padding: 16 }}>
        {/* Card Grid Rows */}
        <FlatList
          data={filteredAnimals}
          keyExtractor={(item) => item.id}
          renderItem={renderAnimalCard}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={fmisStyles.emptyState}>
              <Text style={fmisStyles.emptyStateText}>No animals found</Text>
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            { alignItems: 'center', justifyContent: 'flex-start' }
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>
      {/* Floating Add Animal Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleAddAnimal}
        activeOpacity={0.85}
      >
        <Plus size={32} color="#fff" />
      </TouchableOpacity>
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
  row: {
    justifyContent: "space-between",
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
  card: {
    width: CARD_WIDTH,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  animalImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#F3F4F6",
  },
  healthBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  speciesBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  speciesText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  emojiOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
  },
  emojiText: {
    fontSize: 24,
  },
  cardContent: {
    padding: 12,
  },
  animalId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 4,
  },
  breedText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ageText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  genderText: {
    fontSize: 12,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  weightText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  priceRow: {
    marginBottom: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  priceLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  primaryButton: {
    backgroundColor: "#059669",
  },
  secondaryButton: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#059669",
    flex: 0,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 320,
    maxWidth: 380,
    width: '95%',
  },
  horizontalCardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: '#F3F4F6',
  },
  horizontalCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  horizontalCardVitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  horizontalCardVital: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  horizontalCardDot: {
    fontSize: 13,
    color: '#A7F3D0',
    marginHorizontal: 4,
  },
  horizontalCardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 12,
  },
  horizontalCardStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    gap: 4,
  },
  horizontalCardStatText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 2,
  },
});
