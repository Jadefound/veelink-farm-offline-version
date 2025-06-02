import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { saveSecurely, getSecurely } from './secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const createDataBackup = async () => {
    try {
        const backupData = {
            farms: await AsyncStorage.getItem('farms'),
            animals: await AsyncStorage.getItem('animals'),
            healthRecords: await AsyncStorage.getItem('healthRecords'),
            transactions: await AsyncStorage.getItem('transactions'),
            timestamp: new Date().toISOString(),
        };

        const backupJson = JSON.stringify(backupData, null, 2);
        const fileName = `veelink_backup_${new Date().toISOString().split('T')[0]}.json`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, backupJson);
        await Sharing.shareAsync(fileUri);

        return { success: true, fileUri };
    } catch (error) {
        console.error('Backup failed:', error);
        return { success: false, error };
    }
}; 