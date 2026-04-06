"use client"

import { createContext, useContext } from "react"
import type { User, Session, Provider } from "@supabase/supabase-js"

export type UserPlan = "free" | "premium"

export interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  plan: UserPlan
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, firstName: string) => Promise<string | null>
  signOut: () => Promise<void>
  signInWithOAuth: (provider: Provider) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
