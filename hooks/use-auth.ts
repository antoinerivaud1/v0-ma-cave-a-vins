"use client"

import { createContext, useContext } from "react"
import type { User, Session, Provider } from "@supabase/supabase-js"

export type UserPlan = "free" | "premium"

export interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  plan: UserPlan
  /** Valeur brute du champ plan en base (ex: "free", "amateur", "collector") */
  rawPlan: string
  /** Valeur brute du champ role en base (ex: "user", "beta", "admin") */
  role: string | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string, firstName: string) => Promise<string | null>
  signOut: () => Promise<void>
  signInWithOAuth: (provider: Provider) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue & { isPremium: boolean } {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  const isPremium =
    ctx.rawPlan === "amateur" ||
    ctx.rawPlan === "collector" ||
    ctx.role === "admin" ||
    ctx.role === "beta"
  return { ...ctx, isPremium }
}
