import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { generateId } from "@/utils/helpers";
import { User } from "@/types";
import * as bcrypt from 'bcryptjs';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });

        try {
          // Check if user already exists
          const users = await AsyncStorage.getItem("users");
          const parsedUsers: User[] = users ? JSON.parse(users) : [];

          const existingUser = parsedUsers.find(u => u.email === email);
          if (existingUser) {
            throw new Error("User with this email already exists");
          }

          // Hash the password with bcrypt
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          // Create new user with hashed password
          const newUser: User = {
            id: generateId(),
            name,
            email,
            password: hashedPassword, // Securely hashed password
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Save to AsyncStorage
          const updatedUsers = [...parsedUsers, newUser];
          await AsyncStorage.setItem("users", JSON.stringify(updatedUsers));

          // Update state with user (without exposing hashed password to the frontend)
          const userWithoutPassword = { ...newUser };
          delete userWithoutPassword.password;

          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || "Registration failed",
            isLoading: false
          });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          // Get users from storage
          const users = await AsyncStorage.getItem("users");
          const parsedUsers: User[] = users ? JSON.parse(users) : [];

          // Find user by email
          const user = parsedUsers.find(u => u.email === email);

          if (!user) {
            throw new Error("Invalid email or password");
          }

          // Verify password with bcrypt
          const isPasswordValid = await bcrypt.compare(password, user.password || "");

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          // Create a user object without the password
          const userWithoutPassword = { ...user };
          delete userWithoutPassword.password;

          // Update state
          set({
            user: userWithoutPassword,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || "Login failed",
            isLoading: false
          });
        }
      },

      logout: async () => {
        set({
          user: null,
          isAuthenticated: false
        });
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error("No user logged in");
          }

          // Create updated user object
          let updatedUser = {
            ...currentUser,
            ...userData,
            updatedAt: new Date().toISOString(),
          };

          // If password is being updated, hash it
          if (userData.password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);
            updatedUser.password = hashedPassword;
          }

          // Update in storage
          const users = await AsyncStorage.getItem("users");
          const parsedUsers: User[] = users ? JSON.parse(users) : [];

          const updatedUsers = parsedUsers.map(u =>
            u.id === currentUser.id ? updatedUser : u
          );

          await AsyncStorage.setItem("users", JSON.stringify(updatedUsers));

          // Create a user object without the password for the frontend
          const userWithoutPassword = { ...updatedUser };
          delete userWithoutPassword.password;

          // Update state
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
    }
  )
);