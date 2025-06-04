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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAnimalStore } from "@/store/animalStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { AnimalSpecies, AnimalStatus, Animal } from "@/types";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import TopNavigation from "@/components/TopNavigation";
import LoadingIndicator from "@/components/LoadingIndicator";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function EditAnimalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAnimal, updateAnimal, isLoading, error } = useAnimalStore();
  const { currentFarm } = useFarmStore();
  const { isDarkMode } = useThemeStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [animal, setAnimal] = useState<Animal | null>(null);
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
  const [loading, setLoading] = useState(true);

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
        Alert.alert("Error", "Animal not found");
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load animal data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (animalData: Animal) => {
    setIdentificationNumber(animalData.identificationNumber);
    setSpecies(animalData.species);
    setBreed(animalData.breed);
    setGender(animalData.gender);
    setBirthDate(animalData.birthDate);
    setAcquisitionDate(animalData.acquisitionDate);
    setStatus(animalData.status);
    setWeight(animalData.weight.toString());
    setWeightUnit(animalData.weightUnit);
    setPrice(animalData.price?.toString() || "");
    setAcquisitionPrice(animalData.acquisitionPrice?.toString() || "");
    setNotes(animalData.notes || "");
  };

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

  const handleUpdateAnimal = async () => {
    if (!animal || !currentFarm) {
      setFormError("Animal or farm data not available");
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

    // Validate weight
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setFormError("Please enter a valid weight");
      return;
    }

    // Validate prices if provided
    let priceNum = undefined;
    let acquisitionPriceNum = undefined;

    if (price) {
      priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        setFormError("Please enter a valid price");
        return;
      }
    }

    if (acquisitionPrice) {
      acquisitionPriceNum = parseFloat(acquisitionPrice);
      if (isNaN(acquisitionPriceNum) || acquisitionPriceNum < 0) {
        setFormError("Please enter a valid acquisition price");
        return;
      }
    }

    // Validate dates
    const birthDateObj = new Date(birthDate);
    const acquisitionDateObj = new Date(acquisitionDate);
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
      identificationNumber,
      species,
      breed,
      gender,
      birthDate,
      acquisitionDate,
      status,
      weight: weightNum,
      weightUnit,
      price: priceNum,
      acquisitionPrice: acquisitionPriceNum,
      notes,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateAnimal(animal.id, updatedAnimal);
      Alert.alert("Success", "Animal updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
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
            value={identificationNumber}
            onChangeText={setIdentificationNumber}
            placeholder="Enter animal ID"
            autoCapitalize="characters"
          />

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Species *</Text>
            <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Picker
                selectedValue={species}
                onValueChange={(itemValue) => setSpecies(itemValue as AnimalSpecies)}
                style={[styles.pickerStyle, { color: colors.text }]}
              >
                {speciesOptions.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
          </View>

          <Input
            label="Breed *"
            value={breed}
            onChangeText={setBreed}
            placeholder="Enter breed"
          />

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Gender *</Text>
            <View style={styles.radioContainer}>
              {["Male", "Female"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.radioOption, gender === option && styles.radioSelected]}
                  onPress={() => setGender(option as "Male" | "Female")}
                >
                  <View style={[styles.radioButton, gender === option && styles.radioButtonSelected, { borderColor: colors.tint }]}>
                    {gender === option && <View style={[styles.radioButtonInner, { backgroundColor: colors.tint }]} />}
                  </View>
                  <Text style={[styles.radioText, { color: colors.text }]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Birth Date *
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setShowBirthDatePicker(true)}
            >
              <Text
                style={[
                  styles.dateText,
                  { color: birthDate ? colors.text : colors.muted },
                ]}
              >
                {birthDate || "Select birth date"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Acquisition Date *
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setShowAcquisitionDatePicker(true)}
            >
              <Text
                style={[
                  styles.dateText,
                  { color: acquisitionDate ? colors.text : colors.muted },
                ]}
              >
                {acquisitionDate || "Select acquisition date"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Status *</Text>
            <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Picker
                selectedValue={status}
                onValueChange={(itemValue) => setStatus(itemValue as AnimalStatus)}
                style={[styles.pickerStyle, { color: colors.text }]}
              >
                {statusOptions.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.weightContainer}>
            <View style={styles.weightInput}>
              <Input
                label="Weight *"
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.pickerContainer, styles.unitInput]}>
              <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
              <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Picker
                  selectedValue={weightUnit}
                  onValueChange={(itemValue) => setWeightUnit(itemValue as string)}
                  style={[styles.pickerStyle, { color: colors.text }]}
                >
                  {weightUnitOptions.map((unit) => (
                    <Picker.Item key={unit} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <Input
            label="Current Price"
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <Input
            label="Acquisition Price"
            value={acquisitionPrice}
            onChangeText={setAcquisitionPrice}
            placeholder="0.00"
            keyboardType="numeric"
          />

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
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

      {showBirthDatePicker && (
        <DateTimePicker
          value={birthDate ? new Date(birthDate) : new Date()}
          mode="date"
          display="default"
          onChange={onBirthDateChange}
          maximumDate={new Date()}
        />
      )}

      {showAcquisitionDatePicker && (
        <DateTimePicker
          value={acquisitionDate ? new Date(acquisitionDate) : new Date()}
          mode="date"
          display="default"
          onChange={onAcquisitionDateChange}
          maximumDate={new Date()}
        />
      )}
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
    borderColor: Colors.light.border,
    borderRadius: 8,
  },
  radioSelected: {
    backgroundColor: Colors.light.surface,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    backgroundColor: Colors.light.tint,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.background,
  },
  radioText: {
    fontSize: 16,
  },
  unitInput: {
    flex: 1,
  },
});
