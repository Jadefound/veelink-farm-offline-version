import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { saveSecurely, getSecurely, deleteSecurely, SECURE_STORE_KEYS } from "@/utils/secureStorage";
import { User } from "@/types";
import * as bcrypt from 'bcryptjs';

// User records (contain bcrypt password hashes) live in SecureStore, not
// AsyncStorage. Falls back to the legacy plaintext AsyncStorage key once, to
// migrate any pre-existing installs, then removes it.
const LEGACY_USERS_KEY = 'users';

const getStoredUsers = async (): Promise<User[]> => {
  const secureUsers = await getSecurely<User[]>(SECURE_STORE_KEYS.USERS);
  if (secureUsers) return secureUsers;

  const legacy = await AsyncStorage.getItem(LEGACY_USERS_KEY);
  if (!legacy) return [];

  const migratedUsers: User[] = JSON.parse(legacy);
  await saveSecurely(SECURE_STORE_KEYS.USERS, migratedUsers);
  await AsyncStorage.removeItem(LEGACY_USERS_KEY);
  return migratedUsers;
};

const setStoredUsers = async (users: User[]): Promise<void> => {
  await saveSecurely(SECURE_STORE_KEYS.USERS, users);
};

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
  completeFirstRunOnboarding: (name: string, useBiometric: boolean) => Promise<void>;
  verifyBiometric: () => Promise<boolean>;
  setupFarm: (farmData: Omit<FarmData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  setupAuth: (farmName: string, password: string, usePin?: boolean, pin?: string, useBiometric?: boolean) => Promise<void>;
  authenticateWithPassword: (farmName: string, password: string) => Promise<void>;
  authenticateWithPin: (pin: string) => Promise<void>;
  authenticateWithBiometric: () => Promise<void>;
  unlockApp: () => void;
  lockApp: () => void;
  updateAuthSettings: (settings: Partial<AuthSettings>, newPinHash?: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
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

      completeFirstRunOnboarding: async (name, useBiometric) => {
        set({ isLoading: true, error: null });

        try {
          const newUser: User = {
            id: generateId(),
            name,
            email: `${name.toLowerCase().replace(/\s+/g, '')}@farm.local`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await setStoredUsers([newUser]);

          const authSettings: AuthSettings = {
            useBiometric,
            usePin: false,
            biometricEnabled: useBiometric && get().isBiometricSupported,
          };

          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          set({
            user: newUser,
            isAuthenticated: true,
            isFirstTimeUser: false,
            authSettings,
            isLoading: false,
          });
        } catch (error: any) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          set({
            error: error.message || 'Onboarding failed',
            isLoading: false,
          });
          throw error;
        }
      },

      verifyBiometric: async () => {
        try {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verify your fingerprint',
            cancelLabel: 'Cancel',
            disableDeviceFallback: true,
          });
          return result.success;
        } catch {
          return false;
        }
      },

      unlockApp: () => {
        set({ isAuthenticated: true });
      },

      lockApp: () => {
        set({ isAuthenticated: false });
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
          await setStoredUsers([newUser]);

          // Setup authentication settings
          let authSettings: AuthSettings = {
            useBiometric,
            usePin,
            biometricEnabled: useBiometric && get().isBiometricSupported,
          };

          // Setup PIN if enabled — uses its own salt, independent from the password's.
          if (usePin && pin) {
            const pinSalt = await bcrypt.genSalt(10);
            const pinHash = await bcrypt.hash(pin, pinSalt);
            await saveSecurely('pinHash', pinHash);
          }

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
          const parsedUsers = await getStoredUsers();

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
          const storedPinHash = await getSecurely<string>('pinHash');

          if (!authSettings.usePin || !storedPinHash) {
            throw new Error("PIN authentication not set up");
          }

          const isPinValid = await bcrypt.compare(pin, storedPinHash);

          if (!isPinValid) {
            throw new Error("Invalid PIN");
          }

          // Get user data
          const parsedUsers = await getStoredUsers();
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

          const parsedUsers = await getStoredUsers();
          const user = parsedUsers[0];

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
          throw error;
        }
      },

      updateAuthSettings: async (newSettings, newPinHash) => {
        set({ isLoading: true, error: null });

        try {
          const currentSettings = get().authSettings;
          const updatedSettings = { ...currentSettings, ...newSettings };

          // PIN hash lives only in SecureStore, never in persisted state.
          if (newPinHash) {
            await saveSecurely('pinHash', newPinHash);
          }

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
          // 'users'/'authSettings' are only removed here to clean up any
          // pre-migration leftovers; they are no longer written to.
          await AsyncStorage.multiRemove(['users', 'farmData', 'authSettings', 'demoDataEnabled']);
          await deleteSecurely(SECURE_STORE_KEYS.USERS);
          await deleteSecurely('pinHash');

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

          // Merge against the STORED user record (which has the password hash),
          // not the in-memory currentUser (which had password deleted).
          const parsedUsers = await getStoredUsers();
          const storedUser = parsedUsers.find(u => u.id === currentUser.id);
          if (!storedUser) {
            throw new Error("User not found");
          }

          let updatedUser = {
            ...storedUser,
            ...userData,
            updatedAt: new Date().toISOString(),
          };

          if (userData.password) {
            const salt = await bcrypt.genSalt(10);
            updatedUser.password = await bcrypt.hash(userData.password, salt);
          }

          const updatedUsers = parsedUsers.map(u =>
            u.id === currentUser.id ? updatedUser : u
          );

          await setStoredUsers(updatedUsers);

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
        user: state.user,
        isFirstTimeUser: state.isFirstTimeUser,
        authSettings: state.authSettings,
        farmData: state.farmData,
      }),
    }
  )
);