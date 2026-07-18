import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { showAlert } from '@/utils/crossPlatformAlert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Edit, Trash2, Calendar, DollarSign, FileText, CreditCard, Tag, User } from 'lucide-react-native';
import { useFinancialStore } from '@/store/financialStore';
import { useAnimalStore } from '@/store/animalStore';
import { useThemeStore } from '@/store/themeStore';
import { useToastStore } from '@/store/toastStore';
import { Transaction } from '@/types';
import Colors from '@/constants/colors';
import { formatDate, formatCurrency } from '@/utils/helpers';
import TopNavigation from '@/components/TopNavigation';
import LoadingIndicator from '@/components/LoadingIndicator';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function TransactionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isDarkMode } = useThemeStore();
    const { show } = useToastStore();
    const { getTransactionById, deleteTransaction } = useFinancialStore();
    const { getAnimal } = useAnimalStore();
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

    const handleDelete = () => {
        showAlert(
            "Delete Transaction",
            "Are you sure you want to delete this transaction? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (transaction) {
                            await deleteTransaction(transaction.id);
                            show("Transaction deleted successfully", "success");
                            router.back();
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <TopNavigation />
                <LoadingIndicator fullScreen message="Loading transaction..." />
            </View>
        );
    }

    if (!transaction) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <TopNavigation />
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                        Transaction not found
                    </Text>
                    <Button title="Go Back" onPress={() => router.back()} variant="outline" />
                </View>
            </View>
        );
    }

    const isIncome = transaction.type === 'Income';
    const typeColor = isIncome ? colors.success : colors.danger;
    const linkedAnimal = transaction.animalId ? getAnimal(transaction.animalId) : null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <TopNavigation />
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header Card */}
                <Card variant="elevated" style={styles.headerCard}>
                    <View style={styles.headerContent}>
                        <View style={[styles.typeIcon, { backgroundColor: typeColor + '20' }]}>
                            <DollarSign size={24} color={typeColor} />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.amount, { color: typeColor }]}>
                                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </Text>
                            <Text style={[styles.transactionType, { color: colors.muted }]}>
                                {transaction.type} - {transaction.category}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                    <Card variant="outlined" style={styles.detailCard}>
                        <View style={styles.detailItem}>
                            <Calendar size={20} color={colors.tint} />
                            <Text style={[styles.detailLabel, { color: colors.muted }]}>Date</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                {formatDate(transaction.date)}
                            </Text>
                        </View>
                    </Card>

                    <Card variant="outlined" style={styles.detailCard}>
                        <View style={styles.detailItem}>
                            <Tag size={20} color={colors.secondary} />
                            <Text style={[styles.detailLabel, { color: colors.muted }]}>Category</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                                {transaction.category}
                            </Text>
                        </View>
                    </Card>

                    {transaction.paymentMethod ? (
                        <Card variant="outlined" style={styles.detailCard}>
                            <View style={styles.detailItem}>
                                <CreditCard size={20} color={colors.info} />
                                <Text style={[styles.detailLabel, { color: colors.muted }]}>Payment</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {transaction.paymentMethod}
                                </Text>
                            </View>
                        </Card>
                    ) : null}

                    {transaction.reference ? (
                        <Card variant="outlined" style={styles.detailCard}>
                            <View style={styles.detailItem}>
                                <FileText size={20} color={colors.warning} />
                                <Text style={[styles.detailLabel, { color: colors.muted }]}>Reference</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {transaction.reference}
                                </Text>
                            </View>
                        </Card>
                    ) : null}
                </View>

                {/* Description */}
                {transaction.description && (
                    <Card variant="info" style={styles.descriptionCard}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                        <Text style={[styles.description, { color: colors.text }]}>
                            {transaction.description}
                        </Text>
                    </Card>
                )}

                {/* Linked Animal */}
                {linkedAnimal && (
                    <Card variant="outlined" style={styles.animalCard}>
                        <View style={styles.animalRow}>
                            <User size={20} color={colors.tint} />
                            <View style={styles.animalInfo}>
                                <Text style={[styles.detailLabel, { color: colors.muted }]}>Linked Animal</Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {linkedAnimal.identificationNumber} ({linkedAnimal.species})
                                </Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    <Button
                        title="Delete"
                        onPress={handleDelete}
                        variant="danger"
                        icon={<Trash2 size={16} color="white" />}
                        style={styles.actionButton}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    headerCard: { marginBottom: 24 },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    typeIcon: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center', marginRight: 16,
    },
    headerText: { flex: 1 },
    amount: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
    transactionType: { fontSize: 16, fontWeight: '500' },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    detailCard: { flex: 0.48, minWidth: 150 },
    detailItem: { alignItems: 'center' },
    detailLabel: { fontSize: 12, fontWeight: '500', marginTop: 8, marginBottom: 4 },
    detailValue: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    descriptionCard: { marginBottom: 20 },
    description: { fontSize: 15, lineHeight: 22 },
    animalCard: { marginBottom: 24 },
    animalRow: { flexDirection: 'row', alignItems: 'center' },
    animalInfo: { marginLeft: 12, flex: 1 },
    actionsContainer: { flexDirection: 'row', gap: 16 },
    actionButton: { flex: 1 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 16, textAlign: 'center', marginVertical: 24 },
}); 