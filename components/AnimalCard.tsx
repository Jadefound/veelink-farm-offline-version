import React, { memo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, GestureResponderEvent } from "react-native";
import { Image } from "expo-image";
import { Edit } from "lucide-react-native";
import { Animal } from "@/types";
import { formatDate, calculateAge } from "@/utils/helpers";
import { useThemeStore } from "@/store/themeStore";
import Colors from "@/constants/colors";
import Card from "./Card";
import { useRouter } from "expo-router";
import { getAnimalImage, getSpeciesColor } from "@/utils/animalImages";

interface AnimalCardProps {
  animal: Animal;
  onPress: (animal: Animal) => void;
  onEdit?: (animal: Animal) => void;
  compact?: boolean;
}

// Get status color
const getStatusColor = (status: string, colors: any) => {
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

function AnimalCard({
  animal,
  onPress,
  onEdit,
  compact = false,
}: AnimalCardProps) {
  const { isDarkMode } = useThemeStore();
  const colors = isDarkMode ? Colors.dark : Colors.light;
  const router = useRouter();

  const handleEdit = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (onEdit) {
      onEdit(animal);
    } else {
      router.push(`/animal/edit/${animal.id}`);
    }
  };

  const statusColor = getStatusColor(animal.status, colors);
  const imageSource = getAnimalImage(animal.species);
  const placeholderColor = getSpeciesColor(animal.species);

  if (compact) {
    return (
      <TouchableOpacity onPress={() => onPress(animal)} activeOpacity={0.7}>
        <View style={[styles.compactCard, { backgroundColor: colors.card }]}>
          <Image
            source={imageSource}
            style={[styles.compactImage, { backgroundColor: placeholderColor }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          <View style={styles.compactContent}>
            <Text style={[styles.compactId, { color: colors.text }]}>
              ID: {animal.identificationNumber}
            </Text>
            <Text style={[styles.compactSpecies, { color: colors.muted }]}>
              {animal.species} • {animal.breed}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.compactEditButton,
              { backgroundColor: colors.surface },
            ]}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Edit size={16} color={colors.tint} />
          </TouchableOpacity>
          <View
            style={[
              styles.compactStatusBadge,
              { backgroundColor: statusColor },
            ]}
          >
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
            source={imageSource}
            style={[styles.image, { backgroundColor: placeholderColor }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          <View style={styles.headerContent}>
            <Text style={[styles.id, { color: colors.text }]}>
              ID: {animal.identificationNumber}
            </Text>
            <Text style={[styles.species, { color: colors.muted }]}>
              {animal.species}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.surface }]}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Edit size={20} color={colors.tint} />
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>
              Breed:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {animal.breed}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>
              Gender:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {animal.gender}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>
              Age:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {calculateAge(animal.birthDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.muted }]}>
              Weight:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {animal.weight} {animal.weightUnit}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.footer,
            { borderTopColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor },
            ]}
          >
            <Text style={styles.statusText}>{animal.status}</Text>
          </View>
          <Text style={[styles.date, { color: colors.muted }]}>
            Added: {formatDate(animal.createdAt)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(AnimalCard);

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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 16,
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
  compactEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
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
