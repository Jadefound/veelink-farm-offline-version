import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { LogOut, User, Building2, Info, Shield, Bell, Moon, PawPrint, FileBarChart } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import Card from "@/components/Card";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            await logout();
            router.replace("/auth/login");
          },
          style: "destructive",
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
          title: "Profile",
          onPress: () => Alert.alert("Profile", "Profile settings would go here"),
        },
        {
          icon: <Shield size={20} color={colors.text} />,
          title: "Privacy & Security",
          onPress: () => Alert.alert("Privacy", "Privacy settings would go here"),
        },
      ],
    },
    {
      title: "Animal Management",
      items: [
        {
          icon: <PawPrint size={20} color={colors.text} />,
          title: "Animal Preferences",
          onPress: () => Alert.alert("Animal Settings", "Animal management preferences would go here"),
        },
        {
          icon: <Building2 size={20} color={colors.text} />,
          title: "Farm Settings",
          onPress: () => Alert.alert("Farm Settings", "Farm management settings would go here"),
        },
        {
          icon: <Bell size={20} color={colors.text} />,
          title: "Health Reminders",
          onPress: () => Alert.alert("Reminders", "Set up health care reminders"),
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
      title: "About",
      items: [
        {
          icon: <Info size={20} color={colors.text} />,
          title: "About Veelink Farm",
          onPress: () => Alert.alert("About", "Veelink Farm is a comprehensive farm animal management app for livestock tracking, health records, and financial management."),
        },
      ],
    },
  ];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Card style={{ ...styles.profileCard, backgroundColor: colors.card }}>
          <View style={styles.profileInfo}>
            <View style={[styles.profileAvatar, { backgroundColor: colors.tint }]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) || "U"}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || "User"}</Text>
              <Text style={[styles.profileEmail, { color: colors.muted }]}>{user?.email || "user@example.com"}</Text>
            </View>
          </View>
        </Card>
        
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Card style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingIcon}>{item.icon}</View>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
                  {'showSwitch' in item && item.showSwitch && (
                    <Switch
                      value={'switchValue' in item ? item.switchValue : false}
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
        
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.danger }]} 
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={[styles.versionText, { color: colors.muted }]}>Veelink Farm v2.0.0</Text>
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
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
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
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 15,
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  versionText: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 24,
  },
});