import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Animated } from "react-native";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react-native";
import { useToastStore, ToastType } from "@/store/toastStore";
import Colors from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

function ToastItem({ toast }: { toast: { id: string; message: string; type: ToastType } }) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { dismiss } = useToastStore();
  const Icon = ICONS[toast.type];

  const colorMap: Record<ToastType, string> = {
    success: colors.success,
    error: colors.danger,
    info: colors.info,
    warning: colors.warning,
  };

  const accentColor = colorMap[toast.type];

  return (
    <View
      style={[
        styles.toast,
        {
          backgroundColor: colors.card,
          borderLeftColor: accentColor,
          shadowColor: "#000",
        },
      ]}
    >
      <Icon size={20} color={accentColor} />
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={3}>
        {toast.message}
      </Text>
      <TouchableOpacity
        onPress={() => dismiss(toast.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={16} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

export default function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});
