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
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

type Speaker = "chatgpt" | "gemini" | "claude" | "grok"
type Mode = "collaborative" | "balanced" | "adversarial" | "decision"

const VALID_SPEAKERS: Speaker[] = ["chatgpt", "gemini", "claude", "grok"]
const VALID_MODES: Mode[] = ["collaborative", "balanced", "adversarial", "decision"]

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return json(401, { ok: false, error: "Missing Authorization header" })

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

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, has_ai_access, is_suspended")
    .eq("id", userId)
    .single()

  if (profileError || !profile) return json(403, { ok: false, error: "Profile not found" })
  if (profile.is_suspended) return json(403, { ok: false, error: "Account suspended" })
  if (!profile.has_ai_access) return json(403, { ok: false, error: "AI access denied" })

  let body: {
    title?: string
    first_speaker?: Speaker
    participants?: Speaker[]
    mode?: Mode
    opening_message?: string
    use_master_prompt?: boolean
  }

  try {
    body = await req.json()
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body" })
  }

  const title = (body.title ?? "").trim()
  if (!title) return json(400, { ok: false, error: "Title is required" })

  const participants: Speaker[] = Array.isArray(body.participants) && body.participants.length > 0
    ? body.participants
    : [body.first_speaker ?? "chatgpt", "gemini"]

  const invalidParticipant = participants.find(p => !VALID_SPEAKERS.includes(p))
  if (invalidParticipant) return json(400, { ok: false, error: `Invalid participant: ${invalidParticipant}` })

  const firstSpeaker: Speaker = body.first_speaker ?? participants[0]
  if (!VALID_SPEAKERS.includes(firstSpeaker)) return json(400, { ok: false, error: `Invalid first_speaker: ${firstSpeaker}` })

  const mode: Mode = VALID_MODES.includes(body.mode as Mode) ? body.mode as Mode : "balanced"
  const openingMessage = (body.opening_message ?? "").trim()
  const useMasterPrompt = body.use_master_prompt !== false // default true

  const { data: session, error: sessionError } = await supabase
    .from("ai_sessions")
    .insert({
      user_id: userId,
      title,
      status: "paused",
      first_speaker: firstSpeaker,
      next_speaker: firstSpeaker,
      participants,
      mode,
      use_master_prompt: useMasterPrompt,
    })
    .select("*")
    .single()

  if (sessionError || !session) {
    return json(500, { ok: false, error: sessionError?.message ?? "Failed to create session" })
  }

  if (openingMessage) {
    const { error: messageError } = await supabase
      .from("ai_messages")
      .insert({ session_id: session.id, role: "user", content: openingMessage })

    if (messageError) return json(500, { ok: false, error: messageError.message, session })
  }

  return json(200, { ok: true, session })
})
