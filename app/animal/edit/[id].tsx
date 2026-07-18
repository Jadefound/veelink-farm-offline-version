import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { showAlert } from "@/utils/crossPlatformAlert";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAnimalStore } from "@/store/animalStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { useToastStore } from "@/store/toastStore";
import { AnimalSpecies, AnimalStatus, Animal } from "@/types";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import TopNavigation from "@/components/TopNavigation";
import LoadingIndicator from "@/components/LoadingIndicator";
import SelectField from "@/components/SelectField";
import DatePickerField from "@/components/DatePickerField";

export default function EditAnimalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAnimal, updateAnimal, isLoading, error } = useAnimalStore();
  const { currentFarm } = useFarmStore();
  const { isDarkMode } = useThemeStore();
  const { show } = useToastStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [animal, setAnimal] = useState<Animal | null>(null);
  // State for form fields using formData approach like Add Animal
  const [formData, setFormData] = useState({
    identificationNumber: "",
    species: "Cattle" as AnimalSpecies,
    breed: "",
    gender: "Male" as "Male" | "Female",
    birthDate: "",
    acquisitionDate: "",
    status: "Healthy" as AnimalStatus,
    weight: "",
    weightUnit: "kg",
    price: "",
    acquisitionPrice: "",
    notes: ""
  });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);

  const speciesOptions: AnimalSpecies[] = [
    "Cattle", "Sheep", "Goat", "Pig", "Chicken", "Duck", "Turkey", "Horse", "Rabbit", "Other"
  ];
  const statusOptions: AnimalStatus[] = [
    "Healthy", "Sick", "Pregnant", "Lactating", "Growing", "ForSale", "Sold", "Recovering", "Dead"
  ];
  const weightUnitOptions = ["kg", "lb", "g"];

  useEffect(() => {
    if (id) {
      loadAnimal();
    }
  }, [id]);

  const loadAnimal = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const animalData = await getAnimal(id);
      if (animalData) {
        setAnimal(animalData);
        populateForm(animalData);
      } else {
        showAlert("Error", "Animal not found");
        router.back();
      }
    } catch (error) {
      showAlert("Error", "Failed to load animal data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (animalData: Animal) => {
    setFormData({
      identificationNumber: animalData.identificationNumber,
      species: animalData.species,
      breed: animalData.breed,
      gender: animalData.gender,
      birthDate: animalData.birthDate,
      acquisitionDate: animalData.acquisitionDate,
      status: animalData.status,
      weight: animalData.weight?.toString() || "",
      weightUnit: animalData.weightUnit || "kg",
      price: animalData.price?.toString() || "",
      acquisitionPrice: animalData.acquisitionPrice?.toString() || "",
      notes: animalData.notes || ""
    });
  };

  const onBirthDateChange = (dateString: string) => {
    setFormData(prev => ({ ...prev, birthDate: dateString }));
  };

  const onAcquisitionDateChange = (dateString: string) => {
    setFormData(prev => ({ ...prev, acquisitionDate: dateString }));
  };

  const handleUpdateAnimal = async () => {
    if (!animal || !currentFarm) {
      setFormError("Animal or farm data not available");
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

    // Validate weight
    const weightNum = parseFloat(formData.weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setFormError("Please enter a valid weight");
      return;
    }

    // Validate prices if provided
    let priceNum = undefined;
    let acquisitionPriceNum = undefined;

    if (formData.price) {
      priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        setFormError("Please enter a valid price");
        return;
      }
    }

    if (formData.acquisitionPrice) {
      acquisitionPriceNum = parseFloat(formData.acquisitionPrice);
      if (isNaN(acquisitionPriceNum) || acquisitionPriceNum < 0) {
        setFormError("Please enter a valid acquisition price");
        return;
      }
    }

    // Validate dates
    const birthDateObj = new Date(formData.birthDate);
    const acquisitionDateObj = new Date(formData.acquisitionDate);
    const today = new Date();

    if (birthDateObj > today) {
      setFormError("Birth date cannot be in the future");
      return;
    }

    if (acquisitionDateObj > today) {
      setFormError("Acquisition date cannot be in the future");
      return;
    }

    if (birthDateObj > acquisitionDateObj) {
      setFormError("Birth date cannot be after acquisition date");
      return;
    }

    setFormError("");

    const updatedAnimal = {
      ...animal,
      identificationNumber: formData.identificationNumber,
      species: formData.species,
      breed: formData.breed,
      gender: formData.gender,
      birthDate: formData.birthDate,
      acquisitionDate: formData.acquisitionDate,
      status: formData.status,
      weight: weightNum,
      weightUnit: formData.weightUnit,
      price: priceNum,
      acquisitionPrice: acquisitionPriceNum,
      notes: formData.notes,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateAnimal(animal.id, updatedAnimal);
      show("Animal updated successfully", "success");
      router.back();
    } catch (error) {
      show("Failed to update animal. Please try again.", "error");
      setFormError("Failed to update animal. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopNavigation />
        <LoadingIndicator message="Loading animal data..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TopNavigation />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {formError ? (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: colors.danger + "20" },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {formError}
              </Text>
            </View>
          ) : null}

          <Input
            label="Identification Number *"
            value={formData.identificationNumber}
            editable={false}
            inputStyle={{ color: colors.muted, backgroundColor: colors.card }}
            containerStyle={{ opacity: 0.8 }}
          />

          <SelectField
            label="Species *"
            value={formData.species}
            options={speciesOptions}
            onChange={(value) => setFormData(prev => ({ ...prev, species: value as AnimalSpecies }))}
          />

          <Input
            label="Breed *"
            value={formData.breed}
            onChangeText={(text) => setFormData(prev => ({ ...prev, breed: text }))}
            placeholder="Enter breed"
          />

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Gender *</Text>
            <View style={styles.radioContainer}>
              {["Male", "Female"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radioOption,
                    { borderColor: colors.border },
                    formData.gender === option && [styles.radioSelected, { backgroundColor: colors.surface }],
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, gender: option as "Male" | "Female" }))}
                >
                  <View
                    style={[
                      styles.radioButton,
                      { borderColor: colors.border },
                      formData.gender === option && [styles.radioButtonSelected, { backgroundColor: colors.tint }],
                    ]}
                  >
                    {formData.gender === option && <View style={[styles.radioButtonInner, { backgroundColor: colors.tint }]} />}
                  </View>
                  <Text style={[styles.radioText, { color: colors.text }]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <DatePickerField
            label="Birth Date *"
            value={formData.birthDate}
            onChange={onBirthDateChange}
            placeholder="Select birth date"
            maximumDate={new Date()}
            containerStyle={styles.dateContainer}
          />

          <DatePickerField
            label="Acquisition Date *"
            value={formData.acquisitionDate}
            onChange={onAcquisitionDateChange}
            placeholder="Select acquisition date"
            maximumDate={new Date()}
            containerStyle={styles.dateContainer}
          />

          <SelectField
            label="Status *"
            value={formData.status}
            options={statusOptions}
            onChange={(value) => setFormData(prev => ({ ...prev, status: value as AnimalStatus }))}
          />

          <View style={styles.weightContainer}>
            <View style={styles.weightInput}>
              <Input
                label="Weight *"
                value={formData.weight}
                onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
                placeholder="0.0"
                keyboardType="numeric"
              />
            </View>
            <SelectField
              label="Unit"
              value={formData.weightUnit}
              options={weightUnitOptions}
              onChange={(value) => setFormData(prev => ({ ...prev, weightUnit: value }))}
              containerStyle={styles.unitInput}
            />
          </View>

          <Input
            label="Current Price"
            value={formData.price}
            onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <Input
            label="Acquisition Price"
            value={formData.acquisitionPrice}
            onChangeText={(text) => setFormData(prev => ({ ...prev, acquisitionPrice: text }))}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <Input
            label="Notes"
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Additional notes about the animal"
            multiline
            numberOfLines={4}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Update Animal"
              onPress={handleUpdateAnimal}
              loading={isLoading}
              style={styles.submitButton}
            />
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  form: {
    padding: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerStyle: {
    height: 50,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
  },
  weightContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  weightInput: {
    flex: 2,
  },
  weightUnit: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  submitButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 20,
  },
  radioContainer: {
    flexDirection: "row",
    gap: 12,
  },
  radioOption: {
    padding: 8,
    borderWidth: 2,
    borderRadius: 8,
  },
  radioSelected: {
  },
  radioButton: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioText: {
    fontSize: 16,
  },
  unitInput: {
    flex: 1,
  },
});
