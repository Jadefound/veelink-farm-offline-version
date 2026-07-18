import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  ViewStyle,
} from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label?: string;
  value: string;
  options: string[] | SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  title?: string;
  emptyText?: string;
  containerStyle?: ViewStyle;
  testID?: string;
}

const normalizeOptions = (options: string[] | SelectOption[]): SelectOption[] =>
  options.map(option =>
    typeof option === "string" ? { label: option, value: option } : option
  );

// Themed replacement for the native @react-native-picker/picker <Picker>,
// which renders as an inline wheel on iOS, an OS-styled menu on Android, and
// an unstyled <select> on web — three different looks, none matching the
// app's design system. This always renders as a tap-to-open bottom sheet.
export default function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  error,
  title,
  emptyText = "No options available",
  containerStyle,
  testID,
}: SelectFieldProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [visible, setVisible] = useState(false);

  const normalized = normalizeOptions(options);
  const selected = normalized.find(option => option.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.field,
          { borderColor: error ? colors.danger : colors.border, backgroundColor: colors.card },
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
      >
        <Text
          style={[styles.fieldText, { color: selected ? colors.text : colors.muted }]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={20} color={colors.muted} />
      </TouchableOpacity>

      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>{title || label || "Select"}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} accessibilityRole="button" accessibilityLabel="Close">
                <Text style={[styles.closeText, { color: colors.tint }]}>Close</Text>
              </TouchableOpacity>
            </View>

            {normalized.length > 0 ? (
              <FlatList
                data={normalized}
                keyExtractor={item => item.value}
                renderItem={({ item }) => {
                  const isSelected = item.value === value;
                  return (
                    <TouchableOpacity
                      style={[styles.option, isSelected && { backgroundColor: colors.tint + "15" }]}
                      onPress={() => {
                        onChange(item.value);
                        setVisible(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <Text style={[styles.optionText, { color: colors.text }]}>{item.label}</Text>
                      {isSelected && <Check size={18} color={colors.tint} />}
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.muted }]}>{emptyText}</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fieldText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeText: {
    fontSize: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
  separator: {
    height: 1,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
  },
});
