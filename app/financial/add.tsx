import React, { useState, useEffect } from "react";
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

  const [type, setType] = useState<TransactionType>("Expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Feed");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [formError, setFormError] = useState("");

  const typeOptions: TransactionType[] = ["Income", "Expense"];
  const categoryOptions: TransactionCategory[] = [
    "Feed", "Medication", "Equipment", "Veterinary", "Labor", "Sales", "Purchase", "Utilities", "Other"
  ];

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  const handleCreateTransaction = async () => {
    if (!currentFarm) {
      setFormError("Please select a farm");
      return;
    }

    if (!type || !amount || !category || !description || !date) {
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
        type,
        amount: parseFloat(amount),
        category,
        description,
        date,
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
        <Text style={[styles.title, { color: colors.text }]}>Add Transaction</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Record a financial transaction for your farm</Text>

        {(error || formError) && (
          <View style={[styles.errorContainer, { backgroundColor: colors.danger + "15", borderLeftColor: colors.danger }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error || formError}</Text>
          </View>
        )}

        <FarmSelector
          farms={farms}
          selectedFarm={currentFarm}
          onSelectFarm={setCurrentFarm}
          onAddFarm={() => router.push("/farm/add")}
        />

        <View style={styles.formContainer}>
          <SelectField
            label="Transaction Type *"
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
            label="Description *"
            placeholder="Enter transaction description"
            value={description}
            onChangeText={setDescription}
          />

          <Input
            label="Date *"
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />

          <Input
            label="Payment Method"
            placeholder="e.g., Cash, Bank Transfer, Check"
            value={paymentMethod}
            onChangeText={setPaymentMethod}
          />

          <Input
            label="Reference"
            placeholder="Enter reference number or note"
            value={reference}
            onChangeText={setReference}
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
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
});