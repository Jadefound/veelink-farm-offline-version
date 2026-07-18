import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Keys for secure storage
export const SECURE_STORE_KEYS = {
    USERS: 'secure_users',
    CURRENT_USER: 'secure_current_user',
};

const isWeb = Platform.OS === 'web';

// Web fallback uses AsyncStorage (localStorage). This is NOT secure and is
// intended only for browser development / preview. On native devices we still
// use expo-secure-store.
async function webSetItemAsync(key: string, value: string): Promise<void> {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (error) {
        console.error(`[secureStorage web] setItemAsync failed for ${key}:`, error);
        throw error;
    }
}

async function webGetItemAsync(key: string): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(key);
    } catch (error) {
        console.error(`[secureStorage web] getItemAsync failed for ${key}:`, error);
        return null;
    }
}

async function webDeleteItemAsync(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error(`[secureStorage web] deleteItemAsync failed for ${key}:`, error);
        throw error;
    }
}

/**
 * Save data securely
 * @param key The key to store the data under
 * @param value The data to store (will be JSON stringified)
 */
export async function saveSecurely(key: string, value: any): Promise<void> {
    try {
        const jsonValue = JSON.stringify(value);
        if (isWeb) {
            await webSetItemAsync(key, jsonValue);
        } else {
            await SecureStore.setItemAsync(key, jsonValue);
        }
    } catch (error) {
        console.error('Error saving data securely:', error);
        throw error;
    }
}

/**
 * Get data from secure storage
 * @param key The key to retrieve data from
 * @returns The parsed data or null if not found
 */
export async function getSecurely<T>(key: string): Promise<T | null> {
    try {
        const jsonValue = isWeb
            ? await webGetItemAsync(key)
            : await SecureStore.getItemAsync(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error('Error getting data securely:', error);
        return null;
    }
}

/**
 * Delete data from secure storage
 * @param key The key to delete
 */
export async function deleteSecurely(key: string): Promise<void> {
    try {
        if (isWeb) {
            await webDeleteItemAsync(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (error) {
        console.error('Error deleting data securely:', error);
        throw error;
    }
}