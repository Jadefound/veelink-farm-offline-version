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
import { TransactionType, TransactionCategory } from "@/types";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import FarmSelector from "@/components/FarmSelector";

export default function AddTransactionScreen() {
  const router = useRouter();
  const { createTransaction, isLoading, error } = useFinancialStore();
  const { farms, currentFarm, setCurrentFarm } = useFarmStore();
  
  const [type, setType] = useState<TransactionType>("Expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Feed");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [formError, setFormError] = useState("");
  
  useEffect(() => {
    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);
  
  const handleCreateTransaction = async () => {
    if (!currentFarm) {
      setFormError("Please select a farm");
      return;
    }
    
    // Validate form
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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add Transaction</Text>
        <Text style={styles.subtitle}>Record a financial transaction for your farm</Text>
        
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
        
        <View style={styles.formContainer}>
          <Input
            label="Transaction Type *"
            placeholder="Income or Expense"
            value={type}
            onChangeText={(text) => setType(text as TransactionType)}
          />
          
          <Input
            label="Amount *"
            placeholder="Enter amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          
          <Input
            label="Category *"
            placeholder="e.g., Feed, Medication, Sales"
            value={category}
            onChangeText={(text) => setCategory(text as TransactionCategory)}
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
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    marginBottom: 24,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: Colors.light.danger + "15",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.danger,
  },
  errorText: {
    color: Colors.light.danger,
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
});