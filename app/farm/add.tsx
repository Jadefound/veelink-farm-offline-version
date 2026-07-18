import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";

export default function AddFarmScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { createFarm, isLoading, error } = useFarmStore();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  const canGoBack = navigation.canGoBack();

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
      router.replace("/(tabs)");
    } catch (error: any) {
      setFormError(error.message || "Failed to create farm");
    }
  };

  const handleCancel = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Add New Farm</Text>

        {(error || formError) && (
          <View style={[styles.errorContainer, { backgroundColor: colors.danger + "20" }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error || formError}</Text>
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

          <SelectField
            label="Unit"
            value={sizeUnit}
            options={sizeUnits}
            onChange={setSizeUnit}
            containerStyle={styles.unitInput}
          />
        </View>

        <SelectField
          label="Farm Type *"
          value={type}
          options={farmTypes}
          onChange={setType}
          placeholder="Select farm type"
          error={typeError}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={canGoBack ? "Cancel" : "Skip for now"}
            onPress={handleCancel}
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
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
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
    fontWeight: "500",
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
});
