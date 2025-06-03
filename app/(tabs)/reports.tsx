import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { FileText, Download, Filter, ChevronDown, Calendar, ArrowUpDown, FileBarChart } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { useAnimalStore } from "@/store/animalStore";
import { useHealthStore } from "@/store/healthStore";
import { useFinancialStore } from "@/store/financialStore";
import { useFarmStore } from "@/store/farmStore";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import Card from "@/components/Card";
import Button from "@/components/Button";
import LoadingIndicator from "@/components/LoadingIndicator";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { Animal, HealthRecord, Transaction } from "@/types";
import TopNavigation from "@/components/TopNavigation";
import { mockAnimals, mockHealthRecords, mockTransactions, mockFarms } from "@/utils/mockData";

// Define report types
type ReportType = "animals" | "health" | "financial";

// Define filter options
type FilterPeriod = "all" | "week" | "month" | "quarter" | "year";
type SortDirection = "asc" | "desc";

export default function ReportsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("animals");
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // HARDCODED: Use mock data directly instead of store
  const animals = mockAnimals;
  const healthRecords = mockHealthRecords;
  const transactions = mockTransactions;
  const currentFarm = mockFarms[0]; // Use first farm as current
  const isLoading = false;

  const { isDarkMode } = useThemeStore();

  const colors = isDarkMode ? Colors.dark : Colors.light;

  const loadData = async () => {
    // Mock function - no longer needed
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 500);
  };

  // Filter data based on selected period
  const getFilteredData = () => {
    const now = new Date();
    let startDate = new Date(0); // Default to all time

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

    if (reportType === "animals") {
      return animals.filter(animal => {
        const createdAt = new Date(animal.createdAt).getTime();
        return filterPeriod === "all" || createdAt >= startTimestamp;
      }).sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
    } else if (reportType === "health") {
      return healthRecords.filter(record => {
        const recordDate = new Date(record.date).getTime();
        return filterPeriod === "all" || recordDate >= startTimestamp;
      }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
    } else {
      return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date).getTime();
        return filterPeriod === "all" || transactionDate >= startTimestamp;
      }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
    }
  };

  // Generate HTML for PDF export
  const generateReportHtml = () => {
    const data = getFilteredData();
    const farmName = currentFarm?.name || "Farm";
    const reportDate = new Date().toLocaleDateString();
    const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;

    // Common styles for the PDF
    const styles = `
      <style>
        body {
          font-family: 'Helvetica', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 2px solid #3498db;
        }
        .farm-name {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
          margin: 0;
        }
        .report-title {
          font-size: 20px;
          color: #3498db;
          margin: 5px 0;
        }
        .report-date {
          font-size: 14px;
          color: #7f8c8d;
          margin: 5px 0;
        }
        .filter-info {
          font-size: 14px;
          color: #7f8c8d;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background-color: #3498db;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: bold;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e0e0e0;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .summary {
          margin-top: 30px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 5px;
          border-left: 4px solid #3498db;
        }
        .summary-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #2c3e50;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 12px;
          color: #7f8c8d;
          border-top: 1px solid #e0e0e0;
          padding-top: 10px;
        }
      </style>
    `;

    // Generate table based on report type
    let tableHtml = '';
    let summaryHtml = '';

    if (reportType === "animals") {
      // Animals table
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Species</th>
              <th>Breed</th>
              <th>Gender</th>
              <th>Status</th>
              <th>Weight</th>
              <th>Birth Date</th>
            </tr>
          </thead>
          <tbody>
            ${(data as Animal[]).map(animal => `
              <tr>
                <td>${animal.identificationNumber}</td>
                <td>${animal.species}</td>
                <td>${animal.breed}</td>
                <td>${animal.gender}</td>
                <td>${animal.status}</td>
                <td>${animal.weight} ${animal.weightUnit}</td>
                <td>${formatDate(animal.birthDate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Summary for animals
      const totalAnimals = (data as Animal[]).length;
      const speciesCount = (data as Animal[]).reduce((acc, animal) => {
        acc[animal.species] = (acc[animal.species] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      summaryHtml = `
        <div class="summary">
          <div class="summary-title">Summary</div>
          <p>Total Animals: ${totalAnimals}</p>
          <p>Species Breakdown:</p>
          <ul>
            ${Object.entries(speciesCount).map(([species, count]) =>
        `<li>${species}: ${count} (${((count / totalAnimals) * 100).toFixed(1)}%)</li>`
      ).join('')}
          </ul>
        </div>
      `;
    } else if (reportType === "health") {
      // Health records table
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Animal ID</th>
              <th>Type</th>
              <th>Diagnosis</th>
              <th>Treatment</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            ${(data as HealthRecord[]).map(record => `
              <tr>
                <td>${formatDate(record.date)}</td>
                <td>${record.animalId}</td>
                <td>${record.type}</td>
                <td>${record.diagnosis}</td>
                <td>${record.treatment}</td>
                <td>${formatCurrency(record.cost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Summary for health records
      const totalRecords = (data as HealthRecord[]).length;
      const totalCost = (data as HealthRecord[]).reduce((sum, record) => sum + record.cost, 0);
      const typeCount = (data as HealthRecord[]).reduce((acc, record) => {
        acc[record.type] = (acc[record.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      summaryHtml = `
        <div class="summary">
          <div class="summary-title">Summary</div>
          <p>Total Health Records: ${totalRecords}</p>
          <p>Total Cost: ${formatCurrency(totalCost)}</p>
          <p>Record Types:</p>
          <ul>
            ${Object.entries(typeCount).map(([type, count]) =>
        `<li>${type}: ${count} (${((count / totalRecords) * 100).toFixed(1)}%)</li>`
      ).join('')}
          </ul>
        </div>
      `;
    } else {
      // Financial transactions table
      tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${(data as Transaction[]).map(transaction => `
              <tr>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.type}</td>
                <td>${transaction.category}</td>
                <td>${formatCurrency(transaction.amount)}</td>
                <td>${transaction.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Summary for financial transactions
      const totalIncome = (data as Transaction[])
        .filter(t => t.type === "Income")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = (data as Transaction[])
        .filter(t => t.type === "Expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = totalIncome - totalExpense;

      const categoryBreakdown = (data as Transaction[]).reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      summaryHtml = `
        <div class="summary">
          <div class="summary-title">Financial Summary</div>
          <p>Total Income: ${formatCurrency(totalIncome)}</p>
          <p>Total Expenses: ${formatCurrency(totalExpense)}</p>
          <p>Net Profit: ${formatCurrency(netProfit)}</p>
          <p>Category Breakdown:</p>
          <ul>
            ${Object.entries(categoryBreakdown).map(([category, amount]) =>
        `<li>${category}: ${formatCurrency(amount)}</li>`
      ).join('')}
          </ul>
        </div>
      `;
    }

    // Combine all HTML parts
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          ${styles}
        </head>
        <body>
          <div class="header">
            <h1 class="farm-name">${farmName}</h1>
            <h2 class="report-title">${reportTitle}</h2>
            <p class="report-date">Generated on: ${reportDate}</p>
          </div>
          
          <div class="filter-info">
            <p>Period: ${filterPeriod === "all" ? "All Time" : filterPeriod.charAt(0).toUpperCase() + filterPeriod.slice(1)}</p>
            <p>Sort Order: ${sortDirection === "asc" ? "Oldest First" : "Newest First"}</p>
          </div>
          
          ${tableHtml}
          ${summaryHtml}
          
          <div class="footer">
            <p>Generated by Veelink Farm Management System</p>
          </div>
        </body>
      </html>
    `;
  };

  // Generate and share PDF
  const generatePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const html = generateReportHtml();
      const { uri } = await Print.printToFileAsync({ html });

      const reportTypeName = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      const fileName = `${reportTypeName}_Report_${new Date().toISOString().split('T')[0]}.pdf`;

      await shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share ${reportTypeName} Report`
      });
      setIsGeneratingPdf(false);
    } catch (error) {
      setIsGeneratingPdf(false);
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    }
  };

  // Render table headers based on report type
  const renderTableHeaders = () => {
    if (reportType === "animals") {
      return (
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, color: colors.text }]}>ID</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, color: colors.text }]}>Species</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, color: colors.text }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, color: colors.text }]}>Weight</Text>
        </View>
      );
    } else if (reportType === "health") {
      return (
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, color: colors.text }]}>Date</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, color: colors.text }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, color: colors.text }]}>Animal</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, color: colors.text }]}>Cost</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, color: colors.text }]}>Date</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, color: colors.text }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, color: colors.text }]}>Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, color: colors.text }]}>Amount</Text>
        </View>
      );
    }
  };

  // Render table rows based on report type
  const renderTableRows = () => {
    const data = getFilteredData();

    if (data.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <FileText size={40} color={colors.muted} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            No data available for the selected filters
          </Text>
        </View>
      );
    }

    if (reportType === "animals") {
      return (data as Animal[]).map((animal, index) => (
        <View
          key={animal.id}
          style={[
            styles.tableRow,
            { backgroundColor: index % 2 === 0 ? colors.card : colors.background }
          ]}
        >
          <Text style={[styles.tableCell, { flex: 1.5, color: colors.text }]}>
            {animal.identificationNumber}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
            {animal.species}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
            {animal.status}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
            {animal.weight} {animal.weightUnit}
          </Text>
        </View>
      ));
    } else if (reportType === "health") {
      return (data as HealthRecord[]).map((record, index) => (
        <View
          key={record.id}
          style={[
            styles.tableRow,
            { backgroundColor: index % 2 === 0 ? colors.card : colors.background }
          ]}
        >
          <Text style={[styles.tableCell, { flex: 1.2, color: colors.text }]}>
            {formatDate(record.date)}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
            {record.type}
          </Text>
          <Text style={[styles.tableCell, { flex: 1.5, color: colors.text }]}>
            {record.animalId}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
            {formatCurrency(record.cost)}
          </Text>
        </View>
      ));
    } else {
      return (data as Transaction[]).map((transaction, index) => (
        <View
          key={transaction.id}
          style={[
            styles.tableRow,
            { backgroundColor: index % 2 === 0 ? colors.card : colors.background }
          ]}
        >
          <Text style={[styles.tableCell, { flex: 1.2, color: colors.text }]}>
            {formatDate(transaction.date)}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, color: colors.text }]}>
            {transaction.type}
          </Text>
          <Text style={[styles.tableCell, { flex: 1.5, color: colors.text }]}>
            {transaction.category}
          </Text>
          <Text
            style={[
              styles.tableCell,
              {
                flex: 1,
                color: transaction.type === "Income" ? colors.success : colors.danger
              }
            ]}
          >
            {formatCurrency(transaction.amount)}
          </Text>
        </View>
      ));
    }
  };

  // Render summary based on report type
  const renderSummary = () => {
    const data = getFilteredData();

    if (data.length === 0) {
      return null;
    }

    if (reportType === "animals") {
      const totalAnimals = (data as Animal[]).length;
      const speciesCount = (data as Animal[]).reduce((acc, animal) => {
        acc[animal.species] = (acc[animal.species] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (
        <Card style={{
          backgroundColor: colors.card,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Summary</Text>
          <Text style={[styles.summaryText, { color: colors.text }]}>
            Total Animals: {totalAnimals}
          </Text>
          <Text style={[styles.summarySubtitle, { color: colors.text }]}>Species Breakdown:</Text>
          {Object.entries(speciesCount).map(([species, count]) => (
            <View key={species} style={styles.summaryItem}>
              <Text style={[styles.summaryItemText, { color: colors.text }]}>
                {species}: {count} ({((count / totalAnimals) * 100).toFixed(1)}%)
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${(count / totalAnimals) * 100}%`,
                      backgroundColor: colors.tint
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>
      );
    } else if (reportType === "health") {
      const totalRecords = (data as HealthRecord[]).length;
      const totalCost = (data as HealthRecord[]).reduce((sum, record) => sum + record.cost, 0);
      const typeCount = (data as HealthRecord[]).reduce((acc, record) => {
        acc[record.type] = (acc[record.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return (
        <Card style={{
          backgroundColor: colors.card,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Summary</Text>
          <Text style={[styles.summaryText, { color: colors.text }]}>
            Total Health Records: {totalRecords}
          </Text>
          <Text style={[styles.summaryText, { color: colors.text }]}>
            Total Cost: {formatCurrency(totalCost)}
          </Text>
          <Text style={[styles.summarySubtitle, { color: colors.text }]}>Record Types:</Text>
          {Object.entries(typeCount).map(([type, count]) => (
            <View key={type} style={styles.summaryItem}>
              <Text style={[styles.summaryItemText, { color: colors.text }]}>
                {type}: {count} ({((count / totalRecords) * 100).toFixed(1)}%)
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${(count / totalRecords) * 100}%`,
                      backgroundColor: colors.secondary
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>
      );
    } else {
      const totalIncome = (data as Transaction[])
        .filter(t => t.type === "Income")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = (data as Transaction[])
        .filter(t => t.type === "Expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = totalIncome - totalExpense;

      const categoryBreakdown = (data as Transaction[]).reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      const maxAmount = Math.max(...Object.values(categoryBreakdown));

      return (
        <Card style={{
          backgroundColor: colors.card,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Financial Summary</Text>
          <View style={styles.financialSummary}>
            <View style={styles.financialSummaryItem}>
              <Text style={[styles.financialSummaryLabel, { color: colors.text }]}>Income</Text>
              <Text style={[styles.financialSummaryValue, { color: colors.success }]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View style={styles.financialSummaryItem}>
              <Text style={[styles.financialSummaryLabel, { color: colors.text }]}>Expenses</Text>
              <Text style={[styles.financialSummaryValue, { color: colors.danger }]}>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
            <View style={styles.financialSummaryItem}>
              <Text style={[styles.financialSummaryLabel, { color: colors.text }]}>Net Profit</Text>
              <Text
                style={[
                  styles.financialSummaryValue,
                  { color: netProfit >= 0 ? colors.success : colors.danger }
                ]}
              >
                {formatCurrency(netProfit)}
              </Text>
            </View>
          </View>

          <Text style={[styles.summarySubtitle, { color: colors.text }]}>Category Breakdown:</Text>
          {Object.entries(categoryBreakdown).map(([category, amount]) => (
            <View key={category} style={styles.summaryItem}>
              <View style={styles.summaryItemHeader}>
                <Text style={[styles.summaryItemText, { color: colors.text }]}>
                  {category}
                </Text>
                <Text style={[styles.summaryItemAmount, { color: colors.text }]}>
                  {formatCurrency(amount)}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${(amount / maxAmount) * 100}%`,
                      backgroundColor: colors.tint
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopNavigation />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading && !refreshing ? (
          <LoadingIndicator message="Loading report data..." />
        ) : (
          <>
            <View style={styles.header}>
              <LinearGradient
                colors={isDarkMode ? ['#1a2a3a', '#0d1520'] : ['#3498db', '#2980b9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
              >
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>Reports</Text>
                  <Text style={styles.headerSubtitle}>
                    Generate and export detailed reports
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.reportTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.reportTypeButton,
                  reportType === "animals" && [styles.activeReportType, { borderColor: colors.tint }]
                ]}
                onPress={() => setReportType("animals")}
              >
                <Text
                  style={[
                    styles.reportTypeText,
                    { color: reportType === "animals" ? colors.tint : colors.text }
                  ]}
                >
                  Animals
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.reportTypeButton,
                  reportType === "health" && [styles.activeReportType, { borderColor: colors.secondary }]
                ]}
                onPress={() => setReportType("health")}
              >
                <Text
                  style={[
                    styles.reportTypeText,
                    { color: reportType === "health" ? colors.secondary : colors.text }
                  ]}
                >
                  Health
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.reportTypeButton,
                  reportType === "financial" && [styles.activeReportType, { borderColor: colors.success }]
                ]}
                onPress={() => setReportType("financial")}
              >
                <Text
                  style={[
                    styles.reportTypeText,
                    { color: reportType === "financial" ? colors.success : colors.text }
                  ]}
                >
                  Financial
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={[styles.filterButton, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setShowFilterMenu(!showFilterMenu);
                    setShowSortMenu(false);
                  }}
                >
                  <Calendar size={16} color={colors.text} style={styles.filterIcon} />
                  <Text style={[styles.filterButtonText, { color: colors.text }]}>
                    {filterPeriod === "all" ? "All Time" : filterPeriod.charAt(0).toUpperCase() + filterPeriod.slice(1)}
                  </Text>
                  <ChevronDown size={16} color={colors.text} />
                </TouchableOpacity>

                {showFilterMenu && (
                  <View style={[styles.filterMenu, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                      style={styles.filterMenuItem}
                      onPress={() => {
                        setFilterPeriod("all");
                        setShowFilterMenu(false);
                      }}
                    >
                      <Text style={[styles.filterMenuItemText, { color: colors.text }]}>All Time</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.filterMenuItem}
                      onPress={() => {
                        setFilterPeriod("week");
                        setShowFilterMenu(false);
                      }}
                    >
                      <Text style={[styles.filterMenuItemText, { color: colors.text }]}>Last Week</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.filterMenuItem}
                      onPress={() => {
                        setFilterPeriod("month");
                        setShowFilterMenu(false);
                      }}
                    >
                      <Text style={[styles.filterMenuItemText, { color: colors.text }]}>Last Month</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.filterMenuItem}
                      onPress={() => {
                        setFilterPeriod("quarter");
                        setShowFilterMenu(false);
                      }}
                    >
                      <Text style={[styles.filterMenuItemText, { color: colors.text }]}>Last Quarter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.filterMenuItem}
                      onPress={() => {
                        setFilterPeriod("year");
                        setShowFilterMenu(false);
                      }}
                    >
                      <Text style={[styles.filterMenuItemText, { color: colors.text }]}>Last Year</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={[styles.filterButton, { backgroundColor: colors.card }]}
                  onPress={() => {
                    setShowSortMenu(!showSortMenu);
                    setShowFilterMenu(false);
                  }}
                >
                  <ArrowUpDown size={16} color={colors.text} style={styles.filterIcon} />
                  <Text style={[styles.filterButtonText, { color: colors.text }]}>
                    {sortDirection === "desc" ? "Newest First" : "Oldest First"}
                  </Text>
                  <ChevronDown size={16} color={colors.text} />
                </TouchableOpacity>

                {showSortMenu && (
                  <View style={[styles.filterMenu, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                      style={styles.filterMenuItem}
                      onPress={() => {
                        setSortDirection("desc");
                        setShowSortMenu(false);
                      }}
                    >
                      <Text style={[styles.filterMenuItemText, { color: colors.text }]}>Newest First</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.filterMenuItem}
                      onPress={() => {
                        setSortDirection("asc");
                        setShowSortMenu(false);
                      }}
                    >
                      <Text style={[styles.filterMenuItemText, { color: colors.text }]}>Oldest First</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.exportButton,
                  { backgroundColor: colors.tint },
                  isGeneratingPdf && { opacity: 0.7 }
                ]}
                onPress={generatePdf}
                disabled={isGeneratingPdf}
              >
                <Download size={16} color="#fff" style={styles.exportIcon} />
                <Text style={styles.exportButtonText}>
                  {isGeneratingPdf ? "Generating..." : "Export PDF"}
                </Text>
              </TouchableOpacity>
            </View>

            <Card style={{
              backgroundColor: colors.card,
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Text style={[styles.tableTitle, { color: colors.text }]}>
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
              </Text>

              <View style={styles.tableContainer}>
                {renderTableHeaders()}
                {renderTableRows()}
              </View>
            </Card>

            {renderSummary()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerGradient: {
    borderRadius: 16,
  },
  headerContent: {
    padding: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  reportTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reportTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeReportType: {
    borderBottomWidth: 2,
  },
  reportTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  filterSection: {
    position: 'relative',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 14,
    marginRight: 6,
  },
  filterMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 150,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  filterMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  filterMenuItemText: {
    fontSize: 14,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tableCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  tableCell: {
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 8,
  },
  summarySubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
  },
  summaryItem: {
    marginBottom: 12,
  },
  summaryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryItemText: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryItemAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  financialSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  financialSummaryItem: {
    minWidth: width / 3.5,
    marginBottom: 12,
  },
  financialSummaryLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  financialSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});