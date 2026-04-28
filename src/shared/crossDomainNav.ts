import { getSupabase } from "./supabase"

export async function navigateCrossDomain(url: string) {
  const { data, error } = await getSupabase().auth.getSession()
  const session = data?.session
  if (error || !session?.access_token || !session?.refresh_token) {
    window.location.assign(url)
    return
  }
  const isLocal = window.location.hostname === "localhost"
  const target = isLocal ? url.replace("https://spur.ink", "http://localhost:5173") : url
  const destination = new URL(target)
  destination.hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=cross_domain_session`
  window.location.assign(destination.toString())
}