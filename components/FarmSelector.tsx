import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Farm } from "@/types";
import Colors from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";

interface FarmSelectorProps {
  farms: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onAddFarm: () => void;
}

export default function FarmSelector({
  farms,
  selectedFarm,
  onSelectFarm,
  onAddFarm,
}: FarmSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  const handleSelectFarm = (farm: Farm) => {
    onSelectFarm(farm);
    toggleModal();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={toggleModal}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorText, { color: colors.text }]} numberOfLines={1}>
          {selectedFarm ? selectedFarm.name : "Select a farm"}
        </Text>
        <ChevronDown size={20} color={colors.text} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        statusBarTranslucent={Platform.OS === "android"}
        onRequestClose={toggleModal}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleModal}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Farm</Text>
                <TouchableOpacity onPress={toggleModal}>
                  <Text style={[styles.closeButton, { color: colors.tint }]}>Close</Text>
                </TouchableOpacity>
              </View>

              {farms.length > 0 ? (
                <FlatList
                  data={farms}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.farmItem,
                        selectedFarm?.id === item.id && [styles.selectedFarmItem, { backgroundColor: colors.tint + "10" }],
                      ]}
                      onPress={() => handleSelectFarm(item)}
                    >
                      <Text style={[styles.farmName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.farmLocation, { color: colors.muted }]}>{item.location}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.muted }]}>No farms available</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.tint }]}
                onPress={() => {
                  toggleModal();
                  onAddFarm();
                }}
              >
                <Text style={styles.addButtonText}>+ Add New Farm</Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    fontSize: 16,
  },
  farmItem: {
    paddingVertical: 12,
  },
  selectedFarmItem: {
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  farmName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  farmLocation: {
    fontSize: 14,
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
  addButton: {
    marginTop: 16,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});