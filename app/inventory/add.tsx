import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInventoryStore } from '@/store/inventoryStore';
import { useFarmStore } from '@/store/farmStore';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';
import Input from '@/components/Input';
import Button from '@/components/Button';
import SelectField from '@/components/SelectField';
import DatePickerField from '@/components/DatePickerField';
import TopNavigation from '@/components/TopNavigation';
import { formatCurrency } from '@/utils/helpers';

const CATEGORIES = ['Feed', 'Medicine', 'Equipment', 'Supplement'] as const;
const UNITS = ['kg', 'g', 'L', 'mL', 'pcs', 'bags', 'bottles', 'boxes'] as const;

export default function AddInventoryScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { addItem } = useInventoryStore();
  const { currentFarm } = useFarmStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [cost, setCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!currentFarm) {
      setError('Please select a farm first');
      return;
    }
    if (!name || !category || !quantity || !unit) {
      setError('Please fill in all required fields');
      return;
    }

    const qtyNum = parseFloat(quantity);
    const minNum = parseFloat(minimumStock) || 0;
    const costNum = parseFloat(cost) || 0;

    if (isNaN(qtyNum) || qtyNum < 0) {
      setError('Please enter a valid quantity');
      return;
    }

    try {
      await addItem({
        farmId: currentFarm.id,
        name,
        category: category as any,
        quantity: qtyNum,
        unit,
        minimumStock: minNum,
        cost: costNum,
        supplier: supplier || undefined,
        expiryDate: expiryDate || undefined,
      });
      Alert.alert('Success', 'Inventory item added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setError(e.message || 'Failed to add item');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>Add Inventory Item</Text>

          <Input
            label="Item Name *"
            placeholder="e.g. Cattle Feed, Vaccines"
            value={name}
            onChangeText={setName}
          />

          <SelectField
            label="Category *"
            value={category}
            options={[...CATEGORIES]}
            onChange={setCategory}
          />

          <View style={styles.row}>
            <Input
              label="Quantity *"
              placeholder="0"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              containerStyle={styles.halfInput}
            />
            <SelectField
              label="Unit *"
              value={unit}
              options={[...UNITS]}
              onChange={setUnit}
              containerStyle={styles.halfInput}
            />
          </View>

          <View style={styles.row}>
            <Input
              label="Min Stock"
              placeholder="0"
              keyboardType="numeric"
              value={minimumStock}
              onChangeText={setMinimumStock}
              containerStyle={styles.halfInput}
            />
            <Input
              label="Cost"
              placeholder="0"
              keyboardType="numeric"
              value={cost}
              onChangeText={setCost}
              containerStyle={styles.halfInput}
            />
          </View>

          <DatePickerField
            label="Expiry Date"
            value={expiryDate}
            onChange={setExpiryDate}
            placeholder="Optional"
          />

          <Input
            label="Supplier"
            placeholder="Optional"
            value={supplier}
            onChangeText={setSupplier}
          />

          {error ? (
            <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
          ) : null}

          {cost && parseFloat(cost) > 0 ? (
            <Text style={[styles.costPreview, { color: colors.muted }]}>
              Total value: {formatCurrency(parseFloat(cost) * (parseFloat(quantity) || 0))}
            </Text>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button
              title="Add Item"
              onPress={handleSave}
              style={styles.submitButton}
            />
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  error: { fontSize: 14, marginBottom: 12 },
  costPreview: { fontSize: 14, marginBottom: 16 },
  buttonContainer: { flexDirection: 'row', gap: 16, marginTop: 8 },
  submitButton: { flex: 1 },
  cancelButton: { flex: 1 },
});