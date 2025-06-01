import * as SecureStore from 'expo-secure-store';

// Keys for secure storage
export const SECURE_STORE_KEYS = {
    USERS: 'secure_users',
    CURRENT_USER: 'secure_current_user',
};

/**
 * Save data securely
 * @param key The key to store the data under
 * @param value The data to store (will be JSON stringified)
 */
export async function saveSecurely(key: string, value: any): Promise<void> {
    try {
        const jsonValue = JSON.stringify(value);
        await SecureStore.setItemAsync(key, jsonValue);
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
        const jsonValue = await SecureStore.getItemAsync(key);
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
        await SecureStore.deleteItemAsync(key);
    } catch (error) {
        console.error('Error deleting data securely:', error);
        throw error;
    }
}