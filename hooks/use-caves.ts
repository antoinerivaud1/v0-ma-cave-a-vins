"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

const ACTIVE_CAVE_KEY = "cave-active-cave-id"

export interface Cave {
  id: string
  name: string
  user_id: string
  created_at: string
  nb_wines: number
}

export function useCaves() {
  const { user, loading: authLoading } = useAuth()
  const [caves, setCaves] = useState<Cave[]>([])
  const [activeCaveId, setActiveCaveId] = useState<string | null>(null)
  const [totalWines, setTotalWines] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setCaves([])
      setActiveCaveId(null)
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      const [{ data: cavesData }, { data: winesData }] = await Promise.all([
        supabase
          .from("caves")
          .select("id, name, user_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("wines")
          .select("cave_id")
          .eq("user_id", user.id),
      ])

      const wineCounts: Record<string, number> = {}
      for (const wine of (winesData ?? [])) {
        const cid = (wine as { cave_id: string | null }).cave_id ?? ""
        if (cid) wineCounts[cid] = (wineCounts[cid] ?? 0) + 1
      }

      type CaveRow = Omit<Cave, "nb_wines">
      const loadedCaves: Cave[] = (cavesData ?? []).map((c: unknown) => {
        const row = c as CaveRow
        return { ...row, nb_wines: wineCounts[row.id] ?? 0 }
      })
      setCaves(loadedCaves)
      setTotalWines((winesData ?? []).length)

      // Restore active cave: profile first, then localStorage, then first cave
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_active_cave_id")
        .eq("id", user.id)
        .single()

      const profileCaveId = (profile as { last_active_cave_id?: string | null } | null)
        ?.last_active_cave_id ?? null
      const localCaveId = localStorage.getItem(ACTIVE_CAVE_KEY)

      const candidateId = profileCaveId ?? localCaveId
      const validCave = loadedCaves.find((c) => c.id === candidateId)

      if (validCave) {
        setActiveCaveId(validCave.id)
      } else if (loadedCaves.length > 0) {
        setActiveCaveId(loadedCaves[0].id)
      }

      setLoading(false)
    }

    load()
  }, [user, authLoading])

  const setActiveCave = useCallback(
    async (id: string): Promise<void> => {
      setActiveCaveId(id)
      localStorage.setItem(ACTIVE_CAVE_KEY, id)

      if (user) {
        const supabase = createClient()
        await supabase
          .from("profiles")
          .update({ last_active_cave_id: id })
          .eq("id", user.id)
      }
    },
    [user]
  )

  const createCave = useCallback(
    async (name: string): Promise<Cave | null> => {
      if (!user) return null
      const supabase = createClient()
      const { data } = await supabase
        .from("caves")
        .insert({ user_id: user.id, name })
        .select("id, name, user_id, created_at")
        .single()

      if (data) {
        const cave = { ...(data as Omit<Cave, "nb_wines">), nb_wines: 0 } as Cave
        setCaves((prev) => [...prev, cave])
        return cave
      }
      return null
    },
    [user]
  )

  const renameCave = useCallback(
    async (id: string, name: string): Promise<void> => {
      if (!user) return

      const supabase = createClient()
      await supabase
        .from("caves")
        .update({ name })
        .eq("id", id)
        .eq("user_id", user.id)
      setCaves((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
    },
    [user]
  )

  const deleteCave = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return

      const supabase = createClient()

      // Move wines to null before deletion to avoid data loss
      await supabase
        .from("wines")
        .update({ cave_id: null })
        .eq("cave_id", id)
        .eq("user_id", user.id)
      await supabase
        .from("caves")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      const remaining = caves.filter((c) => c.id !== id)
      setCaves(remaining)

      // If deleted cave was active, switch to first remaining
      if (activeCaveId === id) {
        const next = remaining[0] ?? null
        if (next) {
          setActiveCaveId(next.id)
          localStorage.setItem(ACTIVE_CAVE_KEY, next.id)
          if (user) {
            await supabase
              .from("profiles")
              .update({ last_active_cave_id: next.id })
              .eq("id", user.id)
          }
        } else {
          setActiveCaveId(null)
          localStorage.removeItem(ACTIVE_CAVE_KEY)
        }
      }
    },
    [caves, activeCaveId, user]
  )

  return { caves, activeCaveId, totalWines, loading, createCave, renameCave, deleteCave, setActiveCave }
}
