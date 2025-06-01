import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Animal } from "@/types";
import { formatDate, calculateAge } from "@/utils/helpers";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import Card from "./Card";

interface AnimalCardProps {
  animal: Animal;
  onPress: (animal: Animal) => void;
  compact?: boolean;
}

export default function AnimalCard({ animal, onPress, compact = false }: AnimalCardProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Get species-specific image
  const getAnimalImage = (species: string) => {
    switch (species.toLowerCase()) {
      case "cattle":
        return "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=1740&auto=format&fit=crop";
      case "sheep":
        return "https://images.unsplash.com/photo-1484557985045-edf25e08da73?q=80&w=1740&auto=format&fit=crop";
      case "goat":
        return "https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=1740&auto=format&fit=crop";
      case "pig":
        return "https://images.unsplash.com/photo-1593179357196-705d7578c5a3?q=80&w=1740&auto=format&fit=crop";
      case "chicken":
        return "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=1740&auto=format&fit=crop";
      case "duck":
        return "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=1740&auto=format&fit=crop";
      case "horse":
        return "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=1742&auto=format&fit=crop";
      default:
        return "https://images.unsplash.com/photo-1500595046743-cd271d694e30?q=80&w=1740&auto=format&fit=crop";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
        return colors.success;
      case "Sick":
        return colors.danger;
      case "Pregnant":
        return colors.info;
      case "ForSale":
        return colors.warning;
      case "Sold":
        return colors.muted;
      case "Deceased":
        return "#000000";
      default:
        return colors.muted;
    }
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={() => onPress(animal)} activeOpacity={0.7}>
        <View style={[styles.compactCard, { backgroundColor: colors.card }]}>
          <Image
            source={{ uri: getAnimalImage(animal.species) }}
            style={styles.compactImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.compactContent}>
            <Text style={[styles.compactId, { color: colors.text }]}>ID: {animal.identificationNumber}</Text>
            <Text style={[styles.compactSpecies, { color: colors.muted }]}>{animal.species} • {animal.breed}</Text>
          </View>
          <View style={[styles.compactStatusBadge, { backgroundColor: getStatusColor(animal.status) }]}>
            <Text style={styles.compactStatusText}>{animal.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={() => onPress(animal)} activeOpacity={0.7}>
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Image
            source={{ uri: getAnimalImage(animal.species) }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.headerContent}>
            <Text style={[styles.id, { color: colors.text }]}>ID: {animal.identificationNumber}</Text>
            <Text style={[styles.species, { color: colors.muted }]}>{animal.species}</Text>
          </View>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Breed:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{animal.breed}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Gender:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{animal.gender}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Age:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{calculateAge(animal.birthDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>Weight:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{animal.weight} {animal.weightUnit}</Text>
          </View>
        </View>
        
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(animal.status) }]}>
            <Text style={styles.statusText}>{animal.status}</Text>
          </View>
          <Text style={[styles.date, { color: colors.muted }]}>Added: {formatDate(animal.createdAt)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 88,
    height: 88,
    borderTopLeftRadius: 16,
  },
  headerContent: {
    flex: 1,
    padding: 16,
  },
  id: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  species: {
    fontSize: 15,
    fontWeight: "500",
  },
  details: {
    padding: 16,
    paddingTop: 0,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Compact styles
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactId: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  compactSpecies: {
    fontSize: 13,
    fontWeight: "500",
  },
  compactStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  compactStatusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
});