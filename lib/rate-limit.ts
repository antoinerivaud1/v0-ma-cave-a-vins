import { createClient } from "@supabase/supabase-js"

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfterSeconds: number
}

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Vérifie et incrémente le compteur de rate limiting pour un utilisateur.
 * Utilise le service role pour bypasser RLS sur les writes.
 * @param userId       UUID de l'utilisateur authentifié
 * @param route        Identifiant de la route (ex: "enrich-wine", "scan-label-hour")
 * @param maxPerWindow Nombre max d'appels autorisés sur la fenêtre
 * @param windowMinutes Durée de la fenêtre en minutes
 */
export async function checkRateLimit(
  userId: string,
  route: string,
  maxPerWindow: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  const now = new Date()
  const windowMs = windowMinutes * 60 * 1000
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs)
  const resetAt = new Date(windowStart.getTime() + windowMs)
  const retryAfterSeconds = Math.ceil((resetAt.getTime() - now.getTime()) / 1000)

  const supabase = getServiceRoleClient()

  const { data, error } = await supabase.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_route: route,
    p_window_start: windowStart.toISOString(),
  })

  if (error) {
    console.error("[rate-limit] Erreur Supabase:", error.message)
    return {
      allowed: true,
      remaining: maxPerWindow,
      resetAt,
      retryAfterSeconds,
    }
  }

  const count = data as number
  const allowed = count <= maxPerWindow
  const remaining = Math.max(0, maxPerWindow - count)

  return { allowed, remaining, resetAt, retryAfterSeconds }
}

/**
 * Construit les headers HTTP standard pour une réponse 429.
 */
export function buildRateLimitHeaders(
  result: RateLimitResult,
  limit: number
): Record<string, string> {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  }
}
