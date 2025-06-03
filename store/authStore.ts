import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { User } from "@/types";
import * as bcrypt from 'bcryptjs';

export interface FarmData {
  id: string;
  name: string;
  size: string;
  location: string;
  animalTypes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthSettings {
  useBiometric: boolean;
  usePin: boolean;
  pinHash?: string;
  biometricEnabled: boolean;
}

interface AuthState {
  user: User | null;
  farmData: FarmData | null;
  isAuthenticated: boolean;
  isFirstTimeUser: boolean;
  isLoading: boolean;
  error: string | null;
  authSettings: AuthSettings;

  // Biometric support check
  isBiometricSupported: boolean;
  biometricTypes: LocalAuthentication.AuthenticationType[];

  // Actions
  checkBiometricSupport: () => Promise<void>;
  setupFarm: (farmData: Omit<FarmData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  setupAuth: (farmName: string, password: string, usePin?: boolean, pin?: string, useBiometric?: boolean) => Promise<void>;
  authenticateWithPassword: (farmName: string, password: string) => Promise<void>;
  authenticateWithPin: (pin: string) => Promise<void>;
  authenticateWithBiometric: () => Promise<void>;
  logout: () => Promise<void>;
  updateAuthSettings: (settings: Partial<AuthSettings>) => Promise<void>;
  resetApp: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      farmData: null,
      isAuthenticated: false,
      isFirstTimeUser: true,
      isLoading: false,
      error: null,
      authSettings: {
        useBiometric: false,
        usePin: false,
        biometricEnabled: false,
      },
      isBiometricSupported: false,
      biometricTypes: [],

      checkBiometricSupport: async () => {
        try {
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

          set({
            isBiometricSupported: compatible && enrolled,
            biometricTypes: supportedTypes,
          });
        } catch (error) {
          console.error('Error checking biometric support:', error);
        }
      },

      setupFarm: async (farmData) => {
        set({ isLoading: true, error: null });

        try {
          const newFarmData: FarmData = {
            id: generateId(),
            ...farmData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await AsyncStorage.setItem('farmData', JSON.stringify(newFarmData));

          set({
            farmData: newFarmData,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || "Farm setup failed",
            isLoading: false
          });
        }
      },

      setupAuth: async (farmName, password, usePin = false, pin = '', useBiometric = false) => {
        set({ isLoading: true, error: null });

        try {
          // Hash the main password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // Create user with farm name as username
          const newUser: User = {
            id: generateId(),
            name: farmName,
            email: `${farmName.toLowerCase().replace(/\s+/g, '')}@farm.local`,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Save user data
          await AsyncStorage.setItem("users", JSON.stringify([newUser]));

          // Setup authentication settings
          let authSettings: AuthSettings = {
            useBiometric,
            usePin,
            biometricEnabled: useBiometric && get().isBiometricSupported,
          };

          // Setup PIN if enabled
          if (usePin && pin) {
            const pinHash = await bcrypt.hash(pin, salt);
            authSettings.pinHash = pinHash;
            await SecureStore.setItemAsync('pinHash', pinHash);
          }

          // Save auth settings
          await AsyncStorage.setItem('authSettings', JSON.stringify(authSettings));

          // Create user without password for state
          const userWithoutPassword = { ...newUser };
          delete userWithoutPassword.password;

          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            isFirstTimeUser: false,
            authSettings,
            isLoading: false
          });
        } catch (error: any) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          set({
            error: error.message || "Setup failed",
            isLoading: false
          });
        }
      },

      authenticateWithPassword: async (farmName, password) => {
        set({ isLoading: true, error: null });

        try {
          const users = await AsyncStorage.getItem("users");
          const parsedUsers: User[] = users ? JSON.parse(users) : [];

          const user = parsedUsers.find(u => u.name === farmName);

          if (!user) {
            throw new Error("Invalid farm name or password");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password || "");

          if (!isPasswordValid) {
            throw new Error("Invalid farm name or password");
          }

          const userWithoutPassword = { ...user };
          delete userWithoutPassword.password;

          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          set({
            error: error.message || "Authentication failed",
            isLoading: false
          });
        }
      },

      authenticateWithPin: async (pin) => {
        set({ isLoading: true, error: null });

        try {
          const authSettings = get().authSettings;
          const storedPinHash = await SecureStore.getItemAsync('pinHash');

          if (!authSettings.usePin || !storedPinHash) {
            throw new Error("PIN authentication not set up");
          }

          const isPinValid = await bcrypt.compare(pin, storedPinHash);

          if (!isPinValid) {
            throw new Error("Invalid PIN");
          }

          // Get user data
          const users = await AsyncStorage.getItem("users");
          const parsedUsers: User[] = users ? JSON.parse(users) : [];
          const user = parsedUsers[0]; // Single user app

          if (!user) {
            throw new Error("No user found");
          }

          const userWithoutPassword = { ...user };
          delete userWithoutPassword.password;

          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          set({
            error: error.message || "PIN authentication failed",
            isLoading: false
          });
        }
      },

      authenticateWithBiometric: async () => {
        set({ isLoading: true, error: null });

        try {
          const authSettings = get().authSettings;

          if (!authSettings.useBiometric || !get().isBiometricSupported) {
            throw new Error("Biometric authentication not available");
          }

          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access your farm',
            cancelLabel: 'Cancel',
            fallbackLabel: 'Use PIN',
          });

          if (!result.success) {
            throw new Error("Biometric authentication failed");
          }

          // Get user data
          const users = await AsyncStorage.getItem("users");
          const parsedUsers: User[] = users ? JSON.parse(users) : [];
          const user = parsedUsers[0]; // Single user app

          if (!user) {
            throw new Error("No user found");
          }

          const userWithoutPassword = { ...user };
          delete userWithoutPassword.password;

          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          set({
            error: error.message || "Biometric authentication failed",
            isLoading: false
          });
        }
      },

      logout: async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });
      },

      updateAuthSettings: async (newSettings) => {
        set({ isLoading: true, error: null });

        try {
          const currentSettings = get().authSettings;
          const updatedSettings = { ...currentSettings, ...newSettings };

          // Handle PIN update
          if (newSettings.pinHash) {
            await SecureStore.setItemAsync('pinHash', newSettings.pinHash);
          }

          await AsyncStorage.setItem('authSettings', JSON.stringify(updatedSettings));

          set({
            authSettings: updatedSettings,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || "Settings update failed",
            isLoading: false
          });
        }
      },

      resetApp: async () => {
        try {
          await AsyncStorage.multiRemove(['users', 'farmData', 'authSettings']);
          await SecureStore.deleteItemAsync('pinHash');

          set({
            user: null,
            farmData: null,
            isAuthenticated: false,
            isFirstTimeUser: true,
            authSettings: {
              useBiometric: false,
              usePin: false,
              biometricEnabled: false,
            },
            error: null
          });
        } catch (error) {
          console.error('Error resetting app:', error);
        }
      },

      // Legacy methods for backward compatibility
      register: async (name: string, email: string, password: string) => {
        // Redirect to new setup flow
        await get().setupAuth(name, password);
      },

      login: async (email: string, password: string) => {
        // Extract farm name from email or use name directly
        const farmName = email.includes('@') ? email.split('@')[0] : email;
        await get().authenticateWithPassword(farmName, password);
      },

      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true, error: null });

        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error("No user logged in");
          }

          let updatedUser = {
            ...currentUser,
            ...userData,
            updatedAt: new Date().toISOString(),
          };

          if (userData.password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            updatedUser.password = hashedPassword;
          }

          const users = await AsyncStorage.getItem("users");
          const parsedUsers: User[] = users ? JSON.parse(users) : [];

          const updatedUsers = parsedUsers.map(u =>
            u.id === currentUser.id ? updatedUser : u
          );

          await AsyncStorage.setItem("users", JSON.stringify(updatedUsers));

          const userWithoutPassword = { ...updatedUser };
          delete userWithoutPassword.password;

          set({
            user: userWithoutPassword,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || "Profile update failed",
            isLoading: false
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isFirstTimeUser: state.isFirstTimeUser,
        authSettings: state.authSettings,
        farmData: state.farmData,
      }),
    }
  )
);