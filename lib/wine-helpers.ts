import { REGIONS } from "@/data/regions"

/** Map wine_type to a color key */
export function getColor(type: string): "red" | "white" | "sparkling" | "rose" | "unknown" {
  if (type === "wine_red") return "red"
  if (type === "wine_white") return "white"
  if (type === "wine_white_sparkling") return "sparkling"
  if (type === "wine_rose") return "rose"
  return "unknown"
}

/** Human-readable label with emoji */
export function getLabel(type: string): string {
  if (type === "wine_red") return "Rouge"
  if (type === "wine_white") return "Blanc"
  if (type === "wine_white_sparkling") return "Petillant"
  if (type === "wine_rose") return "Ros\u00E9"
  return "Inconnu"
}

/** Emoji icon by wine type */
export function getIcon(type: string): string {
  if (type === "wine_red") return "\uD83C\uDF77"
  if (type === "wine_white") return "\uD83E\uDD42"
  if (type === "wine_rose") return "\uD83C\uDF78"
  return "\u2728"
}

/** Sanitize a wine text field — replaces underscores with spaces and trims */
export function sanitizeWineName(name: string | null | undefined): string {
  if (!name) return ""
  return String(name).replace(/_/g, " ").trim()
}

/** Format a wine_region key to a nice label */
export function formatRegion(key: string): string {
  const region = REGIONS[key]
  if (region) return region.label
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
