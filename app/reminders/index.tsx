import React, { useMemo, useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Bell, Clock, CheckCircle, AlertTriangle, Trash2, BellOff } from "lucide-react-native";
import { useReminderStore, Reminder } from "@/store/reminderStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import { useToastStore } from "@/store/toastStore";
import Colors from "@/constants/colors";
import { formatDate } from "@/utils/helpers";
import TopNavigation from "@/components/TopNavigation";
import EmptyState from "@/components/EmptyState";
import Card from "@/components/Card";

const TYPE_ICONS: Record<string, React.ElementType> = {
  vaccination: Bell,
  health_checkup: CheckCircle,
  feeding: Clock,
  breeding: Bell,
  inventory_restock: AlertTriangle,
  custom: Bell,
};

export default function RemindersScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { currentFarm } = useFarmStore();
  const { getRemindersByFarm, getOverdueReminders, getUpcomingReminders, completeReminder, deleteReminder, snoozeReminder } = useReminderStore();
  const { show } = useToastStore();
  const [refreshing, setRefreshing] = useState(false);

  const farmReminders = useMemo(
    () => currentFarm ? getRemindersByFarm(currentFarm.id) : [],
    [getRemindersByFarm, currentFarm]
  );

  const overdue = useMemo(
    () => currentFarm ? getOverdueReminders(currentFarm.id) : [],
    [getOverdueReminders, currentFarm]
  );

  const upcoming = useMemo(
    () => currentFarm ? getUpcomingReminders(currentFarm.id, 7) : [],
    [getUpcomingReminders, currentFarm]
  );

  const sortedReminders = useMemo(() => {
    return [...farmReminders].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [farmReminders]);

  const handleComplete = useCallback((reminder: Reminder) => {
    completeReminder(reminder.id);
    show("Reminder completed", "success");
  }, [completeReminder, show]);

  const handleSnooze = useCallback((reminder: Reminder) => {
    Alert.alert(
      "Snooze Reminder",
      "Push this reminder back by how many days?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "1 Day", onPress: () => { snoozeReminder(reminder.id, 1); show("Snoozed 1 day", "info"); } },
        { text: "3 Days", onPress: () => { snoozeReminder(reminder.id, 3); show("Snoozed 3 days", "info"); } },
        { text: "7 Days", onPress: () => { snoozeReminder(reminder.id, 7); show("Snoozed 7 days", "info"); } },
      ]
    );
  }, [snoozeReminder, show]);

  const handleDelete = useCallback((reminder: Reminder) => {
    Alert.alert(
      "Delete Reminder",
      `Delete "${reminder.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => { deleteReminder(reminder.id); show("Reminder deleted", "success"); } },
      ]
    );
  }, [deleteReminder, show]);

  const renderItem = useCallback(({ item }: { item: Reminder }) => {
    const Icon = TYPE_ICONS[item.type] || Bell;
    const isOverdueItem = overdue.some(o => o.id === item.id);
    const accentColor = isOverdueItem ? colors.danger : colors.warning;

    return (
      <Card variant="elevated" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: accentColor + "15" }]}>
            <Icon size={20} color={accentColor} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.dueDate, { color: isOverdueItem ? colors.danger : colors.muted }]}>
              {isOverdueItem ? "Overdue - " : "Due: "}{formatDate(item.dueDate)}
            </Text>
            {item.notes ? (
              <Text style={[styles.notes, { color: colors.muted }]} numberOfLines={2}>
                {item.notes}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success + "15" }]}
            onPress={() => handleComplete(item)}
          >
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.info + "15" }]}
            onPress={() => handleSnooze(item)}
          >
            <Clock size={16} color={colors.info} />
            <Text style={[styles.actionText, { color: colors.info }]}>Snooze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.danger + "15" }]}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }, [colors, overdue, handleComplete, handleSnooze, handleDelete]);

  const ListHeader = useMemo(() => (
    <View>
      {(overdue.length > 0 || upcoming.length > 0) && (
        <View style={[styles.alertSummary, { backgroundColor: overdue.length > 0 ? colors.danger + "10" : colors.warning + "10", borderColor: overdue.length > 0 ? colors.danger + "30" : colors.warning + "30" }]}>
          {overdue.length > 0 && (
            <View style={styles.alertRow}>
              <AlertTriangle size={16} color={colors.danger} />
              <Text style={[styles.alertText, { color: colors.danger }]}>
                {overdue.length} overdue reminder{overdue.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
          {upcoming.length > 0 && (
            <View style={styles.alertRow}>
              <Clock size={16} color={colors.warning} />
              <Text style={[styles.alertText, { color: colors.warning }]}>
                {upcoming.length} upcoming in next 7 days
              </Text>
            </View>
          )}
        </View>
      )}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Reminders ({sortedReminders.length})
      </Text>
    </View>
  ), [overdue, upcoming, sortedReminders.length, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      <FlatList
        data={sortedReminders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            title="No Reminders"
            message="Set up vaccination, health checkup, and other reminders to stay on top of your farm tasks."
            buttonTitle="Add Reminder"
            onButtonPress={() => router.push("/reminders/add")}
            icon={<Bell size={48} color={colors.tint} />}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {sortedReminders.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.tint }]}
          onPress={() => router.push("/reminders/add")}
          activeOpacity={0.85}
        >
          <Plus size={32} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 80 },
  alertSummary: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    gap: 6,
  },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertText: { fontSize: 14, fontWeight: "500" },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16, marginTop: 8 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  cardInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  dueDate: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  notes: { fontSize: 13 },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});
