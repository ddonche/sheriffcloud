import { getSupabase } from '../../shared/supabase'
import type { RouterResponse } from './types'

const SUPABASE_URL = 'https://ukyjfstfoaybvzwplrwx.supabase.co'
const SUPABASE_KEY = 'sb_publishable_rscjPXRJKAm8ZSTRXr_wZw_-umwFzDD'

type CacheEntry = {
  data: RouterResponse
  expiresAt: number
}

const DEFAULT_TTL = 60_000 // 1 minute

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<RouterResponse>>()

export function getSubdomain(): string {
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search)
    return params.get('sub') ?? 'goblin'
  }
  const parts = hostname.split('.')
  return parts.length >= 3 ? parts[0] : hostname
}

function normalizePath(path: string): string {
  if (path === "/" || path === "") return "/blog"
  return path
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
 * - If fresh cached data exists: return it immediately
 * - If stale cached data exists: return it immediately and refresh in background
 * - If a request is already in flight: reuse it
 * - If no cache exists: fetch and cache
 */
export async function fetchRoute(
  path: string,
  onRevalidate?: (data: RouterResponse) => void
): Promise<RouterResponse> {
  const subdomain = getSubdomain()
  const effectivePath = normalizePath(path)
  const key = `${subdomain}:${effectivePath}`
  const now = Date.now()

  const cached = cache.get(key)

  // Fresh cache: instant return
  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  // Reuse in-flight request if one already exists
  if (inflight.has(key)) {
    return inflight.get(key)!
  }

  const request = doFetch(effectivePath)
    .then((data) => {
      cache.set(key, {
        data,
        expiresAt: Date.now() + DEFAULT_TTL,
      })
      if (onRevalidate) onRevalidate(data)
      return data
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, request)

  // Stale cache: return immediately, refresh silently in background
  if (cached) {
    request.then((fresh) => {
      if (onRevalidate) onRevalidate(fresh)
    }).catch(() => {})
    return cached.data
  }

  // No cache: wait for network
  return request
}

/** Prefetch a route into cache without returning anything */
export function prefetchRoute(path: string): void {
  const subdomain = getSubdomain()
  const effectivePath = normalizePath(path)
  const key = `${subdomain}:${effectivePath}`
  const now = Date.now()

  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) return
  if (inflight.has(key)) return

  const request = doFetch(effectivePath)
    .then((data) => {
      cache.set(key, {
        data,
        expiresAt: Date.now() + DEFAULT_TTL,
      })
      return data
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, request)
}

/** Bust cache for a path — call after likes/comments/edits */
export function bustRoute(path: string): void {
  const subdomain = getSubdomain()
  const effectivePath = normalizePath(path)
  const key = `${subdomain}:${effectivePath}`
  cache.delete(key)
  inflight.delete(key)
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