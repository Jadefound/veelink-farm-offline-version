import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export default function ResponsiveContainer({ children, style, padding = 20 }: Props) {
  const { maxContentWidth } = useResponsive();
  return (
    <View style={[
      { flex: 1, padding },
      maxContentWidth ? { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' } : {},
      style,
    ]}>
      {children}
    </View>
  );
}
