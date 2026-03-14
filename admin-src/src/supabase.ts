import { createClient } from "@supabase/supabase-js"

export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn("Supabase env variables missing")
    return null
  }

  return createClient(url, key)
}