import React from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";

const { width: screenWidth } = Dimensions.get("window");

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, height = 180, formatValue }: BarChartProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartWidth = screenWidth - 64;

  return (
    <View style={[styles.chartContainer, { height }]}>
      {/* Y-axis grid lines */}
      {[0.25, 0.5, 0.75, 1].map(ratio => (
        <View
          key={ratio}
          style={[
            styles.gridLine,
            { bottom: ratio * (height - 30), width: chartWidth, borderColor: colors.border + "40" },
          ]}
        />
      ))}

      {/* Bars */}
      <View style={styles.barsRow}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          const barColor = item.color || colors.tint;
          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barValueContainer}>
                <Text style={[styles.barValue, { color: colors.text }]}>
                  {formatValue ? formatValue(item.value) : item.value}
                </Text>
              </View>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(barHeight, 2),
                    backgroundColor: barColor,
                    width: Math.min(chartWidth / data.length - 12, 50),
                  },
                ]}
              />
              <Text
                style={[styles.barLabel, { color: colors.muted }]}
                numberOfLines={2}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 160, centerLabel, centerValue }: DonutChartProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  let cumulativePercentage = 0;
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
    cumulativePercentage += percentage;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const radius = size / 2;
    const innerRadius = radius * 0.6;

    const x1 = radius + radius * Math.cos(startRad);
    const y1 = radius + radius * Math.sin(startRad);
    const x2 = radius + radius * Math.cos(endRad);
    const y2 = radius + radius * Math.sin(endRad);
    const x3 = radius + innerRadius * Math.cos(endRad);
    const y3 = radius + innerRadius * Math.sin(endRad);
    const x4 = radius + innerRadius * Math.cos(startRad);
    const y4 = radius + innerRadius * Math.sin(startRad);

    const largeArc = percentage > 50 ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      "Z",
    ].join(" ");

    return { path, color: item.color, key: index };
  });

  return (
    <View style={styles.donutContainer}>
      <View style={{ width: size, height: size }}>
        {segments.map((seg) => (
          <View
            key={seg.key}
            style={{
              position: "absolute",
              width: size,
              height: size,
              backgroundColor: seg.color,
              borderRadius: size / 2,
              opacity: 0.9,
            }}
          />
        ))}
        <View
          style={{
            position: "absolute",
            width: size * 0.6,
            height: size * 0.6,
            backgroundColor: colors.background,
            borderRadius: size * 0.3,
            top: size * 0.2,
            left: size * 0.2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {centerValue ? (
            <Text style={[styles.donutCenterValue, { color: colors.text }]}>
              {centerValue}
            </Text>
          ) : null}
          {centerLabel ? (
            <Text style={[styles.donutCenterLabel, { color: colors.muted }]}>
              {centerLabel}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: colors.text }]}>
              {item.label}
            </Text>
            <Text style={[styles.legendValue, { color: colors.muted }]}>
              {item.value} ({Math.round((item.value / total) * 100)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export function LineChart({ data, height = 160, color, formatValue }: LineChartProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const lineColor = color || colors.tint;

  if (!data || data.length < 2) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  const chartWidth = screenWidth - 64;
  const stepX = chartWidth / (data.length - 1);

  const points = data.map((item, index) => {
    const x = index * stepX;
    const y = height - 30 - ((item.value - minValue) / range) * (height - 50);
    return { x, y, ...item };
  });

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - 30} L 0 ${height - 30} Z`;

  return (
    <View style={[styles.chartContainer, { height }]}>
      {[0.25, 0.5, 0.75, 1].map(ratio => (
        <View
          key={ratio}
          style={[
            styles.gridLine,
            { bottom: ratio * (height - 30), width: chartWidth, borderColor: colors.border + "40" },
          ]}
        />
      ))}

      {/* Data points and line */}
      <View style={styles.lineChartInner}>
        {points.map((p, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: p.x - 4,
              top: p.y - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: lineColor,
            }}
          />
        ))}
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {data.map((item, index) => (
          <Text
            key={index}
            style={[styles.barLabel, { color: colors.muted }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    position: "relative",
    paddingTop: 20,
  },
  gridLine: {
    position: "absolute",
    height: 1,
    borderWidth: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    flex: 1,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
  },
  barValueContainer: {
    height: 20,
    justifyContent: "flex-end",
  },
  barValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  bar: {
    borderRadius: 6,
    marginVertical: 4,
  },
  barLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  donutContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  donutCenterValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  donutCenterLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  legend: {
    marginTop: 16,
    gap: 8,
    width: "100%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
  },
  lineChartInner: {
    flex: 1,
    position: "relative",
  },
  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
});
