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

type MessageRow = {
  role: "user" | Speaker | "system"
  content: string
}

function providerFromSpeaker(speaker: Speaker): string {
  if (speaker === "chatgpt") return "openai"
  return speaker
}

function speakerLabel(speaker: Speaker): string {
  return speaker.toUpperCase()
}

function nextSpeaker(current: Speaker, participants: Speaker[]): Speaker {
  if (participants.length === 0) return current
  const idx = participants.indexOf(current)
  return participants[(idx + 1) % participants.length]
}

// ── masterPrompt is optional — only appended when present and session has use_master_prompt = true
function buildSystemPrompt(identity: Speaker, participants: Speaker[], mode: Mode, masterPrompt?: string): string {
  const allParticipants = ["the user", ...participants.map(speakerLabel)].join(", ")

  const identityStyles: Record<Speaker, string> = {
    chatgpt: "You are bold and product-minded. You have strong opinions and you voice them. You don't hedge. You push ideas forward and call out weak thinking directly.",
    gemini:  "You are precise and constraint-driven. You think about feasibility, tradeoffs, and what actually holds up under pressure. You would rather be accurate than impressive.",
    claude:  "You are direct and a little skeptical. You notice when assumptions are being made and you say so. You would rather be honest than agreeable.",
    grok:    "You are blunt and unconventional. You cut through noise and say what others are dancing around. You are not interested in being polished — you are interested in being right.",
  }

  const modeContext: Record<Mode, string> = {
    collaborative:
      `The goal is to build something better together. ` +
      `Answer the user's question or task fully and directly first — bring your own ideas, angles, and substance to the table. ` +
      `Then engage with what others have said: extend a good idea, finish a half-formed one, combine angles that work together. ` +
      `Do not just react to the last message. Contribute to the actual topic.`,

    balanced:
      `Answer the user's question or task directly and fully. Bring your own perspective — don't just riff on what others said. ` +
      `Then engage with the other participants: agree where you genuinely agree, push back where you don't. ` +
      `If you had a position and someone challenges it, either defend it with actual reasoning or say specifically what changed your mind. ` +
      `Caving without explanation is a non-answer. The user wants real takes, not consensus performance.`,

    adversarial:
      `Answer the user's question or task — then find the weakest point in whatever has been said, including your own answer if warranted, and go at it directly. ` +
      `Ask the question nobody wants to answer. Point out what breaks under pressure. ` +
      `If someone pushes back on you, hold your ground or concede with a specific reason — not just "good point." ` +
      `This mode exists to stress-test thinking. Conflict without substance is useless; conflict with reasoning is the goal.`,

    decision:
      `Answer the user's question with a clear recommendation — don't hedge, don't list ten options. Pick a direction and argue for it. ` +
      `Engage with what others recommend: challenge it if you disagree, build on it if it's right, correct it if it's incomplete. ` +
      `Keep moving toward a conclusion. Do not reopen things that are already settled. ` +
      `A confident recommendation with clear reasoning is the output. Not a summary of the debate.`,
  }

  const parts = [
    `You are ${speakerLabel(identity)}, one of several AI participants in a live discussion alongside ${allParticipants}.`,
    ``,
    `Your first job is to actually answer what the user asked — fully and directly.`,
    `If they ask for ideas, generate ideas. If they ask for pros and cons, give pros and cons. If they ask for a recommendation, make one.`,
    `Let the question drive the format. Use structure when it helps, skip it when it does not.`,
    ``,
    `Your second job is to engage with the other participants like you are in a real conversation.`,
    `Do not announce who you are addressing. Do not restate what others said before giving your take.`,
    `Do not perform agreement. If you changed your mind, say what specifically changed it.`,
    `Do not step outside the conversation to analyze the request, critique how others are responding, or explain naming conventions. Stay in it.`,
    ``,
    modeContext[mode],
    ``,
    `Your voice: ${identityStyles[identity]}`,
  ]

  if (masterPrompt?.trim()) {
    parts.push(``)
    parts.push(`Additional instructions from the user:`)
    parts.push(masterPrompt.trim())
  }

  return parts.join("\n")
}

// ── Provider callers ─────────────────────────────────────────────────────────

async function callOpenAI(apiKey: string, identity: Speaker, transcript: MessageRow[]): Promise<string> {
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o"

  const messages = transcript.map(m => {
    if (m.role === "system") {
      return {
        role: "system" as const,
        content: m.content,
      }
    }

    if (m.role === "user") {
      return {
        role: "user" as const,
        content: m.content,
      }
    }

    return {
      role: "assistant" as const,
      content: `${speakerLabel(m.role as Speaker)}: ${m.content}`,
    }
  })

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.9 }),
  })
  const data = await res.json()
  console.log("OpenAI status:", res.status, JSON.stringify(data).slice(0, 300))
  if (!res.ok) throw new Error(data?.error?.message ?? "OpenAI request failed")
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error("OpenAI returned no content")
  return text.replace(new RegExp(`^${speakerLabel(identity)}:\\s*`, "i"), "").trim()
}

async function callGemini(apiKey: string, identity: Speaker, transcript: MessageRow[]): Promise<string> {
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const systemText = transcript.find(m => m.role === "system")?.content ?? ""

  const rawContents = transcript
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.role === "user" ? m.content : `${speakerLabel(m.role as Speaker)}: ${m.content}` }],
    }))

  // Merge consecutive same-role messages
  const contents: { role: string; parts: { text: string }[] }[] = []
  for (const msg of rawContents) {
    const last = contents[contents.length - 1]
    if (last && last.role === msg.role) {
      last.parts.push(...msg.parts)
    } else {
      contents.push({ role: msg.role, parts: [...msg.parts] })
    }
  }

  if (contents.length > 0 && contents[0].role !== "user") {
    contents.unshift({ role: "user", parts: [{ text: "(conversation start)" }] })
  }

  if (contents.length > 0 && contents[contents.length - 1].role === "model") {
    contents.push({ role: "user", parts: [{ text: "(please continue)" }] })
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig: { temperature: 0.9 },
    }),
  })
  const data = await res.json()
  console.log("Gemini status:", res.status, JSON.stringify(data).slice(0, 500))
  if (!res.ok) throw new Error(data?.error?.message ?? "Gemini request failed")

  const blockReason = data?.promptFeedback?.blockReason
  if (blockReason) throw new Error(`Gemini blocked the request: ${blockReason}`)

  const candidate = data?.candidates?.[0]
  if (!candidate) throw new Error(`Gemini returned no candidates — response: ${JSON.stringify(data).slice(0, 300)}`)

  const finishReason = candidate?.finishReason
  if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
    throw new Error(`Gemini stopped early: ${finishReason}`)
  }

  const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim()
  if (!text) throw new Error(`Gemini returned empty content — candidate: ${JSON.stringify(candidate).slice(0, 300)}`)
  return text.replace(new RegExp(`^${speakerLabel(identity)}:\\s*`, "i"), "").trim()
}

async function callClaude(apiKey: string, identity: Speaker, transcript: MessageRow[]): Promise<string> {
  const model = Deno.env.get("CLAUDE_MODEL") || "claude-sonnet-4-6"
  const systemText = transcript.find(m => m.role === "system")?.content ?? ""

  const rawMessages = transcript
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "user" ? "user" as const : "assistant" as const,
      content: m.role === "user" ? m.content : `${speakerLabel(m.role as Speaker)}: ${m.content}`,
    }))

  // Merge consecutive same-role messages
  const messages: { role: "user" | "assistant"; content: string }[] = []
  for (const msg of rawMessages) {
    const last = messages[messages.length - 1]
    if (last && last.role === msg.role) {
      last.content += "\n\n" + msg.content
    } else {
      messages.push({ ...msg })
    }
  }

  if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
    messages.push({ role: "user", content: "(please continue)" })
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: 1024, system: systemText, messages }),
  })
  const data = await res.json()
  console.log("Claude status:", res.status, JSON.stringify(data).slice(0, 300))
  if (!res.ok) throw new Error(data?.error?.message ?? `Claude request failed — last role: ${messages[messages.length - 1].role}, count: ${messages.length}`)
  const text = data?.content?.[0]?.text
  if (!text) throw new Error("Claude returned no content")
  return text.replace(new RegExp(`^${speakerLabel(identity)}:\\s*`, "i"), "").trim()
}

async function callGrok(apiKey: string, identity: Speaker, transcript: MessageRow[]): Promise<string> {
  const model = Deno.env.get("GROK_MODEL") || "grok-3-latest"

  const messages = transcript.map(m => {
    if (m.role === "system") {
      return {
        role: "system" as const,
        content: m.content,
      }
    }

    if (m.role === "user") {
      return {
        role: "user" as const,
        content: m.content,
      }
    }

    return {
      role: "assistant" as const,
      content: `${speakerLabel(m.role as Speaker)}: ${m.content}`,
    }
  })

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.9 }),
  })
  const data = await res.json()
  console.log("Grok status:", res.status, JSON.stringify(data).slice(0, 300))
  if (!res.ok) throw new Error(data?.error?.message ?? "Grok request failed")
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error("Grok returned no content")
  return text.replace(new RegExp(`^${speakerLabel(identity)}:\\s*`, "i"), "").trim()
}

async function callProvider(provider: string, apiKey: string, identity: Speaker, transcript: MessageRow[]): Promise<string> {
  if (provider === "openai") return callOpenAI(apiKey, identity, transcript)
  if (provider === "gemini") return callGemini(apiKey, identity, transcript)
  if (provider === "claude") return callClaude(apiKey, identity, transcript)
  if (provider === "grok")   return callGrok(apiKey, identity, transcript)
  throw new Error(`Unknown provider: ${provider}`)
}

// ── JWT ──────────────────────────────────────────────────────────────────────

function decodeJwtPayload(token: string) {
  const parts = token.split(".")
  if (parts.length < 2) throw new Error("Malformed token")
  const base64Url = parts[1]
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  return JSON.parse(atob(padded))
}

// ── Handler ──────────────────────────────────────────────────────────────────

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
    const payload = decodeJwtPayload(token)
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

  // Fetch user settings (master prompt) — null row is fine, just means no settings yet
  const { data: accountSettings } = await supabase
    .from("account_settings")
    .select("master_prompt")
    .eq("user_id", userId)
    .single()

  let body: { session_id?: string; model?: string; pause_after_turn?: boolean }
  try { body = await req.json() } catch { return json(400, { ok: false, error: "Invalid JSON body" }) }

  const sessionId = body.session_id?.trim()
  if (!sessionId) return json(400, { ok: false, error: "session_id is required" })
  const pauseAfterTurn = body.pause_after_turn ?? true

  const { data: session, error: sessionError } = await supabase
    .from("ai_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single()

  if (sessionError || !session) return json(404, { ok: false, error: "Session not found" })
  if (session.status === "ended") return json(400, { ok: false, error: "Session already ended" })

  // Participants — fall back to legacy 2-party if not stored
  const participants: Speaker[] = Array.isArray(session.participants) && session.participants.length > 0
    ? session.participants as Speaker[]
    : [session.first_speaker as Speaker, session.first_speaker === "chatgpt" ? "gemini" : "chatgpt"]

  const mode: Mode = (session.mode as Mode) || "balanced"

  // Speaker: explicit client override > session next_speaker > first participant
  const currentSpeaker: Speaker = (body.model as Speaker) ?? (session.next_speaker as Speaker) ?? participants[0]

  if (!participants.includes(currentSpeaker)) {
    return json(400, { ok: false, error: `"${currentSpeaker}" is not a participant in this session` })
  }

  const provider = providerFromSpeaker(currentSpeaker)
  console.log("speaker:", currentSpeaker, "provider:", provider, "mode:", mode, "participants:", participants)

  const { data: credential, error: credentialError } = await supabase
    .from("ai_credentials")
    .select("encrypted_secret")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("is_active", true)
    .single()

  if (credentialError || !credential?.encrypted_secret) {
    return json(400, { ok: false, error: `Missing active ${provider} credential` })
  }

  const { data: messages, error: messagesError } = await supabase
    .from("ai_messages")
    .select("role, content, created_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true })

  if (messagesError) return json(500, { ok: false, error: messagesError.message })
  console.log("message count:", messages?.length ?? 0)

  // Only pass master prompt if session has use_master_prompt = true and the user has one set
  const masterPrompt = session.use_master_prompt !== false
    ? (accountSettings?.master_prompt ?? undefined)
    : undefined

  const transcript: MessageRow[] = [
    { role: "system", content: buildSystemPrompt(currentSpeaker, participants, mode, masterPrompt) },
    ...((messages ?? []).map(m => ({ role: m.role as MessageRow["role"], content: m.content }))),
  ]

  let reply = ""
  try {
    reply = await callProvider(provider, credential.encrypted_secret, currentSpeaker, transcript)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Provider call failed"
    console.error("Provider error:", msg)
    return json(502, { ok: false, error: msg })
  }

  const { data: newMessage, error: insertError } = await supabase
    .from("ai_messages")
    .insert({ session_id: session.id, role: currentSpeaker, content: reply })
    .select("*")
    .single()

  if (insertError || !newMessage) {
    return json(500, { ok: false, error: insertError?.message ?? "Failed to save AI message" })
  }

  const { data: updatedSession, error: updateSessionError } = await supabase
    .from("ai_sessions")
    .update({
      status: pauseAfterTurn ? "paused" : "running",
      next_speaker: nextSpeaker(currentSpeaker, participants),
    })
    .eq("id", session.id)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (updateSessionError || !updatedSession) {
    return json(500, {
      ok: false,
      error: updateSessionError?.message ?? "Failed to update session",
      message: newMessage,
    })
  }

  return json(200, { ok: true, session: updatedSession, message: newMessage })
})
