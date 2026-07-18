import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Search, X } from "lucide-react-native";
import { useHealthStore } from "@/store/healthStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { HealthRecord, Farm, HealthRecordType } from "@/types";
import Colors from "@/constants/colors";
import HealthRecordCard from "@/components/HealthRecordCard";
import EmptyState from "@/components/EmptyState";
import FarmSelector from "@/components/FarmSelector";

const HEALTH_TYPES: HealthRecordType[] = [
  "Vaccination", "Treatment", "Checkup", "Surgery", "Medication", "Other",
];

export default function HealthScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const healthRecords = useHealthStore(state => state.healthRecords);
  const fetchHealthRecords = useHealthStore(state => state.fetchHealthRecords);
  const { farms, currentFarm, setCurrentFarm } = useFarmStore();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Load health records on mount
  useEffect(() => {
    if (currentFarm) {
      fetchHealthRecords(currentFarm.id);
    }
  }, [currentFarm?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (currentFarm) {
      await fetchHealthRecords(currentFarm.id);
    }
    setRefreshing(false);
  }, [currentFarm?.id, fetchHealthRecords]);

  const handleHealthRecordPress = useCallback((record: HealthRecord) => {
    router.push(`/health/${record.id}`);
  }, [router]);

  const handleAddHealthRecord = useCallback(() => {
    router.push("/health/add");
  }, [router]);

  const handleAddFarm = useCallback(() => {
    router.push("/farm/add");
  }, [router]);

  const handleSelectFarm = useCallback((farm: Farm) => {
    setCurrentFarm(farm);
  }, [setCurrentFarm]);

  const farmHealthRecords = useMemo(() => {
    if (!currentFarm?.id) return [];
    let records = (healthRecords || []).filter(
      (r): r is HealthRecord => !!r && !!r.id && r.farmId === currentFarm.id
    );
    if (typeFilter) {
      records = records.filter(r => r.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter(r =>
        r.description?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q) ||
        r.diagnosis?.toLowerCase().includes(q) ||
        r.medication?.toLowerCase().includes(q) ||
        r.veterinarian?.toLowerCase().includes(q)
      );
    }
    return records;
  }, [healthRecords, currentFarm?.id, typeFilter, searchQuery]);

  // Memoize renderItem for better performance
  const renderItem = useCallback(({ item }: { item: HealthRecord }) => (
    <HealthRecordCard
      record={item}
      onPress={handleHealthRecordPress}
    />
  ), [handleHealthRecordPress]);

  const keyExtractor = useCallback((item: HealthRecord) => item.id, []);

  const ListHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Search size={18} color={colors.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search records..."
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

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.muted }]}>Type:</Text>
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: !typeFilter ? colors.tint : colors.surface }]}
            onPress={() => setTypeFilter(null)}
          >
            <Text style={[styles.filterPillText, { color: !typeFilter ? "white" : colors.muted }]}>All</Text>
          </TouchableOpacity>
          {HEALTH_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterPill, { backgroundColor: typeFilter === type ? colors.tint : colors.surface }]}
              onPress={() => setTypeFilter(typeFilter === type ? null : type)}
            >
              <Text style={[styles.filterPillText, { color: typeFilter === type ? "white" : colors.muted }]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={[styles.countText, { color: colors.muted }]}>
        {farmHealthRecords.length} record{farmHealthRecords.length !== 1 ? "s" : ""}
      </Text>
    </View>
  ), [colors, searchQuery, typeFilter, farmHealthRecords.length]);

  const ListEmpty = useMemo(() => (
    <EmptyState
      title="No Health Records"
      message="Add your first health record to start tracking"
      buttonTitle="Add Health Record"
      onButtonPress={handleAddHealthRecord}
    />
  ), [handleAddHealthRecord]);

  if (farms.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          title="No Farms Available"
          message="Add a farm before managing health records"
          buttonTitle="Add Farm"
          onButtonPress={handleAddFarm}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FarmSelector
        farms={farms}
        selectedFarm={currentFarm}
        onSelectFarm={handleSelectFarm}
        onAddFarm={handleAddFarm}
      />

      <FlatList
        data={farmHealthRecords}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          farmHealthRecords.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        initialNumToRender={8}
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

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.secondary }]}
        onPress={handleAddHealthRecord}
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
    padding: 16,
  },
  headerContainer: {
    marginBottom: 12,
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
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
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
  countText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
