import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  Info,
  Shield,
  Moon,
  FileBarChart,
  Database,
  Trash2,
  Fingerprint,
  Eraser,
  RotateCcw,
  Camera,
  Pencil,
  Phone,
  Mail,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useFarmStore } from "@/store/farmStore";
import { useAnimalStore } from "@/store/animalStore";
import { useFinancialStore } from "@/store/financialStore";
import { useHealthStore } from "@/store/healthStore";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import { clearAllData } from "@/utils/mockData";
import { useResponsive } from "@/hooks/useResponsive";

export default function SettingsScreen() {
  const router = useRouter();
  const {
    user,
    authSettings,
    isBiometricSupported,
    updateAuthSettings,
    updateProfile,
    verifyBiometric,
    resetApp,
  } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const { isTablet, maxContentWidth } = useResponsive();

  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editProfileImage, setEditProfileImage] = useState(user?.profileImage || "");
  const [isSaving, setIsSaving] = useState(false);

  const openEditProfile = () => {
    setEditName(user?.name || "");
    setEditEmail(user?.email || "");
    setEditPhone(user?.phone || "");
    setEditProfileImage(user?.profileImage || "");
    setIsEditProfileVisible(true);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setEditProfileImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Validation", "Name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        profileImage: editProfileImage,
      });
      setIsEditProfileVisible(false);
    } catch {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  const { fetchFarms, resetStore: resetFarmStore, clearDemoData: clearDemoFarms } = useFarmStore();
  const { fetchAnimals, resetStore: resetAnimalStore, clearDemoData: clearDemoAnimals } = useAnimalStore();
  const { fetchTransactions, resetStore: resetFinancialStore, clearDemoData: clearDemoTransactions } = useFinancialStore();
  const { fetchHealthRecords, resetStore: resetHealthStore, clearDemoData: clearDemoHealthRecords } = useHealthStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  const handleToggleBiometric = async () => {
    if (authSettings.useBiometric) {
      await updateAuthSettings({ useBiometric: false, biometricEnabled: false });
      Alert.alert("Fingerprint Disabled", "You will no longer need fingerprint to unlock the app.");
    } else {
      const success = await verifyBiometric();
      if (success) {
        await updateAuthSettings({ useBiometric: true, biometricEnabled: true });
        Alert.alert("Fingerprint Enabled", "You will need to use fingerprint to unlock the app.");
      } else {
        Alert.alert("Verification Failed", "Could not verify your fingerprint.");
      }
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      "Reset App",
      "This will delete ALL your data and return to the initial setup. This cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetApp();
            await AsyncStorage.removeItem("demoDataEnabled");
            resetFarmStore();
            resetAnimalStore();
            resetFinancialStore();
            resetHealthStore();
            router.replace("/auth/register");
          },
        },
      ]
    );
  };

  const handleLoadMockData = () => {
    Alert.alert(
      "Load Demo Data",
      "WARNING: This will erase ALL existing data and replace it with sample farms, animals, transactions, and health records. This cannot be undone. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Erase & Load",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await clearAllData();
              if (!success) throw new Error("Failed to clear existing data");

              await AsyncStorage.setItem("demoDataEnabled", "1");

              // Reset in-memory store state so next fetch uses latest mock data
              resetFarmStore();
              resetAnimalStore();
              resetFinancialStore();
              resetHealthStore();

              await Promise.allSettled([
                fetchFarms(),
                fetchAnimals(),
                fetchTransactions(),
                fetchHealthRecords(),
              ]);

              Alert.alert(
                "Success",
                "Demo data reloaded successfully!"
              );
            } catch (error) {
              Alert.alert(
                "Error",
                `Failed to load mock data: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "⚠️ WARNING: This will permanently delete ALL your data including farms, animals, transactions, and health records. This action cannot be undone!",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All Data",
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
              // Also reset in-memory store state so the app is empty immediately
              resetFarmStore();
              resetAnimalStore();
              resetFinancialStore();
              resetHealthStore();
              Alert.alert("Success", "All data cleared successfully!");
            } else {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleClearDemoData = () => {
    Alert.alert(
      "Clear Demo Data",
      "This will remove only demo/sample data (farms, animals, transactions, health records) while keeping any data you created yourself. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Demo Data",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("demoDataEnabled");
              clearDemoFarms();
              clearDemoAnimals();
              clearDemoTransactions();
              clearDemoHealthRecords();
              Alert.alert("Success", "Demo data cleared successfully! Your own data is untouched.");
            } catch (error) {
              Alert.alert("Error", "Failed to clear demo data. Please try again.");
            }
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: <User size={20} color={colors.text} />,
          title: "Edit Profile",
          onPress: openEditProfile,
        },
        ...(isBiometricSupported
          ? [
              {
                icon: <Fingerprint size={20} color={colors.text} />,
                title: "Fingerprint Lock",
                onPress: handleToggleBiometric,
                showSwitch: true,
                switchValue: authSettings.useBiometric,
              },
            ]
          : []),
        {
          icon: <Shield size={20} color={colors.text} />,
          title: "Privacy & Security",
          onPress: () =>
            Alert.alert("Privacy", "Privacy settings coming soon"),
        },
      ],
    },
    {
      title: "Reports & Analytics",
      items: [
        {
          icon: <FileBarChart size={20} color={colors.text} />,
          title: "Generate Reports",
          onPress: () => router.push("/reports"),
        },
      ],
    },
    {
      title: "App Preferences",
      items: [
        {
          icon: <Moon size={20} color={colors.text} />,
          title: "Dark Mode",
          onPress: toggleTheme,
          showSwitch: true,
          switchValue: isDarkMode,
        },
      ],
    },
    {
      title: "Data Management",
      items: [
        {
          icon: <Database size={20} color={colors.text} />,
          title: "Load Demo Data",
          onPress: handleLoadMockData,
        },
        {
          icon: <Eraser size={20} color={colors.warning} />,
          title: "Clear Demo Data",
          onPress: handleClearDemoData,
        },
        {
          icon: <Trash2 size={20} color={colors.text} />,
          title: "Clear All Data",
          onPress: handleClearAllData,
        },
        {
          icon: <RotateCcw size={20} color={colors.danger} />,
          title: "Reset App",
          onPress: handleResetApp,
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: <Info size={20} color={colors.text} />,
          title: "About Veelink Farm",
          onPress: () =>
            Alert.alert(
              "About",
              "Veelink Farm is a comprehensive farm animal management app for livestock tracking, health records, and financial management."
            ),
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[
        styles.contentContainer,
        { padding: isTablet ? 28 : 20 },
        maxContentWidth ? { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' } : {},
      ]}>
        <Card style={{ ...styles.profileCard, backgroundColor: colors.card }}>
          <View style={styles.profileInfo}>
            <TouchableOpacity onPress={openEditProfile} style={styles.avatarWrapper}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.profileAvatarImage} />
              ) : (
                <View style={[styles.profileAvatar, { backgroundColor: colors.tint }]}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</Text>
                </View>
              )}
              <View style={[styles.cameraIconBadge, { backgroundColor: colors.tint }]}>
                <Camera size={12} color="white" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || "User"}</Text>
              <View style={styles.profileMetaRow}>
                <Mail size={13} color={colors.muted} />
                <Text style={[styles.profileMeta, { color: colors.muted }]}>{user?.email || "—"}</Text>
              </View>
              {user?.phone ? (
                <View style={styles.profileMetaRow}>
                  <Phone size={13} color={colors.muted} />
                  <Text style={[styles.profileMeta, { color: colors.muted }]}>{user.phone}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={openEditProfile} style={styles.editIconButton}>
              <Pencil size={18} color={colors.tint} />
            </TouchableOpacity>
          </View>
        </Card>

        <Modal visible={isEditProfileVisible} animationType="fade" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>

              <TouchableOpacity onPress={handlePickImage} style={styles.modalAvatarWrapper}>
                {editProfileImage ? (
                  <Image source={{ uri: editProfileImage }} style={styles.modalAvatarImage} />
                ) : (
                  <View style={[styles.modalAvatar, { backgroundColor: colors.tint }]}>
                    <Text style={styles.avatarText}>{editName?.charAt(0)?.toUpperCase() || "U"}</Text>
                  </View>
                )}
                <View style={[styles.cameraIconBadge, styles.cameraIconBadgeLarge, { backgroundColor: colors.tint }]}>
                  <Camera size={14} color="white" />
                </View>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Full Name</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Email</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Phone Number</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+1 234 567 8900"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => setIsEditProfileVisible(false)}
                  disabled={isSaving}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.tint }]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <Card
              style={{ ...styles.sectionCard, backgroundColor: colors.card }}
            >
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && {
                      borderBottomColor: colors.border,
                      borderBottomWidth: 1,
                    },
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingIcon}>{item.icon}</View>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  {"showSwitch" in item && item.showSwitch && (
                    <Switch
                      value={"switchValue" in item ? item.switchValue : false}
                      onValueChange={item.onPress}
                      trackColor={{ false: colors.border, true: colors.tint }}
                      thumbColor={item.switchValue ? "white" : colors.muted}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        <Text style={[styles.versionText, { color: colors.muted }]}>
          Veelink Farm v2.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileCard: {
    marginBottom: 32,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  cameraIconBadgeLarge: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  profileMeta: {
    fontSize: 13,
  },
  editIconButton: {
    padding: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    padding: 0,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    flex: 1,
  },
  versionText: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  modalAvatarWrapper: {
    position: "relative",
    alignSelf: "center",
    marginBottom: 24,
  },
  modalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
