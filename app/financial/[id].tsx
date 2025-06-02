import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFinancialStore } from '@/store/financialStore';
import { useThemeStore } from '@/store/themeStore';
import { Transaction } from '@/types';
import Colors from '@/constants/colors';
import TopNavigation from '@/components/TopNavigation';
import LoadingIndicator from '@/components/LoadingIndicator';

export default function TransactionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isDarkMode } = useThemeStore();
    const { getTransactionById } = useFinancialStore();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    const colors = isDarkMode ? Colors.dark : Colors.light;

    useEffect(() => {
        if (id) {
            const txn = getTransactionById(id);
            setTransaction(txn);
            setLoading(false);
        }
    }, [id]);

    if (loading) {
        return <LoadingIndicator message="Loading transaction details..." />;
    }

    if (!transaction) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <TopNavigation />
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.text }]}>
                        Transaction not found
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <TopNavigation />
            <ScrollView style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                    Transaction Details
                </Text>
                {/* Add your transaction detail UI here */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
    },
}); 