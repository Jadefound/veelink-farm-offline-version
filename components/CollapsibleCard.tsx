import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Card from './Card';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ title, children, defaultCollapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Card variant="outlined" style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => setIsCollapsed(!isCollapsed)} activeOpacity={0.8}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <ChevronDown size={20} color={colors.muted} style={{ transform: [{ rotate: isCollapsed ? '-90deg' : '0deg' }] }} />
      </TouchableOpacity>
      {!isCollapsed && <View style={styles.content}>{children}</View>}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default CollapsibleCard;