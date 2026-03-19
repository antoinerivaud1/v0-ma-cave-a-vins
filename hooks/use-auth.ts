"use client"

import { useState, useEffect, useCallback } from "react"
import type { User, Session, Provider } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { migrateLocalToSupabase } from "@/hooks/use-cave-sync"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setLoading(false)

        if (event === "SIGNED_IN" && newSession?.user?.id) {
          await migrateLocalToSupabase(newSession.user.id)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
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
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    })
  }, [])

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
  }
}
