import React, { useEffect, useState } from "react";
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
import { HealthRecord, Farm } from "@/types";
import Colors from "@/constants/colors";
import HealthRecordCard from "@/components/HealthRecordCard";
import EmptyState from "@/components/EmptyState";
import LoadingIndicator from "@/components/LoadingIndicator";
import FarmSelector from "@/components/FarmSelector";

export default function HealthScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Use the store instead:
  const healthRecords = useHealthStore(state => state.healthRecords);
  const { farms, currentFarm } = useFarmStore();
  const isLoading = false;

  const loadHealthRecords = async () => {
    // Mock function - no longer needed
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleHealthRecordPress = (record: HealthRecord) => {
    router.push(`/health/${record.id}`);
  };

  const handleAddHealthRecord = () => {
    router.push("/health/add");
  };

  const handleAddFarm = () => {
    router.push("/farm/add");
  };

  const setCurrentFarm = (farm: Farm) => {
    // Mock function for FarmSelector
  };

  if (farms.length === 0) {
    return (
      <View style={styles.container}>
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
    <View style={styles.container}>
      <FarmSelector
        farms={farms}
        selectedFarm={currentFarm}
        onSelectFarm={setCurrentFarm}
        onAddFarm={handleAddFarm}
      />

      {isLoading && !refreshing ? (
        <LoadingIndicator message="Loading health records..." />
      ) : (
        <>
          {healthRecords.length === 0 ? (
            <EmptyState
              title="No Health Records"
              message="Add your first health record to start tracking"
              buttonTitle="Add Health Record"
              onButtonPress={handleAddHealthRecord}
            />
          ) : (
            <FlatList
              data={healthRecords}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <HealthRecordCard
                  record={item}
                  onPress={handleHealthRecordPress}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}

          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddHealthRecord}
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
    backgroundColor: "#f9fafb",
    padding: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.secondary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
