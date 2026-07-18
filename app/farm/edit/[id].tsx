import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { useToastStore } from "@/store/toastStore";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";
import TopNavigation from "@/components/TopNavigation";

const FARM_TYPES = ["Dairy", "Livestock", "Mixed", "Poultry", "Crop", "Aquaculture", "Other"];
const SIZE_UNITS = ["acres", "hectares", "square meters", "square feet"];

export default function EditFarmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { farms, updateFarm, deleteFarm, isLoading } = useFarmStore();
  const { isDarkMode } = useThemeStore();
  const { show } = useToastStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const farm = farms.find(f => f.id === id);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [sizeUnit, setSizeUnit] = useState("acres");
  const [type, setType] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (farm) {
      setName(farm.name || "");
      setLocation(farm.location || "");
      setSize(String(farm.size || ""));
      setSizeUnit(farm.sizeUnit || "acres");
      setType(farm.type || "");
    }
  }, [farm?.id]);

  const handleUpdate = async () => {
    if (!farm) return;
    if (!name || !location || !size || !type) {
      setError("Please fill in all required fields");
      return;
    }
    const sizeNum = parseFloat(size);
    if (isNaN(sizeNum) || sizeNum <= 0) {
      setError("Size must be a positive number");
      return;
    }

    try {
      await updateFarm(farm.id, {
        name,
        location,
        size: sizeNum,
        sizeUnit,
        type,
      });
      show("Farm updated successfully", "success");
      router.back();
    } catch (e: any) {
      setError(e.message || "Failed to update farm");
      show("Failed to update farm", "error");
    }
  };

  const handleDelete = () => {
    if (!farm) return;
    Alert.alert(
      "Delete Farm",
      `Delete "${farm.name}"? This will also delete ALL animals, health records, and transactions belonging to this farm. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFarm(farm.id);
              show("Farm deleted successfully", "success");
              router.replace("/(tabs)");
            } catch (e: any) {
              show("Failed to delete farm", "error");
            }
          },
        },
      ]
    );
  };

  if (!farm) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopNavigation />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>Farm not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>Edit Farm</Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.danger + "20" }]}>
              <Text style={[styles.errorMsg, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          <Input label="Farm Name *" placeholder="Enter farm name" value={name} onChangeText={setName} />
          <Input label="Location *" placeholder="Enter farm location" value={location} onChangeText={setLocation} />

          <View style={styles.row}>
            <Input
              label="Size *"
              placeholder="Enter size"
              keyboardType="numeric"
              value={size}
              onChangeText={setSize}
              containerStyle={styles.sizeInput}
            />
            <SelectField
              label="Unit"
              value={sizeUnit}
              options={SIZE_UNITS}
              onChange={setSizeUnit}
              containerStyle={styles.unitInput}
            />
          </View>

          <SelectField
            label="Farm Type *"
            value={type}
            options={FARM_TYPES}
            onChange={setType}
            placeholder="Select farm type"
          />

          <View style={styles.buttonContainer}>
            <Button title="Save Changes" onPress={handleUpdate} loading={isLoading} style={styles.button} />
            <Button title="Cancel" onPress={() => router.back()} variant="outline" style={styles.button} />
          </View>

          <Button
            title="Delete Farm"
            onPress={handleDelete}
            variant="danger"
            style={styles.deleteButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 24 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  errorMsg: { fontSize: 14 },
  row: { flexDirection: "row", gap: 12 },
  sizeInput: { flex: 2 },
  unitInput: { flex: 1 },
  buttonContainer: { flexDirection: "row", gap: 12, marginTop: 24 },
  button: { flex: 1 },
  deleteButton: { marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, gap: 16 },
  errorText: { fontSize: 16, textAlign: "center" },
});
