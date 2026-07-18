import { Alert, AlertButton, Platform } from "react-native";

/**
 * Drop-in replacement for Alert.alert that also works on web.
 * React Native Web ignores multi-button Alert.alert (confirmations never fire),
 * so on web we map to window.confirm / window.alert and invoke the matching callback.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = [title, message].filter(Boolean).join("\n\n");

  if (!buttons || buttons.length <= 1) {
    if (typeof window !== "undefined") window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  const confirmBtn =
    buttons.find((b) => b.style !== "cancel") ?? buttons[buttons.length - 1];
  const cancelBtn = buttons.find((b) => b.style === "cancel");

  const confirmed =
    typeof window !== "undefined" ? window.confirm(text) : true;

  if (confirmed) {
    confirmBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
