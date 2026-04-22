import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  })
}

function err(message: string, status = 400) {
  return json({ ok: false, error: message }, status)
}

// ── R2 S3 signing ─────────────────────────────────────────────────────────────

async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  )
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data))
}

function hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("")
}

async function sha256Hex(data: string | ArrayBuffer): Promise<string> {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data
  return hex(await crypto.subtle.digest("SHA-256", buf))
}

async function signedR2Request(opts: {
  method: string
  bucket: string
  key: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  body?: string | ArrayBuffer | null
  contentType?: string
}): Promise<Response> {
  const { method, bucket, key, endpoint, accessKeyId, secretAccessKey, body, contentType } = opts

  const url = new URL(`/${bucket}/${key}`, endpoint)
  const now = new Date()
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "")
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z"
  const region = "auto"
  const service = "s3"

  const bodyBuf = body
    ? (typeof body === "string" ? new TextEncoder().encode(body) : body)
    : new ArrayBuffer(0)

  const payloadHash = await sha256Hex(bodyBuf)

  const headers: Record<string, string> = {
    "host": url.host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  }
  if (contentType) headers["content-type"] = contentType

  const signedHeaders = Object.keys(headers).sort().join(";")
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k}:${headers[k]}`).join("\n") + "\n"

  const canonicalRequest = [
    method,
    url.pathname,
    url.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n")

  const enc = new TextEncoder()
  const kDate    = await hmacSha256(enc.encode(`AWS4${secretAccessKey}`), dateStamp)
  const kRegion  = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, "aws4_request")
  const signature = hex(await hmacSha256(kSigning, stringToSign))

  headers["authorization"] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return fetch(url.toString(), {
    method,
    headers,
    body: body ? bodyBuf : undefined,
  })
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS })
  }

  // Auth
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return err("Missing authorization", 401)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return err("Unauthorized", 401)

  // R2 config
  const R2_ENDPOINT      = Deno.env.get("R2_ENDPOINT")!
  const R2_BUCKET        = Deno.env.get("R2_BUCKET")!
  const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!
  const R2_SECRET        = Deno.env.get("R2_SECRET_ACCESS_KEY")!

  // Parse action + siteId from URL
  const url     = new URL(req.url)
  const action  = url.searchParams.get("action")
  const siteId  = url.searchParams.get("site_id")

  if (!siteId) return err("Missing site_id")
  if (!action)  return err("Missing action")

  // Verify ownership
  const { data: site, error: siteErr } = await supabase
    .from("sites")
    .select("id, subdomain, owner_id, site_origin")
    .eq("id", siteId)
    .single()

  if (siteErr || !site) return err("Site not found", 404)
  if (site.owner_id !== user.id) return err("Forbidden", 403)
  if (site.site_origin !== "sheriffcloud") return err("Not a Sheriff site", 400)

  const prefix = `source/${site.subdomain}/`

  // ── LIST ──────────────────────────────────────────────────────
  if (action === "list") {
    const res = await signedR2Request({
      method: "GET",
      bucket: R2_BUCKET,
      key: `?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=1000`,
      endpoint: R2_ENDPOINT,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET,
    })

    const xml = await res.text()
    const keys: string[] = []
    const matches = xml.matchAll(/<Key>([^<]+)<\/Key>/g)
    for (const m of matches) {
      const rel = m[1].slice(prefix.length)
      if (rel) keys.push(rel)
    }

    return json({ ok: true, files: keys })
  }

  // ── READ ──────────────────────────────────────────────────────
  if (action === "read") {
    const path = url.searchParams.get("path")
    if (!path) return err("Missing path")
    if (path.includes("..")) return err("Invalid path")

    const key = `${prefix}${path}`
    const res = await signedR2Request({
      method: "GET",
      bucket: R2_BUCKET,
      key,
      endpoint: R2_ENDPOINT,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET,
    })

    if (!res.ok) return err("File not found", 404)
    const content = await res.text()
    return json({ ok: true, path, content })
  }

  // ── WRITE ─────────────────────────────────────────────────────
  if (action === "write") {
    const path = url.searchParams.get("path")
    if (!path) return err("Missing path")
    if (path.includes("..")) return err("Invalid path")

    const body = await req.text()
    const key = `${prefix}${path}`

    const res = await signedR2Request({
      method: "PUT",
      bucket: R2_BUCKET,
      key,
      endpoint: R2_ENDPOINT,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET,
      body,
      contentType: "text/plain; charset=utf-8",
    })

    if (!res.ok) return err(`R2 write failed: ${res.status}`, 500)
    return json({ ok: true, path })
  }

  // ── DELETE ────────────────────────────────────────────────────
  if (action === "delete") {
    const path = url.searchParams.get("path")
    if (!path) return err("Missing path")
    if (path.includes("..")) return err("Invalid path")

    const key = `${prefix}${path}`
    const res = await signedR2Request({
      method: "DELETE",
      bucket: R2_BUCKET,
      key,
      endpoint: R2_ENDPOINT,
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET,
    })

    if (!res.ok && res.status !== 204) return err(`R2 delete failed: ${res.status}`, 500)
    return json({ ok: true, path })
  }

  return err("Unknown action")
})
