import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client
  _client = createClient(
    'https://ukyjfstfoaybvzwplrwx.supabase.co',
    'sb_publishable_rscjPXRJKAm8ZSTRXr_wZw_-umwFzDD',
    {
      auth: {
        persistSession: true,
        storage: window.localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
  return _client
}
