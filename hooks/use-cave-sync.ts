"use client"

import { createClient } from "@/lib/supabase/client"
import type { Wine } from "@/data/apogee"

export async function migrateLocalToSupabase(userId: string): Promise<void> {
  const supabase = createClient()

  try {
    // Read data from localStorage
    const manualWinesRaw = localStorage.getItem("cave-manual-wines")
    const profileRaw = localStorage.getItem("cave-user-profile")

    const manualWines: Wine[] = manualWinesRaw ? JSON.parse(manualWinesRaw) : []
    const profile: { firstName?: string } = profileRaw ? JSON.parse(profileRaw) : {}

    // Upsert profile
    if (profile.firstName) {
      await supabase
        .from("profiles")
        .upsert({ id: userId, first_name: profile.firstName }, { onConflict: "id" })
    }

    // Ensure a cave exists for this user
    const { data: existingCave } = await supabase
      .from("caves")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .single()

    let caveId: string | null = existingCave?.id ?? null

    if (!caveId) {
      const { data: newCave } = await supabase
        .from("caves")
        .insert({ user_id: userId, name: "Ma Cave" })
        .select("id")
        .single()
      caveId = newCave?.id ?? null
    }

    if (!caveId || manualWines.length === 0) return

    // Upsert wines — avoid duplicates on (name, vintage, user_id)
    const wineRows = manualWines.map((wine) => ({
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
    }))

    await supabase
      .from("wines")
      .upsert(wineRows, { onConflict: "name,vintage,user_id", ignoreDuplicates: false })
  } catch {
    // Silent failure — do not block sign-in
  }
}

export async function syncWineToSupabase(wine: Wine, userId: string): Promise<void> {
  const supabase = createClient()

  try {
    // Get or create cave
    const { data: existingCave } = await supabase
      .from("caves")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .single()

    let caveId: string | null = existingCave?.id ?? null

    if (!caveId) {
      const { data: newCave } = await supabase
        .from("caves")
        .insert({ user_id: userId, name: "Ma Cave" })
        .select("id")
        .single()
      caveId = newCave?.id ?? null
    }

    if (!caveId) return

    await supabase.from("wines").upsert(
      {
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
      },
      { onConflict: "name,vintage,user_id", ignoreDuplicates: false }
    )
  } catch {
    // Silent failure
  }
}
