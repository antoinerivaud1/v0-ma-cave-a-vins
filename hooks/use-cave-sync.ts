"use client"

import { createClient } from "@/lib/supabase/client"
import { CAVE_STORAGE_KEYS, MIGRATION_DONE_KEY } from "@/lib/cave-storage"
import { getPersistedWineRowIdentityKey, mergeLocalWineSources } from "@/lib/wine-sync"
import { startStockOverridesSync } from "@/hooks/use-stock-overrides"
import type { Wine } from "@/data/apogee"

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export type MigrationStatus = "idle" | "migrating" | "done" | "error"

export interface MigrationResult {
  migrated: number
  errors: string[]
}

// ---------------------------------------------------------------------------
// Types internes
// ---------------------------------------------------------------------------

interface WineRow {
  id: string
  user_id: string
  cave_id: string | null
  name: string
  vintage: string | null
  quantity: number | null
  region: string | null
  appellation: string | null
  domain: string | null
  wine_type: string | null
  classification: string | null
  notes: string | null
}

// ---------------------------------------------------------------------------
// Helpers localStorage — sûrs côté SSR
// ---------------------------------------------------------------------------

function parseStoredWines(key: string): Wine[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Wine[]) : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Mapping Wine → WineRow
// ---------------------------------------------------------------------------

function mapWineToRow(wine: Wine, userId: string, caveId: string) {
  return {
    user_id: userId,
    cave_id: caveId,
    name: wine.wine_name ?? "",
    vintage: wine.millesime_year != null ? String(wine.millesime_year) : null,
    quantity: Number(wine.bottle_quantity ?? 0),
    region: wine.wine_region ?? null,
    appellation: wine.wine_appellation ?? null,
    domain: wine.wine_domain ?? null,
    wine_type: wine.wine_type ?? null,
    classification: wine.wine_classification ?? null,
    notes: wine.wine_notes ?? null,
  }
}

// ---------------------------------------------------------------------------
// Résolution de la cave cible
// ---------------------------------------------------------------------------

async function resolveTargetCaveId(userId: string): Promise<string | null> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_active_cave_id")
    .eq("id", userId)
    .single()

  const preferredCaveId = (
    profile as { last_active_cave_id?: string | null } | null
  )?.last_active_cave_id

  if (preferredCaveId) return preferredCaveId

  const { data: existingCave } = await supabase
    .from("caves")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  if (existingCave?.id) return existingCave.id as string

  const { data: newCave } = await supabase
    .from("caves")
    .insert({ user_id: userId, name: "Ma Cave" })
    .select("id")
    .single()

  return newCave?.id ?? null
}

// ---------------------------------------------------------------------------
// Upsert des vins par clé d'identité métier (sans doublon)
// ---------------------------------------------------------------------------

async function upsertWinesByIdentity(
  userId: string,
  caveId: string,
  wines: Wine[]
): Promise<void> {
  const supabase = createClient()

  const { data: existingRows, error: fetchError } = await supabase
    .from("wines")
    .select(
      "id, user_id, cave_id, name, vintage, quantity, region, appellation, domain, wine_type, classification, notes"
    )
    .eq("user_id", userId)
    .eq("cave_id", caveId)

  if (fetchError) throw fetchError

  const existingByKey = new Map<string, WineRow>()
  for (const row of (existingRows ?? []) as WineRow[]) {
    existingByKey.set(getPersistedWineRowIdentityKey(row), row)
  }

  const updates: Promise<unknown>[] = []
  const inserts: ReturnType<typeof mapWineToRow>[] = []

  for (const wine of wines) {
    const rowPayload = mapWineToRow(wine, userId, caveId)
    const identityKey = getPersistedWineRowIdentityKey(rowPayload)
    const existingRow = existingByKey.get(identityKey)

    if (existingRow) {
      updates.push(
        supabase.from("wines").update(rowPayload).eq("id", existingRow.id)
      )
    } else {
      inserts.push(rowPayload)
    }
  }

  if (updates.length > 0) {
    const results = await Promise.all(updates)
    for (const result of results) {
      const r = result as { error?: { message: string } | null }
      if (r?.error) throw new Error(r.error.message)
    }
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from("wines").insert(inserts)
    if (insertError) throw insertError
  }
}

// ---------------------------------------------------------------------------
// Point d'entrée principal : appelé depuis auth-provider.tsx au SIGNED_IN
// ---------------------------------------------------------------------------

/**
 * Migre les données localStorage vers Supabase de manière idempotente.
 *
 * Données migrées une seule fois (flag MIGRATION_DONE_KEY) :
 *   - cave-user-profile     → profiles.first_name
 *   - cave_data             → wines (upsert par identité)
 *   - cave-manual-wines     → wines (upsert par identité, fusionné avec cave_data)
 *
 * Stock (MA-113) : hors du flag one-shot. À chaque connexion, startStockOverridesSync
 * rattache les surcharges locales au compte et les met en file d'attente ; elles ne sortent
 * de la file qu'une fois confirmées par Supabase (upsert user_id + wine_identity_key).
 * Un échec (réseau, schéma pas encore migré) laisse la file intacte et la synchro est
 * retentée : le stock n'est jamais marqué « migré » à tort.
 *
 * Données NON migrées (intentionnel) :
 *   - cave-wine-enrichments : cache API éphémère (TTL 7j), pas de valeur à persister
 *   - cave-tastings         : géré par use-tastings.ts avec sync Supabase propre
 *   - cave-active-cave-id   : géré par use-caves.ts avec profiles.last_active_cave_id
 *   - cave-offline-cache    : cache lecture seule reconstruit depuis Supabase
 */
export async function migrateLocalToSupabase(userId: string): Promise<MigrationResult> {
  // Stock : avant le retour anticipé, pour que les comptes déjà migrés (flag posé alors que
  // l'ancien upsert stock_overrides échouait en silence) envoient enfin leurs surcharges.
  // Synchrone et local : l'envoi réseau part hors de ce callback d'auth.
  startStockOverridesSync(userId)

  // Idempotence : ne pas rejouer si déjà migré avec succès
  if (
    typeof window !== "undefined" &&
    localStorage.getItem(MIGRATION_DONE_KEY) === "true"
  ) {
    return { migrated: 0, errors: [] }
  }

  const supabase = createClient()
  const errors: string[] = []
  let migrated = 0

  // 1. Migrer le profil utilisateur (prénom)
  try {
    const profileRaw =
      typeof window !== "undefined"
        ? localStorage.getItem(CAVE_STORAGE_KEYS.userProfile)
        : null
    const localProfile: { firstName?: string } = profileRaw
      ? (JSON.parse(profileRaw) as { firstName?: string })
      : {}

    if (localProfile.firstName) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: userId, first_name: localProfile.firstName }, { onConflict: "id" })
      if (profileError) {
        console.error("[cave-sync] Profile migration error:", profileError.message)
        errors.push(`profile: ${profileError.message}`)
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[cave-sync] Profile migration unexpected error:", message)
    errors.push(`profile: ${message}`)
  }

  // 2. Résoudre la cave cible (ou en créer une)
  let caveId: string | null = null
  try {
    caveId = await resolveTargetCaveId(userId)
    if (!caveId) {
      const msg = "cave: Failed to resolve or create target cave"
      console.error("[cave-sync]", msg)
      errors.push(msg)
      return { migrated, errors }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[cave-sync] Cave resolution error:", message)
    errors.push(`cave: ${message}`)
    return { migrated, errors }
  }

  // 3. Migrer les vins (cave_data + cave-manual-wines fusionnés, upsert idempotent)
  try {
    const importedWines = parseStoredWines(CAVE_STORAGE_KEYS.caveData)
    const manualWines = parseStoredWines(CAVE_STORAGE_KEYS.manualWines)
    const winesToSync = mergeLocalWineSources(importedWines, manualWines, caveId)

    if (winesToSync.length > 0) {
      await upsertWinesByIdentity(userId, caveId, winesToSync)
      migrated += winesToSync.length
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[cave-sync] Wine migration error:", message)
    errors.push(`wines: ${message}`)
  }

  // 4. Marquer la migration (profil, cave, vins) comme terminée si aucune erreur critique.
  // Le stock n'entre pas dans ce flag : sa file d'attente persiste jusqu'à confirmation cloud.
  const wineErrors = errors.filter((e) => e.startsWith("wines:"))
  const caveErrors = errors.filter((e) => e.startsWith("cave:"))
  if (wineErrors.length === 0 && caveErrors.length === 0) {
    if (typeof window !== "undefined") {
      localStorage.setItem(MIGRATION_DONE_KEY, "true")
    }
  }

  return { migrated, errors }
}

// ---------------------------------------------------------------------------
// Sync incrémental — appelé à chaque ajout de vin dans use-manual-wines.ts
// ---------------------------------------------------------------------------

export async function syncWineToSupabase(wine: Wine, userId: string): Promise<void> {
  try {
    const caveId = await resolveTargetCaveId(userId)
    if (!caveId) return

    await upsertWinesByIdentity(userId, caveId, [{ ...wine, cave_id: caveId }])
  } catch (error) {
    console.error("[cave-sync] Wine sync failed:", error)
  }
}
