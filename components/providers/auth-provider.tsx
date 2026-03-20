"use client"

import { useState, useEffect, useCallback } from "react"
import type { ReactNode } from "react"
import type { User, Session, Provider } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { migrateLocalToSupabase } from "@/hooks/use-cave-sync"
import { AuthContext, type UserPlan } from "@/hooks/use-auth"

async function fetchUserPlan(userId: string): Promise<UserPlan> {
  const supabase = createClient()
  const { data } = await supabase
    .from("profiles")
    .select("plan, role")
    .eq("id", userId)
    .single()
  const raw = data as { plan?: string; role?: string } | null
  if (raw?.role === "beta" || raw?.role === "admin") return "premium"
  return raw?.plan === "premium" ? "premium" : "free"
}

interface AuthProviderProps {
  initialUser: User | null
  children: ReactNode
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<UserPlan>("free")

  // Fetch plan for the user resolved server-side
  useEffect(() => {
    if (initialUser?.id) {
      fetchUserPlan(initialUser.id).then(setPlan)
    }
  }, [initialUser?.id])

  // Subscribe to auth changes: subsequent sign-ins, sign-out, token refresh
  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        newSession?.user
      ) {
        setSession(newSession)
        setUser(newSession.user)
        await migrateLocalToSupabase(newSession.user.id)
        const userPlan = await fetchUserPlan(newSession.user.id)
        setPlan(userPlan)
        setLoading(false)
      } else if (event === "TOKEN_REFRESHED" && newSession?.user) {
        setSession(newSession)
        setUser(newSession.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setSession(null)
        setPlan("free")
        setLoading(false)
      }
    })

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
    async (
      email: string,
      password: string,
      firstName: string
    ): Promise<string | null> => {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName } },
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
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, session, loading, plan, signIn, signUp, signOut, signInWithOAuth }}
    >
      {children}
    </AuthContext.Provider>
  )
}
