import { describe, expect, it } from "vitest"
import { getUnifiedApogee, unifiedToLegacySt } from "@/lib/apogee-unified"
import type { Wine } from "@/data/apogee"
import type { WineEnrichment } from "@/lib/types"

// Vin de référence : Bordeaux rouge 2015 (maintenant 2026, age=11, fenêtre heuristique 2020-2035)
const bordeauxRouge2015: Wine = {
  wine_name: "Test Bordeaux",
  millesime_year: 2015,
  wine_type: "wine_red",
  wine_region: "bordeaux",
}

// Vin sans millésime
const wineNoMillesime: Wine = {
  wine_name: "Sans millésime",
}

// Vin récent (2024) -> devrait être en "garde"
const youngWine: Wine = {
  wine_name: "Jeune Bordeaux",
  millesime_year: 2024,
  wine_type: "wine_red",
  wine_region: "bordeaux",
}

// Vin très vieux (1980) -> devrait être "urgent"
const oldWine: Wine = {
  wine_name: "Vieux Bordeaux",
  millesime_year: 1980,
  wine_type: "wine_red",
  wine_region: "bordeaux",
}

// Enrichissement IA avec fenêtre explicite
function makeEnrichment(
  apogee_start: number | null,
  apogee_end: number | null
): WineEnrichment {
  return {
    id: "enr-1",
    wine_id: "wine-1",
    user_id: "user-1",
    description: null,
    grape_varieties: null,
    taste_profile: null,
    critic_score: null,
    price_min: null,
    price_max: null,
    apogee_start,
    apogee_end,
    apogee_status: null,
    food_pairings: null,
    domaine_history: null,
    domaine_style: null,
    bottle_image_url: null,
    created_at: "",
    updated_at: "",
  }
}

describe("getUnifiedApogee", () => {
  it("retourne null si pas de millésime", () => {
    expect(getUnifiedApogee(wineNoMillesime)).toBeNull()
  })

  // ── Fenêtre IA ─────────────────────────────────────────────────────────

  it("utilise la fenêtre IA si apogee_start/end fournis", () => {
    const enrichment = makeEnrichment(2025, 2035)
    const result = getUnifiedApogee(bordeauxRouge2015, enrichment)
    expect(result).not.toBeNull()
    expect(result!.start).toBe(2025)
    expect(result!.end).toBe(2035)
    expect(result!.estimated).toBe(false)
  })

  it("fallback heuristique si enrichissement sans apogee_start/end", () => {
    const enrichment = makeEnrichment(null, null)
    const result = getUnifiedApogee(bordeauxRouge2015, enrichment)
    expect(result).not.toBeNull()
    expect(result!.estimated).toBe(true)
    // Heuristique bordeaux rouge: min=5, max=20 -> 2020-2035
    expect(result!.start).toBe(2020)
    expect(result!.end).toBe(2035)
  })

  // ── Fallback heuristique ────────────────────────────────────────────────

  it("estimated=true si pas d'enrichissement", () => {
    const result = getUnifiedApogee(bordeauxRouge2015)
    expect(result).not.toBeNull()
    expect(result!.estimated).toBe(true)
  })

  it("fenêtre heuristique correcte pour Bordeaux rouge 2015", () => {
    const result = getUnifiedApogee(bordeauxRouge2015)
    expect(result!.start).toBe(2020) // 2015 + 5
    expect(result!.end).toBe(2035)   // 2015 + 20
  })

  // ── Les 4 seuils de statut ─────────────────────────────────────────────

  it("statut = garde pour un vin très jeune (avant fenêtre)", () => {
    const result = getUnifiedApogee(youngWine) // 2024, window 2029-2044
    expect(result).not.toBeNull()
    expect(result!.status).toBe("garde")
  })

  it("statut = urgent pour un vin très vieux (après fenêtre)", () => {
    const result = getUnifiedApogee(oldWine) // 1980, window 1985-2000
    expect(result).not.toBeNull()
    expect(result!.status).toBe("urgent")
  })

  it("statut = apogee quand on est au milieu de la fenêtre", () => {
    // Bordeaux 2015 avec fenêtre IA 2010-2040, now=2026 -> progress=(2026-2015)/(2040-2015)=11/25=0.44 -> optimal
    // Utilisons une fenêtre où 2026 tombe en zone apogee (50-85%)
    // Fenêtre 2020-2030: lifespan=2030-2015=15, progress=(2026-2015)/15=11/15=0.733 -> apogee
    const enrichment = makeEnrichment(2020, 2030)
    const result = getUnifiedApogee(bordeauxRouge2015, enrichment)
    expect(result!.status).toBe("apogee")
  })

  it("statut = optimal quand progress entre 30% et 50%", () => {
    // Bordeaux 2015 avec fenêtre IA 2010-2045: lifespan=2045-2015=30, progress=(2026-2015)/30=11/30=0.367 -> optimal
    const enrichment = makeEnrichment(2010, 2045)
    const result = getUnifiedApogee(bordeauxRouge2015, enrichment)
    expect(result!.status).toBe("optimal")
  })

  // ── estimated flag ─────────────────────────────────────────────────────

  it("estimated=false avec fenêtre IA valide", () => {
    const result = getUnifiedApogee(bordeauxRouge2015, makeEnrichment(2025, 2035))
    expect(result!.estimated).toBe(false)
  })

  it("estimated=true sans enrichissement (AC2 : jamais masqué)", () => {
    const result = getUnifiedApogee(bordeauxRouge2015)
    expect(result!.estimated).toBe(true)
  })

  // ── Cohérence même input = même output ─────────────────────────────────

  it("résultat déterministe: même input -> même output", () => {
    const r1 = getUnifiedApogee(bordeauxRouge2015)
    const r2 = getUnifiedApogee(bordeauxRouge2015)
    expect(r1).toEqual(r2)
  })
})

// Helpers pour construire un UnifiedApogee minimal à des fins de test
function makeLegacyInput(
  status: import("@/lib/apogee-unified").UnifiedApogeeStatus,
  progress: number,
  pastWindow: boolean,
  beforeWindow: boolean
): import("@/lib/apogee-unified").UnifiedApogee {
  return { start: 2020, end: 2030, status, progress, estimated: false, pastWindow, beforeWindow, label: "test" }
}

describe("unifiedToLegacySt — sémantique legacy exacte (B1/B2, MA-97)", () => {
  // Vin fenêtre dépassée -> legacy "urgent" (B2 : compte dans isDrinkNow/toDrink)
  it("fenêtre dépassée (pastWindow=true) -> urgent", () => {
    const input = makeLegacyInput("urgent", 1.0, true, false)
    expect(unifiedToLegacySt(input)).toBe("urgent")
  })

  // Vin dans la fenêtre, fin proche (progress > 0.85) -> legacy "late" (score neutre 0, B1)
  it("dans la fenêtre, progress > 0.85 -> late (score 0, neutre)", () => {
    const input = makeLegacyInput("urgent", 0.9, false, false)
    expect(unifiedToLegacySt(input)).toBe("late")
  })

  // Vin en zone optimale -> legacy "ok" (score +2)
  it("dans la fenêtre optimale (optimal, progress 0.4) -> ok", () => {
    const input = makeLegacyInput("optimal", 0.4, false, false)
    expect(unifiedToLegacySt(input)).toBe("ok")
  })

  // Vin apogée (peak) -> legacy "ok" (score +2)
  it("dans la fenêtre apogée (apogee, progress 0.65) -> ok", () => {
    const input = makeLegacyInput("apogee", 0.65, false, false)
    expect(unifiedToLegacySt(input)).toBe("ok")
  })

  // Vin en garde (avant fenêtre) -> legacy "wait" (score 0)
  it("avant la fenêtre (beforeWindow=true) -> wait", () => {
    const input = makeLegacyInput("garde", 0.1, false, true)
    expect(unifiedToLegacySt(input)).toBe("wait")
  })

  // Vérification scoring B1 : "late" doit rester neutre (0), pas -2 comme "urgent"
  it("B1 : late ne doit PAS être mappé urgent (scoring 0, pas -2)", () => {
    const input = makeLegacyInput("urgent", 0.88, false, false)
    const st = unifiedToLegacySt(input)
    expect(st).toBe("late")
    expect(st).not.toBe("urgent")
  })

  // Vérification B2 : isDrinkNow = urgent || late tous les deux présents
  it("B2 : urgent et late sont tous les deux des candidats isDrinkNow", () => {
    const urgentWine = makeLegacyInput("urgent", 1.0, true, false)
    const lateWine = makeLegacyInput("urgent", 0.9, false, false)
    expect(["urgent", "late"]).toContain(unifiedToLegacySt(urgentWine))
    expect(["urgent", "late"]).toContain(unifiedToLegacySt(lateWine))
  })
})
