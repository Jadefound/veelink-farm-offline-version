import { create } from 'zustand';
import * as Notifications from 'expo-notifications';

interface NotificationState {
    notifications: Notification[];
    scheduleVaccinationReminder: (animalId: string, date: string) => Promise<void>;
    scheduleFeedingReminder: (farmId: string, time: string) => Promise<void>;
    scheduleHealthCheckup: (animalId: string, interval: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],

    scheduleVaccinationReminder: async (animalId, date) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Vaccination Reminder',
                body: `Animal ${animalId} needs vaccination today`,
                sound: true,
            },
            trigger: {
                date: new Date(date),
            },
        });
    },

    scheduleFeedingReminder: async (farmId, time) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Feeding Time',
                body: 'Time to feed your animals',
                sound: true,
            },
            trigger: {
                hour: parseInt(time.split(':')[0]),
                minute: parseInt(time.split(':')[1]),
                repeats: true,
            },
        });
    },

    scheduleHealthCheckup: async (animalId, interval) => {
        const nextCheckup = new Date();
        nextCheckup.setDate(nextCheckup.getDate() + interval);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Health Checkup Due',
                body: `Animal ${animalId} needs health checkup`,
                sound: true,
            },
            trigger: {
                date: nextCheckup,
            },
        });
    },
})); 