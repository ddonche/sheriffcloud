import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return json(401, { ok: false, error: "Missing Authorization header" })
  }

  // Decode JWT locally — no network call needed
  let userId: string
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "")
    const parts = token.split(".")
    if (parts.length < 2) throw new Error("Malformed token")
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    userId = payload.sub
    if (!userId) throw new Error("No subject")
  } catch {
    return json(401, { ok: false, error: "Invalid token" })
  }

  // Use service role key so RLS doesn't block us
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, has_ai_access, is_suspended")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    return json(403, { ok: false, error: "Profile not found" })
  }

  if (profile.is_suspended) {
    return json(403, { ok: false, error: "Account suspended" })
  }

  if (!profile.has_ai_access) {
    return json(403, { ok: false, error: "AI access denied" })
  }

  let payload: {
    provider?: "openai" | "gemini" | "claude" | "grok"
    label?: string
    secret?: string
  }

  try {
    payload = await req.json()
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body" })
  }

  const provider = payload.provider
  const label = (payload.label ?? "default").trim()
  const secret = (payload.secret ?? "").trim()

  if (!provider || !["openai", "gemini", "claude", "grok"].includes(provider)) {
    return json(400, { ok: false, error: `Invalid provider: ${provider}` })
  }

  if (!secret) {
    return json(400, { ok: false, error: "Secret is required" })
  }

  const { error: deactivateError } = await supabase
    .from("ai_credentials")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("is_active", true)

  if (deactivateError) {
    return json(500, { ok: false, error: deactivateError.message })
  }

  const { data: credential, error: insertError } = await supabase
    .from("ai_credentials")
    .insert({
      user_id: userId,
      provider,
      label,
      encrypted_secret: secret,
      is_active: true,
    })
    .select("id, user_id, provider, label, is_active, created_at, updated_at")
    .single()

  if (insertError || !credential) {
    return json(500, { ok: false, error: insertError?.message ?? "Failed to save credential" })
  }

  return json(200, {
    ok: true,
    credential,
  })
})
