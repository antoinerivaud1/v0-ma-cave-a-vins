"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

const STORAGE_KEY = "cave-tastings"
const supabase = createClient()

export interface Tasting {
  id: string
  user_id: string
  wine_name: string
  millesime: string | null
  region: string | null
  appellation: string | null
  wine_type: string | null
  stars: number
  comment: string
  web_score: string | null
  web_source: string | null
  web_summary: string | null
  web_enriched_at: string | null
  cave_wine_ref: string | null
  tasted_at: string
  created_at: string
  updated_at: string
}

export type TastingInput = Pick<
  Tasting,
  | "wine_name"
  | "millesime"
  | "region"
  | "appellation"
  | "wine_type"
  | "stars"
  | "comment"
  | "web_score"
  | "web_source"
  | "web_summary"
  | "cave_wine_ref"
>

function makeCaveWineRef(
  wineName: string | null | undefined,
  millesime: string | number | null | undefined
): string | null {
  if (!wineName) return null
  return `${wineName}_${millesime ?? ""}`
}

export function useTastings() {
  const [tastings, setTastings] = useState<Tasting[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const { user } = useAuth()

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setTastings(JSON.parse(stored))
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true)
  }, [])

  // Sync from Supabase when user is authenticated
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from("tastings")
      .select("*")
      .eq("user_id", user.id)
      .order("tasted_at", { ascending: false })
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error("[tastings] Failed to fetch:", error)
          return
        }
        if (data) {
          setTastings(data as Tasting[])
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        }
      })
  }, [user?.id])

  const getTastingForWine = useCallback(
    (
      wineName: string | null | undefined,
      millesime: string | number | null | undefined
    ): Tasting | null => {
      const ref = makeCaveWineRef(wineName, millesime)
      if (!ref) return null
      return tastings.find((t) => t.cave_wine_ref === ref) ?? null
    },
    [tastings]
  )

  const saveTasting = useCallback(
    async (input: TastingInput): Promise<Tasting | null> => {
      if (!user?.id) return null

      const caveWineRef = input.cave_wine_ref ?? makeCaveWineRef(input.wine_name, input.millesime)

      // Check if tasting already exists for this wine (upsert by cave_wine_ref)
      const existing = caveWineRef
        ? tastings.find((t) => t.cave_wine_ref === caveWineRef)
        : null

      const now = new Date().toISOString()

      if (existing) {
        // Update existing
        const updates = {
          stars: input.stars,
          comment: input.comment,
          web_score: input.web_score ?? existing.web_score,
          web_source: input.web_source ?? existing.web_source,
          web_summary: input.web_summary ?? existing.web_summary,
          updated_at: now,
        }
        const { data, error } = await supabase
          .from("tastings")
          .update(updates)
          .eq("id", existing.id)
          .select()
          .single()

        if (error) {
          console.error("[tastings] Failed to update:", error)
          return null
        }

        const updated = data as Tasting
        setTastings((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        return updated
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("tastings")
          .insert({
            user_id: user.id,
            wine_name: input.wine_name,
            millesime: input.millesime ?? null,
            region: input.region ?? null,
            appellation: input.appellation ?? null,
            wine_type: input.wine_type ?? null,
            stars: input.stars,
            comment: input.comment,
            web_score: input.web_score ?? null,
            web_source: input.web_source ?? null,
            web_summary: input.web_summary ?? null,
            cave_wine_ref: caveWineRef,
            tasted_at: now,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single()

        if (error) {
          console.error("[tastings] Failed to insert:", error)
          return null
        }

        const inserted = data as Tasting
        setTastings((prev) => [inserted, ...prev])
        return inserted
      }
    },
    [user?.id, tastings]
  )

  const deleteTasting = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) return false

      const { error } = await supabase
        .from("tastings")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
      if (error) {
        console.error("[tastings] Failed to delete:", error)
        return false
      }
      setTastings((prev) => prev.filter((t) => t.id !== id))
      return true
    },
    [user?.id]
  )

  const listTastings = useCallback((): Tasting[] => {
    return [...tastings].sort(
      (a, b) => new Date(b.tasted_at).getTime() - new Date(a.tasted_at).getTime()
    )
  }, [tastings])

  return {
    tastings,
    isLoaded,
    getTastingForWine,
    saveTasting,
    deleteTasting,
    listTastings,
    makeCaveWineRef,
  }
}
