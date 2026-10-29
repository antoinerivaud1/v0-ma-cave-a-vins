import type { StockOverride } from "@/lib/stock-overrides"

// MA-113 : logique pure de synchro du stock entre le cache local et la table stock_overrides.
// Règles :
//   - Supabase est la source de vérité.
//   - Une modification locale en attente gagne seulement si elle est plus récente que la
//     ligne cloud (dernier écrit gagne, égalité = le cloud gagne).
//   - Une clé locale qui n'est pas en attente et n'existe plus dans le cloud est retirée
//     (vidée depuis un autre appareil ou par la réinitialisation).

/**
 * Horodatage donné aux surcharges locales créées avant la synchro cloud : la valeur déjà
 * présente dans Supabase gagne toujours contre elles.
 */
export const STOCK_SYNC_EPOCH = "1970-01-01T00:00:00.000Z"

/** Ligne de la table stock_overrides, hors user_id. */
export interface StockOverrideRow {
  wine_identity_key: string
  /** Quantité surchargée. null = pas de surcharge (on garde wines.quantity). */
  stock: number | null
  archived: boolean
  deleted: boolean
  /** Horodatage client de la dernière modification. */
  updated_at: string
}

export interface LocalStockState {
  overrides: Record<string, StockOverride>
  updatedAt: Record<string, string>
  pending: readonly string[]
}

export interface StockMergeResult {
  overrides: Record<string, StockOverride>
  updatedAt: Record<string, string>
  /** Modifications locales gagnantes, à envoyer à Supabase. */
  toPush: StockOverrideRow[]
}

export function toTime(value: string | null | undefined): number {
  if (!value) return 0
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : 0
}

/** Format unique (toISOString) pour comparer et stocker les horodatages. */
export function normalizeTimestamp(value: string | null | undefined): string {
  return new Date(toTime(value)).toISOString()
}

/** Une surcharge neutre a le même effet que l'absence de surcharge. */
export function isNeutralOverride(override: StockOverride | undefined): boolean {
  if (!override) return true
  return override.quantity == null && override.archived !== true && override.deleted !== true
}

function toStock(quantity: number | undefined): number | null {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) return null
  return Math.max(0, Math.round(quantity))
}

export function overrideToRow(
  key: string,
  override: StockOverride | undefined,
  updatedAt: string | undefined
): StockOverrideRow {
  return {
    wine_identity_key: key,
    stock: toStock(override?.quantity),
    archived: override?.archived === true,
    deleted: override?.deleted === true,
    updated_at: normalizeTimestamp(updatedAt),
  }
}

export function rowToOverride(row: StockOverrideRow): StockOverride | undefined {
  const override: StockOverride = {}
  if (row.stock !== null) override.quantity = row.stock
  if (row.archived) override.archived = true
  if (row.deleted) override.deleted = true
  return isNeutralOverride(override) ? undefined : override
}

/** Valide la réponse brute de Supabase (client non typé). */
export function parseStockOverrideRows(data: unknown): StockOverrideRow[] {
  if (!Array.isArray(data)) return []

  const rows: StockOverrideRow[] = []
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue
    const raw = item as Record<string, unknown>
    if (typeof raw.wine_identity_key !== "string" || raw.wine_identity_key === "") continue

    rows.push({
      wine_identity_key: raw.wine_identity_key,
      stock: typeof raw.stock === "number" && Number.isFinite(raw.stock) ? raw.stock : null,
      archived: raw.archived === true,
      deleted: raw.deleted === true,
      updated_at: normalizeTimestamp(typeof raw.updated_at === "string" ? raw.updated_at : null),
    })
  }
  return rows
}

export function mergeStockOverrides(
  local: LocalStockState,
  cloudRows: readonly StockOverrideRow[]
): StockMergeResult {
  const pending = new Set(local.pending)
  const overrides: Record<string, StockOverride> = {}
  const updatedAt: Record<string, string> = {}
  const toPush: StockOverrideRow[] = []
  const seen = new Set<string>()

  const keepLocal = (key: string) => {
    const localOverride = local.overrides[key]
    if (localOverride !== undefined) overrides[key] = localOverride
    updatedAt[key] = normalizeTimestamp(local.updatedAt[key])
    toPush.push(overrideToRow(key, localOverride, local.updatedAt[key]))
  }

  for (const row of cloudRows) {
    const key = row.wine_identity_key
    if (seen.has(key)) continue
    seen.add(key)

    if (pending.has(key) && toTime(local.updatedAt[key]) > toTime(row.updated_at)) {
      keepLocal(key)
      continue
    }

    const fromCloud = rowToOverride(row)
    if (fromCloud) overrides[key] = fromCloud
    updatedAt[key] = normalizeTimestamp(row.updated_at)
  }

  for (const key of pending) {
    if (seen.has(key)) continue
    // Absente des deux côtés (ou neutre) : rien à envoyer
    if (isNeutralOverride(local.overrides[key])) continue
    keepLocal(key)
  }

  return { overrides, updatedAt, toPush }
}
