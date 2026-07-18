import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Text,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useAnimalStore } from "@/store/animalStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Animal } from "@/types";
import Colors from "@/constants/colors";
import EmptyState from "@/components/EmptyState";
import TopNavigation from "@/components/TopNavigation";
import { Ionicons } from "@expo/vector-icons";
import { getAnimalImage, getSpeciesColor } from "@/utils/animalImages";
import { generateAnimalId } from "@/utils/animalId";
import { useResponsive } from "@/hooks/useResponsive";
import { formatCurrency } from "@/utils/helpers";

const CARD_HEIGHT = 100; // Fixed height for getItemLayout optimization
const PAGE_SIZE = 15; // Items per page for infinite scroll


// Filter pill component for better performance
const FilterPill = React.memo(({ 
  label, 
  isActive, 
  onPress,
  colors,
}: { 
  label: string; 
  isActive: boolean; 
  onPress: () => void;
  colors: typeof Colors.light;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.filterPill,
      { backgroundColor: isActive ? colors.tint : colors.surface },
    ]}
  >
    <Text style={[
      styles.filterPillText,
      { color: isActive ? "white" : colors.muted },
      isActive && { fontWeight: 'bold' },
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
));

// Memoized Animal Card component for better FlatList performance
const AnimalCard = React.memo(({ 
  item, 
  onPress 
}: { 
  item: Animal; 
  onPress: (id: string) => void;
}) => {
  if (!item?.id) return null;
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  return (
  <TouchableOpacity
    style={[styles.horizontalCard, { backgroundColor: colors.card }]}
    onPress={() => onPress(item.id)}
    activeOpacity={0.85}
  >
    <Image
      source={getAnimalImage(item.species || "Other")}
      style={[styles.horizontalCardImage, { backgroundColor: getSpeciesColor(item.species || "Other") }]}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={200}
    />
    <View style={styles.horizontalCardContent}>
      <Text style={[styles.horizontalCardTitle, { color: colors.text }]} numberOfLines={1}>
        {item.identificationNumber}
      </Text>
      <View style={styles.horizontalCardVitalsRow}>
        <Text style={[styles.horizontalCardVital, { color: colors.muted }]}>{item.species}</Text>
        <Text style={[styles.horizontalCardDot, { color: colors.muted }]}>•</Text>
        <Text style={[styles.horizontalCardVital, { color: colors.muted }]}>{item.gender}</Text>
        <Text style={[styles.horizontalCardDot, { color: colors.muted }]}>•</Text>
        <Text style={[styles.horizontalCardVital, { color: colors.muted }]}>{item.age || 0}y</Text>
        <Text style={[styles.horizontalCardDot, { color: colors.muted }]}>•</Text>
        <Text style={[styles.horizontalCardVital, { color: colors.muted }]}>{item.weight || 0}{item.weightUnit || "kg"}</Text>
      </View>
      <View style={styles.horizontalCardStatsRow}>
        <View style={styles.horizontalCardStatItem}>
          <Ionicons name="heart-outline" size={18} color={colors.success} />
          <Text style={[styles.horizontalCardStatText, { color: colors.text }]}>{item.status}</Text>
        </View>
        <View style={styles.horizontalCardStatItem}>
          <Ionicons name="pricetag-outline" size={18} color={colors.success} />
          <Text style={[styles.horizontalCardStatText, { color: colors.text }]}>
            {formatCurrency(item.estimatedValue || item.price || 0)}
          </Text>
        </View>
        <View style={styles.horizontalCardStatItem}>
          <Ionicons name="eye-outline" size={18} color={colors.success} />
        </View>
      </View>
    </View>
  </TouchableOpacity>
  );
});

export default function AnimalsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [animalSpeciesFilter, setAnimalSpeciesFilter] = useState<string | null>(null);
  const [animalStatusFilter, setAnimalStatusFilter] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const animals = useAnimalStore(state => state.animals);
  const fetchAnimals = useAnimalStore(state => state.fetchAnimals);
  const { farms, currentFarm } = useFarmStore();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const { isTablet, maxContentWidth } = useResponsive();

  // Load animals on mount
  useEffect(() => {
    if (currentFarm) {
      fetchAnimals(currentFarm.id);
      setDisplayedCount(PAGE_SIZE); // Reset pagination when farm changes
    }
  }, [currentFarm?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setDisplayedCount(PAGE_SIZE); // Reset pagination on refresh
    if (currentFarm) {
      await fetchAnimals(currentFarm.id);
    }
    setRefreshing(false);
  }, [currentFarm?.id, fetchAnimals]);

  const handleAddAnimal = useCallback(() => {
    router.push("/animal/add");
  }, [router]);

  const handleAddFarm = useCallback(() => {
    router.push("/farm/add");
  }, [router]);

  const handleAnimalPress = useCallback((id: string) => {
    router.push(`/animal/${id}`);
  }, [router]);

  const farmAnimals = useMemo(() => {
    if (!currentFarm?.id) return [];
    return (animals || []).filter((a): a is Animal => !!a && !!a.id && a.farmId === currentFarm.id);
  }, [animals, currentFarm?.id]);

  // Memoize computed values (scoped to current farm); filter out undefined to avoid crashes
  const { allSpecies, allStatuses } = useMemo(() => ({
    allSpecies: Array.from(new Set(farmAnimals.map(a => a.species).filter(Boolean))),
    allStatuses: Array.from(new Set(farmAnimals.map(a => a.status).filter(Boolean))),
  }), [farmAnimals]);

  // Memoize filtered animals
  const filteredAnimals = useMemo(() => {
    let result = farmAnimals;
    
    if (animalSpeciesFilter) {
      result = result.filter(a => a.species === animalSpeciesFilter);
    }
    if (animalStatusFilter) {
      result = result.filter(a => a.status === animalStatusFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(animal =>
        animal.identificationNumber?.toLowerCase().includes(query) ||
        animal.species?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [farmAnimals, animalSpeciesFilter, animalStatusFilter, searchQuery]);

  // Paginated animals for display
  const paginatedAnimals = useMemo(() => {
    return filteredAnimals.slice(0, displayedCount);
  }, [filteredAnimals, displayedCount]);

  // Check if there are more items to load
  const hasMore = displayedCount < filteredAnimals.length;

  // Load more handler for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      // Simulate a small delay for smoother UX
      setTimeout(() => {
        setDisplayedCount(prev => Math.min(prev + PAGE_SIZE, filteredAnimals.length));
        setIsLoadingMore(false);
      }, 100);
    }
  }, [isLoadingMore, hasMore, filteredAnimals.length]);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [animalSpeciesFilter, animalStatusFilter, searchQuery]);

  // Memoize renderItem for FlatList
  const renderItem = useCallback(({ item }: { item: Animal }) => (
    <AnimalCard item={item} onPress={handleAnimalPress} />
  ), [handleAnimalPress]);

  // Memoize keyExtractor
  const keyExtractor = useCallback((item: Animal) => item.id, []);

  // getItemLayout for fixed-height items (improves scroll performance)
  const getItemLayout = useCallback((_: any, index: number) => {
    const length = Number(CARD_HEIGHT) || 100;
    return { length, offset: length * index, index };
  }, []);

  const ListHeader = useMemo(() => (
    <View style={styles.filterContainer}>
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.muted }]}>Species:</Text>
        <View style={styles.filterPillsRow}>
          <FilterPill
            label="All"
            isActive={!animalSpeciesFilter}
            onPress={() => setAnimalSpeciesFilter(null)}
            colors={colors}
          />
          {allSpecies.map(species => (
            <FilterPill
              key={species}
              label={species}
              isActive={animalSpeciesFilter === species}
              onPress={() => setAnimalSpeciesFilter(species)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.muted }]}>Status:</Text>
        <View style={styles.filterPillsRow}>
          <FilterPill
            label="All"
            isActive={!animalStatusFilter}
            onPress={() => setAnimalStatusFilter(null)}
            colors={colors}
          />
          {allStatuses.map(status => (
            <FilterPill
              key={status}
              label={status}
              isActive={animalStatusFilter === status}
              onPress={() => setAnimalStatusFilter(status)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border,
          }]}
          placeholder="Search by ID..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  ), [allSpecies, allStatuses, animalSpeciesFilter, animalStatusFilter, searchQuery, colors]);

  const ListEmpty = useMemo(() => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, { color: colors.muted }]}>
        No animals found
      </Text>
    </View>
  ), [colors.muted]);

  const ListFooter = useMemo(() => {
    if (!hasMore) return null;
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Text style={[styles.footerText, { color: colors.muted }]}>Loading more...</Text>
        </View>
      );
    }
    return null;
  }, [hasMore, isLoadingMore, colors.tint, colors.muted]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      <FlatList
        key={isTablet ? 'animals-grid-2' : 'animals-list-1'}
        data={paginatedAnimals}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={isTablet ? 2 : 1}
        columnWrapperStyle={isTablet ? { gap: 12 } : undefined}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        contentContainerStyle={[
          styles.listContent,
          { padding: isTablet ? 24 : 16 },
          maxContentWidth ? { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' } : {},
        ]}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={!isTablet ? getItemLayout : undefined}
        // Infinite scroll
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 13,
    marginRight: 8,
    fontWeight: '500',
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  searchContainer: {
    marginTop: 4,
  },
  searchInput: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
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
  horizontalCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    height: CARD_HEIGHT,
  },
  horizontalCardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 14,
  },
  horizontalCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  horizontalCardVitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  horizontalCardVital: {
    fontSize: 13,
    fontWeight: '600',
  },
  horizontalCardDot: {
    fontSize: 13,
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
    fontWeight: '600',
    marginLeft: 2,
  },
});
