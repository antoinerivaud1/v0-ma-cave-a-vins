import type { Wine } from '@/data/apogee'
import { ACCORDS, FALLBACK_ACCORD, type Accord } from '@/data/accords'

export interface ScoredWine {
  wine: Wine
  score: number
}

export interface SuggestResult {
  accord: Accord
  suggestions: Wine[]
}

/**
 * Find the best matching Accord for a free-text query.
 * Matches keywords against the lowercased, trimmed input.
 */
export function findAccord(query: string): Accord {
  const q = query.toLowerCase().trim()
  if (!q) return FALLBACK_ACCORD

  for (const accord of ACCORDS) {
    for (const keyword of accord.k) {
      if (q.includes(keyword)) return accord
    }
  }

  return FALLBACK_ACCORD
}

/**
 * Score a single wine against an Accord.
 * +10 first recommended type, +6 second, +2 third or later, +1 other type
 * +4 if wine_region is in the recommended regions
 */
function scoreWine(wine: Wine, accord: Accord): number {
  let score = 0
  const wType = wine.wine_type || ''
  const typeIdx = accord.t.indexOf(wType)

  if (typeIdx === 0) score += 10
  else if (typeIdx === 1) score += 6
  else if (typeIdx >= 2) score += 2
  else score += 1

  const wRegion = wine.wine_region || ''
  if (wRegion && accord.r.includes(wRegion)) score += 4

  return score
}

/**
 * Return the top 2 wine suggestions for a given accord, avoiding
 * two wines of the same type when possible.
 */
export function suggestWines(cave: Wine[], accord: Accord): Wine[] {
  if (cave.length === 0) return []

  const scored: ScoredWine[] = cave
    .map((wine) => ({ wine, score: scoreWine(wine, accord) }))
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return []

  const first = scored[0]
  const results: Wine[] = [first.wine]

  // Try to find a second wine of a different type
  const secondDiff = scored.find(
    (s) => s !== first && (s.wine.wine_type || '') !== (first.wine.wine_type || '')
  )

  if (secondDiff) {
    results.push(secondDiff.wine)
  } else if (scored.length > 1) {
    // Fallback: just take the second best even if same type
    results.push(scored[1].wine)
  }

  return results
}

/**
 * Full suggestion pipeline: find accord + pick best wines.
 */
export function getSuggestions(query: string, cave: Wine[]): SuggestResult {
  const accord = findAccord(query)
  const suggestions = suggestWines(cave, accord)
  return { accord, suggestions }
}
