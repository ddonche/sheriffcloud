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

  let userId: string
  try {
    const token = authHeader.replace("Bearer ", "")
    const payload = JSON.parse(atob(token.split(".")[1]))
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
    session_id?: string
    content?: string
    pause_session?: boolean
  }

  try {
    payload = await req.json()
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body" })
  }

  const sessionId = payload.session_id?.trim()
  const content = (payload.content ?? "").trim()
  const pauseSession = payload.pause_session ?? true

  if (!sessionId) {
    return json(400, { ok: false, error: "session_id is required" })
  }

  if (!content) {
    return json(400, { ok: false, error: "content is required" })
  }

  const { data: session, error: sessionError } = await supabase
    .from("ai_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single()

  if (sessionError || !session) {
    return json(404, { ok: false, error: "Session not found" })
  }

  if (session.status === "ended") {
    return json(400, { ok: false, error: "Session already ended" })
  }

  const { data: message, error: insertError } = await supabase
    .from("ai_messages")
    .insert({
      session_id: session.id,
      role: "user",
      content,
    })
    .select("*")
    .single()

  if (insertError || !message) {
    return json(500, { ok: false, error: insertError?.message ?? "Failed to add message" })
  }

  let updatedSession = session

  if (pauseSession) {
    const { data: paused, error: pauseError } = await supabase
      .from("ai_sessions")
      .update({ status: "paused" })
      .eq("id", session.id)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (pauseError || !paused) {
      return json(500, {
        ok: false,
        error: pauseError?.message ?? "Failed to pause session",
        message,
      })
    }

    updatedSession = paused
  }

  return json(200, {
    ok: true,
    session: updatedSession,
    message,
  })
})
