import React, { useState, useEffect, useMemo } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useHealthStore } from "@/store/healthStore";
import { useAnimalStore } from "@/store/animalStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { useToastStore } from "@/store/toastStore";
import { HealthRecordType, HealthRecord } from "@/types";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import TopNavigation from "@/components/TopNavigation";
import LoadingIndicator from "@/components/LoadingIndicator";
import SelectField from "@/components/SelectField";
import DatePickerField from "@/components/DatePickerField";

export default function EditHealthRecordScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const { getHealthRecord, updateHealthRecord, isLoading, error } = useHealthStore();
    const { animals } = useAnimalStore();
    const { currentFarm } = useFarmStore();
    const { isDarkMode } = useThemeStore();
    const { show } = useToastStore();

    const colors = isDarkMode ? Colors.dark : Colors.light;

    const [record, setRecord] = useState<HealthRecord | null>(null);
    const [formData, setFormData] = useState({
        animalId: "",
        type: "Checkup" as HealthRecordType,
        date: "",
        description: "",
        diagnosis: "",
        treatment: "",
        medication: "",
        dosage: "",
        veterinarian: "",
        cost: "",
        notes: "",
    });
    const [formError, setFormError] = useState("");

    const healthRecordTypes: HealthRecordType[] = [
        "Vaccination",
        "Treatment",
        "Checkup",
        "Surgery",
        "Medication",
        "Other"
    ];

    const animalOptions = useMemo(
        () => animals.map((animal) => ({
            label: `${animal.identificationNumber} - ${animal.species}`,
            value: animal.id,
        })),
        [animals]
    );

    useEffect(() => {
        if (id) {
            loadHealthRecord();
        }
    }, [id]);

    const loadHealthRecord = async () => {
        if (!id) return;

        const healthRecord = await getHealthRecord(id);
        if (healthRecord) {
            setRecord(healthRecord);
            setFormData({
                animalId: healthRecord.animalId,
                type: healthRecord.type,
                date: healthRecord.date.split('T')[0], // Format date for input
                description: healthRecord.description,
                diagnosis: healthRecord.diagnosis,
                treatment: healthRecord.treatment,
                medication: healthRecord.medication,
                dosage: healthRecord.dosage,
                veterinarian: healthRecord.veterinarian,
                cost: healthRecord.cost ? healthRecord.cost.toString() : "",
                notes: healthRecord.notes,
            });
        }
    };

    const onDateChange = (dateString: string) => {
        setFormData({ ...formData, date: dateString });
    };

    const handleUpdateRecord = async () => {
        if (!currentFarm || !record) {
            setFormError("Unable to update record");
            return;
        }

        // Validate required fields
        if (!formData.animalId || !formData.type || !formData.date || !formData.description) {
            setFormError("Please fill in all required fields");
            return;
        }

        setFormError("");

        try {
            await updateHealthRecord(record.id, {
                animalId: formData.animalId,
                type: formData.type,
                date: formData.date,
                description: formData.description,
                diagnosis: formData.diagnosis,
                treatment: formData.treatment,
                medication: formData.medication,
                dosage: formData.dosage,
                veterinarian: formData.veterinarian,
                cost: formData.cost ? parseFloat(formData.cost) : 0,
                notes: formData.notes,
            });

            show("Health record updated successfully", "success");
            router.back();
        } catch (error: any) {
            show(error.message || "Failed to update health record", "error");
            setFormError(error.message || "Failed to update health record");
        }
    };

    if (isLoading || !record) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <TopNavigation />
                <LoadingIndicator fullScreen message="Loading health record..." />
            </View>
        );
    }

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
                        Edit Health Record
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.muted }]}>
                        Update the health record information
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
                        <SelectField
                            label="Animal *"
                            value={formData.animalId}
                            options={animalOptions}
                            onChange={(value) => setFormData(prev => ({ ...prev, animalId: value }))}
                            placeholder="Select an animal"
                        />

                        <SelectField
                            label="Type *"
                            value={formData.type}
                            options={healthRecordTypes}
                            onChange={(value) => setFormData(prev => ({ ...prev, type: value as HealthRecordType }))}
                        />

                        <DatePickerField
                            label="Date *"
                            value={formData.date}
                            onChange={onDateChange}
                            placeholder="YYYY-MM-DD"
                            containerStyle={styles.inputContainer}
                        />

                        <Input
                            label="Description *"
                            placeholder="Enter description"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                        />

                        <Input
                            label="Diagnosis"
                            placeholder="Enter diagnosis"
                            multiline
                            numberOfLines={2}
                            textAlignVertical="top"
                            value={formData.diagnosis}
                            onChangeText={(text) => setFormData({ ...formData, diagnosis: text })}
                        />

                        <Input
                            label="Treatment"
                            placeholder="Enter treatment details"
                            multiline
                            numberOfLines={2}
                            textAlignVertical="top"
                            value={formData.treatment}
                            onChangeText={(text) => setFormData({ ...formData, treatment: text })}
                        />

                        <View style={styles.row}>
                            <Input
                                label="Medication"
                                placeholder="Enter medication"
                                value={formData.medication}
                                onChangeText={(text) => setFormData({ ...formData, medication: text })}
                                containerStyle={styles.medicationInput}
                            />

                            <Input
                                label="Dosage"
                                placeholder="Enter dosage"
                                value={formData.dosage}
                                onChangeText={(text) => setFormData({ ...formData, dosage: text })}
                                containerStyle={styles.dosageInput}
                            />
                        </View>

                        <Input
                            label="Veterinarian"
                            placeholder="Enter veterinarian name"
                            value={formData.veterinarian}
                            onChangeText={(text) => setFormData({ ...formData, veterinarian: text })}
                        />

                        <Input
                            label="Cost"
                            placeholder="Enter cost"
                            keyboardType="numeric"
                            value={formData.cost}
                            onChangeText={(text) => setFormData({ ...formData, cost: text })}
                        />

                        <Input
                            label="Notes"
                            placeholder="Enter additional notes"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={formData.notes}
                            onChangeText={(text) => setFormData({ ...formData, notes: text })}
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
                            title="Update Record"
                            onPress={handleUpdateRecord}
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
    row: {
        flexDirection: "row",
        gap: 16,
    },
    medicationInput: {
        flex: 2,
    },
    dosageInput: {
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
}); 