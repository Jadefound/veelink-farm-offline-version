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
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Search } from "lucide-react-native";
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
import { getMockData } from "@/utils/mockData";

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

export default function AnimalsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // HARDCODED: Use mock data directly instead of store
  const animals = getMockData("animals") as Animal[];
  const farms = getMockData("farms") as Farm[];
  const currentFarm = farms[0]; // Use first farm as current
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

  // Get filtered animals based on search by ID
  const filteredAnimals = searchQuery.trim()
    ? animals.filter((animal) => {
        const animalId = generateAnimalId(animal.species || "Other", animals);
        return (
          animalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          animal.identificationNumber
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      })
    : animals;

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "#10B981";
      case "sick":
        return "#EF4444";
      case "recovering":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "checkmark-circle";
      case "sick":
        return "medical";
      case "recovering":
        return "time";
      default:
        return "help-circle";
    }
  };

  const renderAnimalCard = ({
    item,
    index,
  }: {
    item: Animal;
    index: number;
  }) => {
    const animalId = generateAnimalId(
      item.species || "Other",
      animals.slice(0, index + 1)
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/animal/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: getAnimalImage(item.species || "Other"),
            }}
            style={styles.animalImage}
            resizeMode="cover"
          />

          {/* Emoji overlay for guaranteed species recognition */}
          <View style={styles.emojiOverlay}>
            <Text style={styles.emojiText}>
              {getAnimalEmoji(item.species || "Other")}
            </Text>
          </View>

          <View
            style={[
              styles.healthBadge,
              {
                backgroundColor: getHealthStatusColor(
                  item.healthStatus || "unknown"
                ),
              },
            ]}
          >
            <Ionicons
              name={getHealthStatusIcon(item.healthStatus || "unknown")}
              size={12}
              color="white"
            />
          </View>

          <View style={styles.speciesBadge}>
            <Text style={styles.speciesText}>{item.species || "Unknown"}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.animalId} numberOfLines={1}>
            {animalId}
          </Text>
          <Text style={styles.breedText} numberOfLines={1}>
            {item.breed}
          </Text>

          <View style={styles.detailsRow}>
            <View style={styles.ageContainer}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.ageText}>{item.age || 0}y</Text>
            </View>
            <Text style={styles.genderText}>{item.gender}</Text>
          </View>

          <View style={styles.weightRow}>
            <Ionicons name="fitness-outline" size={14} color="#6B7280" />
            <Text style={styles.weightText}>
              {item.weight || 0} {item.weightUnit || "kg"}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              ${(item.estimatedValue || item.price || 0).toLocaleString()}
            </Text>
            <Text style={styles.priceLabel}>Market Value</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => router.push(`/animal/${item.id}`)}
            >
              <Ionicons name="eye-outline" size={16} color="white" />
              <Text style={styles.primaryButtonText}>Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => router.push(`/health/add?animalId=${item.id}`)}
            >
              <Ionicons name="medical-outline" size={16} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />

      <View style={styles.header}>
        <Card style={[styles.searchCard, { backgroundColor: colors.card }]}>
          <View
            style={[styles.searchContainer, { backgroundColor: colors.card }]}
          >
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
              message={
                searchQuery
                  ? `No animals found with ID containing "${searchQuery}"`
                  : "Add your first animal to start tracking"
              }
              buttonTitle={searchQuery ? "Clear Search" : "Add Animal"}
              onButtonPress={
                searchQuery ? () => setSearchQuery("") : handleAddAnimal
              }
            />
          ) : (
            <FlatList
              data={filteredAnimals}
              keyExtractor={(item) => item.id}
              renderItem={renderAnimalCard}
              numColumns={2}
              columnWrapperStyle={styles.row}
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
});
