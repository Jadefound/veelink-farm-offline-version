import { documentDirectory, writeAsStringAsync, readAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys used by each Zustand `persist` store (must match the `name` passed to persist()).
const BACKUP_KEYS = [
    'farm-storage',
    'animal-storage',
    'health-storage',
    'financial-storage',
    'inventory-storage',
    'theme-storage',
    'auth-storage',
] as const;

const BACKUP_VERSION = 1;

export const createDataBackup = async () => {
    try {
        const entries = await AsyncStorage.multiGet(BACKUP_KEYS);

        const backupData = {
            version: BACKUP_VERSION,
            timestamp: new Date().toISOString(),
            data: Object.fromEntries(entries),
        };

        const backupJson = JSON.stringify(backupData, null, 2);
        const fileName = `veelink_backup_${new Date().toISOString().split('T')[0]}.json`;
        const fileUri = `${documentDirectory}${fileName}`;

        await writeAsStringAsync(fileUri, backupJson);
        await Sharing.shareAsync(fileUri);

        return { success: true, fileUri };
    } catch (error) {
        console.error('Backup failed:', error);
        return { success: false, error };
    }
};

// Restores a backup created by createDataBackup, given the local file URI of
// a previously exported backup (e.g. from expo-document-picker). The app must
// be restarted (or all stores rehydrated) after this resolves for the
// restored data to take effect, since each store's in-memory state was
// loaded at launch.
export const restoreDataBackup = async (fileUri: string) => {
    try {
        const backupJson = await readAsStringAsync(fileUri);
        const backup = JSON.parse(backupJson);

        if (!backup?.data || typeof backup.data !== 'object') {
            throw new Error('Invalid backup file');
        }

        const pairs = BACKUP_KEYS
            .filter(key => typeof backup.data[key] === 'string')
            .map(key => [key, backup.data[key]] as [string, string]);

        await AsyncStorage.multiSet(pairs);

        return { success: true, restoredKeys: pairs.map(([key]) => key) };
    } catch (error) {
        console.error('Restore failed:', error);
        return { success: false, error };
    }
};
