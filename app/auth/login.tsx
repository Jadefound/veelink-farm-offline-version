import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Fingerprint } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import { FARM_LOGO_BASE64 } from "@/assets/images/farm-logo";

const LockScreen = () => {
  const router = useRouter();
  const {
    user,
    authSettings,
    isBiometricSupported,
    checkBiometricSupport,
    authenticateWithBiometric,
    unlockApp,
    isLoading,
    error,
  } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  const [pulseAnim] = useState(new Animated.Value(1));
  const [attemptFailed, setAttemptFailed] = useState(false);
  const [biometricCheckDone, setBiometricCheckDone] = useState(false);

  const colors = isDarkMode ? Colors.dark : Colors.light;
  const shouldUseBiometric = authSettings.useBiometric && isBiometricSupported;

  useEffect(() => {
    checkBiometricSupport().finally(() => setBiometricCheckDone(true));
  }, []);

  // Auto-unlock when biometric is not needed (only after check completes)
  useEffect(() => {
    if (!biometricCheckDone) return;
    if (!shouldUseBiometric) {
      unlockApp();
      router.replace("/(tabs)");
    }
  }, [biometricCheckDone, shouldUseBiometric]);

  // Auto-prompt biometric when it becomes available
  useEffect(() => {
    if (shouldUseBiometric) {
      startPulseAnimation();
      handleBiometricUnlock();
    }
  }, [shouldUseBiometric]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBiometricUnlock = async () => {
    setAttemptFailed(false);
    try {
      await authenticateWithBiometric();
      router.replace("/(tabs)");
    } catch {
      setAttemptFailed(true);
    }
  };

  const handleContinueWithoutBiometric = () => {
    unlockApp();
    router.replace("/(tabs)");
  };

  if (!biometricCheckDone || !shouldUseBiometric) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Image source={{ uri: FARM_LOGO_BASE64 }} style={styles.logo} />

        <Text style={[styles.greeting, { color: colors.muted }]}>
          Welcome back
        </Text>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.name || "Farmer"}
        </Text>

        <Animated.View
          style={[
            styles.fingerprintContainer,
            { backgroundColor: colors.tint + "15", transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Fingerprint size={64} color={colors.tint} />
        </Animated.View>

        <Text style={[styles.instruction, { color: colors.muted }]}>
          Touch the fingerprint sensor to unlock
        </Text>

        {attemptFailed && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error || "Fingerprint not recognized. Try again."}
          </Text>
        )}

        <Button
          title="Try Again"
          onPress={handleBiometricUnlock}
          loading={isLoading}
          disabled={isLoading}
          style={styles.retryButton}
          leftIcon={<Fingerprint size={20} color="white" />}
        />

        <Button
          title="Skip for now"
          onPress={handleContinueWithoutBiometric}
          variant="outline"
          style={styles.skipButton}
          textStyle={{ color: colors.muted }}
        />
      </View>
    </View>
  );
};

export default LockScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 40,
  },
  fingerprintContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  instruction: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 200,
    marginBottom: 12,
  },
  skipButton: {
    minWidth: 200,
  },
});
