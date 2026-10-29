"use client"

import { useCallback, useSyncExternalStore } from "react"
import type { Wine } from "@/data/apogee"
import { getWineIdentityKey, type StockOverride } from "@/lib/stock-overrides"
import { CAVE_STORAGE_KEYS, STOCK_SYNC_META_KEY } from "@/lib/cave-storage"
import { createClient } from "@/lib/supabase/client"
import {
  STOCK_SYNC_EPOCH,
  mergeStockOverrides,
  overrideToRow,
  parseStockOverrideRows,
  type StockOverrideRow,
} from "@/lib/stock-sync"

// MA-113 : stock cloud, Supabase source de vérité, cache local.
//
// - Le cache local (clé cave-stock-overrides, format inchangé) sert l'affichage immédiat
//   et le mode hors ligne.
// - Chaque modification est horodatée et mise en file d'attente (clé cave-stock-sync).
// - La synchro lit stock_overrides, fusionne (dernier écrit gagne) puis envoie les
//   modifications locales gagnantes. Upsert sur (user_id, wine_identity_key) : jamais de doublon.
// - Un échec (réseau, colonnes absentes tant que la migration n'est pas appliquée) ne modifie
//   rien en local : la file reste et la synchro est retentée plus tard, sans erreur visible.

const STORAGE_KEY = CAVE_STORAGE_KEYS.stockOverrides
const TABLE = "stock_overrides"
const CLOUD_COLUMNS = "wine_identity_key, stock, archived, deleted, updated_at"
const READ_PAGE_SIZE = 1000
const WRITE_CHUNK_SIZE = 500
const WRITE_DEBOUNCE_MS = 1200
const RETRY_MIN_MS = 30_000
const RETRY_MAX_MS = 10 * 60_000

type OverridesMap = Record<string, StockOverride>

interface ParkedStockState {
  owner: string
  overrides: OverridesMap
  updatedAt: Record<string, string>
  pending: string[]
  clearAt: string | null
}

interface StockSyncMeta {
  v: 1
  /** Compte auquel appartient le cache local. null = surcharges antérieures à la synchro. */
  owner: string | null
  updatedAt: Record<string, string>
  /** Clés modifiées localement, pas encore confirmées par Supabase. */
  pending: string[]
  /** Vidage cloud demandé (import Excel, reset) et pas encore appliqué. */
  clearAt: string | null
  /** Modifications non synchronisées d'un autre compte connecté auparavant sur cet appareil. */
  parked: ParkedStockState | null
}

export interface StockSyncSnapshot {
  owner: string | null
  pendingCount: number
  clearPending: boolean
  lastSyncedAt: string | null
  lastError: string | null
}

function emptyMeta(owner: string | null): StockSyncMeta {
  return { v: 1, owner, updatedAt: {}, pending: [], clearAt: null, parked: null }
}

let overridesStore: OverridesMap = {}
let meta: StockSyncMeta = emptyMeta(null)
let hasLoadedOverrides = false
const listeners = new Set<() => void>()

let syncUserId: string | null = null
let syncTimer: ReturnType<typeof setTimeout> | null = null
let syncInFlight: Promise<void> | null = null
let syncRequestedDuringFlight = false
let retryDelayMs = 0
let lastSyncedAt: string | null = null
let lastError: string | null = null
let lastIssuedTime = 0

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return overridesStore
}

/** Horodatage strictement croissant : deux écritures successives ne sont jamais à égalité. */
function nextTimestamp(): string {
  const time = Math.max(Date.now(), lastIssuedTime + 1)
  lastIssuedTime = time
  return new Date(time).toISOString()
}

// ---------------------------------------------------------------------------
// Lecture / écriture localStorage
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  const result: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") result[key] = entry
  }
  return result
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []
}

function readOverrides(value: unknown): OverridesMap {
  return isRecord(value) ? (value as OverridesMap) : {}
}

function readParked(value: unknown): ParkedStockState | null {
  if (!isRecord(value) || typeof value.owner !== "string") return null
  return {
    owner: value.owner,
    overrides: readOverrides(value.overrides),
    updatedAt: readStringRecord(value.updatedAt),
    pending: readStringList(value.pending),
    clearAt: typeof value.clearAt === "string" ? value.clearAt : null,
  }
}

function parseMeta(raw: string | null): StockSyncMeta {
  if (!raw) return emptyMeta(null)
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return emptyMeta(null)
    return {
      v: 1,
      owner: typeof parsed.owner === "string" ? parsed.owner : null,
      updatedAt: readStringRecord(parsed.updatedAt),
      pending: readStringList(parsed.pending),
      clearAt: typeof parsed.clearAt === "string" ? parsed.clearAt : null,
      parked: readParked(parsed.parked),
    }
  } catch {
    return emptyMeta(null)
  }
}

function readFromStorage() {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      overridesStore = readOverrides(JSON.parse(stored))
    } catch (e) {
      console.error("[stock-sync] Failed to parse stock overrides:", e)
      overridesStore = {}
    }
  } else {
    overridesStore = {}
  }
  meta = parseMeta(window.localStorage.getItem(STOCK_SYNC_META_KEY))
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error("[stock-sync] localStorage indisponible:", e)
  }
}

function persistOverrides() {
  writeStorage(STORAGE_KEY, overridesStore)
}

function persistMeta() {
  writeStorage(STOCK_SYNC_META_KEY, meta)
}

function loadOverridesFromStorage() {
  if (hasLoadedOverrides || typeof window === "undefined") return
  hasLoadedOverrides = true

  try {
    readFromStorage()
  } catch (e) {
    console.error("[stock-sync] Failed to read stock overrides:", e)
  }

  // Autre onglet : on relit le cache et ses métadonnées
  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY && event.key !== STOCK_SYNC_META_KEY) return
    try {
      readFromStorage()
    } catch (e) {
      console.error("[stock-sync] Failed to parse stock overrides:", e)
    }
    emitChange()
  })

  // Retour du réseau ou retour au premier plan : on resynchronise
  window.addEventListener("online", () => requestStockSync(0))
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") requestStockSync(0)
  })
}

// Initialisation au niveau module : exécutée une seule fois à l'import du fichier,
// jamais en boucle au mount de N composants.
loadOverridesFromStorage()

// ---------------------------------------------------------------------------
// Écritures locales
// ---------------------------------------------------------------------------

function writeOverrides(changes: Record<string, StockOverride | undefined>) {
  const timestamp = nextTimestamp()
  const next = { ...overridesStore }
  const updatedAt = { ...meta.updatedAt }
  const pending = new Set(meta.pending)

  for (const [key, override] of Object.entries(changes)) {
    if (override === undefined) {
      delete next[key]
    } else {
      next[key] = override
    }
    updatedAt[key] = timestamp
    pending.add(key)
  }

  overridesStore = next
  meta = { ...meta, updatedAt, pending: [...pending] }
  persistOverrides()
  persistMeta()
  emitChange()
  requestStockSync(WRITE_DEBOUNCE_MS)
}

function getLegacyKey(wine: Wine): string {
  return `${wine.wine_name ?? ""}_${wine.millesime_year ?? ""}`
}

/**
 * Vide toutes les surcharges : en local tout de suite, dans Supabase à la prochaine synchro
 * (repère clearAt conservé tant que la suppression n'est pas confirmée).
 * Appelé après un import Excel (les quantités importées font foi) et par la réinitialisation.
 */
export function clearAllStockOverrides() {
  hasLoadedOverrides = true
  overridesStore = {}

  const owner = meta.owner ?? syncUserId
  meta = { ...emptyMeta(owner), parked: meta.parked, clearAt: owner ? nextTimestamp() : null }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage indisponible : l'état mémoire suffit
    }
  }
  persistMeta()
  emitChange()
  requestStockSync(0)
}

// ---------------------------------------------------------------------------
// Rattachement au compte connecté
// ---------------------------------------------------------------------------

function switchOwner(userId: string) {
  const restored = meta.parked && meta.parked.owner === userId ? meta.parked : null
  const hasUnsynced = meta.pending.length > 0 || meta.clearAt !== null
  const previous: ParkedStockState | null =
    meta.owner && hasUnsynced
      ? {
          owner: meta.owner,
          overrides: overridesStore,
          updatedAt: meta.updatedAt,
          pending: meta.pending,
          clearAt: meta.clearAt,
        }
      : null

  overridesStore = restored ? restored.overrides : {}
  meta = {
    v: 1,
    owner: userId,
    updatedAt: restored ? restored.updatedAt : {},
    pending: restored ? restored.pending : [],
    clearAt: restored ? restored.clearAt : null,
    parked: previous ?? (restored ? null : meta.parked),
  }
}

/**
 * Démarre la synchro du stock pour le compte connecté. Appelé au SIGNED_IN / INITIAL_SESSION
 * (hooks/use-cave-sync.ts). Synchrone et local : l'envoi réseau part hors du callback d'auth.
 *
 * - Surcharges sans propriétaire (créées avant MA-113 ou en invité) : rattachées à ce compte
 *   et mises en file. Sans horodatage, elles reçoivent STOCK_SYNC_EPOCH : la valeur cloud gagne.
 * - Cache d'un autre compte : mis de côté s'il reste des modifications non envoyées, puis
 *   remplacé par le cache de ce compte (restauré s'il avait été mis de côté).
 */
export function startStockOverridesSync(userId: string) {
  if (typeof window === "undefined" || !userId) return
  loadOverridesFromStorage()
  syncUserId = userId

  if (meta.owner !== userId) {
    if (meta.owner === null) {
      const updatedAt = { ...meta.updatedAt }
      const pending = new Set(meta.pending)
      for (const key of Object.keys(overridesStore)) {
        if (!updatedAt[key]) updatedAt[key] = STOCK_SYNC_EPOCH
        pending.add(key)
      }
      meta = { ...meta, owner: userId, updatedAt, pending: [...pending] }
    } else {
      switchOwner(userId)
    }
    persistOverrides()
    persistMeta()
    emitChange()
  }

  requestStockSync(0)
}

// ---------------------------------------------------------------------------
// Synchro Supabase
// ---------------------------------------------------------------------------

function sameOverride(a: StockOverride, b: StockOverride): boolean {
  return (
    a.quantity === b.quantity &&
    (a.archived === true) === (b.archived === true) &&
    (a.deleted === true) === (b.deleted === true)
  )
}

/** Évite de re-rendre tous les composants quand une synchro ne change rien. */
function sameOverridesMap(a: OverridesMap, b: OverridesMap): boolean {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((key) => b[key] !== undefined && sameOverride(a[key], b[key]))
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (isRecord(error) && typeof error.message === "string") return error.message
  return String(error)
}

function requestStockSync(delayMs: number) {
  if (!syncUserId || typeof window === "undefined") return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncTimer = null
    void syncStockOverridesNow()
  }, delayMs)
}

async function fetchCloudRows(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<StockOverrideRow[]> {
  const rows: StockOverrideRow[] = []
  for (let from = 0; ; from += READ_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(CLOUD_COLUMNS)
      .eq("user_id", userId)
      .order("wine_identity_key", { ascending: true })
      .range(from, from + READ_PAGE_SIZE - 1)
    if (error) throw new Error(errorMessage(error))
    rows.push(...parseStockOverrideRows(data))
    if (!Array.isArray(data) || data.length < READ_PAGE_SIZE) return rows
  }
}

async function runStockSync(): Promise<void> {
  const userId = syncUserId
  if (!userId || typeof window === "undefined") return
  if (typeof navigator !== "undefined" && navigator.onLine === false) return // repris sur "online"

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  // Plus connecté (ou autre compte) : rien à faire, le prochain SIGNED_IN relance la synchro
  if (!session || session.user.id !== userId || syncUserId !== userId) return

  // 1. Vidage cloud en attente (import Excel, reset)
  const clearAt = meta.clearAt
  if (clearAt) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("user_id", userId)
      .lte("updated_at", clearAt)
    if (error) throw new Error(errorMessage(error))
    if (meta.owner === userId && meta.clearAt === clearAt) {
      meta = { ...meta, clearAt: null }
      persistMeta()
    }
  }

  // 2. Lecture cloud (source de vérité)
  const cloudRows = await fetchCloudRows(supabase, userId)
  if (syncUserId !== userId || meta.owner !== userId) return
  // Vidage demandé pendant la lecture : ces lignes sont périmées. La synchro suivante
  // (relancée par clearAllStockOverrides) applique d'abord le vidage.
  if (meta.clearAt !== null) return

  // 3. Fusion, appliquée sans await intermédiaire : aucune écriture locale ne peut s'intercaler
  const pendingAtMerge = new Set(meta.pending)
  const merged = mergeStockOverrides(
    { overrides: overridesStore, updatedAt: meta.updatedAt, pending: meta.pending },
    cloudRows
  )
  const changed = !sameOverridesMap(overridesStore, merged.overrides)
  if (changed) overridesStore = merged.overrides
  meta = { ...meta, updatedAt: merged.updatedAt }
  const updatedAtAtMerge = { ...merged.updatedAt }
  persistOverrides()
  persistMeta()
  if (changed) emitChange()

  // 4. Envoi des modifications locales gagnantes
  for (let i = 0; i < merged.toPush.length; i += WRITE_CHUNK_SIZE) {
    const chunk = merged.toPush.slice(i, i + WRITE_CHUNK_SIZE).map((row) => ({ user_id: userId, ...row }))
    const { error } = await supabase.from(TABLE).upsert(chunk, { onConflict: "user_id,wine_identity_key" })
    if (error) throw new Error(errorMessage(error))
  }

  // 5. Sortie de file : uniquement les clés non modifiées depuis la fusion
  if (meta.owner !== userId) return
  const stillPending = meta.pending.filter(
    (key) => !(pendingAtMerge.has(key) && meta.updatedAt[key] === updatedAtAtMerge[key])
  )
  meta = { ...meta, pending: stillPending }
  persistMeta()
  lastSyncedAt = new Date().toISOString()
  lastError = null
  if (stillPending.length > 0) requestStockSync(WRITE_DEBOUNCE_MS)
}

/**
 * Lance (ou rejoint) une synchro immédiate. Ne rejette jamais : en cas d'échec, l'état local
 * est conservé et une nouvelle tentative est planifiée.
 */
export function syncStockOverridesNow(): Promise<void> {
  if (syncInFlight) {
    syncRequestedDuringFlight = true
    return syncInFlight
  }

  syncInFlight = (async () => {
    try {
      await runStockSync()
      retryDelayMs = 0
    } catch (error) {
      const message = errorMessage(error)
      if (message !== lastError) {
        console.error("[stock-sync] Synchro du stock reportée:", message)
      }
      lastError = message
      retryDelayMs = Math.min(Math.max(RETRY_MIN_MS, retryDelayMs * 2), RETRY_MAX_MS)
      requestStockSync(retryDelayMs)
    } finally {
      syncInFlight = null
      if (syncRequestedDuringFlight) {
        syncRequestedDuringFlight = false
        requestStockSync(0)
      }
    }
  })()

  return syncInFlight
}

/** État de la synchro (tests, diagnostic). */
export function getStockSyncSnapshot(): StockSyncSnapshot {
  return {
    owner: meta.owner,
    pendingCount: meta.pending.length,
    clearPending: meta.clearAt !== null,
    lastSyncedAt,
    lastError,
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStockOverrides() {
  const overrides = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const isLoaded = hasLoadedOverrides

  const getWineKeyFromWine = useCallback((wine: Wine): string => {
    return getWineIdentityKey(wine)
  }, [])

  const getOverrideForWine = useCallback((wine: Wine): StockOverride | undefined => {
    const newKey = getWineKeyFromWine(wine)
    if (overrides[newKey] !== undefined) return overrides[newKey]
    // Fallback: read legacy keys written as "${wine_name}_${millesime_year}" before PR #38
    return overrides[getLegacyKey(wine)]
  }, [getWineKeyFromWine, overrides])

  const setOverrideForWine = useCallback((wine: Wine, override: StockOverride) => {
    const key = getWineKeyFromWine(wine)
    const legacyKey = getLegacyKey(wine)
    const changes: Record<string, StockOverride | undefined> = { [key]: override }
    // Lazy migration: remove legacy key so the fallback in getOverrideForWine never returns stale data
    if (legacyKey !== key && overridesStore[legacyKey] !== undefined) changes[legacyKey] = undefined
    writeOverrides(changes)
  }, [getWineKeyFromWine])

  const clearOverrideForWine = useCallback((wine: Wine) => {
    const key = getWineKeyFromWine(wine)
    const legacyKey = getLegacyKey(wine)
    const changes: Record<string, StockOverride | undefined> = { [key]: undefined }
    // Also clear legacy key so it cannot resurface via the fallback read path
    if (legacyKey !== key && overridesStore[legacyKey] !== undefined) changes[legacyKey] = undefined
    writeOverrides(changes)
  }, [getWineKeyFromWine])

  return {
    overrides,
    isLoaded,
    getWineKeyFromWine,
    getOverrideForWine,
    setOverrideForWine,
    clearOverrideForWine,
  }
}
