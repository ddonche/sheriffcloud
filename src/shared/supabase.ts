import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase env variables missing")
  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      storage: window.localStorage,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })
  return _client
}

export const supabase = getSupabase()