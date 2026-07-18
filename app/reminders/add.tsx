import React, { useState } from "react";
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
import { useReminderStore, ReminderType } from "@/store/reminderStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { useToastStore } from "@/store/toastStore";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";
import DatePickerField from "@/components/DatePickerField";
import TopNavigation from "@/components/TopNavigation";
import { CheckCircle } from "lucide-react-native";

const REMINDER_TYPES: ReminderType[] = [
  "vaccination", "health_checkup", "feeding", "breeding", "inventory_restock", "custom",
];

export default function AddReminderScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { createReminder } = useReminderStore();
  const { currentFarm } = useFarmStore();
  const { show } = useToastStore();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!currentFarm) {
      setError("Please select a farm first");
      return;
    }
    if (!title || !type || !dueDate) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      await createReminder({
        farmId: currentFarm.id,
        title,
        type: type as ReminderType,
        dueDate,
        recurring,
        recurringDays: recurring ? parseInt(recurringDays) || 0 : undefined,
        notes: notes || undefined,
      });
      show("Reminder added successfully", "success");
      router.back();
    } catch (e: any) {
      setError(e.message || "Failed to add reminder");
      show("Failed to add reminder", "error");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>Add Reminder</Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.danger + "20" }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Title *"
            placeholder="e.g. Cattle vaccination booster"
            value={title}
            onChangeText={setTitle}
          />

          <SelectField
            label="Type *"
            value={type}
            options={[...REMINDER_TYPES]}
            onChange={setType}
            placeholder="Select reminder type"
          />

          <DatePickerField
            label="Due Date *"
            value={dueDate}
            onChange={setDueDate}
            placeholder="Select date"
          />

          <Input
            label="Notes"
            placeholder="Additional details (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          {/* Recurring toggle */}
          <TouchableOpacity
            style={styles.recurringRow}
            onPress={() => setRecurring(!recurring)}
          >
            <View style={[styles.checkbox, { borderColor: recurring ? colors.tint : colors.border, backgroundColor: recurring ? colors.tint : "transparent" }]}>
              {recurring && <CheckCircle size={16} color="white" />}
            </View>
            <Text style={[styles.recurringText, { color: colors.text }]}>
              Recurring reminder
            </Text>
          </TouchableOpacity>

          {recurring && (
            <Input
              label="Repeat every (days)"
              placeholder="e.g. 30 for monthly"
              keyboardType="numeric"
              value={recurringDays}
              onChangeText={setRecurringDays}
            />
          )}

          <View style={styles.buttonContainer}>
            <Button title="Add Reminder" onPress={handleSave} style={styles.button} />
            <Button title="Cancel" onPress={() => router.back()} variant="outline" style={styles.button} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { fontSize: 14 },
  recurringRow: { flexDirection: "row", alignItems: "center", marginVertical: 12, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  recurringText: { fontSize: 15, flex: 1 },
  buttonContainer: { flexDirection: "row", gap: 16, marginTop: 16 },
  button: { flex: 1 },
});
