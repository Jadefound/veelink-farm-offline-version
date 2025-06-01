import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAnimalStore } from "@/store/animalStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { AnimalSpecies, AnimalStatus } from "@/types";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import TopNavigation from "@/components/TopNavigation";
import { Picker } from "@react-native-picker/picker";

export default function AddAnimalScreen() {
  const router = useRouter();
  const { createAnimal, isLoading, error } = useAnimalStore();
  const { currentFarm } = useFarmStore();
  const { isDarkMode } = useThemeStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [identificationNumber, setIdentificationNumber] = useState("");
  const [species, setSpecies] = useState<AnimalSpecies>("Cattle");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [birthDate, setBirthDate] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [status, setStatus] = useState<AnimalStatus>("Healthy");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const speciesOptions: AnimalSpecies[] = ["Cattle", "Goat", "Sheep", "Pig", "Chicken"];
  const statusOptions: AnimalStatus[] = ["Healthy", "Sick", "Sold", "Dead"];

  useEffect(() => {
    // Set today's date as default for acquisition date
    const today = new Date().toISOString().split("T")[0];
    setAcquisitionDate(today);
  }, []);

  const handleCreateAnimal = async () => {
    if (!currentFarm) {
      setFormError("Please select a farm");
      return;
    }

    // Validate form
    if (!identificationNumber || !species || !breed || !gender || !birthDate || !acquisitionDate || !status || !weight) {
      setFormError("Please fill in all required fields");
      return;
    }

    setFormError("");

    try {
      await createAnimal({
        farmId: currentFarm.id,
        identificationNumber,
        species,
        breed,
        gender,
        birthDate,
        acquisitionDate,
        status,
        weight: parseFloat(weight),
        weightUnit,
        notes,
      });

      router.back();
    } catch (error: any) {
      setFormError(error.message || "Failed to create animal");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.text }]}>Add New Animal</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Enter the animal details to add to your farm
          </Text>

          {(error || formError) && (
            <View style={[styles.errorContainer, { backgroundColor: colors.danger + "15", borderLeftColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error || formError}</Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <Input
              label="Identification Number *"
              placeholder="Enter unique ID number (e.g., A001, COW-123)"
              value={identificationNumber}
              onChangeText={setIdentificationNumber}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Species</Text>
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface }}>
                <Picker
                  selectedValue={species}
                  onValueChange={setSpecies}
                  style={{ color: colors.text }}
                  dropdownIconColor={colors.text}
                >
                  {speciesOptions.map(option => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>

            <Input
              label="Breed *"
              placeholder="Enter breed"
              value={breed}
              onChangeText={setBreed}
            />

            <Input
              label="Gender *"
              placeholder="Male or Female"
              value={gender}
              onChangeText={(text) => setGender(text as "Male" | "Female")}
            />

            <Input
              label="Birth Date *"
              placeholder="YYYY-MM-DD"
              value={birthDate}
              onChangeText={setBirthDate}
            />

            <Input
              label="Acquisition Date *"
              placeholder="YYYY-MM-DD"
              value={acquisitionDate}
              onChangeText={setAcquisitionDate}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Status</Text>
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface }}>
                <Picker
                  selectedValue={status}
                  onValueChange={setStatus}
                  style={{ color: colors.text }}
                  dropdownIconColor={colors.text}
                >
                  {statusOptions.map(option => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.row}>
              <Input
                label="Weight *"
                placeholder="Enter weight"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                containerStyle={styles.weightInput}
              />

              <Input
                label="Unit"
                placeholder="Unit"
                value={weightUnit}
                onChangeText={setWeightUnit}
                containerStyle={styles.unitInput}
              />
            </View>

            <Input
              label="Notes"
              placeholder="Enter any additional notes"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
              inputStyle={styles.notesInput}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.button}
            />

            <Button
              title="Add Animal"
              onPress={handleCreateAnimal}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  formContainer: {
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  weightInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    marginBottom: 40,
    gap: 16,
  },
  button: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
});