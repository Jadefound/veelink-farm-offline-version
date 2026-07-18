import React, { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, AlertTriangle, Clock, Package } from 'lucide-react-native';
import { useInventoryStore, InventoryItem } from '@/store/inventoryStore';
import { useFarmStore } from '@/store/farmStore';
import { useThemeStore } from '@/store/themeStore';
import { useToastStore } from '@/store/toastStore';
import Colors from '@/constants/colors';
import { formatCurrency, formatDate } from '@/utils/helpers';
import TopNavigation from '@/components/TopNavigation';
import EmptyState from '@/components/EmptyState';
import Card from '@/components/Card';

export default function InventoryScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const { items, deleteItem, getLowStockItems, getExpiringItems } = useInventoryStore();
  const { currentFarm } = useFarmStore();
  const { show } = useToastStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const farmItems = useMemo(
    () => currentFarm ? items.filter(i => i.farmId === currentFarm.id) : [],
    [items, currentFarm]
  );

  const lowStock = useMemo(
    () => currentFarm ? getLowStockItems(currentFarm.id) : [],
    [getLowStockItems, currentFarm]
  );

  const expiring = useMemo(
    () => currentFarm ? getExpiringItems(30, currentFarm.id) : [],
    [getExpiringItems, currentFarm]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItem(item.id);
            show("Inventory item deleted successfully", "success");
          },
        },
      ]
    );
  };

  const renderItem = useCallback(({ item }: { item: InventoryItem }) => {
    const isLowStock = item.quantity <= item.minimumStock;
    const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return (
      <Card variant="elevated" style={styles.card}>
        <TouchableOpacity
          onPress={() => {}}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
                <Package size={20} color={colors.tint} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemCategory, { color: colors.muted }]}>
                  {item.category} - {item.supplier || 'No supplier'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Stock</Text>
              <Text style={[styles.statValue, { color: isLowStock ? colors.danger : colors.text }]}>
                {item.quantity} {item.unit}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Min</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {item.minimumStock} {item.unit}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Value</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(item.cost * item.quantity)}
              </Text>
            </View>
            {item.expiryDate ? (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Expires</Text>
                <Text style={[styles.statValue, { color: isExpiring ? colors.warning : colors.text }]}>
                  {formatDate(item.expiryDate)}
                </Text>
              </View>
            ) : null}
          </View>

          {isLowStock ? (
            <View style={[styles.alertBadge, { backgroundColor: colors.danger + '15' }]}>
              <AlertTriangle size={14} color={colors.danger} />
              <Text style={[styles.alertText, { color: colors.danger }]}>Low stock</Text>
            </View>
          ) : null}
          {isExpiring && !isLowStock ? (
            <View style={[styles.alertBadge, { backgroundColor: colors.warning + '15' }]}>
              <Clock size={14} color={colors.warning} />
              <Text style={[styles.alertText, { color: colors.warning }]}>Expiring soon</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </Card>
    );
  }, [colors, deleteItem]);

  const ListHeader = useMemo(() => (
    <View>
      {(lowStock.length > 0 || expiring.length > 0) && (
        <View style={[styles.alertSummary, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
          {lowStock.length > 0 && (
            <Text style={[styles.alertSummaryText, { color: colors.warning }]}>
              {lowStock.length} item(s) running low on stock
            </Text>
          )}
          {expiring.length > 0 && (
            <Text style={[styles.alertSummaryText, { color: colors.warning }]}>
              {expiring.length} item(s) expiring within 30 days
            </Text>
          )}
        </View>
      )}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Inventory ({farmItems.length})
      </Text>
    </View>
  ), [lowStock, expiring, farmItems.length, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />
      <FlatList
        data={farmItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            title="No Inventory Items"
            message="Track feed, medicine, equipment, and supplies here."
            buttonTitle="Add Item"
            onButtonPress={() => router.push('/inventory/add')}
            icon={<Package size={48} color={colors.tint} />}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      />

      {/* FAB */}
      {farmItems.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/inventory/add')}
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
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, marginTop: 8 },
  alertSummary: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    gap: 4,
  },
  alertSummaryText: { fontSize: 14, fontWeight: '500' },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  itemCategory: { fontSize: 13 },
  deleteText: { fontSize: 14, fontWeight: '500' },
  cardStats: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  statItem: { minWidth: 70 },
  statLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '600' },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  alertText: { fontSize: 13, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});
