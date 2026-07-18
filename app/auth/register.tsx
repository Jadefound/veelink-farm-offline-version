import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { User, Fingerprint, ArrowRight, CheckCircle } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { FARM_LOGO_BASE64 } from "@/assets/images/farm-logo";

type OnboardingStep = "profile" | "biometric";

const OnboardingScreen = () => {
  const router = useRouter();
  const {
    completeFirstRunOnboarding,
    checkBiometricSupport,
    verifyBiometric,
    isBiometricSupported,
    biometricTypes,
    isLoading,
    error,
  } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>("profile");
  const [userName, setUserName] = useState("");
  const [nameError, setNameError] = useState("");
  const [useBiometric, setUseBiometric] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);

  const colors = isDarkMode ? Colors.dark : Colors.light;

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const hasFingerprint = biometricTypes.includes(1);

  const handleProfileContinue = () => {
    const trimmedName = userName.trim();
    if (!trimmedName) {
      setNameError("Please enter your name");
      return;
    }
    if (trimmedName.length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    setNameError("");
    setCurrentStep("biometric");
  };

  const handleEnableBiometric = async () => {
    const success = await verifyBiometric();
    if (success) {
      setUseBiometric(true);
      setBiometricVerified(true);
    } else {
      Alert.alert(
        "Verification Failed",
        "Could not verify your fingerprint. Please try again or skip this step."
      );
    }
  };

  const handleDisableBiometric = () => {
    setUseBiometric(false);
    setBiometricVerified(false);
  };

  const handleFinishOnboarding = async () => {
    try {
      await completeFirstRunOnboarding(userName.trim(), useBiometric);
      router.replace("/farm/add");
    } catch {
      Alert.alert("Error", "Failed to complete setup. Please try again.");
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, { backgroundColor: colors.tint }]}>
        {currentStep === "biometric" ? (
          <CheckCircle size={16} color="white" />
        ) : (
          <Text style={styles.stepNumber}>1</Text>
        )}
      </View>
      <View
        style={[
          styles.stepLine,
          { backgroundColor: currentStep === "biometric" ? colors.tint : colors.muted },
        ]}
      />
      <View
        style={[
          styles.stepDot,
          { backgroundColor: currentStep === "biometric" ? colors.tint : colors.muted },
        ]}
      >
        <Text style={styles.stepNumber}>2</Text>
      </View>
    </View>
  );

  const renderProfileStep = () => (
    <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Welcome to Veelink Farm
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
        Let's get to know you. What should we call you?
      </Text>

      <Input
        label="Your Name"
        placeholder="Enter your name"
        value={userName}
        onChangeText={(text) => {
          setUserName(text);
          if (nameError) setNameError("");
        }}
        leftIcon={<User size={20} color={colors.muted} />}
        error={nameError}
        autoCapitalize="words"
        autoFocus
      />

      <Button
        title="Continue"
        onPress={handleProfileContinue}
        fullWidth
        style={styles.continueButton}
        rightIcon={<ArrowRight size={20} color="white" />}
      />
    </View>
  );

  const renderBiometricStep = () => (
    <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Secure Your App
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.muted }]}>
        {isBiometricSupported && hasFingerprint
          ? "Would you like to use your fingerprint to unlock the app?"
          : "Fingerprint authentication is not available on this device."}
      </Text>

      {isBiometricSupported && hasFingerprint && (
        <View style={styles.biometricSection}>
          <View
            style={[
              styles.biometricIconContainer,
              { backgroundColor: useBiometric ? colors.tint + "20" : colors.border + "40" },
            ]}
          >
            <Fingerprint
              size={64}
              color={useBiometric ? colors.tint : colors.muted}
            />
          </View>

          {biometricVerified ? (
            <View style={styles.verifiedContainer}>
              <CheckCircle size={24} color={colors.success} />
              <Text style={[styles.verifiedText, { color: colors.success }]}>
                Fingerprint enabled
              </Text>
              <TouchableOpacity onPress={handleDisableBiometric}>
                <Text style={[styles.disableLink, { color: colors.muted }]}>
                  Disable
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              title="Enable Fingerprint"
              onPress={handleEnableBiometric}
              variant="outline"
              style={styles.biometricButton}
              leftIcon={<Fingerprint size={20} color={colors.tint} />}
            />
          )}
        </View>
      )}

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.danger + "20" }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          title="Back"
          onPress={() => setCurrentStep("profile")}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Get Started"
          onPress={handleFinishOnboarding}
          loading={isLoading}
          disabled={isLoading}
          style={styles.finishButton}
          rightIcon={<ArrowRight size={20} color="white" />}
        />
      </View>

      {!useBiometric && isBiometricSupported && hasFingerprint && (
        <Text style={[styles.skipNote, { color: colors.muted }]}>
          You can enable fingerprint later in Settings
        </Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image source={{ uri: FARM_LOGO_BASE64 }} style={styles.logo} />
        </View>

        {renderStepIndicator()}

        {currentStep === "profile" ? renderProfileStep() : renderBiometricStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
  },
  stepDotInactive: {
  },
  stepNumber: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  stepLine: {
    width: 60,
    height: 2,
    marginHorizontal: 8,
  },
  stepLineActive: {
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  continueButton: {
    marginTop: 16,
  },
  biometricSection: {
    alignItems: "center",
    marginVertical: 24,
  },
  biometricIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  biometricButton: {
    minWidth: 200,
  },
  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: "600",
  },
  disableLink: {
    fontSize: 14,
    marginLeft: 8,
    textDecorationLine: "underline",
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
  },
  finishButton: {
    flex: 2,
  },
  skipNote: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
  },
});
