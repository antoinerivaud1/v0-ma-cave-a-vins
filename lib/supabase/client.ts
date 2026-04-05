import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  console.log("[supabase-client] init — url:", url ? url.slice(0, 30) + "..." : "UNDEFINED", "key:", key ? "ok" : "UNDEFINED")
  client = createBrowserClient(url!, key!)
  return client
}
