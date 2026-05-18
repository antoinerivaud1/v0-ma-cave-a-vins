import type { Wine } from "@/data/apogee"
import type { Accord } from "@/data/accords"
import { getSuggestionsStatic } from "./suggest-helpers"

// ──────────────────────── Types ────────────────────────

export type SuggestMode = "static" | "ai"

export interface SuggestResult {
  wine: Wine
  reason: string
  temperature?: string
  serving?: string
  aiGenerated?: boolean
}

export interface SuggestResponse {
  accord: Accord
  results: SuggestResult[]
}

export interface SuggestService {
  getSuggestions(meal: string, cave: Wine[]): Promise<SuggestResponse>
}

// ──────────────────────── Static implementation ────────────────────────

export class StaticSuggestService implements SuggestService {
  async getSuggestions(meal: string, cave: Wine[]): Promise<SuggestResponse> {
    const { accord, suggestions } = getSuggestionsStatic(meal, cave)

    const results: SuggestResult[] = suggestions.map((wine) => ({
      wine,
      reason: accord.reason,
      temperature: accord.temperature,
      serving: accord.serving,
      aiGenerated: false,
    }))

    return { accord, results }
  }
}

// ──────────────────────── AI implementation (stub) ────────────────────────

export class AISuggestService implements SuggestService {
  async getSuggestions(meal: string, cave: Wine[]): Promise<SuggestResponse> {
    // TODO Phase 2 : appel Claude API
    // Le prompt sera construit ici avec meal + cave serialisee
    // Pour l'instant : fallback sur StaticSuggestService
    console.log("AI suggest not yet implemented, falling back to static")
    return new StaticSuggestService().getSuggestions(meal, cave)
  }
}

// ──────────────────────── Factory ────────────────────────

const SUGGEST_MODE: SuggestMode =
  (process.env.NEXT_PUBLIC_SUGGEST_MODE as SuggestMode) || "static"

export const suggestService: SuggestService =
  SUGGEST_MODE === "ai" ? new AISuggestService() : new StaticSuggestService()
