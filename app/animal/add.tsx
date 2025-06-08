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

// Helper to generate animal ID
const getNextAnimalId = (species: string, animals: any[]) => {
  const speciesPrefixes: Record<string, string> = {
    Cattle: "C",
    Sheep: "S",
    Goat: "G",
    Pig: "P",
    Chicken: "CH",
    Duck: "D",
    Turkey: "T",
    Horse: "H",
    Rabbit: "R",
    Other: "O",
  };
  const prefix = speciesPrefixes[species] || "O";
  const count = animals.filter((a) => a.species === species).length;
  const nextNumber = (count + 1).toString().padStart(3, "0");
  return `${prefix}${nextNumber}`;
};

export default function AddAnimalScreen() {
  const router = useRouter();
  const { createAnimal, isLoading, error, animals } = useAnimalStore();
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
    "Cattle", "Sheep", "Goat", "Pig", "Chicken", "Duck", "Turkey", "Horse", "Rabbit", "Other"
  ];
  const statusOptions: AnimalStatus[] = [
    "Healthy", "Sick", "Pregnant", "Lactating", "Growing", "ForSale", "Sold", "Recovering", "Dead"
  ];
  const weightUnitOptions = ["kg", "lb", "g"];

  const [formData, setFormData] = useState({
    identificationNumber,
    species,
    breed,
    gender,
    birthDate,
    acquisitionDate,
    status,
    weight,
    weightUnit,
    price,
    acquisitionPrice,
    notes,
    acquisitionCost: '',
    currentValue: '',
  });

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

  // When species changes, update the ID
  useEffect(() => {
    const nextId = getNextAnimalId(formData.species, animals);
    setFormData((prev) => ({ ...prev, identificationNumber: nextId }));
  }, [formData.species, animals]);

  const handleCreateAnimal = async () => {
    if (!currentFarm) {
      setFormError("Please select a farm");
      return;
    }

    // Validate form
    if (
      !formData.identificationNumber ||
      !formData.species ||
      !formData.breed ||
      !formData.gender ||
      !formData.birthDate ||
      !formData.acquisitionDate ||
      !formData.status ||
      !formData.weight
    ) {
      setFormError("Please fill in all required fields");
      return;
    }

    setFormError("");

    try {
      // Calculate age from birth date
      const birthDate = new Date(formData.birthDate);
      const now = new Date();
      const ageInYears = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

      // Derive health status from status
      const healthStatus = formData.status === 'Healthy' ? 'healthy' :
        formData.status === 'Sick' ? 'sick' :
          formData.status === 'Recovering' ? 'recovering' : 'healthy';

      await createAnimal({
        farmId: currentFarm.id,
        identificationNumber: formData.identificationNumber,
        species: formData.species,
        type: formData.species,
        breed: formData.breed,
        gender: formData.gender,
        birthDate: formData.birthDate,
        acquisitionDate: formData.acquisitionDate,
        status: formData.status,
        weight: parseFloat(formData.weight),
        weightUnit: formData.weightUnit,
        price: formData.currentValue ? parseFloat(formData.currentValue) : 0,
        acquisitionPrice: formData.acquisitionCost ? parseFloat(formData.acquisitionCost) : 0,
        notes: formData.notes,
        age: ageInYears,
        healthStatus: healthStatus,
        estimatedValue: formData.currentValue ? parseFloat(formData.currentValue) : 0,
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
              value={formData.identificationNumber}
              editable={false}
              inputStyle={{ color: colors.muted, backgroundColor: colors.card }}
              containerStyle={{ opacity: 0.8 }}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Species *</Text>
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.card }}>
                <Picker
                  selectedValue={formData.species}
                  onValueChange={(value) => setFormData({ ...formData, species: value as AnimalSpecies })}
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
              value={formData.breed}
              onChangeText={text => setFormData({ ...formData, breed: text })}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.radioContainer}>
                {["Male", "Female"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.radioOption, formData.gender === option && styles.radioSelected]}
                    onPress={() => setFormData({ ...formData, gender: option as "Male" | "Female" })}
                  >
                    <View style={[styles.radioButton, formData.gender === option && styles.radioButtonSelected, { borderColor: colors.tint }]}>
                      {formData.gender === option && <View style={[styles.radioButtonInner, { backgroundColor: colors.tint }]} />}
                    </View>
                    <Text style={[styles.radioText, { color: colors.text }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
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
                    backgroundColor: colors.card,
                  },
                ]}
                onPress={() => setShowBirthDatePicker(true)}
              >
                <Text style={{ color: formData.birthDate ? colors.text : colors.muted }}>
                  {formData.birthDate || "YYYY-MM-DD"}
                </Text>
              </TouchableOpacity>
              {showBirthDatePicker && (
                <DateTimePicker
                  value={formData.birthDate ? new Date(formData.birthDate) : new Date()}
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
                    backgroundColor: colors.card,
                  },
                ]}
                onPress={() => setShowAcquisitionDatePicker(true)}
              >
                <Text
                  style={{
                    color: formData.acquisitionDate ? colors.text : colors.muted,
                  }}
                >
                  {formData.acquisitionDate || "YYYY-MM-DD"}
                </Text>
              </TouchableOpacity>
              {showAcquisitionDatePicker && (
                <DateTimePicker
                  value={
                    formData.acquisitionDate ? new Date(formData.acquisitionDate) : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={onAcquisitionDateChange}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Status *</Text>
              <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.card }}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as AnimalStatus })}
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
                value={formData.weight}
                onChangeText={text => setFormData({ ...formData, weight: text })}
                containerStyle={styles.weightInput}
              />

              <View style={[styles.inputContainer, styles.unitInput]}>
                <Text style={styles.label}>Unit</Text>
                <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.card }}>
                  <Picker
                    selectedValue={formData.weightUnit}
                    onValueChange={(value) => setFormData({ ...formData, weightUnit: value as string })}
                    style={{ color: colors.text }}
                    dropdownIconColor={colors.text}
                  >
                    {weightUnitOptions.map((unit) => (
                      <Picker.Item key={unit} label={unit} value={unit} />
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
                value={formData.price}
                onChangeText={text => setFormData({ ...formData, price: text })}
                containerStyle={styles.weightInput}
              />

              <Input
                label="Acquisition Price *"
                placeholder="Enter purchase cost"
                keyboardType="numeric"
                value={formData.acquisitionPrice}
                onChangeText={text => setFormData({ ...formData, acquisitionPrice: text })}
                containerStyle={styles.weightInput}
              />
            </View>

            <Input
              label="Acquisition Cost"
              value={formData.acquisitionCost}
              onChangeText={text => setFormData({ ...formData, acquisitionCost: text })}
              placeholder="Enter acquisition cost"
              keyboardType="numeric"
            />

            <Input
              label="Current Value"
              value={formData.currentValue}
              onChangeText={text => setFormData({ ...formData, currentValue: text })}
              placeholder="Enter current value"
              keyboardType="numeric"
            />

            <Input
              label="Notes"
              placeholder="Enter any additional notes"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.notes}
              onChangeText={text => setFormData({ ...formData, notes: text })}
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
