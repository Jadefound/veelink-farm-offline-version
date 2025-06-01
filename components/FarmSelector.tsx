import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Farm } from "@/types";
import Colors from "@/constants/colors";

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
        style={styles.selector}
        onPress={toggleModal}
        activeOpacity={0.7}
      >
        <Text style={styles.selectorText} numberOfLines={1}>
          {selectedFarm ? selectedFarm.name : "Select a farm"}
        </Text>
        <ChevronDown size={20} color={Colors.light.text} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleModal}>
          <View style={styles.modalContainer}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Farm</Text>
                <TouchableOpacity onPress={toggleModal}>
                  <Text style={styles.closeButton}>Close</Text>
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
                        selectedFarm?.id === item.id && styles.selectedFarmItem,
                      ]}
                      onPress={() => handleSelectFarm(item)}
                    >
                      <Text style={styles.farmName}>{item.name}</Text>
                      <Text style={styles.farmLocation}>{item.location}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No farms available</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.addButton}
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
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectorText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
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
    color: Colors.light.text,
  },
  closeButton: {
    fontSize: 16,
    color: Colors.light.tint,
  },
  farmItem: {
    paddingVertical: 12,
  },
  selectedFarmItem: {
    backgroundColor: Colors.light.tint + "10", // 10% opacity
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  farmName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 4,
  },
  farmLocation: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.muted,
  },
  addButton: {
    marginTop: 16,
    backgroundColor: Colors.light.tint,
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