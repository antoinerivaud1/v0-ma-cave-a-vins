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
}

export function useCaves() {
  const { user } = useAuth()
  const [caves, setCaves] = useState<Cave[]>([])
  const [activeCaveId, setActiveCaveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCaves([])
      setActiveCaveId(null)
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data: cavesData } = await supabase
        .from("caves")
        .select("id, name, user_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      const loadedCaves: Cave[] = (cavesData ?? []) as Cave[]
      setCaves(loadedCaves)

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
  }, [user])

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
        const cave = data as Cave
        setCaves((prev) => [...prev, cave])
        return cave
      }
      return null
    },
    [user]
  )

  const renameCave = useCallback(async (id: string, name: string): Promise<void> => {
    const supabase = createClient()
    await supabase.from("caves").update({ name }).eq("id", id)
    setCaves((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
  }, [])

  const deleteCave = useCallback(
    async (id: string): Promise<void> => {
      const supabase = createClient()

      // Move wines to null before deletion to avoid data loss
      await supabase.from("wines").update({ cave_id: null }).eq("cave_id", id)
      await supabase.from("caves").delete().eq("id", id)

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

  return { caves, activeCaveId, loading, createCave, renameCave, deleteCave, setActiveCave }
}
