import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
import DateTimePicker from "@react-native-community/datetimepicker";

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
  const [price, setPrice] = useState("");
  const [acquisitionPrice, setAcquisitionPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Date picker state
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showAcquisitionDatePicker, setShowAcquisitionDatePicker] =
    useState(false);

  const speciesOptions: AnimalSpecies[] = [
    "Cattle",
    "Goat",
    "Sheep",
    "Pig",
    "Chicken",
  ];
  const statusOptions: AnimalStatus[] = ["Healthy", "Sick", "Sold", "Dead"];
  const weightUnitOptions = ["kg", "lb", "g"];

  useEffect(() => {
    // Set today's date as default for acquisition date
    const today = new Date().toISOString().split("T")[0];
    setAcquisitionDate(today);
  }, []);

  // Date picker handlers
  const onBirthDateChange = (event: any, selectedDate?: Date) => {
    setShowBirthDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setBirthDate(formattedDate);
    }
  };

  const onAcquisitionDateChange = (event: any, selectedDate?: Date) => {
    setShowAcquisitionDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setAcquisitionDate(formattedDate);
    }
  };

  const handleCreateAnimal = async () => {
    if (!currentFarm) {
      setFormError("Please select a farm");
      return;
    }

    // Validate form
    if (
      !identificationNumber ||
      !species ||
      !breed ||
      !gender ||
      !birthDate ||
      !acquisitionDate ||
      !status ||
      !weight
    ) {
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
        price: price ? parseFloat(price) : 0,
        acquisitionPrice: acquisitionPrice ? parseFloat(acquisitionPrice) : 0,
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
          <Text style={[styles.title, { color: colors.text }]}>
            Add New Animal
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Enter the animal details to add to your farm
          </Text>

          {(error || formError) && (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: colors.danger + "15",
                  borderLeftColor: colors.danger,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error || formError}
              </Text>
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
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                }}
              >
                <Picker
                  selectedValue={species}
                  onValueChange={setSpecies}
                  style={{ color: colors.text }}
                  dropdownIconColor={colors.text}
                >
                  {speciesOptions.map((option) => (
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

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Gender *
              </Text>
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    gender === "Male" && styles.radioSelected,
                  ]}
                  onPress={() => setGender("Male")}
                >
                  <View
                    style={[
                      styles.radioButton,
                      gender === "Male" && styles.radioButtonSelected,
                      { borderColor: colors.tint },
                    ]}
                  >
                    {gender === "Male" && (
                      <View
                        style={[
                          styles.radioButtonInner,
                          { backgroundColor: colors.tint },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.radioText, { color: colors.text }]}>
                    Male
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    gender === "Female" && styles.radioSelected,
                  ]}
                  onPress={() => setGender("Female")}
                >
                  <View
                    style={[
                      styles.radioButton,
                      gender === "Female" && styles.radioButtonSelected,
                      { borderColor: colors.tint },
                    ]}
                  >
                    {gender === "Female" && (
                      <View
                        style={[
                          styles.radioButtonInner,
                          { backgroundColor: colors.tint },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.radioText, { color: colors.text }]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Birth Date *
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() => setShowBirthDatePicker(true)}
              >
                <Text style={{ color: birthDate ? colors.text : colors.muted }}>
                  {birthDate || "YYYY-MM-DD"}
                </Text>
              </TouchableOpacity>
              {showBirthDatePicker && (
                <DateTimePicker
                  value={birthDate ? new Date(birthDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onBirthDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Acquisition Date *
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() => setShowAcquisitionDatePicker(true)}
              >
                <Text
                  style={{
                    color: acquisitionDate ? colors.text : colors.muted,
                  }}
                >
                  {acquisitionDate || "YYYY-MM-DD"}
                </Text>
              </TouchableOpacity>
              {showAcquisitionDatePicker && (
                <DateTimePicker
                  value={
                    acquisitionDate ? new Date(acquisitionDate) : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={onAcquisitionDateChange}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Status</Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                }}
              >
                <Picker
                  selectedValue={status}
                  onValueChange={setStatus}
                  style={{ color: colors.text }}
                  dropdownIconColor={colors.text}
                >
                  {statusOptions.map((option) => (
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

              <View style={[styles.inputContainer, styles.unitInput]}>
                <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Picker
                    selectedValue={weightUnit}
                    onValueChange={setWeightUnit}
                    style={{ color: colors.text }}
                    dropdownIconColor={colors.text}
                  >
                    {weightUnitOptions.map((option) => (
                      <Picker.Item key={option} label={option} value={option} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <Input
                label="Current Price *"
                placeholder="Enter current market value"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
                containerStyle={styles.weightInput}
              />

              <Input
                label="Acquisition Price *"
                placeholder="Enter purchase cost"
                keyboardType="numeric"
                value={acquisitionPrice}
                onChangeText={setAcquisitionPrice}
                containerStyle={styles.weightInput}
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
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  radioSelected: {
    // You can add styling for the selected option if needed
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioButtonSelected: {
    // Border color is now applied dynamically
  },
  radioButtonInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    // Background color is now applied dynamically
  },
  radioText: {
    fontSize: 16,
  },
});
