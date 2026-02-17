import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Edit, Trash2, Plus, Tag } from "lucide-react-native";
import { useAnimalStore } from "@/store/animalStore";
import { useHealthStore } from "@/store/healthStore";
import { useThemeStore } from "@/store/themeStore";
import { Animal, HealthRecord } from "@/types";
import { formatDate, calculateAge } from "@/utils/helpers";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import HealthRecordCard from "@/components/HealthRecordCard";
import LoadingIndicator from "@/components/LoadingIndicator";
import TopNavigation from "@/components/TopNavigation";
import { Ionicons } from "@expo/vector-icons";

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    getAnimal,
    deleteAnimal,
    isLoading: animalLoading,
  } = useAnimalStore();
  const {
    fetchHealthRecords,
    healthRecords,
    isLoading: healthLoading,
  } = useHealthStore();
  const { isDarkMode } = useThemeStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [deleteHealthAfterSale, setDeleteHealthAfterSale] = useState(true);

  const isLoading = animalLoading || healthLoading;

  useEffect(() => {
    if (id) {
      loadAnimalData();
    }
  }, [id]);

  const loadAnimalData = async () => {
    if (!id) return;

    const animalData = await getAnimal(id);
    if (animalData) {
      setAnimal(animalData);
      await fetchHealthRecords(animalData.farmId, animalData.id);
    }
  };

  const handleDeleteAnimal = () => {
    Alert.alert(
      "Delete Animal",
      "Are you sure you want to delete this animal? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            if (animal) {
              await deleteAnimal(animal.id);
              router.back();
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleEditAnimal = () => {
    router.push(`/animal/edit/${id}`);
  };

  const openSellModal = () => {
    if (!animal) return;
    const defaultPrice = (animal.estimatedValue ?? animal.price ?? 0) || 0;
    setSalePrice(defaultPrice ? String(defaultPrice) : "");
    setDeleteHealthAfterSale(true);
    setShowSellModal(true);
  };

  const handleConfirmSold = async () => {
    if (!animal) return;

    const parsedPrice = Number(String(salePrice).replace(/,/g, "").trim());
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Invalid price", "Please enter a valid sale price greater than 0.");
      return;
    }

    try {
      // Mark as sold (animalStore will ensure a Sales transaction exists)
      await useAnimalStore.getState().updateAnimal(animal.id, {
        status: "Sold",
        price: parsedPrice,
      });

      // Optional cleanup to save storage
      if (deleteHealthAfterSale) {
        await useHealthStore.getState().deleteHealthRecordsForAnimal(animal.id, animal.farmId);
      }

      setShowSellModal(false);
      await loadAnimalData();
      Alert.alert("Success", "Animal marked as sold.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to mark animal as sold.");
    }
  };

  const handleAddHealthRecord = () => {
    router.push({
      pathname: "/health/add",
      params: { animalId: id },
    });
  };

  const handleHealthRecordPress = (record: HealthRecord) => {
    router.push({
      pathname: "/health/[id]",
      params: { id: record.id },
    });
  };

  // Get species-specific image
  const getAnimalImage = (species: string) => {
    const animalImages = {
      Cattle:
        "https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      Sheep:
        "https://th.bing.com/th/id/OIP.cHOpiC21p07NjMl7nY8YxgHaEK?w=327&h=183&c=7&r=0&o=7&pid=1.7&rm=3",
      Goat: "https://images.pexels.com/photos/751689/pexels-photo-751689.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      Pig: "https://images.pexels.com/photos/1300361/pexels-photo-1300361.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      Chicken:
        "https://images.pexels.com/photos/1300358/pexels-photo-1300358.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      Duck: "https://images.pexels.com/photos/416179/pexels-photo-416179.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      Turkey:
        "https://th.bing.com/th/id/OIP.0b24h87IrPK3cHoNPsV_qAHaGU?w=220&h=187&c=7&r=0&o=7&pid=1.7&rm=3",
      Horse:
        "https://images.pexels.com/photos/52500/horse-herd-fog-nature-52500.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      Rabbit:
        "https://images.pexels.com/photos/326012/pexels-photo-326012.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
      Other:
        "https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    };

    return (
      animalImages[species as keyof typeof animalImages] || animalImages.Other
    );
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
        return colors.success;
      case "Sick":
        return colors.danger;
      case "Pregnant":
        return colors.info;
      case "ForSale":
        return colors.warning;
      case "Sold":
        return colors.muted;
      case "Deceased":
        return "#000000";
      default:
        return colors.muted;
    }
  };


  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopNavigation />
        <LoadingIndicator fullScreen message="Loading animal details..." />
      </View>
    );
  }

  if (!animal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopNavigation />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            Animal not found
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Image
            source={{ uri: getAnimalImage(animal.species || "Other") }}
            style={styles.image}
            contentFit="cover"
          />

          <View style={styles.overlay}>
            <Text style={styles.id}>ID: {animal.identificationNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(animal.status) },
              ]}
            >
              <Text style={styles.statusText}>{animal.status}</Text>
            </View>
          </View>
        </View>

        <Card style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Species
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {animal.species || "Unknown"}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Breed
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {animal.breed}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Gender
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {animal.gender}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Age
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {calculateAge(animal.birthDate)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Weight
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {(animal as any).weight || 0}{" "}
                {(animal as any).weightUnit || "kg"}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Birth Date
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(animal.birthDate)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Acquisition Date
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(animal.acquisitionDate)}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                Added
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(animal.createdAt)}
              </Text>
            </View>
          </View>
        </Card>

        {animal.notes && (
          <Card style={[styles.notesCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.notesLabel, { color: colors.text }]}>
              Notes
            </Text>
            <Text style={[styles.notes, { color: colors.text }]}>
              {animal.notes}
            </Text>
          </Card>
        )}

        <View style={styles.recordsContainer}>
          <View style={styles.recordsHeader}>
            <Text style={[styles.recordsTitle, { color: colors.text }]}>
              Health Records
            </Text>
            <Button
              title="Add Record"
              onPress={handleAddHealthRecord}
              variant="outline"
              size="small"
              icon={<Plus size={16} color={colors.tint} />}
            />
          </View>

          {healthRecords.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No health records found
            </Text>
          ) : (
            healthRecords.map((record) => (
              <HealthRecordCard
                key={record.id}
                record={record}
                onPress={handleHealthRecordPress}
              />
            ))
          )}
        </View>

        <View style={styles.actionsContainer}>
          {animal.status !== "Sold" && animal.status !== "Dead" && (
            <Button
              title="Mark Sold"
              onPress={openSellModal}
              variant="secondary"
              icon={<Tag size={16} color="white" />}
              style={styles.actionButton}
            />
          )}

          <Button
            title="Edit"
            onPress={handleEditAnimal}
            variant="outline"
            icon={<Edit size={16} color={colors.tint} />}
            style={styles.actionButton}
          />

          <Button
            title="Delete"
            onPress={handleDeleteAnimal}
            variant="danger"
            icon={<Trash2 size={16} color="white" />}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      {/* Mark Sold Modal */}
      <Modal visible={showSellModal} transparent animationType="fade" statusBarTranslucent={Platform.OS === "android"} onRequestClose={() => setShowSellModal(false)}>
        <View style={Platform.OS === "android" ? { flex: 1, backgroundColor: "transparent" } : styles.modalOverlay}>
          <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalInner}>
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Mark as Sold</Text>
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                This will record a Sales transaction and mark the animal as Sold.
              </Text>

              <Text style={[styles.modalLabel, { color: colors.text }]}>Sale price</Text>
              <TextInput
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
                placeholder="Enter sale price"
                placeholderTextColor={colors.muted}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              />

              <View style={styles.modalToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: colors.text }]}>Delete health records</Text>
                  <Text style={[styles.modalHelp, { color: colors.muted }]}>
                    Saves storage, but you won’t be able to view this animal’s past health history later.
                  </Text>
                </View>
                <Switch value={deleteHealthAfterSale} onValueChange={setDeleteHealthAfterSale} />
              </View>

              <View style={styles.modalActions}>
                <Button title="Cancel" onPress={() => setShowSellModal(false)} variant="outline" />
                <Button title="Confirm" onPress={handleConfirmSold} variant="primary" />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    position: "relative",
    height: 240,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  id: {
    fontSize: 26,
    fontWeight: "700",
    color: "white",
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    margin: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  notesCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
  },
  recordsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  recordsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 32,
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 32,
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalInner: {
    width: "100%",
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    fontSize: 14,
  },
  modalToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalHelp: {
    fontSize: 12,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 24,
  },
});
