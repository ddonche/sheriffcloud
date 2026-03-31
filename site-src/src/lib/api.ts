import { getSupabase } from '../supabase'
import type { RouterResponse } from './types'

const SUPABASE_URL = 'https://ukyjfstfoaybvzwplrwx.supabase.co'
const SUPABASE_KEY = 'sb_publishable_rscjPXRJKAm8ZSTRXr_wZw_-umwFzDD'

const cache = new Map<string, RouterResponse>()

export function getSubdomain(): string {
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search)
    return params.get('sub') ?? 'goblin'
  }
  const parts = hostname.split('.')
  return parts.length >= 3 ? parts[0] : hostname
}

async function doFetch(path: string): Promise<RouterResponse> {
  const subdomain = getSubdomain()
  const url = `${SUPABASE_URL}/functions/v1/site_router?path=${encodeURIComponent(path)}`

  // Send user session token if available so edge function can resolve user_liked
  let authToken = SUPABASE_KEY
  try {
    const sb = getSupabase()
    const { data: { session } } = await sb.auth.getSession()
    if (session?.access_token) authToken = session.access_token
  } catch {}

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${authToken}`,
      'X-Subdomain': subdomain,
    },
  })
  if (!res.ok) throw new Error(`site_router returned ${res.status}`)
  return res.json()
}

/**
 * Fetch a route.
 * - If cached: return cache immediately, revalidate in background
 * - If not cached: fetch and cache
 */
export async function fetchRoute(path: string, onRevalidate?: (data: RouterResponse) => void): Promise<RouterResponse> {
  const subdomain = getSubdomain()
  const key = `${subdomain}:${path}`

  if (cache.has(key)) {
    // Return cached immediately, revalidate silently in background
    if (onRevalidate) {
      doFetch(path).then(fresh => {
        cache.set(key, fresh)
        onRevalidate(fresh)
      }).catch(() => {})
    }
    return cache.get(key)!
  }

  const data = await doFetch(path)
  cache.set(key, data)
  return data
}

/** Prefetch a route into cache without returning anything */
export function prefetchRoute(path: string): void {
  const subdomain = getSubdomain()
  const key = `${subdomain}:${path}`
  if (cache.has(key)) return
  doFetch(path).then(data => cache.set(key, data)).catch(() => {})
}

/** Bust cache for a path — call after likes/comments/edits */
export function bustRoute(path: string): void {
  const subdomain = getSubdomain()
  cache.delete(`${subdomain}:${path}`)
}

export function firstImageFromContent(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/)
  return match ? match[1] : null
}

export function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function authorName(author: { display_name: string | null; username: string }): string {
  return author.display_name || author.username
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
