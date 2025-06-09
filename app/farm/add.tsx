import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useFarmStore } from "@/store/farmStore";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { Picker } from "@react-native-picker/picker";

export default function AddFarmScreen() {
  const router = useRouter();
  const { createFarm, isLoading, error } = useFarmStore();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [sizeUnit, setSizeUnit] = useState("acres");
  const [type, setType] = useState("");
  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [typeError, setTypeError] = useState("");

  // Farm type options
  const farmTypes = [
    "Dairy",
    "Livestock",
    "Mixed",
    "Poultry",
    "Crop",
    "Aquaculture",
    "Other",
  ];
  // Size unit options
  const sizeUnits = ["acres", "hectares", "square meters", "square feet"];

  const handleCreateFarm = async () => {
    let hasError = false;
    setNameError("");
    setLocationError("");
    setSizeError("");
    setTypeError("");
    setFormError("");

    if (!name) {
      setNameError("Farm name is required");
      hasError = true;
    }
    if (!location) {
      setLocationError("Location is required");
      hasError = true;
    }
    if (!size) {
      setSizeError("Size is required");
      hasError = true;
    } else if (isNaN(parseFloat(size)) || parseFloat(size) <= 0) {
      setSizeError("Size must be a positive number");
      hasError = true;
    }
    if (!type) {
      setTypeError("Farm type is required");
      hasError = true;
    }
    if (hasError) return;

    try {
      await createFarm({
        name,
        location,
        size: parseFloat(size),
        sizeUnit,
        type,
      });
      router.back();
    } catch (error: any) {
      setFormError(error.message || "Failed to create farm");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add New Farm</Text>

        {(error || formError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || formError}</Text>
          </View>
        )}

        <Input
          label="Farm Name *"
          placeholder="Enter farm name"
          value={name}
          onChangeText={setName}
          error={nameError}
        />

        <Input
          label="Location *"
          placeholder="Enter farm location"
          value={location}
          onChangeText={setLocation}
          error={locationError}
        />

        <View style={styles.row}>
          <Input
            label="Size *"
            placeholder="Enter size"
            keyboardType="numeric"
            value={size}
            onChangeText={setSize}
            containerStyle={styles.sizeInput}
            error={sizeError}
          />

          <View style={[styles.unitInput, styles.inputContainer]}>
            <Text style={styles.label}>Unit</Text>
            <View style={[styles.pickerContainer]}>
              <Picker
                selectedValue={sizeUnit}
                onValueChange={(itemValue) => setSizeUnit(itemValue)}
                style={styles.picker}
              >
                {sizeUnits.map((unit) => (
                  <Picker.Item key={unit} label={unit} value={unit} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Farm Type *</Text>
          <View style={[styles.pickerContainer, typeError ? { borderColor: Colors.light.danger, borderWidth: 1 } : {}]}>
            <Picker
              selectedValue={type}
              onValueChange={(itemValue) => setType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select farm type" value="" />
              {farmTypes.map((farmType) => (
                <Picker.Item key={farmType} label={farmType} value={farmType} />
              ))}
            </Picker>
          </View>
          {typeError ? <Text style={{ color: Colors.light.danger, fontSize: 13, marginTop: 4 }}>{typeError}</Text> : null}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={styles.button}
          />

          <Button
            title="Create Farm"
            onPress={handleCreateFarm}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          />
        </View>
      </ScrollView>
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  sizeInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: "white",
  },
  picker: {
    height: 50,
  },
});
