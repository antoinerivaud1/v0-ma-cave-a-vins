"use client"

import { useState, useEffect, useCallback } from "react"
import type { ReactNode } from "react"
import type { AuthChangeEvent, User, Session, Provider } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { migrateLocalToSupabase } from "@/hooks/use-cave-sync"
import { AuthContext, type UserPlan } from "@/hooks/use-auth"

interface UserProfile {
  plan: UserPlan
  rawPlan: string
  role: string | null
}

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const supabase = createClient()
  const { data } = await supabase
    .from("profiles")
    .select("plan, role")
    .eq("id", userId)
    .single()
  const raw = data as { plan?: string; role?: string } | null
  const role = raw?.role ?? null
  const rawPlan = raw?.plan ?? "free"
  const plan: UserPlan =
    (role === "beta" || role === "admin") ? "premium"
    : rawPlan === "premium" ? "premium" : "free"
  return { plan, rawPlan, role }
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
  const [rawPlan, setRawPlan] = useState<string>("free")
  const [role, setRole] = useState<string | null>(null)

  // Fetch plan for the user resolved server-side
  useEffect(() => {
    if (initialUser?.id) {
      fetchUserProfile(initialUser.id).then(({ plan: p, rawPlan: rp, role: r }) => {
        setPlan(p)
        setRawPlan(rp)
        setRole(r)
      })
    }
  }, [initialUser?.id])

  // Subscribe to auth changes: subsequent sign-ins, sign-out, token refresh
  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        newSession?.user
      ) {
        setSession(newSession)
        setUser(newSession.user)
        await migrateLocalToSupabase(newSession.user.id)
        const profile = await fetchUserProfile(newSession.user.id)
        setPlan(profile.plan)
        setRawPlan(profile.rawPlan)
        setRole(profile.role)
        setLoading(false)
      } else if (event === "TOKEN_REFRESHED" && newSession?.user) {
        setSession(newSession)
        setUser(newSession.user)
        const refreshedProfile = await fetchUserProfile(newSession.user.id)
        setPlan(refreshedProfile.plan)
        setRawPlan(refreshedProfile.rawPlan)
        setRole(refreshedProfile.role)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setSession(null)
        setPlan("free")
        setRawPlan("free")
        setRole(null)
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
    await fetch("/api/auth/signout", { method: "POST" })
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
      value={{ user, session, loading, plan, rawPlan, role, signIn, signUp, signOut, signInWithOAuth }}
    >
      {children}
    </AuthContext.Provider>
  )
}
