import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useBreedingStore } from "@/store/breedingStore";
import { useAnimalStore } from "@/store/animalStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { useToastStore } from "@/store/toastStore";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";
import DatePickerField from "@/components/DatePickerField";
import TopNavigation from "@/components/TopNavigation";

const METHODS = ["Natural", "Artificial Insemination"] as const;
const STATUSES = ["Planned", "Confirmed", "Pregnant"] as const;

const todayIso = () => new Date().toISOString().split("T")[0];

const addDays = (dateString: string, days: number) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

export default function AddBreedingScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { createBreedingRecord } = useBreedingStore();
  const { currentFarm } = useFarmStore();
  const { animals } = useAnimalStore();
  const { show } = useToastStore();

  const [femaleAnimalId, setFemaleAnimalId] = useState("");
  const [maleAnimalId, setMaleAnimalId] = useState("");
  const [breedingDate, setBreedingDate] = useState(todayIso());
  const [expectedBirthDate, setExpectedBirthDate] = useState(
    addDays(todayIso(), 283)
  );
  const [method, setMethod] = useState("Natural");
  const [status, setStatus] = useState("Planned");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const femaleOptions = useMemo(() => {
    if (!currentFarm) return [];
    return animals
      .filter((a) => a.farmId === currentFarm.id && a.gender === "Female")
      .map((a) => ({
        label: `${a.identificationNumber} (${a.species})`,
        value: a.id,
      }));
  }, [animals, currentFarm]);

  const maleOptions = useMemo(() => {
    if (!currentFarm) return [];
    return animals
      .filter((a) => a.farmId === currentFarm.id && a.gender === "Male")
      .map((a) => ({
        label: `${a.identificationNumber} (${a.species})`,
        value: a.id,
      }));
  }, [animals, currentFarm]);

  const handleBreedingDateChange = (value: string) => {
    setBreedingDate(value);
    if (!expectedBirthDate || expectedBirthDate === addDays(breedingDate, 283)) {
      setExpectedBirthDate(addDays(value, 283));
    }
  };

  const handleSave = async () => {
    if (!currentFarm) {
      setError("Please select a farm first");
      return;
    }
    if (!femaleAnimalId || !breedingDate || !expectedBirthDate || !method || !status) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      await createBreedingRecord({
        farmId: currentFarm.id,
        femaleAnimalId,
        maleAnimalId: maleAnimalId || undefined,
        breedingDate,
        expectedBirthDate,
        method: method as "Natural" | "Artificial Insemination",
        status: status as "Planned" | "Confirmed" | "Pregnant",
        notes,
      });
      show("Breeding record added", "success");
      router.back();
    } catch (e: any) {
      show(e.message || "Failed to add breeding record", "error");
      setError(e.message || "Failed to add breeding record");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Add Breeding Record
          </Text>

          <SelectField
            label="Female Animal *"
            value={femaleAnimalId}
            options={femaleOptions}
            onChange={setFemaleAnimalId}
            placeholder="Select female animal"
            emptyText="No female animals available"
          />

          <SelectField
            label="Male Animal (Sire)"
            value={maleAnimalId}
            options={maleOptions}
            onChange={setMaleAnimalId}
            placeholder="Optional - select sire or AI"
            emptyText="No male animals available"
          />

          <DatePickerField
            label="Breeding Date *"
            value={breedingDate}
            onChange={handleBreedingDateChange}
          />

          <DatePickerField
            label="Expected Birth Date *"
            value={expectedBirthDate}
            onChange={setExpectedBirthDate}
          />

          <SelectField
            label="Method *"
            value={method}
            options={[...METHODS]}
            onChange={setMethod}
          />

          <SelectField
            label="Status *"
            value={status}
            options={[...STATUSES]}
            onChange={setStatus}
          />

          <Input
            label="Notes"
            placeholder="Optional notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {error ? (
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button
              title="Save Record"
              onPress={handleSave}
              style={styles.submitButton}
            />
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  error: { fontSize: 14, marginBottom: 12 },
  buttonContainer: { flexDirection: "row", gap: 16, marginTop: 8 },
  submitButton: { flex: 1 },
  cancelButton: { flex: 1 },
});
