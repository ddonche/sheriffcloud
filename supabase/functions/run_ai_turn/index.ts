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

function buildSystemPrompt(identity: Speaker, participants: Speaker[], mode: Mode): string {
  const others = participants.filter(p => p !== identity).map(speakerLabel)
  const othersStr = others.length > 0 ? others.join(" and ") : "the other AI"
  const allParticipants = ["USER", ...participants.map(speakerLabel)].join(", ")

  const identityStyles: Record<Speaker, string> = {
    chatgpt: "Bold, product-minded, decisive. Push for strong opinions over safe answers. Challenge weak ideas.",
    gemini:  "Analytical, efficient, constraint-driven. Focus on feasibility, tradeoffs, and clean reasoning. Prefer precision over flair.",
    claude:  "Thoughtful, nuanced, direct. Balance depth with clarity. Call out assumptions. Prefer honest over agreeable.",
    grok:    "Irreverent, sharp, unconventional. Cut through noise. Prioritize signal. Don't be afraid to be blunt or contrarian.",
  }

  const modeRules: Record<Mode, string[]> = {
    collaborative: [
      `Mode: COLLABORATIVE.`,
      `Goal: Co-create better ideas together through refinement.`,

      `You MUST do at least one of the following each turn:`,
      `- Build on another AI's idea`,
      `- Improve or combine ideas`,
      `- Ask 1 targeted clarification question to another AI or USER`,

      `Prefer fewer, higher-quality ideas over many weak ones.`,
      `Do NOT just list ideas. Refine them.`,

      `If another AI has already said something useful, extend it instead of repeating it.`,
    ],

    balanced: [
      `Mode: BALANCED.`,
      `Goal: Think clearly with selective agreement and pushback.`,

      `You may:`,
      `- Agree and extend`,
      `- Disagree and explain why`,
      `- Ask 1 targeted clarification question if it improves the outcome`,

      `Do NOT repeat what others said.`,
      `Add new insight, tradeoffs, or improvements.`,

      `Prioritize alignment with USER intent over novelty.`,
    ],

    adversarial: [
      `Mode: ADVERSARIAL.`,
      `Goal: Pressure-test ideas and expose weaknesses.`,

      `You MUST challenge at least one idea from USER or another AI.`,
      `Use reasoning, not tone, to attack weak ideas.`,

      `You may ask pointed questions to expose flaws.`,
      `Example: "How does this scale?" or "What happens if X fails?"`,

      `Do NOT agree unless an idea withstands scrutiny.`,
      `No fluff. No politeness padding.`,
    ],

    decision: [
      `Mode: DECISION.`,
      `Goal: Deliberate briefly, then converge on the best answer.`,

      `You MUST follow this structure:`,

      `Phase 1: Propose 1–2 strong options.`,
      `Phase 2: Compare your options against others.`,
      `Phase 3: Ask 1 targeted question IF needed.`,
      `Phase 4: Recommend a final answer with reasoning.`,

      `Do NOT converge immediately.`,
      `Do NOT list many options.`,
      `Converge only after comparison.`,

      `Focus on reaching a confident, well-reasoned conclusion.`,
    ],
  }

  return [
    `You are ${speakerLabel(identity)} in a multi-party conversation with: ${allParticipants}.`,
    `Speak ONLY as ${speakerLabel(identity)}. NEVER speak for USER or ${othersStr}.`,
    `Answer USER's actual question directly. Do not reinterpret it.`,
    `You are participating in an ongoing conversation with other AI agents and the user.`,
    `The other AI agents are active participants, not just text quoted by the user.`,
    `Respond naturally as part of the discussion, not as a final structured answer.`,
    `Keep responses reasonably concise, but prioritize clarity and interaction over strict length.`,
    `Avoid rigid formats like bullet lists unless absolutely necessary.`,
    `You can address the user, another AI, or both.`,
    `When relevant, briefly respond to another AI's point directly, but do not do this every turn.`,
    `You may ask 1 short, relevant question if it improves the discussion.`,
    `Do not default to formal or template-style responses.`,
    ...modeRules[mode],
    `Your style: ${identityStyles[identity]}`,
  ].join(" ")
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

  const contents = transcript
    .filter(m => m.role !== "system")
    .map(m => {
      if (m.role === "user") {
        return {
          role: "user",
          parts: [{ text: m.content }],
        }
      }

      return {
        role: "model",
        parts: [{ text: `${speakerLabel(m.role as Speaker)}: ${m.content}` }],
      }
    })

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
  console.log("Gemini status:", res.status, JSON.stringify(data).slice(0, 300))
  if (!res.ok) throw new Error(data?.error?.message ?? "Gemini request failed")
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim()
  if (!text) throw new Error("Gemini returned no text")
  return text.replace(new RegExp(`^${speakerLabel(identity)}:\\s*`, "i"), "").trim()
}

async function callClaude(apiKey: string, identity: Speaker, transcript: MessageRow[]): Promise<string> {
  const model = Deno.env.get("CLAUDE_MODEL") || "claude-sonnet-4-6"
  const systemText = transcript.find(m => m.role === "system")?.content ?? ""

  const messages = transcript
    .filter(m => m.role !== "system")
    .map(m => {
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

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: 512, system: systemText, messages }),
  })
  const data = await res.json()
  console.log("Claude status:", res.status, JSON.stringify(data).slice(0, 300))
  if (!res.ok) throw new Error(data?.error?.message ?? "Claude request failed")
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

  const transcript: MessageRow[] = [
    { role: "system", content: buildSystemPrompt(currentSpeaker, participants, mode) },
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