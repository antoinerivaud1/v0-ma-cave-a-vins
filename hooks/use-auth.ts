"use client"

import { useState, useEffect, useCallback } from "react"
import type { User, Session, Provider } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { migrateLocalToSupabase } from "@/hooks/use-cave-sync"

export type UserPlan = "free" | "premium"

async function fetchUserPlan(userId: string): Promise<UserPlan> {
  const supabase = createClient()
  const { data } = await supabase
    .from("profiles")
    .select("plan, role")
    .eq("id", userId)
    .single()
  const raw = data as { plan?: string; role?: string } | null
  // Les beta testeurs et admins ont accès premium complet
  if (raw?.role === "beta" || raw?.role === "admin") return "premium"
  return raw?.plan === "premium" ? "premium" : "free"
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<UserPlan>("free")

  useEffect(() => {
    const supabase = createClient()

    // 1. Read initial session from cookies immediately (needed for server-side PKCE / Google OAuth)
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession?.user?.id) {
        setSession(initialSession)
        setUser(initialSession.user)
        const userPlan = await fetchUserPlan(initialSession.user.id)
        setPlan(userPlan)
      }
      setLoading(false)
    })

    // 2. Listen for subsequent auth changes (sign out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && newSession?.user?.id) {
          setSession(newSession)
          setUser(newSession.user)
          await migrateLocalToSupabase(newSession.user.id)
          const userPlan = await fetchUserPlan(newSession.user.id)
          setPlan(userPlan)
          setLoading(false)
        } else if (event === "SIGNED_OUT") {
          setUser(null)
          setSession(null)
          setPlan("free")
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error?.message ?? null
    },
    []
  )

  const signUp = useCallback(
    async (email: string, password: string, firstName: string): Promise<string | null> => {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName },
        },
      })
      return error?.message ?? null
    },
    []
  )

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }, [])

  const signInWithOAuth = useCallback(async (provider: Provider): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    })
  }, [])

  return {
    user,
    session,
    loading,
    plan,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
  }
}
