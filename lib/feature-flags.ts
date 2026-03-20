export type FeatureStatus = "enabled" | "coming-soon" | "disabled"

export interface FeatureFlag {
  key: string
  label: string
  description: string
  status: FeatureStatus
  icon?: string
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  SCAN_LABEL: {
    key: "SCAN_LABEL",
    label: "Scanner une étiquette",
    description: "Identifiez instantanément un vin en photographiant son étiquette.",
    status: "enabled",
    icon: "Camera",
  },
  ENRICH_WINE: {
    key: "ENRICH_WINE",
    label: "Enrichissement web",
    description: "Récupérez automatiquement la description, l'apogée et le prix moyen d'un vin.",
    status: "enabled",
    icon: "Globe",
  },
  MULTI_CAVE: {
    key: "MULTI_CAVE",
    label: "Multi-cave",
    description: "Gérez plusieurs caves (ex: Paris, La Baule) depuis une seule app.",
    status: "enabled",
    icon: "Layers",
  },
}

export function isEnabled(key: string): boolean {
  return FEATURE_FLAGS[key]?.status === "enabled"
}

export function isComingSoon(key: string): boolean {
  return FEATURE_FLAGS[key]?.status === "coming-soon"
}

export function getComingSoonFeatures(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter((f) => f.status === "coming-soon")
}
