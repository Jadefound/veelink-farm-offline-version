import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";

interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (dateString: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  containerStyle?: ViewStyle;
  testID?: string;
}

const isWeb = Platform.OS === "web";

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  maximumDate,
  minimumDate,
  containerStyle,
  testID = "date-picker",
}: DatePickerFieldProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [showNativePicker, setShowNativePicker] = useState(false);

  if (isWeb) {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
        <View
          style={[
            styles.field,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Calendar size={18} color={colors.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.fieldText, { color: value ? colors.text : colors.muted }]}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            // @ts-expect-error react-native-web TextInput supports HTML input attributes
            type="date"
            max={maximumDate ? maximumDate.toISOString().split("T")[0] : undefined}
            min={minimumDate ? minimumDate.toISOString().split("T")[0] : undefined}
            testID={testID}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.field,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
        onPress={() => setShowNativePicker(true)}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
      >
        <Calendar size={18} color={colors.muted} style={{ marginRight: 8 }} />
        <Text style={{ color: value ? colors.text : colors.muted }}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      {showNativePicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={(_event, selectedDate) => {
            setShowNativePicker(false);
            if (selectedDate) {
              onChange(selectedDate.toISOString().split("T")[0]);
            }
          }}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fieldText: {
    fontSize: 16,
    flex: 1,
    outlineStyle: "none",
  },
});
