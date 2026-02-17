import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, FlatList, Platform } from "react-native";
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

  // #region agent log
  useEffect(() => {
    if (showFarmSelector) {
      fetch('http://127.0.0.1:7246/ingest/79193bdc-f2c4-4e7b-8086-16038e987145', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'TopNavigation.tsx:FarmModal', message: 'Farm selector modal opened', data: { cardColor: colors.card, isDarkMode }, timestamp: Date.now(), hypothesisId: 'F' }) }).catch(() => {});
    }
  }, [showFarmSelector, colors.card, isDarkMode]);
  // #endregion

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.leftSection}>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "User"}</Text>
        </View>

        <View style={styles.rightSection}>
          {farms.length > 1 && (
            <TouchableOpacity
              style={[styles.farmSelector, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowFarmSelector(true)}
            >
              <Text style={[styles.farmName, { color: colors.text }]} numberOfLines={1}>
                {currentFarm?.name || "Select"}
              </Text>
              <ChevronDown size={14} color={colors.muted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: colors.tint + "15" }]}
            onPress={handleProfilePress}
          >
            <User size={18} color={colors.tint} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showFarmSelector}
        transparent
        animationType="fade"
        statusBarTranslucent={Platform.OS === "android"}
        onRequestClose={() => setShowFarmSelector(false)}
      >
        <View style={Platform.OS === "android" ? { flex: 1, backgroundColor: "transparent" } : { flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFarmSelector(false)}>
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
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  leftSection: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  farmSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 120,
  },
  farmName: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 4,
    flex: 1,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
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