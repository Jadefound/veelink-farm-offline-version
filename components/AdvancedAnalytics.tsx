import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

export default function AdvancedAnalytics() {
    const screenWidth = Dimensions.get('window').width;

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    };

    return (
        <View>
            {/* Profit/Loss Trend */}
            <Text>Monthly Profit/Loss Trend</Text>
            <LineChart
                data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{ data: [2000, 4500, 2800, 8000, 9900, 4300] }]
                }}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
            />

            {/* Animal Health Status Distribution */}
            <Text>Animal Health Status</Text>
            <PieChart
                data={[
                    { name: 'Healthy', population: 85, color: '#10b981', legendFontColor: '#7F7F7F' },
                    { name: 'Sick', population: 10, color: '#ef4444', legendFontColor: '#7F7F7F' },
                    { name: 'Under Treatment', population: 5, color: '#f59e0b', legendFontColor: '#7F7F7F' },
                ]}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
            />
        </View>
    );
} 