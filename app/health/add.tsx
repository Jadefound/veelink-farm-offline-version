import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { useHealthStore } from "@/store/healthStore";
import { useFarmStore } from "@/store/farmStore";
import { useAnimalStore } from "@/store/animalStore";
import { HealthRecordType } from "@/types";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import FarmSelector from "@/components/FarmSelector";

export default function AddHealthRecordScreen() {
  const { animalId } = useLocalSearchParams<{ animalId?: string }>();
  const router = useRouter();
  
  const { createHealthRecord, isLoading, error } = useHealthStore();
  const { farms, currentFarm, setCurrentFarm } = useFarmStore();
  const { animals, fetchAnimals } = useAnimalStore();
  
  const [selectedAnimalId, setSelectedAnimalId] = useState(animalId || "");
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
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
  
  useEffect(() => {
    if (currentFarm) {
      fetchAnimals(currentFarm.id);
    }
  }, [currentFarm]);
  
  useEffect(() => {
    if (selectedAnimalId && animals.length > 0) {
      const animal = animals.find(a => a.id === selectedAnimalId);
      setSelectedAnimal(animal);
    }
  }, [selectedAnimalId, animals]);
  
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
  
  const handleSelectAnimal = (animal: any) => {
    setSelectedAnimalId(animal.id);
    setSelectedAnimal(animal);
    setShowAnimalPicker(false);
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add Health Record</Text>
        
        {(error || formError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || formError}</Text>
          </View>
        )}
        
        <FarmSelector
          farms={farms}
          selectedFarm={currentFarm}
          onSelectFarm={setCurrentFarm}
          onAddFarm={() => router.push("/farm/add")}
        />
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Animal *</Text>
          <TouchableOpacity
            style={styles.animalSelector}
            onPress={() => setShowAnimalPicker(true)}
          >
            <Text style={styles.animalSelectorText}>
              {selectedAnimal 
                ? `ID: ${selectedAnimal.identificationNumber} (${selectedAnimal.species})`
                : "Select an animal"
              }
            </Text>
            <ChevronDown size={20} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
        
        <Input
          label="Record Type *"
          placeholder="e.g., Vaccination, Treatment, Checkup"
          value={type}
          onChangeText={(text) => setType(text as HealthRecordType)}
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
        
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={styles.button}
          />
          
          <Button
            title="Add Record"
            onPress={handleCreateHealthRecord}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          />
        </View>
      </ScrollView>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAnimalPicker}
        onRequestClose={() => setShowAnimalPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Animal</Text>
              <TouchableOpacity onPress={() => setShowAnimalPicker(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            
            {animals.length > 0 ? (
              <FlatList
                data={animals}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.animalItem,
                      selectedAnimalId === item.id && styles.selectedAnimalItem,
                    ]}
                    onPress={() => handleSelectAnimal(item)}
                  >
                    <Text style={styles.animalId}>ID: {item.identificationNumber}</Text>
                    <Text style={styles.animalDetails}>
                      {item.species} • {item.breed} • {item.gender}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No animals available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: Colors.light.danger + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: Colors.light.text,
    fontWeight: "500",
  },
  animalSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  animalSelectorText: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  closeButton: {
    fontSize: 16,
    color: Colors.light.tint,
  },
  animalItem: {
    paddingVertical: 12,
  },
  selectedAnimalItem: {
    backgroundColor: Colors.light.tint + "10",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  animalId: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 4,
  },
  animalDetails: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.muted,
  },
});