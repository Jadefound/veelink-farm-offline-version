import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useHealthStore } from "@/store/healthStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { HealthRecord, Farm } from "@/types";
import Colors from "@/constants/colors";
import HealthRecordCard from "@/components/HealthRecordCard";
import EmptyState from "@/components/EmptyState";
import FarmSelector from "@/components/FarmSelector";

const ITEM_HEIGHT = 120; // Approximate height for health record cards

export default function HealthScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const healthRecords = useHealthStore(state => state.healthRecords);
  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7246/ingest/79193bdc-f2c4-4e7b-8086-16038e987145", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "health.tsx:mount", message: "Health tab mounted", data: { healthRecordsCount: Array.isArray(healthRecords) ? healthRecords.length : 0 }, timestamp: Date.now() }) }).catch(() => {});
  }, []);
  // #endregion
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
    return (healthRecords || []).filter((r): r is HealthRecord => !!r && !!r.id && r.farmId === currentFarm.id);
  }, [healthRecords, currentFarm?.id]);

  // Memoize renderItem for better performance
  const renderItem = useCallback(({ item }: { item: HealthRecord }) => (
    <HealthRecordCard
      record={item}
      onPress={handleHealthRecordPress}
    />
  ), [handleHealthRecordPress]);

  const keyExtractor = useCallback((item: HealthRecord) => item.id, []);

  const getItemLayout = useCallback((_: any, index: number) => {
    const length = Number(ITEM_HEIGHT) || 120;
    return { length, offset: length * index, index };
  }, []);

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
        getItemLayout={getItemLayout}
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
