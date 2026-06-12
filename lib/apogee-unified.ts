/**
 * lib/apogee-unified.ts
 *
 * Source unique de vérité pour l'apogée d'un vin (MA-97).
 *
 * Priorité :
 *  1. Données enrichies (apogee_start / apogee_end) -> fenêtre IA, estimated=false
 *  2. Heuristique getApogee() -> fenêtre dérivée, estimated=true
 *
 * Seuils de statut (sur progress 0-1) :
 *  <  0.30  -> "garde"
 *  0.30-0.50 -> "optimal"
 *  0.50-0.85 -> "apogee"
 *  > 0.85   -> "urgent"
 *
 *  Avant la fenêtre : "garde"
 *  Après la fenêtre : "urgent"
 */

import type { Wine } from "@/data/apogee"
import { getApogee } from "@/data/apogee"
import type { WineEnrichment } from "@/lib/types"

export type UnifiedApogeeStatus = "garde" | "optimal" | "apogee" | "urgent"

export interface UnifiedApogee {
  /** Année de début de fenêtre (peut être null si non déterminable) */
  start: number | null
  /** Année de fin de fenêtre (peut être null si non déterminable) */
  end: number | null
  /** Statut calculé par seuils */
  status: UnifiedApogeeStatus
  /** Position 0-1 dans la fenêtre de vie totale du vin (naissance -> fin) */
  progress: number
  /** true si la fenêtre est estimée par heuristique (pas de données IA) */
  estimated: boolean
  /** Label lisible */
  label: string
}

// ── Mapping legacy -> unified ──────────────────────────────────────────────

/**
 * Convertit un statut unifié en st legacy ("wait"|"ok"|"late"|"urgent")
 * pour ne pas casser le scoring de lib/suggest-helpers.ts.
 *
 * garde   -> "wait"
 * optimal -> "ok"
 * apogee  -> "ok"   (fenêtre idéale, toujours valorisé positivement)
 * urgent  -> "urgent"
 */
export function unifiedToLegacySt(
  status: UnifiedApogeeStatus
): "wait" | "ok" | "late" | "urgent" {
  switch (status) {
    case "garde":
      return "wait"
    case "optimal":
      return "ok"
    case "apogee":
      return "ok"
    case "urgent":
      return "urgent"
  }
}

// ── Calcul progress + status depuis une fenêtre et l'année courante ─────────

function computeStatus(
  progress: number,
  beforeWindow: boolean,
  afterWindow: boolean
): UnifiedApogeeStatus {
  if (beforeWindow) return "garde"
  if (afterWindow) return "urgent"
  if (progress < 0.3) return "garde"
  if (progress < 0.5) return "optimal"
  if (progress <= 0.85) return "apogee"
  return "urgent"
}

// ── Dérivation de fenêtre depuis la logique heuristique ────────────────────

const APOGEE_RULES: Record<string, Record<string, { min: number; max: number }>> = {
  wine_white_sparkling: {
    champagne: { min: 3, max: 10 },
    veneto: { min: 1, max: 3 },
    default: { min: 1, max: 4 },
  },
  wine_white: {
    bourgogne: { min: 3, max: 12 },
    vallee_de_la_loire: { min: 2, max: 10 },
    alsace: { min: 2, max: 8 },
    savoie_et_bugey: { min: 1, max: 4 },
    moselle: { min: 3, max: 15 },
    rheingau: { min: 3, max: 12 },
    autriche: { min: 2, max: 8 },
    marlborough: { min: 1, max: 5 },
    rias_baixas: { min: 1, max: 4 },
    default: { min: 1, max: 5 },
  },
  wine_red: {
    bordeaux: { min: 5, max: 20 },
    bourgogne: { min: 4, max: 15 },
    vallee_du_rhone: { min: 4, max: 15 },
    vallee_de_la_loire: { min: 2, max: 8 },
    toscane: { min: 4, max: 15 },
    piemont: { min: 5, max: 20 },
    veneto: { min: 3, max: 12 },
    rioja: { min: 3, max: 12 },
    ribera_del_duero: { min: 4, max: 15 },
    priorat: { min: 4, max: 15 },
    douro: { min: 3, max: 10 },
    napa: { min: 4, max: 15 },
    sonoma: { min: 3, max: 12 },
    oregon: { min: 3, max: 10 },
    mendoza: { min: 2, max: 8 },
    chili: { min: 2, max: 8 },
    barossa: { min: 4, max: 15 },
    mclaren: { min: 3, max: 12 },
    stellenbosch: { min: 3, max: 10 },
    default: { min: 2, max: 7 },
  },
  wine_unknown: {
    default: { min: 1, max: 5 },
  },
}

/**
 * Dérive start/end depuis les règles heuristiques sans modifier getApogee().
 */
function deriveWindowFromHeuristic(
  wine: Wine
): { start: number | null; end: number | null } {
  const y = parseInt(String(wine.millesime_year))
  if (!y || isNaN(y)) return { start: null, end: null }

  const typeRules =
    APOGEE_RULES[wine.wine_type || ""] || APOGEE_RULES.wine_unknown
  const rule =
    (wine.wine_region ? typeRules[wine.wine_region] : undefined) ||
    typeRules.default

  if (!rule) return { start: null, end: null }

  return { start: y + rule.min, end: y + rule.max }
}

// ── API principale ──────────────────────────────────────────────────────────

/**
 * Calcule l'apogée unifiée d'un vin.
 *
 * @param wine      - objet Wine (millesime_year, wine_type, wine_region requis pour l'heuristique)
 * @param enrichment - données Supabase enrichies (optionnel) ; si fourni et que apogee_start/end existent, prioritaire
 *
 * AC2 : toujours retourne un objet non-null avec estimated=true si pas d'enrichissement.
 * AC4 : si enrichment fourni mais sans apogee, fallback heuristique sans crash.
 */
export function getUnifiedApogee(
  wine: Wine,
  enrichment?: WineEnrichment | null
): UnifiedApogee | null {
  const now = new Date().getFullYear()
  const millesime = parseInt(String(wine.millesime_year))
  if (!millesime || isNaN(millesime)) return null

  // 1. Fenêtre IA si disponible
  const iaStart = enrichment?.apogee_start ?? null
  const iaEnd = enrichment?.apogee_end ?? null
  const hasIaWindow = iaStart !== null && iaEnd !== null

  let start: number | null
  let end: number | null
  let estimated: boolean

  if (hasIaWindow) {
    start = iaStart
    end = iaEnd
    estimated = false
  } else {
    // Fallback heuristique (AC2 : toujours une barre, jamais masquée)
    const derived = deriveWindowFromHeuristic(wine)
    start = derived.start
    end = derived.end
    estimated = true

    // Si on n'a pas pu dériver non plus, tenter getApogee comme filet
    if (start === null || end === null) {
      const legacy = getApogee(wine)
      if (!legacy) return null
      let status: UnifiedApogeeStatus
      if (legacy.st === "wait") status = "garde"
      else if (legacy.st === "urgent") status = "urgent"
      else if (legacy.st === "late") status = "urgent"
      else status = "optimal"
      return {
        start: null,
        end: null,
        status,
        progress: status === "garde" ? 0.1 : status === "urgent" ? 0.95 : 0.6,
        estimated: true,
        label: legacy.label,
      }
    }
  }

  // 2. Calcul progress
  // progress = position de now dans [millesime, end]
  const lifespan = end - millesime
  const beforeWindow = now < (start ?? 0)
  const afterWindow = now > (end ?? 0)

  let progress: number
  if (lifespan <= 0) {
    progress = afterWindow ? 1 : 0
  } else {
    progress = Math.max(0, Math.min(1, (now - millesime) / lifespan))
  }

  const status = computeStatus(progress, beforeWindow, afterWindow)

  // 3. Label
  let label: string
  if (beforeWindow && start !== null) {
    const wait = start - now
    label = `À garder ~${wait} an${wait > 1 ? "s" : ""} (${start}–${end})`
  } else if (afterWindow) {
    label = `Apogée dépassée (${start}–${end})`
  } else if (end !== null && end - now <= 2) {
    label = `À boire bientôt (avant ${end})`
  } else {
    label = `Apogée ${start}–${end}`
  }

  return { start, end, status, progress, estimated, label }
}
