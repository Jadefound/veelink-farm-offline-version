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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Home,
  MapPin,
  Ruler,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Colors from "@/constants/colors";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useThemeStore } from "@/store/themeStore";

const { width } = Dimensions.get('window');

// Farm images URLs for visual appeal
const FARM_IMAGES = [
  "https://images.unsplash.com/photo-1500595046743-cd271d694e30?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=1752&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

const ANIMAL_TYPES = [
  "Cattle", "Sheep", "Goats", "Pigs", "Poultry", "Horses",
  "Fish", "Rabbits", "Ducks", "Turkeys", "Other"
];

// Validation schemas for each step
const farmSchema = yup.object().shape({
  farmName: yup.string().required('Farm name is required').min(2, 'Farm name must be at least 2 characters'),
  farmSize: yup.string().required('Farm size is required'),
  location: yup.string().required('Location is required').min(3, 'Location must be at least 3 characters'),
  animalTypes: yup.array().of(yup.string()).min(1, 'Please select at least one animal type'),
});

const authSchema = yup.object().shape({
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  pin: yup.string().when('usePin', {
    is: true,
    then: (schema) => schema.required('PIN is required').length(4, 'PIN must be exactly 4 digits').matches(/^\d+$/, 'PIN must contain only numbers'),
    otherwise: (schema) => schema.notRequired(),
  }),
  confirmPin: yup.string().when('usePin', {
    is: true,
    then: (schema) => schema.required('Please confirm your PIN').oneOf([yup.ref('pin')], 'PINs must match'),
    otherwise: (schema) => schema.notRequired(),
  }),
  usePin: yup.boolean(),
  useBiometric: yup.boolean(),
});

interface FarmFormData {
  farmName: string;
  farmSize: string;
  location: string;
  animalTypes: string[];
}

interface AuthFormData {
  password: string;
  confirmPassword: string;
  pin?: string;
  confirmPin?: string;
  usePin: boolean;
  useBiometric: boolean;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    setupFarm,
    setupAuth,
    checkBiometricSupport,
    isBiometricSupported,
    biometricTypes,
    isLoading,
    error
  } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [farmData, setFarmData] = useState<FarmFormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Form setup - don't use resolver, handle validation manually
  const farmForm = useForm<FarmFormData>({
    defaultValues: {
      farmName: '',
      farmSize: '',
      location: '',
      animalTypes: [],
    },
  });

  const authForm = useForm<AuthFormData>({
    defaultValues: {
      password: 'admin',
      confirmPassword: 'admin',
      pin: '',
      confirmPin: '',
      usePin: false,
      useBiometric: false,
    },
  });

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const handleFarmSubmit = async (data: FarmFormData) => {
    try {
      // Transform FarmFormData to match setupFarm expected format
      const farmData = {
        name: data.farmName,
        size: data.farmSize,
        location: data.location,
        animalTypes: data.animalTypes,
      };
      await setupFarm(farmData);
      setFarmData(data);
      setCurrentStep(1);
    } catch (error) {
      Alert.alert('Error', 'Failed to setup farm data');
    }
  };

  const handleAuthSubmit = async (data: AuthFormData) => {
    if (!farmData) return;

    try {
      await setupAuth(
        farmData.farmName,
        data.password,
        data.usePin,
        data.pin,
        data.useBiometric
      );
      router.replace("/(tabs)");
    } catch (error) {
      // Error handled by store
    }
  };

  const handleAnimalToggle = (animal: string) => {
    const currentAnimals = farmForm.getValues('animalTypes');
    const newAnimals = currentAnimals.includes(animal)
      ? currentAnimals.filter(a => a !== animal)
      : [...currentAnimals, animal];
    farmForm.setValue('animalTypes', newAnimals);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[0, 1].map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            currentStep >= step ? styles.stepDotActive : styles.stepDotInactive
          ]}
        >
          {currentStep > step ? (
            <CheckCircle size={16} color="white" />
          ) : (
            <Text style={styles.stepNumber}>{step + 1}</Text>
          )}
        </View>
      ))}
      <View style={[styles.stepLine, currentStep >= 1 && styles.stepLineActive]} />
    </View>
  );

  const formContainerStyle = [
    styles.formContainer,
    { backgroundColor: isDarkMode ? Colors.dark.background : '#f0fdf4', borderColor: Colors.light.tint, borderWidth: 1 }
  ];

  const renderFarmSetup = () => (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: FARM_IMAGES[0] }}
        style={styles.headerImage}
      />

      <View style={styles.formContainer}>
        <Text style={styles.stepTitle}>Setup Your Farm</Text>
        <Text style={styles.stepSubtitle}>Let's get to know your farm better</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Controller
          control={farmForm.control}
          name="farmName"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              label="Farm Name"
              placeholder="Enter your farm name"
              value={value}
              onChangeText={onChange}
              leftIcon={<Home size={20} color={Colors.light.muted} />}
              error={error?.message}
            />
          )}
        />

        <Controller
          control={farmForm.control}
          name="farmSize"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              label="Farm Size"
              placeholder="e.g., 50 acres, 10 hectares"
              value={value}
              onChangeText={onChange}
              leftIcon={<Ruler size={20} color={Colors.light.muted} />}
              error={error?.message}
            />
          )}
        />

        <Controller
          control={farmForm.control}
          name="location"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              label="Location"
              placeholder="City, State/Region"
              value={value}
              onChangeText={onChange}
              leftIcon={<MapPin size={20} color={Colors.light.muted} />}
              error={error?.message}
            />
          )}
        />

        <View style={styles.animalSection}>
          <Text style={styles.animalTitle}>What animals do you raise?</Text>
          <View style={styles.animalGrid}>
            {ANIMAL_TYPES.map((animal) => (
              <TouchableOpacity
                key={animal}
                style={[
                  styles.animalTag,
                  farmForm.watch('animalTypes').includes(animal) && styles.animalTagSelected
                ]}
                onPress={() => handleAnimalToggle(animal)}
              >
                <Text style={[
                  styles.animalTagText,
                  farmForm.watch('animalTypes').includes(animal) && styles.animalTagTextSelected
                ]}>
                  {animal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {farmForm.formState.errors.animalTypes && (
            <Text style={styles.errorText}>{farmForm.formState.errors.animalTypes.message}</Text>
          )}
        </View>

        <Button
          title="Continue"
          onPress={farmForm.handleSubmit(handleFarmSubmit)}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          style={styles.continueButton}
        />
      </View>
    </View>
  );

  const renderAuthSetup = () => (
    <View style={styles.stepContainer}>
      <Image
        source={{ uri: FARM_IMAGES[1] }}
        style={styles.headerImage}
      />

      <View style={formContainerStyle}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Shield size={28} color={Colors.light.tint} style={{ marginRight: 8 }} />
          <Text style={styles.stepTitle}>Secure Your Farm</Text>
        </View>
        <Text style={styles.stepSubtitle}>Setup authentication to protect your data</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Controller
          control={authForm.control}
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

        <Controller
          control={authForm.control}
          name="confirmPassword"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry={!showPassword}
              value={value}
              onChangeText={onChange}
              leftIcon={<Lock size={20} color={Colors.light.muted} />}
              error={error?.message}
            />
          )}
        />

        {/* PIN Option */}
        <View style={styles.authOption}>
          <TouchableOpacity
            style={[
              styles.authToggle,
              authForm.watch('usePin') && { backgroundColor: Colors.light.tint + '10' }
            ]}
            onPress={() => authForm.setValue('usePin', !authForm.watch('usePin'))}
          >
            <View style={[styles.checkbox, authForm.watch('usePin') && styles.checkboxChecked]}>
              {authForm.watch('usePin') && <CheckCircle size={16} color="white" />}
            </View>
            <View style={styles.authOptionText}>
              <Text style={styles.authOptionTitle}>Enable PIN Authentication</Text>
              <Text style={styles.authOptionSubtitle}>Quick 4-digit access</Text>
            </View>
          </TouchableOpacity>

          {authForm.watch('usePin') && (
            <View style={styles.pinInputs}>
              <Controller
                control={authForm.control}
                name="pin"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Input
                    label="4-Digit PIN"
                    placeholder="Enter PIN"
                    secureTextEntry={!showPin}
                    keyboardType="numeric"
                    maxLength={4}
                    value={value}
                    onChangeText={onChange}
                    leftIcon={<Shield size={20} color={Colors.light.muted} />}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPin(!showPin)}>
                        {showPin ? (
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

              <Controller
                control={authForm.control}
                name="confirmPin"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Input
                    label="Confirm PIN"
                    placeholder="Confirm PIN"
                    secureTextEntry={!showPin}
                    keyboardType="numeric"
                    maxLength={4}
                    value={value}
                    onChangeText={onChange}
                    leftIcon={<Shield size={20} color={Colors.light.muted} />}
                    error={error?.message}
                  />
                )}
              />
            </View>
          )}
        </View>

        {/* Biometric Option */}
        {isBiometricSupported && (
          <View style={styles.authOption}>
            <TouchableOpacity
              style={[
                styles.authToggle,
                authForm.watch('useBiometric') && { backgroundColor: Colors.light.tint + '10' }
              ]}
              onPress={() => authForm.setValue('useBiometric', !authForm.watch('useBiometric'))}
            >
              <View style={[styles.checkbox, authForm.watch('useBiometric') && styles.checkboxChecked]}>
                {authForm.watch('useBiometric') && <CheckCircle size={16} color="white" />}
              </View>
              <View style={styles.authOptionText}>
                <Text style={styles.authOptionTitle}>Enable Biometric Authentication</Text>
                <Text style={styles.authOptionSubtitle}>
                  Use {biometricTypes.includes(1) ? 'fingerprint' : 'face recognition'} for quick access
                </Text>
              </View>
              <Fingerprint size={24} color={Colors.light.tint} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Button
            title="Back"
            onPress={() => setCurrentStep(0)}
            variant="outline"
            style={styles.backButton}
          />

          <Button
            title="Complete Setup"
            onPress={authForm.handleSubmit(handleAuthSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={{ ...styles.completeButton, backgroundColor: Colors.light.tint, borderColor: Colors.light.tint }}
            textStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStepIndicator()}

        {currentStep === 0 ? renderFarmSetup() : renderAuthSetup()}
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
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    zIndex: 2,
  },
  stepDotActive: {
    backgroundColor: Colors.light.tint,
  },
  stepDotInactive: {
    backgroundColor: Colors.light.muted,
  },
  stepNumber: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    height: 2,
    width: 40,
    backgroundColor: Colors.light.muted,
    top: 15,
  },
  stepLineActive: {
    backgroundColor: Colors.light.tint,
  },
  stepContainer: {
    flex: 1,
  },
  headerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  formContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    marginTop: -24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    marginBottom: 24,
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
  },
  animalSection: {
    marginVertical: 16,
  },
  animalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  animalTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.muted + "40",
    backgroundColor: 'white',
  },
  animalTagSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  animalTagText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  animalTagTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  continueButton: {
    marginTop: 24,
  },
  authOption: {
    marginVertical: 12,
  },
  authToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.muted + "20",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  authOptionText: {
    flex: 1,
  },
  authOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  authOptionSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  pinInputs: {
    marginTop: 12,
    paddingLeft: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
  },
  completeButton: {
    flex: 2,
  },
});