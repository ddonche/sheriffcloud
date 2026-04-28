/**
 * Sheriff Cloud — API Auth Proxy
 *
 * Sits between nginx and Goblin. nginx sends an auth_request here before
 * proxying any /api/* call to Goblin. This service:
 *
 *   1. Extracts the Bearer JWT from the Authorization header
 *   2. Verifies it against Supabase to get the user_id
 *   3. Extracts the portal name from the original request query string
 *   4. Checks that a `sites` row exists with subdomain=portal AND owner_id=user_id
 *   5. Returns 200 + x-goblin-auth-user-id header on success, 401/403 on failure
 *
 * nginx then injects x-goblin-auth-user-id into the Goblin request so Goblin
 * scripts can trust the user identity without doing any auth themselves.
 */

import { createClient } from "@supabase/supabase-js"

const PORT = parseInt(process.env.AUTH_PROXY_PORT ?? "9002")
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ""
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ""

if (!SUPABASE_URL) {
  console.error("AUTH PROXY: SUPABASE_URL not set")
  process.exit(1)
}

if (!SUPABASE_SERVICE_KEY) {
  console.error("AUTH PROXY: SUPABASE_SERVICE_ROLE_KEY not set — needed to verify JWTs and check ownership")
  process.exit(1)
}

// Service role client — only used server-side, never exposed to browser
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract portal name from the original nginx query string.
 * Handles both:
 *   - Simple:  ?bassipedia
 *   - Named:   ?portal=bassipedia&path=content/index.md
 */
function portalFromQuery(qs: string): string {
  if (!qs) return ""
  const decoded = decodeURIComponent(qs)

  // Named param
  const named = new URLSearchParams(decoded).get("portal")
  if (named) return named.trim().toLowerCase()

  // Simple — entire query string is the portal name
  const simple = decoded.split("&")[0].split("=")[0].trim().toLowerCase()
  // Sanity check — portal names are alphanumeric + hyphens only
  if (/^[a-z0-9][a-z0-9-_]*$/.test(simple)) return simple

  return ""
}

function respond(res: any, status: number, headers: Record<string, string> = {}) {
  const body = status === 200 ? "ok" : status === 401 ? "unauthorized" : "forbidden"
  const allHeaders: Record<string, string> = {
    "Content-Type": "text/plain",
    "Content-Length": String(Buffer.byteLength(body)),
    ...headers,
  }
  res.writeHead(status, allHeaders)
  res.end(body)
}

// ── Read-only endpoints that don't need ownership check ───────────────────────
// These still require a valid JWT (logged in user) but don't need to own the portal.
// Expand this list if needed.
const READ_ONLY_ENDPOINTS = [
  "/api/portals",
  "/api/test",
]

// ── Server ────────────────────────────────────────────────────────────────────

import http from "node:http"

const server = http.createServer(async (req, res) => {
  try {
    const originalUri = req.headers["x-original-uri"] as string ?? ""
    const originalQuery = req.headers["x-original-query"] as string ?? ""
    const authorization = req.headers["authorization"] as string ?? ""

    // ── 1. Extract JWT ────────────────────────────────────────────────────────
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : ""

    if (!token) {
      return respond(res, 401)
    }

    // ── 2. Verify JWT + get user ──────────────────────────────────────────────
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return respond(res, 401)
    }

    const userId = user.id

    // ── 3. Read-only endpoints — just need a valid login ──────────────────────
    const path = originalUri.split("?")[0]
    if (READ_ONLY_ENDPOINTS.some(e => path.startsWith(e))) {
      return respond(res, 200, { "x-goblin-auth-user-id": userId })
    }

    // ── 4. Extract portal name ────────────────────────────────────────────────
    const portal = portalFromQuery(originalQuery)

    if (!portal) {
      // No portal in query — can't check ownership, deny
      return respond(res, 403)
    }

    // ── 5. Check ownership ────────────────────────────────────────────────────
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id")
      .eq("subdomain", portal)
      .eq("owner_id", userId)
      .maybeSingle()

    if (siteError || !site) {
      return respond(res, 403)
    }

    // ── 6. Authorized — pass user id to Goblin ────────────────────────────────
    return respond(res, 200, {
      "x-goblin-auth-user-id": userId,
      "x-goblin-auth-email":   user.email ?? "",
    })

  } catch (err) {
    console.error("AUTH PROXY ERROR:", err)
    return respond(res, 401)
  }
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Sheriff auth proxy listening on 127.0.0.1:${PORT}`)
})
