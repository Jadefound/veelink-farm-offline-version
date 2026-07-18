import React, { useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { showAlert } from "@/utils/crossPlatformAlert";
import { useRouter } from "expo-router";
import { Plus, Heart, AlertTriangle } from "lucide-react-native";
import { useBreedingStore } from "@/store/breedingStore";
import { useAnimalStore } from "@/store/animalStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { useToastStore } from "@/store/toastStore";
import Colors from "@/constants/colors";
import { BreedingRecord } from "@/types";
import { formatDate } from "@/utils/helpers";
import TopNavigation from "@/components/TopNavigation";
import EmptyState from "@/components/EmptyState";
import Card from "@/components/Card";

type ColorTheme = typeof Colors.light;

const getStatusColor = (status: BreedingRecord["status"], colors: ColorTheme) => {
  switch (status) {
    case "Confirmed":
      return colors.info;
    case "Pregnant":
      return colors.warning;
    case "Successful":
      return colors.success;
    case "Failed":
      return colors.danger;
    default:
      return colors.muted;
  }
};

export default function BreedingScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { breedingRecords, deleteBreedingRecord, getUpcomingBirths } =
    useBreedingStore();
  const { currentFarm } = useFarmStore();
  const { getAnimal } = useAnimalStore();
  const { show } = useToastStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const farmRecords = useMemo(
    () =>
      currentFarm
        ? breedingRecords.filter((r) => r.farmId === currentFarm.id)
        : [],
    [breedingRecords, currentFarm]
  );

  const upcomingBirths = useMemo(
    () => (currentFarm ? getUpcomingBirths(currentFarm.id, 30) : []),
    [getUpcomingBirths, currentFarm]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleDelete = (record: BreedingRecord) => {
    showAlert("Delete Record", "Delete this breeding record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteBreedingRecord(record.id);
          show("Breeding record deleted successfully", "success");
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: { item: BreedingRecord }) => {
      const femaleAnimal = getAnimal(item.femaleAnimalId);
      const maleAnimal = item.maleAnimalId
        ? getAnimal(item.maleAnimalId)
        : undefined;
      const statusColor = getStatusColor(item.status, colors);

      return (
        <Card variant="elevated" style={styles.card}>
          <TouchableOpacity activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.tint + "15" },
                  ]}
                >
                  <Heart size={20} color={colors.tint} />
                </View>
                <View style={styles.cardInfo}>
                  <Text
                    style={[styles.femaleId, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {femaleAnimal?.identificationNumber || item.femaleAnimalId}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.muted }]}>
                    {maleAnimal
                      ? `Sire: ${maleAnimal.identificationNumber}`
                      : "AI / Unknown sire"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.deleteText, { color: colors.danger }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Breeding
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatDate(item.breedingDate)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Expected Birth
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {formatDate(item.expectedBirthDate)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Method
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {item.method}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "15" },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status}
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      );
    },
    [colors, getAnimal]
  );

  const ListHeader = useMemo(
    () => (
      <View>
        {upcomingBirths.length > 0 && (
          <View
            style={[
              styles.alertSummary,
              {
                backgroundColor: colors.warning + "10",
                borderColor: colors.warning + "30",
              },
            ]}
          >
            <AlertTriangle size={18} color={colors.warning} />
            <Text
              style={[styles.alertSummaryText, { color: colors.warning }]}
            >
              {upcomingBirths.length} birth{upcomingBirths.length !== 1 ? "s" : ""} expected within 30 days
            </Text>
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Breeding Records ({farmRecords.length})
        </Text>
      </View>
    ),
    [upcomingBirths, farmRecords.length, colors]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      <FlatList
        data={farmRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            title="No Breeding Records"
            message="Track breeding events, pregnancies, and expected births here."
            buttonTitle="Add Record"
            onButtonPress={() => router.push("/breeding/add")}
            icon={<Heart size={48} color={colors.tint} />}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      />

      {farmRecords.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/breeding/add")}
          activeOpacity={0.85}
        >
          <Plus size={32} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 80 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 8,
  },
  alertSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  alertSummaryText: { fontSize: 14, fontWeight: "500" },
  card: { marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  femaleId: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  subtitle: { fontSize: 13 },
  deleteText: { fontSize: 14, fontWeight: "500" },
  cardStats: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  statItem: { minWidth: 90 },
  statLabel: { fontSize: 12, fontWeight: "500", marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: "600" },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  statusText: { fontSize: 13, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});
