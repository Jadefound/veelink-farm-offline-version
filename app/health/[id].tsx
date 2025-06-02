import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Edit, Trash2, Calendar, DollarSign, FileText, User, Clock } from "lucide-react-native";
import { useHealthStore } from "@/store/healthStore";
import { useThemeStore } from "@/store/themeStore";
import { HealthRecord } from "@/types";
import { formatDate, formatCurrency } from "@/utils/helpers";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import LoadingIndicator from "@/components/LoadingIndicator";
import TopNavigation from "@/components/TopNavigation";

export default function HealthRecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const {
    getHealthRecord,
    deleteHealthRecord,
    isLoading,
  } = useHealthStore();
  const { isDarkMode } = useThemeStore();
  
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const [record, setRecord] = useState<HealthRecord | null>(null);

  useEffect(() => {
    if (id) {
      loadHealthRecord();
    }
  }, [id]);

  const loadHealthRecord = async () => {
    if (!id) return;
    
    const healthRecord = await getHealthRecord(id);
    if (healthRecord) {
      setRecord(healthRecord);
    }
  };

  const handleDeleteRecord = () => {
    Alert.alert(
      "Delete Health Record",
      "Are you sure you want to delete this health record? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            if (record) {
              await deleteHealthRecord(record.id);
              router.back();
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleEditRecord = () => {
    router.push({
      pathname: '/health/edit/[id]',
      params: { id: id }
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopNavigation />
        <LoadingIndicator fullScreen message="Loading health record..." />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopNavigation />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            Health record not found
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header Card */}
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.typeIcon, { backgroundColor: colors.info + '20' }]}>
              <FileText size={24} color={colors.info} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.recordType, { color: colors.text }]}>
                {record.type}
              </Text>
              <Text style={[styles.recordDate, { color: colors.muted }]}>
                {formatDate(record.date)}
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
                {formatDate(record.date)}
              </Text>
            </View>
          </Card>

          {record.cost && (
            <Card variant="outlined" style={styles.detailCard}>
              <View style={styles.detailItem}>
                <DollarSign size={20} color={colors.success} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Cost</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatCurrency(record.cost)}
                </Text>
              </View>
            </Card>
          )}

          {record.veterinarian && (
            <Card variant="outlined" style={styles.detailCard}>
              <View style={styles.detailItem}>
                <User size={20} color={colors.secondary} />
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Veterinarian</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {record.veterinarian}
                </Text>
              </View>
            </Card>
          )}

          <Card variant="outlined" style={styles.detailCard}>
            <View style={styles.detailItem}>
              <Clock size={20} color={colors.warning} />
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Added</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(record.createdAt)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Description */}
        {record.description && (
          <Card variant="info" style={styles.descriptionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.text }]}>
              {record.description}
            </Text>
          </Card>
        )}

        {/* Treatment Details */}
        {(record.diagnosis || record.treatment || record.medication) && (
          <Card variant="success" style={styles.treatmentCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Treatment Details</Text>
            
            {record.diagnosis && (
              <View style={styles.treatmentItem}>
                <Text style={[styles.treatmentLabel, { color: colors.muted }]}>Diagnosis</Text>
                <Text style={[styles.treatmentValue, { color: colors.text }]}>
                  {record.diagnosis}
                </Text>
              </View>
            )}

            {record.treatment && (
              <View style={styles.treatmentItem}>
                <Text style={[styles.treatmentLabel, { color: colors.muted }]}>Treatment</Text>
                <Text style={[styles.treatmentValue, { color: colors.text }]}>
                  {record.treatment}
                </Text>
              </View>
            )}

            {record.medication && (
              <View style={styles.treatmentItem}>
                <Text style={[styles.treatmentLabel, { color: colors.muted }]}>Medication</Text>
                <Text style={[styles.treatmentValue, { color: colors.text }]}>
                  {record.medication}
                  {record.dosage && ` - ${record.dosage}`}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Notes */}
        {record.notes && (
          <Card variant="outlined" style={styles.notesCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.notes, { color: colors.text }]}>
              {record.notes}
            </Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Edit"
            onPress={handleEditRecord}
            variant="outline"
            icon={<Edit size={16} color={colors.tint} />}
            style={styles.actionButton}
          />

          <Button
            title="Delete"
            onPress={handleDeleteRecord}
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
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  recordType: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailCard: {
    flex: 0.48,
    minWidth: 150,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  descriptionCard: {
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  treatmentCard: {
    marginBottom: 20,
  },
  treatmentItem: {
    marginBottom: 12,
  },
  treatmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  treatmentValue: {
    fontSize: 15,
    lineHeight: 20,
  },
  notesCard: {
    marginBottom: 24,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 24,
  },
}); 