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

export default function AddFarmScreen() {
  const router = useRouter();
  const { createFarm, isLoading, error } = useFarmStore();
  
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [sizeUnit, setSizeUnit] = useState("acres");
  const [type, setType] = useState("");
  const [formError, setFormError] = useState("");
  
  const handleCreateFarm = async () => {
    // Validate form
    if (!name || !location || !size || !type) {
      setFormError("Please fill in all required fields");
      return;
    }
    
    setFormError("");
    
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
        />
        
        <Input
          label="Location *"
          placeholder="Enter farm location"
          value={location}
          onChangeText={setLocation}
        />
        
        <View style={styles.row}>
          <Input
            label="Size *"
            placeholder="Enter size"
            keyboardType="numeric"
            value={size}
            onChangeText={setSize}
            containerStyle={styles.sizeInput}
          />
          
          <Input
            label="Unit"
            placeholder="Unit"
            value={sizeUnit}
            onChangeText={setSizeUnit}
            containerStyle={styles.unitInput}
          />
        </View>
        
        <Input
          label="Farm Type *"
          placeholder="e.g., Dairy, Livestock, Mixed"
          value={type}
          onChangeText={setType}
        />
        
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
});