import Colors from "@/constants/colors";

type ColorTheme = typeof Colors.light;

/**
 * Get the color for an animal/health status string.
 * Centralized so all components use consistent status coloring.
 *
 * @param status - The status string (case-insensitive)
 * @param colors - The current theme's color palette
 * @returns A hex color string
 */
export const getStatusColor = (
  status: string,
  colors: ColorTheme = Colors.light
): string => {
  if (!status) return colors.muted;

  switch (status.toLowerCase()) {
    case "healthy":
    case "active":
    case "good":
    case "lactating":
    case "growing":
      return colors.success;
    case "sick":
    case "critical":
    case "poor":
    case "dead":
      return colors.danger;
    case "pregnant":
      return colors.info;
    case "forsale":
    case "sold":
    case "recovering":
    case "moderate":
      return colors.warning;
    default:
      return colors.muted;
  }
};
