import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

/**
 * Route de callback OAuth Supabase (flux PKCE).
 * Supabase redirige ici après l'auth Google/Apple avec ?code=<code>.
 * On échange ce code contre une session persistée dans les cookies.
 *
 * IMPORTANT : le client Supabase est créé directement ici (pas via
 * createServerSupabaseClient) afin que les cookies soient écrits
 * sur le même objet NextResponse que le redirect — sinon la session
 * est perdue et le browser arrive sur "/" non connecté.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  const response = NextResponse.redirect(origin)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return response
}
