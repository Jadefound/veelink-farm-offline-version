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
import { useFinancialStore } from "@/store/financialStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { TransactionType, TransactionCategory } from "@/types";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import FarmSelector from "@/components/FarmSelector";
import SelectField from "@/components/SelectField";

export default function AddTransactionScreen() {
  const router = useRouter();

  const { createTransaction, isLoading, error } = useFinancialStore();
  const { farms, currentFarm, setCurrentFarm } = useFarmStore();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<TransactionType>("Expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Feed");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reference, setReference] = useState("");
  const [formError, setFormError] = useState("");

  const typeOptions: TransactionType[] = ["Income", "Expense"];
  const categoryOptions: TransactionCategory[] = [
    "Feed", "Medication", "Equipment", "Veterinary", "Labor", "Sales", "Purchase", "Utilities", "Other"
  ];

  const handleCreateTransaction = async () => {
    if (!currentFarm) {
      setFormError("Please select a farm");
      return;
    }

    if (!date || !type || !amount || !category) {
      setFormError("Please fill in all required fields");
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setFormError("Please enter a valid amount");
      return;
    }

    setFormError("");

    try {
      await createTransaction({
        farmId: currentFarm.id,
        date,
        type,
        amount: parseFloat(amount),
        category,
        description,
        paymentMethod,
        reference,
      });

      router.back();
    } catch (error: any) {
      setFormError(error.message || "Failed to create transaction");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Add New Transaction</Text>

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

        <Input
          label="Date *"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        <SelectField
          label="Type *"
          value={type}
          options={typeOptions}
          onChange={(value) => setType(value as TransactionType)}
        />

        <Input
          label="Amount *"
          placeholder="Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <SelectField
          label="Category *"
          value={category}
          options={categoryOptions}
          onChange={(value) => setCategory(value as TransactionCategory)}
        />

        <Input
          label="Description"
          placeholder="Enter description"
          value={description}
          onChangeText={setDescription}
        />

        <Input
          label="Payment Method"
          placeholder="e.g., Cash, Credit Card, Bank Transfer"
          value={paymentMethod}
          onChangeText={setPaymentMethod}
        />

        <Input
          label="Reference"
          placeholder="Enter reference number or details"
          value={reference}
          onChangeText={setReference}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={styles.button}
          />

          <Button
            title="Add Transaction"
            onPress={handleCreateTransaction}
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
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
});
