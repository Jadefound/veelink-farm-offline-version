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
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Shield,
  Home,
  Settings
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { FARM_LOGO_BASE64 } from "@/assets/images/farm-logo";

type AuthMethod = 'password' | 'pin' | 'biometric';

const passwordSchema = yup.object().shape({
  farmName: yup.string().required('Farm name is required'),
  password: yup.string().required('Password is required'),
});

const pinSchema = yup.object().shape({
  pin: yup.string().required('PIN is required').length(4, 'PIN must be 4 digits'),
});

interface PasswordFormData {
  farmName: string;
  password: string;
}

interface PinFormData {
  pin: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const {
    authenticateWithPassword,
    authenticateWithPin,
    authenticateWithBiometric,
    authSettings,
    isBiometricSupported,
    biometricTypes,
    isLoading,
    error,
    farmData
  } = useAuthStore();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Form setup
  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      farmName: farmData?.name || '',
      password: '',
    },
  });

  const pinForm = useForm<PinFormData>({
    resolver: yupResolver(pinSchema),
    defaultValues: {
      pin: '',
    },
  });

  useEffect(() => {
    // Auto-fill farm name if available
    if (farmData?.name) {
      passwordForm.setValue('farmName', farmData.name);
    }

    // Set default auth method based on user preferences
    if (authSettings.useBiometric && isBiometricSupported) {
      setAuthMethod('biometric');
      // Auto-trigger biometric authentication
      handleBiometricAuth();
    } else if (authSettings.usePin) {
      setAuthMethod('pin');
    } else {
      setAuthMethod('password');
    }
  }, [farmData, authSettings, isBiometricSupported]);

  const handlePasswordLogin = async (data: PasswordFormData) => {
    try {
      await authenticateWithPassword(data.farmName, data.password);
      router.replace("/(tabs)");
    } catch (error) {
      // Error handled by store
      animateError();
    }
  };

  const handlePinLogin = async (data: PinFormData) => {
    try {
      await authenticateWithPin(data.pin);
      router.replace("/(tabs)");
    } catch (error) {
      // Error handled by store
      animateError();
      pinForm.reset();
    }
  };

  const handleBiometricAuth = async () => {
    try {
      await authenticateWithBiometric();
      router.replace("/(tabs)");
    } catch (error) {
      // Error handled by store - fallback to other methods
      if (authSettings.usePin) {
        setAuthMethod('pin');
      } else {
        setAuthMethod('password');
      }
    }
  };

  const animateError = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const switchAuthMethod = (method: AuthMethod) => {
    setAuthMethod(method);
    // Clear previous errors
    passwordForm.clearErrors();
    pinForm.clearErrors();
  };

  const renderAuthMethodTabs = () => (
    <View style={styles.authTabs}>
      {/* Password Tab */}
      <TouchableOpacity
        style={[styles.authTab, authMethod === 'password' && styles.authTabActive]}
        onPress={() => switchAuthMethod('password')}
      >
        <Lock size={20} color={authMethod === 'password' ? 'white' : Colors.light.muted} />
        <Text style={[
          styles.authTabText,
          authMethod === 'password' && styles.authTabTextActive
        ]}>
          Password
        </Text>
      </TouchableOpacity>

      {/* PIN Tab */}
      {authSettings.usePin && (
        <TouchableOpacity
          style={[styles.authTab, authMethod === 'pin' && styles.authTabActive]}
          onPress={() => switchAuthMethod('pin')}
        >
          <Shield size={20} color={authMethod === 'pin' ? 'white' : Colors.light.muted} />
          <Text style={[
            styles.authTabText,
            authMethod === 'pin' && styles.authTabTextActive
          ]}>
            PIN
          </Text>
        </TouchableOpacity>
      )}

      {/* Biometric Tab */}
      {authSettings.useBiometric && isBiometricSupported && (
        <TouchableOpacity
          style={[styles.authTab, authMethod === 'biometric' && styles.authTabActive]}
          onPress={() => switchAuthMethod('biometric')}
        >
          <Fingerprint size={20} color={authMethod === 'biometric' ? 'white' : Colors.light.muted} />
          <Text style={[
            styles.authTabText,
            authMethod === 'biometric' && styles.authTabTextActive
          ]}>
            {biometricTypes.includes(1) ? 'Fingerprint' : 'Face ID'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPasswordAuth = () => (
    <View style={styles.authContent}>
      <Controller
        control={passwordForm.control}
        name="farmName"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Input
            label="Farm Name"
            placeholder="Enter your farm name"
            value={value}
            onChangeText={onChange}
            leftIcon={<Home size={20} color={Colors.light.muted} />}
            error={error?.message}
            autoCapitalize="words"
          />
        )}
      />

      <Controller
        control={passwordForm.control}
        name="password"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={value}
            onChangeText={onChange}
            leftIcon={<Lock size={20} color={Colors.light.muted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={Colors.light.muted} />
                ) : (
                  <Eye size={20} color={Colors.light.muted} />
                )}
              </TouchableOpacity>
            }
            error={error?.message}
          />
        )}
      />

      <Button
        title="Sign In"
        onPress={passwordForm.handleSubmit(handlePasswordLogin)}
        loading={isLoading}
        disabled={isLoading}
        fullWidth
        style={styles.signInButton}
      />
    </View>
  );

  const renderPinAuth = () => (
    <View style={styles.authContent}>
      <Text style={styles.pinTitle}>Enter your 4-digit PIN</Text>

      <Controller
        control={pinForm.control}
        name="pin"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View style={styles.pinContainer}>
            <Input
              placeholder="••••"
              secureTextEntry={!showPin}
              keyboardType="numeric"
              maxLength={4}
              value={value}
              onChangeText={onChange}
              style={styles.pinInput}
              error={error?.message}
            />
            <TouchableOpacity
              style={styles.pinToggle}
              onPress={() => setShowPin(!showPin)}
            >
              {showPin ? (
                <EyeOff size={20} color={Colors.light.muted} />
              ) : (
                <Eye size={20} color={Colors.light.muted} />
              )}
            </TouchableOpacity>
          </View>
        )}
      />

      <Button
        title="Authenticate"
        onPress={pinForm.handleSubmit(handlePinLogin)}
        loading={isLoading}
        disabled={isLoading}
        fullWidth
        style={styles.signInButton}
      />
    </View>
  );

  const renderBiometricAuth = () => (
    <View style={styles.authContent}>
      <View style={styles.biometricContainer}>
        <View style={styles.biometricIcon}>
          <Fingerprint size={48} color={Colors.light.tint} />
        </View>

        <Text style={styles.biometricTitle}>
          {biometricTypes.includes(1) ? 'Fingerprint Authentication' : 'Face ID Authentication'}
        </Text>

        <Text style={styles.biometricSubtitle}>
          Touch the sensor or look at the camera to authenticate
        </Text>

        <Button
          title="Authenticate"
          onPress={handleBiometricAuth}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          style={styles.biometricButton}
        />

        <View style={styles.fallbackOptions}>
          <Text style={styles.fallbackText}>Having trouble?</Text>
          <View style={styles.fallbackButtons}>
            {authSettings.usePin && (
              <TouchableOpacity onPress={() => switchAuthMethod('pin')}>
                <Text style={styles.fallbackLink}>Use PIN</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => switchAuthMethod('password')}>
              <Text style={styles.fallbackLink}>Use Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderFirstTimeSetup = () => (
    <View style={styles.firstTimeContainer}>
      <Text style={styles.firstTimeTitle}>Welcome to Veelink Farm</Text>
      <Text style={styles.firstTimeSubtitle}>Let's set up your farm management system</Text>

      <Button
        title="Get Started"
        onPress={() => router.push("/auth/register")}
        fullWidth
        style={styles.getStartedButton}
      />
    </View>
  );

  // Show setup screen if no farm data exists
  if (!farmData) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image
              source={{ uri: FARM_LOGO_BASE64 }}
              style={styles.logo}
            />
          </View>
          {renderFirstTimeSetup()}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={{ uri: FARM_LOGO_BASE64 }}
            style={styles.logo}
          />
          <Text style={styles.title}>{farmData.name}</Text>
          <Text style={styles.subtitle}>Welcome back to your farm</Text>
        </View>

        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          <Text style={styles.formTitle}>Sign In</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {renderAuthMethodTabs()}

          {authMethod === 'password' && renderPasswordAuth()}
          {authMethod === 'pin' && renderPinAuth()}
          {authMethod === 'biometric' && renderBiometricAuth()}

          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => Alert.alert('Settings', 'Farm settings will be available in the main app')}
          >
            <Settings size={16} color={Colors.light.muted} />
            <Text style={styles.settingsText}>Farm Settings</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: Colors.light.danger + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  authTabs: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  authTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  authTabActive: {
    backgroundColor: Colors.light.tint,
  },
  authTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.muted,
  },
  authTabTextActive: {
    color: 'white',
  },
  authContent: {
    minHeight: 200,
  },
  signInButton: {
    marginTop: 16,
  },
  pinTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  pinContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  pinInput: {
    fontSize: 32,
    letterSpacing: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  pinToggle: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  biometricContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  biometricIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.tint + "10",
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  biometricTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  biometricSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  biometricButton: {
    marginBottom: 24,
  },
  fallbackOptions: {
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  fallbackButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  fallbackLink: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  settingsText: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  firstTimeContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  firstTimeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  firstTimeSubtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  getStartedButton: {
    marginTop: 8,
  },
});