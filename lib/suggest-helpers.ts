import type { Wine } from '@/data/apogee'
import { getApogee } from '@/data/apogee'
import { ACCORDS, FALLBACK_ACCORDS, type Accord } from '@/data/accords'

export interface ScoredWine {
  wine: Wine
  score: number
}

// ──────────────────────── Text normalisation ────────────────────────

/** Remove diacritics and lowercase a string */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// ──────────────────────── Keyword matching ────────────────────────

const ITALIAN_HINTS = ['italien', 'italienne', 'pizza', 'pasta', 'pates', 'lasagne', 'bolognaise', 'risotto', 'osso']
const ASIAN_HINTS = ['asiatique', 'epice', 'curry', 'thai', 'japonais', 'sushi', 'sashimi', 'chinois', 'wok', 'dim sum', 'pad thai', 'maki']
const SPANISH_HINTS = ["espagnol", "espagnole", "tapas", "paella", "chorizo", "jambon iberico", "tortilla"]
const AMERICAN_HINTS = ["americain", "burger", "bbq", "barbecue", "cote de boeuf americaine", "steak"]

/**
 * Find the best matching Accord for a free-text query.
 * Each accord is scored by how many of its keywords appear in the query.
 * The accord with the highest keyword-match count wins.
 */
export function findAccord(query: string): Accord {
  const q = normalize(query)
  if (!q) return FALLBACK_ACCORDS.default

  let bestAccord: Accord | null = null
  let bestScore = 0

  for (const accord of ACCORDS) {
    let matchCount = 0
    for (const keyword of accord.k) {
      const nk = normalize(keyword)
      if (q.includes(nk)) matchCount++
    }
    if (matchCount > bestScore) {
      bestScore = matchCount
      bestAccord = accord
    }
  }

  if (bestAccord && bestScore > 0) return bestAccord

  // Fallback by cuisine category detection
  if (ITALIAN_HINTS.some((h) => q.includes(h))) return FALLBACK_ACCORDS.italian
  if (ASIAN_HINTS.some((h) => q.includes(h))) return FALLBACK_ACCORDS.asian
  if (SPANISH_HINTS.some((h) => q.includes(h))) return FALLBACK_ACCORDS.spanish
  if (AMERICAN_HINTS.some((h) => q.includes(h))) return FALLBACK_ACCORDS.american

  return FALLBACK_ACCORDS.default
}

// ──────────────────────── Wine scoring ────────────────────────

/**
 * Score a single wine against an Accord.
 *
 * Base type priority: +10 first, +6 second, +2 third or later, +1 other
 * Region bonus:       +4 if wine_region is recommended
 * Freshness bonus:    +3 if white & millesime < 5 years old
 * Apogee bonus:       +2 if apogee 'ok' (ideal drinking window)
 * Apogee malus:       -2 if apogee 'urgent' (past its prime)
 */
function scoreWine(wine: Wine, accord: Accord): number {
  let score = 0
  const wType = wine.wine_type || ''
  const typeIdx = accord.t.indexOf(wType)

  // Type priority
  if (typeIdx === 0) score += 10
  else if (typeIdx === 1) score += 6
  else if (typeIdx >= 2) score += 2
  else score += 1

  // Region bonus
  const wRegion = wine.wine_region || ''
  if (wRegion && accord.r.includes(wRegion)) score += 4

  // Freshness bonus for whites
  const year = parseInt(String(wine.millesime_year))
  const now = new Date().getFullYear()
  if (!isNaN(year) && (wType === 'wine_white' || wType === 'wine_white_sparkling')) {
    if (now - year < 5) score += 3
  }

  // Apogee bonus / malus
  const apogee = getApogee(wine)
  if (apogee) {
    if (apogee.st === 'ok') score += 2
    else if (apogee.st === 'urgent') score -= 2
  }

  return score
}

// ──────────────────────── Suggestion pipeline ────────────────────────

/**
 * Return the top 2 wine suggestions for a given accord, diversifying
 * by wine_type when possible.
 */
export function suggestWines(cave: Wine[], accord: Accord): Wine[] {
  if (cave.length === 0) return []

  const scored: ScoredWine[] = cave
    .map((wine) => ({ wine, score: scoreWine(wine, accord) }))
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return []

  const first = scored[0]
  const results: Wine[] = [first.wine]

  // Try to diversify: find a second wine of a different type
  const secondDiff = scored.find(
    (s) => s !== first && (s.wine.wine_type || '') !== (first.wine.wine_type || '')
  )

  if (secondDiff) {
    results.push(secondDiff.wine)
  } else if (scored.length > 1) {
    results.push(scored[1].wine)
  }

  return results
}

/**
 * Full suggestion pipeline: find accord + pick best wines.
 */
export function getSuggestionsStatic(
  query: string,
  cave: Wine[]
): { accord: Accord; suggestions: Wine[] } {
  const accord = findAccord(query)
  const suggestions = suggestWines(cave, accord)
  return { accord, suggestions }
}
