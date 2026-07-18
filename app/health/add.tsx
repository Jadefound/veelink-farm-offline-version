import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useHealthStore } from "@/store/healthStore";
import { useFarmStore } from "@/store/farmStore";
import { useAnimalStore } from "@/store/animalStore";
import { useThemeStore } from "@/store/themeStore";
import { HealthRecordType } from "@/types";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import FarmSelector from "@/components/FarmSelector";
import TopNavigation from "@/components/TopNavigation";
import Card from "@/components/Card";
import SelectField from "@/components/SelectField";

export default function AddHealthRecordScreen() {
  const { animalId } = useLocalSearchParams<{ animalId: string }>();
  const router = useRouter();

  const { createHealthRecord, isLoading, error } = useHealthStore();
  const { farms, currentFarm, setCurrentFarm } = useFarmStore();
  const { animals, fetchAnimals } = useAnimalStore();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [selectedAnimalId, setSelectedAnimalId] = useState(animalId || "");
  const [type, setType] = useState<HealthRecordType>("Checkup");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [veterinarian, setVeterinarian] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const healthRecordTypes: HealthRecordType[] = [
    "Vaccination",
    "Treatment",
    "Checkup",
    "Surgery",
    "Medication",
    "Other",
  ];
  const farmAnimals = useMemo(
    () => (currentFarm ? animals.filter((animal) => animal.farmId === currentFarm.id) : []),
    [animals, currentFarm?.id]
  );

  const animalOptions = useMemo(
    () => farmAnimals.map((animal) => ({
      label: `ID: ${animal.identificationNumber} (${animal.species})`,
      value: animal.id,
    })),
    [farmAnimals]
  );

  useEffect(() => {
    if (currentFarm) {
      fetchAnimals(currentFarm.id);
    }
  }, [currentFarm?.id, fetchAnimals]);

  useEffect(() => {
    if (!selectedAnimalId) return;
    const stillExists = farmAnimals.some((item) => item.id === selectedAnimalId);
    if (!stillExists) {
      setSelectedAnimalId("");
    }
  }, [selectedAnimalId, farmAnimals]);

  const handleCreateHealthRecord = async () => {
    if (!currentFarm) {
      setFormError("Please select a farm");
      return;
    }

    if (!selectedAnimalId) {
      setFormError("Please select an animal");
      return;
    }

    // Validate form
    if (!type || !date || !description) {
      setFormError("Please fill in all required fields");
      return;
    }

    setFormError("");

    try {
      await createHealthRecord({
        farmId: currentFarm.id,
        animalId: selectedAnimalId,
        type,
        date,
        description,
        diagnosis,
        treatment,
        medication,
        dosage,
        veterinarian,
        cost: parseFloat(cost) || 0,
        notes,
      });

      router.back();
    } catch (error: any) {
      setFormError(error.message || "Failed to create health record");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Card style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Add Health Record
          </Text>

          {(error || formError) && (
            <View style={[styles.errorContainer, { backgroundColor: colors.danger + "20" }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error || formError}</Text>
            </View>
          )}

          <FarmSelector
            farms={farms}
            selectedFarm={currentFarm}
            onSelectFarm={setCurrentFarm}
            onAddFarm={() => router.push("/farm/add")}
          />

          <SelectField
            label="Animal *"
            value={selectedAnimalId}
            options={animalOptions}
            onChange={setSelectedAnimalId}
            placeholder="Select an animal"
            emptyText="No animals available for this farm"
          />

          <SelectField
            label="Record Type *"
            value={type}
            options={healthRecordTypes}
            onChange={(value) => setType(value as HealthRecordType)}
          />

          <Input
            label="Date *"
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />

          <Input
            label="Description *"
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
          />

          <Input
            label="Diagnosis"
            placeholder="Enter diagnosis"
            value={diagnosis}
            onChangeText={setDiagnosis}
          />

          <Input
            label="Treatment"
            placeholder="Enter treatment"
            value={treatment}
            onChangeText={setTreatment}
          />

          <Input
            label="Medication"
            placeholder="Enter medication"
            value={medication}
            onChangeText={setMedication}
          />

          <Input
            label="Dosage"
            placeholder="Enter dosage"
            value={dosage}
            onChangeText={setDosage}
          />

          <Input
            label="Veterinarian"
            placeholder="Enter veterinarian name"
            value={veterinarian}
            onChangeText={setVeterinarian}
          />

          <Input
            label="Cost"
            placeholder="Enter cost"
            keyboardType="numeric"
            value={cost}
            onChangeText={setCost}
          />

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
        </Card>

        <View style={styles.actionsContainer}>
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={styles.actionButton}
          />

          <Button
            title="Save"
            onPress={handleCreateHealthRecord}
            variant="primary"
            style={styles.actionButton}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
});