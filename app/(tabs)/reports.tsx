import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
  Alert,
  Modal,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import {
  FileText,
  Download,
  ChevronDown,
  Calendar,
  ArrowUpDown,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Heart,
  Users,
  PieChart,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  ChevronRight,
  Layers,
  Wallet,
  Target,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { useAnimalStore } from "@/store/animalStore";
import { useHealthStore } from "@/store/healthStore";
import { useFinancialStore } from "@/store/financialStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import Button from "@/components/Button";
import LoadingIndicator from "@/components/LoadingIndicator";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { Animal, HealthRecord, Transaction } from "@/types";
import TopNavigation from "@/components/TopNavigation";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// Define report types
type ReportType = "overview" | "animals" | "health" | "financial";
type FilterPeriod = "all" | "week" | "month" | "quarter" | "year";
type SortDirection = "asc" | "desc";

// Animated number component
const AnimatedValue = ({ value, prefix = "", suffix = "", color }: { value: number; prefix?: string; suffix?: string; color: string }) => {
  return (
    <Text style={[styles.metricValue, { color }]}>
      {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
    </Text>
  );
};

export default function ReportsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams();
  const initialReportType = (params?.reportType as ReportType) || "overview";
  const [reportType, setReportType] = useState<ReportType>(initialReportType);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("summary");

  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const animals = useAnimalStore(state => state.animals);
  const healthRecords = useHealthStore(state => state.healthRecords);
  const transactions = useFinancialStore(state => state.transactions);
  const { currentFarm } = useFarmStore();
  const isLoading = false;
  const insets = useSafeAreaInsets();

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);

    if (filterPeriod === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (filterPeriod === "month") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (filterPeriod === "quarter") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    } else if (filterPeriod === "year") {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const startTimestamp = startDate.getTime();

    // Filter data by period
    const filteredAnimals = animals.filter(a =>
      filterPeriod === "all" || new Date(a.createdAt).getTime() >= startTimestamp
    );
    const filteredHealth = healthRecords.filter(r =>
      filterPeriod === "all" || new Date(r.date).getTime() >= startTimestamp
    );
    const filteredTransactions = transactions.filter(t =>
      filterPeriod === "all" || new Date(t.date).getTime() >= startTimestamp
    );

    // Animal stats
    const totalAnimals = animals.length;
    const activeAnimals = animals.filter(a => a.status !== 'Sold' && a.status !== 'Dead');
    const soldAnimals = animals.filter(a => a.status === 'Sold');
    const healthyAnimals = animals.filter(a => a.healthStatus === 'healthy' || a.status === 'Healthy');
    const sickAnimals = animals.filter(a => a.healthStatus === 'sick' || a.status === 'Sick');

    // Health costs (Health module)
    const totalHealthCosts = filteredHealth.reduce((sum, r) => sum + r.cost, 0);

    // Financial stats
    // IMPORTANT: include Health costs in expenses so net profit matches the Health module.
    const totalIncome = filteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const baseExpenses = filteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = baseExpenses + totalHealthCosts;
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const avgHealthCostPerAnimal = totalAnimals > 0 ? totalHealthCosts / totalAnimals : 0;

    // Asset value
    const totalAssetValue = activeAnimals.reduce((sum, a) => sum + (a.estimatedValue || a.price || 0), 0);
    const totalAcquisitionCost = activeAnimals.reduce((sum, a) => sum + (a.acquisitionPrice || 0), 0);
    const assetAppreciation = totalAssetValue - totalAcquisitionCost;
    const appreciationPercent = totalAcquisitionCost > 0 ? (assetAppreciation / totalAcquisitionCost) * 100 : 0;

    // Sales performance
    const salesRevenue = soldAnimals.reduce((sum, a) => sum + (a.price || 0), 0);
    const salesCost = soldAnimals.reduce((sum, a) => sum + (a.acquisitionPrice || 0), 0);
    const salesProfit = salesRevenue - salesCost;

    // Species breakdown
    const speciesData = animals.reduce((acc, a) => {
      acc[a.species] = (acc[a.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Transaction categories
    const categoryData = filteredTransactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === 'Income') {
        acc[t.category].income += t.amount;
      } else {
        acc[t.category].expense += t.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    // Health record types
    const healthTypeData = filteredHealth.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      animals: {
        total: totalAnimals,
        active: activeAnimals.length,
        sold: soldAnimals.length,
        healthy: healthyAnimals.length,
        sick: sickAnimals.length,
        healthRate: totalAnimals > 0 ? (healthyAnimals.length / totalAnimals) * 100 : 0,
        speciesData,
      },
      financial: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin,
        healthCosts: totalHealthCosts,
        totalAssetValue,
        totalAcquisitionCost,
        assetAppreciation,
        appreciationPercent,
        salesRevenue,
        salesCost,
        salesProfit,
        categoryData,
      },
      health: {
        totalRecords: filteredHealth.length,
        totalCosts: totalHealthCosts,
        avgCostPerAnimal: avgHealthCostPerAnimal,
        typeData: healthTypeData,
      },
      filteredAnimals,
      filteredHealth,
      filteredTransactions,
    };
  }, [animals, healthRecords, transactions, filterPeriod]);

  // Generate PDF HTML
  const generateReportHtml = () => {
    const farmName = currentFarm?.name || "Farm";
    const reportDate = new Date().toLocaleDateString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; background: #fff; }
            .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
            .farm-name { font-size: 32px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.5px; }
            .report-title { font-size: 18px; color: #6366f1; margin-top: 8px; font-weight: 500; }
            .report-date { font-size: 14px; color: #64748b; margin-top: 8px; }
            .section { margin-bottom: 32px; }
            .section-title { font-size: 20px; font-weight: 600; color: #1a1a2e; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
            .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
            .metric-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
            .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
            .metric-value { font-size: 24px; font-weight: 700; color: #1a1a2e; }
            .metric-value.positive { color: #10b981; }
            .metric-value.negative { color: #ef4444; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { background: #6366f1; color: white; padding: 12px 16px; text-align: left; font-weight: 600; font-size: 13px; }
            td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            tr:nth-child(even) { background: #f8fafc; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .summary-box { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
            .summary-title { font-size: 16px; opacity: 0.9; margin-bottom: 8px; }
            .summary-value { font-size: 36px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="farm-name">${farmName}</h1>
            <p class="report-title">Comprehensive Farm Report</p>
            <p class="report-date">Generated: ${reportDate} | Period: ${filterPeriod === 'all' ? 'All Time' : filterPeriod}</p>
          </div>

          <div class="summary-box">
            <p class="summary-title">Net Profit</p>
            <p class="summary-value">${formatCurrency(stats.financial.netProfit)}</p>
          </div>

          <div class="section">
            <h2 class="section-title">📊 Financial Overview</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <p class="metric-label">Total Income</p>
                <p class="metric-value positive">${formatCurrency(stats.financial.totalIncome)}</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Total Expenses</p>
                <p class="metric-value negative">${formatCurrency(stats.financial.totalExpenses)}</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Asset Value</p>
                <p class="metric-value">${formatCurrency(stats.financial.totalAssetValue)}</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Profit Margin</p>
                <p class="metric-value ${stats.financial.profitMargin >= 0 ? 'positive' : 'negative'}">${stats.financial.profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">🐄 Animal Inventory</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <p class="metric-label">Total Animals</p>
                <p class="metric-value">${stats.animals.total}</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Active</p>
                <p class="metric-value">${stats.animals.active}</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Sold</p>
                <p class="metric-value">${stats.animals.sold}</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Health Rate</p>
                <p class="metric-value positive">${stats.animals.healthRate.toFixed(1)}%</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Species</th>
                  <th>Status</th>
                  <th>Weight</th>
                  <th>Value</th>
                  <th>Acquisition</th>
                </tr>
              </thead>
              <tbody>
                ${stats.filteredAnimals.map(a => `
                  <tr>
                    <td>${a.identificationNumber}</td>
                    <td>${a.species}</td>
                    <td>${a.status}</td>
                    <td>${a.weight} ${a.weightUnit}</td>
                    <td>${formatCurrency(a.price || 0)}</td>
                    <td>${formatCurrency(a.acquisitionPrice || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">🏥 Health Records</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <p class="metric-label">Total Records</p>
                <p class="metric-value">${stats.health.totalRecords}</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Total Costs</p>
                <p class="metric-value negative">${formatCurrency(stats.health.totalCosts)}</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Avg Cost/Animal</p>
                <p class="metric-value">${formatCurrency(stats.health.avgCostPerAnimal)}</p>
              </div>
              <div class="metric-card">
                <p class="metric-label">Healthy Animals</p>
                <p class="metric-value positive">${stats.animals.healthy}</p>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Generated by VeeLink Farm Management System</p>
          </div>
        </body>
      </html>
    `;
  };

  const generatePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const html = generateReportHtml();
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: "Share Farm Report",
      });
      setIsGeneratingPdf(false);
    } catch (error) {
      setIsGeneratingPdf(false);
      Alert.alert("Error", "Failed to generate PDF report.");
    }
  };

  const renderMetricCard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    trend?: number,
    prefix?: string,
    suffix?: string,
    gradient?: readonly [string, string, ...string[]]
  ) => (
    <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
      {(() => {
        const defaultGradient: readonly [string, string, ...string[]] = isDarkMode
          ? ['#2d3748', '#1a202c']
          : ['#ffffff', '#f8fafc'];

        return (
          <LinearGradient
            colors={gradient ?? defaultGradient}
            style={styles.metricGradient}
          >
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconContainer, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}>
                {icon}
              </View>
              {trend !== undefined && (
                <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                  {trend >= 0 ? (
                    <TrendingUp size={12} color="#10b981" />
                  ) : (
                    <TrendingDown size={12} color="#ef4444" />
                  )}
                  <Text style={[styles.trendText, { color: trend >= 0 ? '#10b981' : '#ef4444' }]}>
                    {Math.abs(trend).toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.metricTitle, { color: colors.muted }]}>{title}</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </Text>
          </LinearGradient>
        );
      })()}
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Hero Summary Card */}
      <LinearGradient
        colors={[colors.secondary, colors.tint] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Net Profit</Text>
          <Text style={styles.heroValue}>{formatCurrency(stats.financial.netProfit)}</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <TrendingUp size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{formatCurrency(stats.financial.totalIncome)} Income</Text>
            </View>
            <View style={styles.heroStatItem}>
              <TrendingDown size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroStatText}>{formatCurrency(stats.financial.totalExpenses)} Expenses</Text>
            </View>
          </View>
        </View>
        <View style={styles.heroDecoration}>
          <PieChart size={80} color="rgba(255,255,255,0.1)" />
        </View>
      </LinearGradient>

      {/* Quick Metrics Grid */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Metrics</Text>
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          "Total Animals",
          stats.animals.total,
          <Users size={20} color={colors.tint} />,
          undefined,
          "",
          ""
        )}
        {renderMetricCard(
          "Asset Value",
          formatCurrency(stats.financial.totalAssetValue),
          <Wallet size={20} color={colors.tint} />
        )}
        {renderMetricCard(
          "Health Rate",
          stats.animals.healthRate.toFixed(1),
          <Heart size={20} color="#10b981" />,
          undefined,
          "",
          "%"
        )}
        {renderMetricCard(
          "Profit Margin",
          stats.financial.profitMargin.toFixed(1),
          <Target size={20} color={stats.financial.profitMargin >= 0 ? "#10b981" : "#ef4444"} />,
          undefined,
          "",
          "%"
        )}
      </View>

      {/* Expandable Sections */}
      <TouchableOpacity
        style={[styles.expandableHeader, { backgroundColor: colors.card }]}
        onPress={() => setExpandedSection(expandedSection === 'species' ? null : 'species')}
      >
        <View style={styles.expandableTitle}>
          <Layers size={20} color={colors.tint} />
          <Text style={[styles.expandableTitleText, { color: colors.text }]}>Species Breakdown</Text>
        </View>
        <ChevronDown
          size={20}
          color={colors.muted}
          style={{ transform: [{ rotate: expandedSection === 'species' ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {expandedSection === 'species' && (
        <View style={[styles.expandableContent, { backgroundColor: colors.card }]}>
          {Object.entries(stats.animals.speciesData).map(([species, count]) => (
            <View key={species} style={styles.breakdownItem}>
              <View style={styles.breakdownLabel}>
                <View style={[styles.breakdownDot, { backgroundColor: colors.tint }]} />
                <Text style={[styles.breakdownText, { color: colors.text }]}>{species}</Text>
              </View>
              <View style={styles.breakdownValues}>
                <Text style={[styles.breakdownCount, { color: colors.text }]}>{count}</Text>
                <View style={styles.breakdownBar}>
                  <View
                    style={[
                      styles.breakdownBarFill,
                      { width: `${(count / stats.animals.total) * 100}%`, backgroundColor: colors.tint }
                    ]}
                  />
                </View>
                <Text style={[styles.breakdownPercent, { color: colors.muted }]}>
                  {((count / stats.animals.total) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Financial Categories */}
      <TouchableOpacity
        style={[styles.expandableHeader, { backgroundColor: colors.card }]}
        onPress={() => setExpandedSection(expandedSection === 'categories' ? null : 'categories')}
      >
        <View style={styles.expandableTitle}>
          <BarChart3 size={20} color={colors.tint} />
          <Text style={[styles.expandableTitleText, { color: colors.text }]}>Financial Categories</Text>
        </View>
        <ChevronDown
          size={20}
          color={colors.muted}
          style={{ transform: [{ rotate: expandedSection === 'categories' ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {expandedSection === 'categories' && (
        <View style={[styles.expandableContent, { backgroundColor: colors.card }]}>
          {Object.entries(stats.financial.categoryData).map(([category, data]) => (
            <View key={category} style={styles.categoryItem}>
              <Text style={[styles.categoryName, { color: colors.text }]}>{category}</Text>
              <View style={styles.categoryValues}>
                {data.income > 0 && (
                  <View style={styles.categoryValue}>
                    <Text style={styles.incomeText}>+{formatCurrency(data.income)}</Text>
                  </View>
                )}
                {data.expense > 0 && (
                  <View style={styles.categoryValue}>
                    <Text style={styles.expenseText}>-{formatCurrency(data.expense)}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderAnimalsTab = () => (
    <View style={styles.tabContent}>
      {/* Animal Summary Cards */}
      <View style={styles.animalSummaryRow}>
        <LinearGradient colors={['#10b981', '#059669']} style={styles.animalSummaryCard}>
          <CheckCircle size={24} color="white" />
          <Text style={styles.animalSummaryValue}>{stats.animals.healthy}</Text>
          <Text style={styles.animalSummaryLabel}>Healthy</Text>
        </LinearGradient>
        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.animalSummaryCard}>
          <Activity size={24} color="white" />
          <Text style={styles.animalSummaryValue}>{stats.animals.sick}</Text>
          <Text style={styles.animalSummaryLabel}>Sick</Text>
        </LinearGradient>
        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.animalSummaryCard}>
          <DollarSign size={24} color="white" />
          <Text style={styles.animalSummaryValue}>{stats.animals.sold}</Text>
          <Text style={styles.animalSummaryLabel}>Sold</Text>
        </LinearGradient>
      </View>

      {/* Animals Table */}
      <View style={[styles.tableContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.tableHeader, { backgroundColor: colors.tint }]}>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>ID</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Species</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Value</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}></Text>
        </View>
        <ScrollView style={styles.tableBody} nestedScrollEnabled>
          {stats.filteredAnimals
            .sort((a, b) => sortDirection === 'desc'
              ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
            .map((animal, index) => (
              <TouchableOpacity
                key={animal.id}
                style={[
                  styles.tableRow,
                  { backgroundColor: index % 2 === 0 ? colors.background : colors.card }
                ]}
                onPress={() => { setSelectedAnimal(animal); setShowAnimalModal(true); }}
              >
                <Text style={[styles.tableCell, { flex: 1.2, color: colors.text }]} numberOfLines={1}>
                  {animal.identificationNumber}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
                  {animal.species}
                </Text>
                <View style={[styles.statusBadge, {
                  backgroundColor: animal.status === 'Healthy' ? 'rgba(16, 185, 129, 0.1)' :
                    animal.status === 'Sick' ? 'rgba(239, 68, 68, 0.1)' :
                      animal.status === 'Sold' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                  flex: 1
                }]}>
                  <Text style={[styles.statusText, {
                    color: animal.status === 'Healthy' ? '#10b981' :
                      animal.status === 'Sick' ? '#ef4444' :
                        animal.status === 'Sold' ? '#6366f1' : colors.muted
                  }]}>
                    {animal.status}
                  </Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1, color: colors.text, fontWeight: '600' }]}>
                  {formatCurrency(animal.price || 0)}
                </Text>
                <View style={{ flex: 0.5, alignItems: 'flex-end' }}>
                  <ChevronRight size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderHealthTab = () => (
    <View style={styles.tabContent}>
      {/* Health Summary */}
      <View style={styles.healthSummaryGrid}>
        <View style={[styles.healthSummaryCard, { backgroundColor: colors.card }]}>
          <Heart size={32} color="#ef4444" />
          <Text style={[styles.healthSummaryValue, { color: colors.text }]}>{stats.health.totalRecords}</Text>
          <Text style={[styles.healthSummaryLabel, { color: colors.muted }]}>Total Records</Text>
        </View>
        <View style={[styles.healthSummaryCard, { backgroundColor: colors.card }]}>
          <DollarSign size={32} color="#f59e0b" />
          <Text style={[styles.healthSummaryValue, { color: colors.text }]}>{formatCurrency(stats.health.totalCosts)}</Text>
          <Text style={[styles.healthSummaryLabel, { color: colors.muted }]}>Total Health Costs</Text>
        </View>
      </View>

      {/* Health Types Breakdown */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Record Types</Text>
      <View style={[styles.healthTypesContainer, { backgroundColor: colors.card }]}>
        {Object.entries(stats.health.typeData).map(([type, count]) => (
          <View key={type} style={styles.healthTypeItem}>
            <View style={styles.healthTypeInfo}>
              <View style={[styles.healthTypeDot, {
                backgroundColor: type === 'Vaccination' ? '#10b981' :
                  type === 'Treatment' ? '#f59e0b' :
                    type === 'Checkup' ? '#3b82f6' :
                      type === 'Surgery' ? '#ef4444' : '#6366f1'
              }]} />
              <Text style={[styles.healthTypeText, { color: colors.text }]}>{type}</Text>
            </View>
            <Text style={[styles.healthTypeCount, { color: colors.text }]}>{count}</Text>
          </View>
        ))}
      </View>

      {/* Health Records Table */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Records</Text>
      <View style={[styles.tableContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.tableHeader, { backgroundColor: colors.tint }]}>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Treatment</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Cost</Text>
        </View>
        <ScrollView style={styles.tableBody} nestedScrollEnabled>
          {stats.filteredHealth
            .sort((a, b) => sortDirection === 'desc'
              ? new Date(b.date).getTime() - new Date(a.date).getTime()
              : new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .slice(0, 10)
            .map((record, index) => (
              <View
                key={record.id}
                style={[
                  styles.tableRow,
                  { backgroundColor: index % 2 === 0 ? colors.background : colors.card }
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
                  {formatDate(record.date)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
                  {record.type}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5, color: colors.text }]} numberOfLines={1}>
                  {record.treatment || record.diagnosis || '-'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, color: '#ef4444', fontWeight: '600' }]}>
                  {formatCurrency(record.cost)}
                </Text>
              </View>
            ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderFinancialTab = () => (
    <View style={styles.tabContent}>
      {/* Financial Overview Cards */}
      <View style={styles.financialOverviewRow}>
        <LinearGradient colors={['#10b981', '#059669']} style={styles.financialOverviewCard}>
          <TrendingUp size={24} color="white" />
          <Text style={styles.financialOverviewLabel}>Total Income</Text>
          <Text style={styles.financialOverviewValue}>{formatCurrency(stats.financial.totalIncome)}</Text>
        </LinearGradient>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.financialOverviewCard}>
          <TrendingDown size={24} color="white" />
          <Text style={styles.financialOverviewLabel}>Total Expenses</Text>
          <Text style={styles.financialOverviewValue}>{formatCurrency(stats.financial.totalExpenses)}</Text>
        </LinearGradient>
      </View>

      {/* Asset Performance */}
      <View style={[styles.assetPerformanceCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.assetPerformanceTitle, { color: colors.text }]}>Asset Performance</Text>
        <View style={styles.assetPerformanceGrid}>
          <View style={styles.assetPerformanceItem}>
            <Text style={[styles.assetLabel, { color: colors.muted }]}>Current Value</Text>
            <Text style={[styles.assetValue, { color: colors.text }]}>{formatCurrency(stats.financial.totalAssetValue)}</Text>
          </View>
          <View style={styles.assetPerformanceItem}>
            <Text style={[styles.assetLabel, { color: colors.muted }]}>Acquisition Cost</Text>
            <Text style={[styles.assetValue, { color: colors.text }]}>{formatCurrency(stats.financial.totalAcquisitionCost)}</Text>
          </View>
          <View style={styles.assetPerformanceItem}>
            <Text style={[styles.assetLabel, { color: colors.muted }]}>Appreciation</Text>
            <Text style={[styles.assetValue, { color: stats.financial.assetAppreciation >= 0 ? '#10b981' : '#ef4444' }]}>
              {stats.financial.assetAppreciation >= 0 ? '+' : ''}{formatCurrency(stats.financial.assetAppreciation)}
            </Text>
          </View>
          <View style={styles.assetPerformanceItem}>
            <Text style={[styles.assetLabel, { color: colors.muted }]}>ROI</Text>
            <Text style={[styles.assetValue, { color: stats.financial.appreciationPercent >= 0 ? '#10b981' : '#ef4444' }]}>
              {stats.financial.appreciationPercent >= 0 ? '+' : ''}{stats.financial.appreciationPercent.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Transactions Table */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
      <View style={[styles.tableContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.tableHeader, { backgroundColor: colors.tint }]}>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Amount</Text>
        </View>
        <ScrollView style={styles.tableBody} nestedScrollEnabled>
          {stats.filteredTransactions
            .sort((a, b) => sortDirection === 'desc'
              ? new Date(b.date).getTime() - new Date(a.date).getTime()
              : new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .slice(0, 15)
            .map((transaction, index) => (
              <View
                key={transaction.id}
                style={[
                  styles.tableRow,
                  { backgroundColor: index % 2 === 0 ? colors.background : colors.card }
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
                  {formatDate(transaction.date)}
                </Text>
                <View style={[styles.typeBadge, {
                  backgroundColor: transaction.type === 'Income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  flex: 0.8
                }]}>
                  <Text style={[styles.typeText, {
                    color: transaction.type === 'Income' ? '#10b981' : '#ef4444'
                  }]}>
                    {transaction.type}
                  </Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1.2, color: colors.text }]}>
                  {transaction.category}
                </Text>
                <Text style={[styles.tableCell, {
                  flex: 1,
                  fontWeight: '600',
                  color: transaction.type === 'Income' ? '#10b981' : '#ef4444'
                }]}>
                  {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (reportType) {
      case 'overview':
        return renderOverviewTab();
      case 'animals':
        return renderAnimalsTab();
      case 'health':
        return renderHealthTab();
      case 'financial':
        return renderFinancialTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TopNavigation />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !refreshing ? (
          <LoadingIndicator message="Loading report data..." />
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Reports</Text>
                <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
                  Analytics & insights for {currentFarm?.name || 'your farm'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.exportButton, isGeneratingPdf && { opacity: 0.6 }]}
                onPress={generatePdf}
                disabled={isGeneratingPdf}
              >
                <LinearGradient
                  colors={[colors.secondary, colors.tint] as const}
                  style={styles.exportButtonGradient}
                >
                  <Download size={18} color="white" />
                  <Text style={styles.exportButtonText} numberOfLines={1}>
                    {isGeneratingPdf ? 'Generating...' : 'Export'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabNav}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(['overview', 'animals', 'health', 'financial'] as ReportType[]).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tabButton,
                      reportType === tab && styles.tabButtonActive,
                      { backgroundColor: reportType === tab ? colors.tint : colors.card }
                    ]}
                    onPress={() => setReportType(tab)}
                  >
                    {tab === 'overview' && <PieChart size={16} color={reportType === tab ? 'white' : colors.text} />}
                    {tab === 'animals' && <Users size={16} color={reportType === tab ? 'white' : colors.text} />}
                    {tab === 'health' && <Heart size={16} color={reportType === tab ? 'white' : colors.text} />}
                    {tab === 'financial' && <DollarSign size={16} color={reportType === tab ? 'white' : colors.text} />}
                    <Text style={[
                      styles.tabButtonText,
                      { color: reportType === tab ? 'white' : colors.text }
                    ]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Filter Controls */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: colors.card }]}
                onPress={() => setShowFilterMenu(!showFilterMenu)}
              >
                <Calendar size={16} color={colors.text} />
                <Text style={[styles.filterButtonText, { color: colors.text }]}>
                  {filterPeriod === 'all' ? 'All Time' : filterPeriod.charAt(0).toUpperCase() + filterPeriod.slice(1)}
                </Text>
                <ChevronDown size={16} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: colors.card }]}
                onPress={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
              >
                <ArrowUpDown size={16} color={colors.text} />
                <Text style={[styles.filterButtonText, { color: colors.text }]}>
                  {sortDirection === 'desc' ? 'Newest' : 'Oldest'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter Menu */}
            {showFilterMenu && (
              <View style={[styles.filterMenu, { backgroundColor: colors.card }]}>
                {(['all', 'week', 'month', 'quarter', 'year'] as FilterPeriod[]).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.filterMenuItem,
                      filterPeriod === period && { backgroundColor: 'rgba(99, 102, 241, 0.1)' }
                    ]}
                    onPress={() => { setFilterPeriod(period); setShowFilterMenu(false); }}
                  >
                    <Text style={[
                      styles.filterMenuItemText,
                      { color: filterPeriod === period ? '#6366f1' : colors.text }
                    ]}>
                      {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                    </Text>
                    {filterPeriod === period && <CheckCircle size={16} color="#6366f1" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Tab Content */}
            {renderTabContent()}
          </>
        )}
      </ScrollView>

      {/* Animal Details Modal */}
      <Modal
        visible={showAnimalModal && !!selectedAnimal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnimalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Animal Details</Text>
              <TouchableOpacity onPress={() => setShowAnimalModal(false)}>
                <XCircle size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>
            {selectedAnimal && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.muted }]}>ID</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>{selectedAnimal.identificationNumber}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.muted }]}>Species</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>{selectedAnimal.species}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.muted }]}>Breed</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>{selectedAnimal.breed}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.muted }]}>Status</Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: selectedAnimal.status === 'Healthy' ? 'rgba(16, 185, 129, 0.1)' :
                      selectedAnimal.status === 'Sick' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: selectedAnimal.status === 'Healthy' ? '#10b981' :
                        selectedAnimal.status === 'Sick' ? '#ef4444' : '#6366f1'
                    }]}>
                      {selectedAnimal.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.muted }]}>Weight</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>{selectedAnimal.weight} {selectedAnimal.weightUnit}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.muted }]}>Current Value</Text>
                  <Text style={[styles.modalValue, { color: '#10b981', fontWeight: '700' }]}>
                    {formatCurrency(selectedAnimal.price || 0)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.muted }]}>Acquisition Price</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>
                    {formatCurrency(selectedAnimal.acquisitionPrice || 0)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.muted }]}>Appreciation</Text>
                  <Text style={[styles.modalValue, {
                    color: (selectedAnimal.price || 0) - (selectedAnimal.acquisitionPrice || 0) >= 0 ? '#10b981' : '#ef4444',
                    fontWeight: '600'
                  }]}>
                    {(selectedAnimal.price || 0) - (selectedAnimal.acquisitionPrice || 0) >= 0 ? '+' : ''}
                    {formatCurrency((selectedAnimal.price || 0) - (selectedAnimal.acquisitionPrice || 0))}
                  </Text>
                </View>
                {selectedAnimal.notes && (
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.muted }]}>Notes</Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>{selectedAnimal.notes}</Text>
                  </View>
                )}
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAnimalModal(false)}
            >
              <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.modalCloseButtonGradient}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    rowGap: 10,
    columnGap: 12,
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    minWidth: 220,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  exportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  exportButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  tabNav: {
    marginBottom: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    gap: 8,
  },
  tabButtonActive: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterMenu: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  filterMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterMenuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -1,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  heroDecoration: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metricGradient: {
    padding: 14,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 2,
  },
  expandableTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expandableTitleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandableContent: {
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  breakdownValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownCount: {
    fontSize: 14,
    fontWeight: '600',
    width: 30,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownPercent: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryValues: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryValue: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  incomeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  expenseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  animalSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  animalSummaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  animalSummaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  animalSummaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  tableContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tableCell: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  healthSummaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  healthSummaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  healthSummaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  healthSummaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  healthTypesContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  healthTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  healthTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  healthTypeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  healthTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  healthTypeCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  financialOverviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  financialOverviewCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  financialOverviewLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  financialOverviewValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  assetPerformanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  assetPerformanceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  assetPerformanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  assetPerformanceItem: {
    width: '45%',
    marginBottom: 8,
  },
  assetLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  assetValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  modalBody: {
    padding: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalCloseButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
