import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

/**
 * POST /api/reset-user
 *
 * Supprime toutes les données métier de l'utilisateur authentifié.
 * Utilise le service role pour contourner les RLS policies qui peuvent
 * bloquer les DELETE côté client (session expirée, token stale, etc.).
 *
 * Ordre des suppressions (contraintes FK) :
 *   stock_overrides → tastings → wines → caves
 */
export async function POST() {
  // 1. Vérifier la session utilisateur via les cookies
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    )
  }

  // 2. Client admin (service role) — contourne RLS
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error("[reset-user] SUPABASE_SERVICE_ROLE_KEY is not set")
    return NextResponse.json(
      { error: "Configuration serveur manquante" },
      { status: 500 }
    )
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  // 3. Supprimer dans l'ordre FK : stock_overrides → tastings → wines → caves
  const tables = [
    "stock_overrides",
    "tastings",
    "wines",
    "caves",
  ] as const

  for (const table of tables) {
    const { error } = await admin
      .from(table)
      .delete()
      .eq("user_id", user.id)

    if (error) {
      console.error(`[reset-user] DELETE ${table} failed:`, error)
      return NextResponse.json(
        { error: `Échec de la suppression (${table})`, detail: error.message },
        { status: 500 }
      )
    }
  }

  // 4. Nettoyer last_active_cave_id dans profiles
  await admin
    .from("profiles")
    .update({ last_active_cave_id: null })
    .eq("id", user.id)

  return NextResponse.json({ ok: true })
}
