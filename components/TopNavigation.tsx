import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ChevronDown, User, Plus } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { Farm } from "@/types";
import Colors from "@/constants/colors";
import Card from "./Card";

export default function TopNavigation() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { farms, currentFarm, setCurrentFarm } = useFarmStore();
  const { isDarkMode } = useThemeStore();
  const [showFarmSelector, setShowFarmSelector] = useState(false);
  
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const handleFarmSelect = (farm: Farm) => {
    setCurrentFarm(farm);
    setShowFarmSelector(false);
  };

  const handleAddFarm = () => {
    setShowFarmSelector(false);
    router.push("/farm/add");
  };

  const handleProfilePress = () => {
    router.push("/(tabs)/settings");
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.leftSection}>
          <Text style={[styles.welcomeText, { color: colors.muted }]}>Welcome</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "User"}</Text>
        </View>

        <View style={styles.rightSection}>
          {farms.length > 0 && (
            <TouchableOpacity
              style={[styles.farmSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowFarmSelector(true)}
            >
              <Text style={[styles.farmName, { color: colors.text }]} numberOfLines={1}>
                {currentFarm?.name || "Select Farm"}
              </Text>
              <ChevronDown size={16} color={colors.muted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: colors.tint }]}
            onPress={handleProfilePress}
          >
            <User size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showFarmSelector}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFarmSelector(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFarmSelector(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Farm</Text>
            
            <FlatList
              data={farms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.farmOption,
                    { borderBottomColor: colors.border },
                    currentFarm?.id === item.id && { backgroundColor: colors.surface }
                  ]}
                  onPress={() => handleFarmSelect(item)}
                >
                  <Text style={[styles.farmOptionName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.farmOptionDetails, { color: colors.muted }]}>
                    {item.type} • {item.location}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[styles.addFarmButton, { backgroundColor: colors.tint }]}
              onPress={handleAddFarm}
            >
              <Plus size={20} color="white" />
              <Text style={styles.addFarmText}>Add New Farm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  leftSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  farmSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 140,
  },
  farmName: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
    flex: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxHeight: "60%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  farmOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  farmOptionName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  farmOptionDetails: {
    fontSize: 14,
  },
  addFarmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addFarmText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});