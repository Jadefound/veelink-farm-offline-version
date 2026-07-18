import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Animated,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Fingerprint, Lock, KeyRound } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { FARM_LOGO_BASE64 } from "@/assets/images/farm-logo";

type LoginMethod = "biometric" | "password" | "pin";

const LockScreen = () => {
  const router = useRouter();
  const {
    user,
    authSettings,
    isBiometricSupported,
    checkBiometricSupport,
    authenticateWithBiometric,
    authenticateWithPassword,
    authenticateWithPin,
    unlockApp,
    isLoading,
    error,
  } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  const [pulseAnim] = useState(new Animated.Value(1));
  const [attemptFailed, setAttemptFailed] = useState(false);
  const [biometricCheckDone, setBiometricCheckDone] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod | null>(null);
  const [farmName, setFarmName] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");

  const colors = isDarkMode ? Colors.dark : Colors.light;
  const shouldUseBiometric = authSettings.useBiometric && isBiometricSupported;

  useEffect(() => {
    checkBiometricSupport().finally(() => setBiometricCheckDone(true));
  }, []);

  useEffect(() => {
    if (!biometricCheckDone) return;
    if (!shouldUseBiometric) {
      // No biometric: default to password login
      setLoginMethod("password");
    }
  }, [biometricCheckDone, shouldUseBiometric]);

  useEffect(() => {
    if (shouldUseBiometric && loginMethod === null) {
      startPulseAnimation();
      handleBiometricUnlock();
    }
  }, [shouldUseBiometric, loginMethod]);

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

  const handlePasswordLogin = async () => {
    setLoginError("");
    if (!farmName || !password) {
      setLoginError("Please enter your farm name and password");
      return;
    }
    try {
      await authenticateWithPassword(farmName, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setLoginError(e.message || "Invalid farm name or password");
    }
  };

  const handlePinLogin = async () => {
    setLoginError("");
    if (!pin) {
      setLoginError("Please enter your PIN");
      return;
    }
    try {
      await authenticateWithPin(pin);
      router.replace("/(tabs)");
    } catch (e: any) {
      setLoginError(e.message || "Invalid PIN");
    }
  };

  if (!biometricCheckDone) return null;

  // Password/PIN login form
  if (loginMethod === "password" || loginMethod === "pin") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.formContent}>
          <Image source={{ uri: FARM_LOGO_BASE64 }} style={styles.logo} />

          <Text style={[styles.greeting, { color: colors.muted }]}>Welcome back</Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || "Farmer"}
          </Text>

          {loginError ? (
            <View style={[styles.errorBox, { backgroundColor: colors.danger + "20" }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{loginError}</Text>
            </View>
          ) : null}

          {loginMethod === "password" ? (
            <>
              <Input
                label="Farm Name"
                placeholder="Enter your farm name"
                value={farmName}
                onChangeText={setFarmName}
                leftIcon={<Lock size={20} color={colors.muted} />}
                autoCapitalize="words"
              />
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Lock size={20} color={colors.muted} />}
              />
              <Button
                title="Login"
                onPress={handlePasswordLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
              />
            </>
          ) : (
            <>
              <Input
                label="PIN"
                placeholder="Enter your PIN"
                value={pin}
                onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                secureTextEntry
                leftIcon={<KeyRound size={20} color={colors.muted} />}
              />
              <Button
                title="Unlock"
                onPress={handlePinLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
              />
            </>
          )}

          {/* Switch between login methods */}
          <View style={styles.methodSwitchRow}>
            {shouldUseBiometric && (
              <TouchableOpacity onPress={() => { setLoginMethod(null); setLoginError(""); }}>
                <Text style={[styles.switchLink, { color: colors.tint }]}>Use Fingerprint</Text>
              </TouchableOpacity>
            )}
            {loginMethod === "password" && authSettings.usePin && (
              <TouchableOpacity onPress={() => { setLoginMethod("pin"); setLoginError(""); }}>
                <Text style={[styles.switchLink, { color: colors.tint }]}>Use PIN</Text>
              </TouchableOpacity>
            )}
            {loginMethod === "pin" && (
              <TouchableOpacity onPress={() => { setLoginMethod("password"); setLoginError(""); }}>
                <Text style={[styles.switchLink, { color: colors.tint }]}>Use Password</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Biometric login screen
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Image source={{ uri: FARM_LOGO_BASE64 }} style={styles.logo} />

        <Text style={[styles.greeting, { color: colors.muted }]}>Welcome back</Text>
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

        <TouchableOpacity
          onPress={() => { setLoginMethod(authSettings.usePin ? "pin" : "password"); setAttemptFailed(false); }}
        >
          <Text style={[styles.fallbackLink, { color: colors.muted }]}>
            Use {authSettings.usePin ? "PIN" : "Password"} instead
          </Text>
        </TouchableOpacity>
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
  formContent: {
    width: "100%",
    maxWidth: 360,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 24,
    alignSelf: "center",
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: "center",
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 40,
    textAlign: "center",
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
  errorBox: {
    padding: 12,
    borderRadius: 8,
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
  loginButton: {
    marginTop: 8,
    minWidth: 200,
  },
  fallbackLink: {
    fontSize: 15,
    marginTop: 16,
    textDecorationLine: "underline",
  },
  methodSwitchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 20,
  },
  switchLink: {
    fontSize: 15,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
