"use client"

import { createClient } from "@/lib/supabase/client"
import { CAVE_STORAGE_KEYS } from "@/lib/cave-storage"
import { getPersistedWineRowIdentityKey, mergeLocalWineSources } from "@/lib/wine-sync"
import type { Wine } from "@/data/apogee"

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

function parseStoredWines(key: string): Wine[] {
  const raw = localStorage.getItem(key)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as Wine[] : []
  } catch {
    return []
  }
}

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

async function resolveTargetCaveId(userId: string): Promise<string | null> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_active_cave_id")
    .eq("id", userId)
    .single()

  const preferredCaveId = (profile as { last_active_cave_id?: string | null } | null)?.last_active_cave_id

  if (preferredCaveId) {
    return preferredCaveId
  }

  const { data: existingCave } = await supabase
    .from("caves")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  if (existingCave?.id) {
    return existingCave.id as string
  }

  const { data: newCave } = await supabase
    .from("caves")
    .insert({ user_id: userId, name: "Ma Cave" })
    .select("id")
    .single()

  return newCave?.id ?? null
}

async function upsertWinesByIdentity(userId: string, caveId: string, wines: Wine[]): Promise<void> {
  const supabase = createClient()

  const { data: existingRows, error } = await supabase
    .from("wines")
    .select("id, user_id, cave_id, name, vintage, quantity, region, appellation, domain, wine_type, classification, notes")
    .eq("user_id", userId)
    .eq("cave_id", caveId)

  if (error) {
    throw error
  }

  const existingByKey = new Map<string, WineRow>()
  for (const row of (existingRows ?? []) as WineRow[]) {
    existingByKey.set(getPersistedWineRowIdentityKey(row), row)
  }

  const updates = []
  const inserts = []

  for (const wine of wines) {
    const rowPayload = mapWineToRow(wine, userId, caveId)
    const identityKey = getPersistedWineRowIdentityKey(rowPayload)
    const existingRow = existingByKey.get(identityKey)

    if (existingRow) {
      updates.push(
        supabase
          .from("wines")
          .update(rowPayload)
          .eq("id", existingRow.id)
      )
    } else {
      inserts.push(rowPayload)
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates)
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from("wines").insert(inserts)
    if (insertError) {
      throw insertError
    }
  }
}

export async function migrateLocalToSupabase(userId: string): Promise<void> {
  const supabase = createClient()

  try {
    const importedWines = parseStoredWines(CAVE_STORAGE_KEYS.caveData)
    const manualWines = parseStoredWines(CAVE_STORAGE_KEYS.manualWines)
    const profileRaw = localStorage.getItem(CAVE_STORAGE_KEYS.userProfile)
    const profile: { firstName?: string } = profileRaw ? JSON.parse(profileRaw) : {}

    if (profile.firstName) {
      await supabase
        .from("profiles")
        .upsert({ id: userId, first_name: profile.firstName }, { onConflict: "id" })
    }

    const caveId = await resolveTargetCaveId(userId)
    if (!caveId) return

    const winesToSync = mergeLocalWineSources(importedWines, manualWines, caveId)

    if (winesToSync.length === 0) return

    await upsertWinesByIdentity(userId, caveId, winesToSync)
  } catch (error) {
    console.error("[cave-sync] Migration failed:", error)
  }
}

export async function syncWineToSupabase(wine: Wine, userId: string): Promise<void> {
  try {
    const caveId = await resolveTargetCaveId(userId)
    if (!caveId) return

    await upsertWinesByIdentity(userId, caveId, [{ ...wine, cave_id: caveId }])
  } catch (error) {
    console.error("[cave-sync] Wine sync failed:", error)
  }
}
