import { useEffect, useRef, useState } from "react"

type AiProvider = "chatgpt" | "gemini" | "claude" | "grok"
type AiMode = "collaborative" | "balanced" | "adversarial" | "decision"

type AiSession = {
  id: string
  title: string
  first_speaker: string
  participants: AiProvider[]
  mode: AiMode
  created_at: string
}

type AiMessage = {
  id: string
  role: string
  model: string
  content: string
  created_at: string
}

const AI_PROVIDERS: { id: AiProvider; label: string; color: string }[] = [
  { id: "chatgpt", label: "ChatGPT", color: "#2563eb" },
  { id: "gemini",  label: "Gemini",  color: "#e040a0" },
  { id: "claude",  label: "Claude",  color: "#c96442" },
  { id: "grok",    label: "Grok",    color: "#8b5cf6" },
]

const AI_MODES: { id: AiMode; label: string; color: string; desc: string; icon: string }[] = [
  { id: "collaborative", label: "Collaborative", color: "#ea7c1e", desc: "Build on each other — brainstorming, writing, ideation",
    icon: "M300.9 117.2L184.3 246.8C179.7 251.9 179.9 259.8 184.8 264.7C215.3 295.2 264.8 295.2 295.3 264.7L327.1 232.9C331.3 228.7 336.6 226.4 342 226C348.8 225.4 355.8 227.7 361 232.9L537.6 408L608 352L608 64L496 128L472.2 112.1C456.4 101.6 437.9 96 418.9 96L348.5 96C347.4 96 346.2 96 345.1 96.1C328.2 97 312.3 104.6 300.9 117.2zM148.6 214.7L255.4 96L215.8 96C190.3 96 165.9 106.1 147.9 124.1L32 256L32 608L176 472L188.4 482.3C211.4 501.5 240.4 512 270.3 512L286 512L279 505C269.6 495.6 269.6 480.4 279 471.1C288.4 461.8 303.6 461.7 312.9 471.1L353.9 512.1L362.9 512.1C382 512.1 400.7 507.8 417.7 499.8L391 473C381.6 463.6 381.6 448.4 391 439.1C400.4 429.8 415.6 429.7 424.9 439.1L456.9 471.1L474.4 453.6C483.3 444.7 485.9 431.8 482 420.5L344.1 283.7L329.2 298.6C279.9 347.9 200.1 347.9 150.8 298.6C127.8 275.6 126.9 238.7 148.6 214.6z" },
  { id: "balanced", label: "Balanced", color: "#3b82f6", desc: "Agree or disagree, call out weak points — general use",
    icon: "M384 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L398.4 160C393.2 185.8 375.5 207.1 352 217.3L352 512L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L128 576C110.3 576 96 561.7 96 544C96 526.3 110.3 512 128 512L288 512L288 217.3C264.5 207 246.8 185.7 241.6 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L256 96C270.6 76.6 293.8 64 320 64C346.2 64 369.4 76.6 384 96zM439.6 384L584.4 384L512 259.8L439.6 384zM512 480C449.1 480 396.8 446 386 401.1C383.4 390.1 387 378.8 392.7 369L487.9 205.8C492.9 197.2 502.1 192 512 192C521.9 192 531.1 197.3 536.1 205.8L631.3 369C637 378.8 640.6 390.1 638 401.1C627.2 445.9 574.9 480 512 480zM126.8 259.8L54.4 384L199.3 384L126.8 259.8zM.9 401.1C-1.7 390.1 1.9 378.8 7.6 369L102.8 205.8C107.8 197.2 117 192 126.9 192C136.8 192 146 197.3 151 205.8L246.2 369C251.9 378.8 255.5 390.1 252.9 401.1C242.1 445.9 189.8 480 126.9 480C64 480 11.7 446 .9 401.1z" },
  { id: "adversarial", label: "Adversarial", color: "#ef4444", desc: "Pressure test everything — strategy, validation",
    icon: "M288 64C305.7 64 320 78.3 320 96L320 208L256 208L256 96C256 78.3 270.3 64 288 64zM160 128C160 110.3 174.3 96 192 96C209.7 96 224 110.3 224 128L224 208L160 208L160 128zM352 128C352 110.3 366.3 96 384 96C401.7 96 416 110.3 416 128L416 224C416 241.7 401.7 256 384 256C366.3 256 352 241.7 352 224L352 128zM448 192C448 174.3 462.3 160 480 160C497.7 160 512 174.3 512 192L512 256C512 273.7 497.7 288 480 288C462.3 288 448 273.7 448 256L448 192zM352 280L352 279.4C361.4 284.8 372.3 288 384 288C397.2 288 409.4 284 419.6 277.2C428.3 302.1 452.1 320 480 320C491.7 320 502.6 316.9 512 311.4L512 320C512 372.3 486.9 418.8 448 448L448 544C448 561.7 433.7 576 416 576L256 576C238.3 576 224 561.7 224 544L224 465.6C206.7 457.7 190.8 446.8 177.1 433.1L165.5 421.5C141.5 397.5 128 364.9 128 331L128 304C128 268.7 156.7 240 192 240L280 240C302.1 240 320 257.9 320 280C320 302.1 302.1 320 280 320L224 320C215.2 320 208 327.2 208 336C208 344.8 215.2 352 224 352L280 352C319.8 352 352 319.8 352 280z" },
  { id: "decision", label: "Decision", color: "#a855f7", desc: "Debate first, then converge on a recommendation",
    icon: "M201.6 217.4L182.9 198.7C170.4 186.2 170.4 165.9 182.9 153.4L297.6 38.6C310.1 26.1 330.4 26.1 342.9 38.6L361.6 57.4C374.1 69.9 374.1 90.2 361.6 102.7L246.9 217.4C234.4 229.9 214.1 229.9 201.6 217.4zM308 275.7L276.6 244.3L388.6 132.3L508 251.7L396 363.7L364.6 332.3L132.6 564.3C117 579.9 91.7 579.9 76 564.3C60.3 548.7 60.4 523.4 76 507.7L308 275.7zM422.9 438.6C410.4 426.1 410.4 405.8 422.9 393.3L537.6 278.6C550.1 266.1 570.4 266.1 582.9 278.6L601.6 297.3C614.1 309.8 614.1 330.1 601.6 342.6L486.9 457.4C474.4 469.9 454.1 469.9 441.6 457.4L422.9 438.7z" },
]

const FONT = `"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif`

const C = {
  sidebarBg:     "#0b0916",
  sidebarBorder: "#1e1535",
  sidebarHover:  "#1e1535",
  sidebarActive: "#2a1a52",
  sidebarActiveBorder: "#7c3aed",
  chatBg:        "#f8fafc",
  chatBorder:    "#e2e8f0",
  userBubble:    "#2a1a52",
  userText:      "#f1f5f9",
  aiBubble:      "#ffffff",
  aiText:        "#0f172a",
  bubbleBorder:  "#e2e8f0",
  inputBg:       "#ffffff",
  inputBorder:   "#cbd5e1",
  accent:        "#7c3aed",
  textPrimary:   "#0f172a",
  textSecondary: "#475569",
  textMuted:     "#94a3b8",
}

function providerColor(role: string) {
  return AI_PROVIDERS.find(p => p.id === role)?.color ?? C.textMuted
}
function providerLabel(role: string) {
  if (role === "user") return "You"
  return AI_PROVIDERS.find(p => p.id === role)?.label ?? role
}

function Avatar({ role }: { role: string }) {
  const color = providerColor(role)
  const isUser = role === "user"
  const initial = isUser ? "Y" : providerLabel(role).charAt(0)
  return (
    <div style={{
      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
      background: isUser ? "#1e293b" : color + "20",
      border: `2px solid ${isUser ? "#334155" : color + "55"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, color: isUser ? "#94a3b8" : color,
      fontFamily: FONT,
    }}>
      {initial}
    </div>
  )
}

function AiPanel({ supabase }: { supabase: any }) {
  const [sessions, setSessions] = useState<AiSession[]>([])
  const [selectedSession, setSelectedSession] = useState<AiSession | null>(null)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [userMessage, setUserMessage] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newParticipants, setNewParticipants] = useState<AiProvider[]>(["chatgpt", "gemini"])
  const [newMode, setNewMode] = useState<AiMode>("balanced")
  const [openingMessage, setOpeningMessage] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [openaiKey, setOpenaiKey] = useState("")
  const [geminiKey, setGeminiKey] = useState("")
  const [claudeKey, setClaudeKey] = useState("")
  const [grokKey, setGrokKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [runningModel, setRunningModel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [showKeyHelp, setShowKeyHelp] = useState(false)
  const [mobileTab, setMobileTab] = useState<"chat" | "sessions">("chat")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [listening, setListening] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null)
  const lastMessageRef = useRef<HTMLDivElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  function toggleListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setError("Speech recognition not supported in this browser."); return }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = "en-US"
    rec.onresult = (e: any) => {
      const t = Array.from(e.results as any[]).slice(e.resultIndex).map((r: any) => r[0].transcript).join(" ")
      setUserMessage(prev => prev ? prev + " " + t : t)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => { if (listening) rec.start() }
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  async function invoke(fn: string, body: any) {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const res = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": supabaseKey, ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return { data, error: res.ok ? null : { message: data?.error ?? `HTTP ${res.status}` } }
  }

  useEffect(() => { loadSessions(); loadSavedKeys() }, [])
  

  useEffect(() => {
    const el = transcriptScrollRef.current
    if (!el) return
    setTimeout(() => { el.scrollTop = el.scrollHeight }, 0)
  }, [messages])
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return
      const delta = e.clientX - dragStartX.current
      setSidebarWidth(Math.max(180, Math.min(520, dragStartWidth.current + delta)))
    }
    function onMouseUp() {
      isDragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp) }
  }, [])

  async function loadSavedKeys() {
    const { data, error } = await supabase.from("ai_credentials").select("provider")
    if (!error && data) setSavedKeys(new Set(data.map((r: any) => r.provider)))
  }
  async function loadSessions() {
    const { data, error } = await supabase.from("ai_sessions").select("*").order("created_at", { ascending: false })
    if (!error) setSessions(data || [])
  }
  async function loadMessages(sessionId: string) {
    const { data, error } = await supabase.from("ai_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true })
    if (!error) setMessages(data || [])
  }
  async function selectSession(session: AiSession) {
    setSelectedSession(session); await loadMessages(session.id)
  }
  async function createSession() {
    if (!newTitle.trim() || newParticipants.length < 1) return
    setLoading(true); setError(null)
    const { data, error } = await invoke("create_ai_session", {
      title: newTitle, first_speaker: newParticipants[0], participants: newParticipants,
      mode: newMode, opening_message: openingMessage || undefined,
    })
    setLoading(false)
    if (error || !data?.ok) { setError(error?.message || data?.error || "Failed to create session"); return }
    setShowNewForm(false); setNewTitle(""); setOpeningMessage("")
    setNewParticipants(["chatgpt", "gemini"]); setNewMode("balanced")
    await loadSessions()
    if (data.session) await selectSession(data.session)
  }
  async function addMessage() {
    if (!userMessage.trim() || !selectedSession) return
    setLoading(true); setError(null)
    const { data, error } = await invoke("add_ai_message", { session_id: selectedSession.id, content: userMessage, pause_session: true })
    setLoading(false)
    if (error || !data?.ok) { setError(error?.message || data?.error || "Failed to add message"); return }
    setUserMessage(""); await loadMessages(selectedSession.id)
  }
  async function runTurn(model?: string) {
    if (!selectedSession) return
    setRunningModel(model ?? "auto"); setError(null)
    const { data, error } = await invoke("run_ai_turn", {
      session_id: selectedSession.id, ...(model ? { model } : {}), mode: selectedSession.mode ?? "balanced",
    })
    setRunningModel(null)
    if (error || !data?.ok) { setError(error?.message || data?.error || "Failed to run turn"); return }
    await loadMessages(selectedSession.id)
  }
  async function saveCredentials() {
    setLoading(true); setError(null)
    try {
      for (const [provider, secret] of [["openai", openaiKey], ["gemini", geminiKey], ["claude", claudeKey], ["grok", grokKey]] as [string,string][]) {
        if (!secret.trim()) continue
        const { data, error } = await invoke("save_ai_credentials", { provider, label: "default", secret: secret.trim() })
        if (error) throw error
        if (!data?.ok) throw new Error(data?.error || `Failed to save ${provider} key`)
      }
      setShowCredentials(false); setOpenaiKey(""); setGeminiKey(""); setClaudeKey(""); setGrokKey("")
      await loadSavedKeys()
    } catch (err: any) {
      setError(err.message || "Failed to save credentials")
    } finally { setLoading(false) }
  }
  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Delete this session and all its messages?")) return
    await supabase.from("ai_messages").delete().eq("session_id", id)
    await supabase.from("ai_sessions").delete().eq("id", id)
    if (selectedSession?.id === id) setSelectedSession(null)
    await loadSessions()
  }

  function copyMessage(id: string, content: string) {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1800)
    })
  }
  function copyAllMessages() {
    const text = messages.map(m => `[${providerLabel(m.role)}]\n${m.content}`).join("\n\n---\n\n")
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 1800)
    })
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────
  function renderSidebarHeader() {
    return (
      <div style={{
        height: 64, padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${C.sidebarBorder}`, flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT }}>
          Sessions
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {/* API Keys button */}
          <button onClick={() => { setShowCredentials(v => !v); setShowNewForm(false) }} title="API Keys"
            style={{
              width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
              background: showCredentials ? C.sidebarHover : "transparent",
              border: "none", borderRadius: 8, cursor: "pointer",
              color: showCredentials ? "#e040a0" : C.textMuted,
            }}>
            <svg viewBox="0 0 640 640" width={24} height={24} fill="currentColor">
              <path d="M400 416C497.2 416 576 337.2 576 240C576 142.8 497.2 64 400 64C302.8 64 224 142.8 224 240C224 258.7 226.9 276.8 232.3 293.7L71 455C66.5 459.5 64 465.6 64 472L64 552C64 565.3 74.7 576 88 576L168 576C181.3 576 192 565.3 192 552L192 512L232 512C245.3 512 256 501.3 256 488L256 448L296 448C302.4 448 308.5 445.5 313 441L346.3 407.7C363.2 413.1 381.3 416 400 416zM440 160C462.1 160 480 177.9 480 200C480 222.1 462.1 240 440 240C417.9 240 400 222.1 400 200C400 177.9 417.9 160 440 160z"/>
            </svg>
          </button>
          {/* New session button */}
          <button onClick={() => { setShowNewForm(v => !v); setShowCredentials(false) }} title="New Session"
            style={{
              width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
              background: showNewForm ? C.sidebarHover : "transparent",
              border: "none", borderRadius: 8, cursor: "pointer",
              color: showNewForm ? "#2563eb" : C.textMuted,
            }}>
            <svg viewBox="0 0 640 640" width={24} height={24} fill="currentColor">
              <path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }

  function renderSessionsList(onSelect?: () => void) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

        {/* Credentials panel */}
        {showCredentials && (
          <div style={{ padding: "16px", borderBottom: `1px solid ${C.sidebarBorder}`, display: "grid", gap: 10, background: "#080f1d" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT }}>API Keys</span>
              <button onClick={() => setShowKeyHelp(v => !v)}
                style={{ fontSize: 13, color: "#e040a0", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: FONT }}>
                {showKeyHelp ? "Hide help" : "How to get these?"}
              </button>
            </div>
            {showKeyHelp && (
              <div style={{ display: "grid", gap: 8, background: "#1e293b", borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }}>
                {[
                  { name: "ChatGPT", color: "#10a37f", url: "https://platform.openai.com/api-keys",          steps: "API keys → Create new secret key" },
                  { name: "Gemini",  color: "#4285f4", url: "https://aistudio.google.com/apikey",            steps: "Get API key → Create API key" },
                  { name: "Claude",  color: "#c96442", url: "https://console.anthropic.com/settings/keys",   steps: "API Keys → Create Key" },
                  { name: "Grok",    color: "#8b5cf6", url: "https://console.x.ai/",                         steps: "API Keys → Create API Key" },
                ].map(({ name, color, url, steps }) => (
                  <div key={name}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color, textDecoration: "none", fontFamily: FONT }}>{name} ↗</a>
                    <div style={{ color: C.textMuted, fontSize: 12, fontFamily: FONT }}>{steps}</div>
                  </div>
                ))}
                <div style={{ color: C.textMuted, fontSize: 12, borderTop: `1px solid ${C.sidebarBorder}`, paddingTop: 8, marginTop: 2, fontFamily: FONT }}>
                  Keys are encrypted at rest and never shared.
                </div>
              </div>
            )}
            {[
              { label: "OpenAI",     provider: "openai", val: openaiKey, set: setOpenaiKey },
              { label: "Gemini",     provider: "gemini", val: geminiKey, set: setGeminiKey },
              { label: "Anthropic",  provider: "claude", val: claudeKey, set: setClaudeKey },
              { label: "xAI (Grok)", provider: "grok",   val: grokKey,   set: setGrokKey  },
            ].map(({ label, provider, val, set }) => {
              const hasSaved = savedKeys.has(provider)
              return (
                <div key={label} style={{ position: "relative" }}>
                  <input placeholder={hasSaved ? "••••••••••••••••" : `${label} key`}
                    value={val} onChange={e => set(e.target.value)} type="password"
                    style={{
                      width: "100%", boxSizing: "border-box" as const,
                      padding: "10px 12px", fontSize: 14,
                      background: "#1e293b", border: `1px solid ${hasSaved ? "#e040a055" : C.sidebarBorder}`,
                      borderRadius: 8, color: "#e2e8f0", outline: "none", fontFamily: FONT,
                    }}
                  />
                  {hasSaved && !val && (
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: "#e040a0", pointerEvents: "none" }}>saved</span>
                  )}
                </div>
              )
              })}
            <button onClick={saveCredentials} disabled={loading}
              style={{ padding: "11px", background: "#e040a0", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
              Save Keys
            </button>
          </div>
        )}

        {/* New session form */}
        {showNewForm && (
          <div style={{ padding: "16px", borderBottom: `1px solid ${C.sidebarBorder}`, display: "grid", gap: 12, background: "#080f1d" }}>
            <input placeholder="Session title" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              autoFocus
              style={{
                padding: "10px 12px", fontSize: 15,
                background: "#1e293b",
                border: `1.5px solid ${newTitle ? C.accent : "#7c3aed"}`,
                boxShadow: newTitle ? `0 0 0 3px ${C.accent}33` : undefined,
                animation: newTitle ? "none" : "title-pulse 1.8s ease-in-out infinite",
                borderRadius: 8, color: "#e2e8f0", outline: "none",
                width: "100%", boxSizing: "border-box" as const, fontFamily: FONT,
              }}
            />

            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT }}>Participants</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AI_PROVIDERS.map(p => {
                const on = newParticipants.includes(p.id)
                return (
                  <button key={p.id} type="button"
                    onClick={() => setNewParticipants(prev => on ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    style={{
                      padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      border: `2px solid ${p.color}`,
                      background: on ? p.color : "transparent",
                      color: on ? "#fff" : p.color, fontFamily: FONT,
                    }}>
                    {p.label}
                  </button>
                )
              })}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT }}>Mode</div>
            <div style={{ display: "grid", gap: 6 }}>
              {AI_MODES.map(m => {
                const sel = newMode === m.id
                return (
                  <button key={m.id} type="button" onClick={() => setNewMode(m.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                      borderRadius: 8, cursor: "pointer", textAlign: "left",
                      border: `1.5px solid ${sel ? m.color + "88" : C.sidebarBorder}`,
                      background: sel ? m.color + "20" : "transparent", fontFamily: FONT,
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={20} height={20} fill={sel ? m.color : C.textMuted}>
                      <path d={m.icon} />
                    </svg>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: sel ? m.color : "#e2e8f0" }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.4, marginTop: 2 }}>{m.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            <textarea placeholder="Opening message (optional)" value={openingMessage} onChange={e => setOpeningMessage(e.target.value)} rows={3}
              style={{
                padding: "10px 12px", fontSize: 14, resize: "vertical",
                background: "#1e293b", border: `1px solid ${C.sidebarBorder}`,
                borderRadius: 8, color: "#e2e8f0", outline: "none",
                width: "100%", boxSizing: "border-box" as const, fontFamily: FONT, lineHeight: 1.5,
              }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createSession} disabled={loading || !newTitle.trim() || newParticipants.length < 1}
                style={{
                  flex: 1, padding: "11px", background: C.accent, color: "#fff", border: "none",
                  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  opacity: !newTitle.trim() || newParticipants.length < 1 ? 0.4 : 1, fontFamily: FONT,
                }}>
                Create
              </button>
              <button onClick={() => setShowNewForm(false)}
                style={{
                  flex: 1, padding: "11px", background: "transparent",
                  border: `1px solid ${C.sidebarBorder}`, borderRadius: 8,
                  fontSize: 14, color: C.textMuted, cursor: "pointer", fontFamily: FONT,
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sessions list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {sessions.length === 0 && (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <div style={{ color: C.textMuted, fontSize: 17, fontFamily: FONT }}>No sessions yet.</div>
              <div style={{ color: "#475569", fontSize: 15, marginTop: 6, fontFamily: FONT }}>Hit + to start one.</div>
            </div>
          )}
          {sessions.map(s => {
            const participants: AiProvider[] = s.participants ?? [s.first_speaker as AiProvider]
            const mode = AI_MODES.find(m => m.id === (s.mode ?? "balanced"))
            const isActive = selectedSession?.id === s.id
            return (
              <div key={s.id} style={{
                display: "flex", alignItems: "stretch",
                borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                background: isActive ? C.sidebarActive : "transparent",
              }}>
                <button onClick={() => { selectSession(s); onSelect?.() }}
                  style={{ flex: 1, padding: "14px 16px", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", minWidth: 0 }}>
                  <div style={{
                    fontSize: 17, fontWeight: 500,
                    color: isActive ? "#e2e8f0" : "#cbd5e1",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: 7, fontFamily: FONT,
                  }}>
                    {s.title}
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                    {participants.map(pid => {
                      const p = AI_PROVIDERS.find(x => x.id === pid)
                      return p ? (
                        <span key={pid} style={{
                          fontSize: 13, fontWeight: 700, color: p.color,
                          background: p.color + "22", padding: "2px 8px", borderRadius: 4, fontFamily: FONT,
                        }}>{p.label}</span>
                      ) : null
                    })}
                    {mode && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: C.textMuted, fontFamily: FONT }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={14} height={14} fill={mode.color}><path d={mode.icon}/></svg>
                        {mode.label}
                      </span>
                    )}
                  </div>
                </button>
                <button onClick={e => deleteSession(s.id, e)} title="Delete"
                  style={{ padding: "0 14px", border: "none", background: "transparent", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#374151")}>
                  <svg viewBox="0 0 576 640" width={20} height={20} fill="currentColor">
                    <path d="M163.8 0L148.1 38.4C142.8 51.5 130.1 60 115.8 60L16 60C7.2 60 0 67.2 0 76L0 104C0 112.8 7.2 120 16 120L528 120C536.8 120 544 112.8 544 104L544 76C544 67.2 536.8 60 528 60L428.3 60C414 60 401.3 51.5 396 38.4L380.2 0L163.8 0zM32 160L64 544C66 568 85.8 586 110 586L434 586C458.2 586 478 568 480 544L512 160L32 160z"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Chat area header ──────────────────────────────────────────────────────
  function renderChatHeader() {
    const mode = selectedSession ? AI_MODES.find(m => m.id === (selectedSession.mode ?? "balanced")) : null
    const participants: AiProvider[] = selectedSession?.participants ?? (selectedSession ? [selectedSession.first_speaker as AiProvider] : [])
    return (
      <div style={{
        height: 64, padding: "0 28px",
        borderBottom: `1px solid ${C.chatBorder}`,
        display: "flex", alignItems: "center", gap: 14,
        background: "#fff", flexShrink: 0,
      }}>
        {selectedSession ? (
          <>
            <span style={{ fontWeight: 600, fontSize: 17, color: C.textPrimary, fontFamily: FONT }}>{selectedSession.title}</span>
            {mode && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 12, color: mode.color, background: mode.color + "15",
                padding: "4px 12px", borderRadius: 20, fontWeight: 600, fontFamily: FONT,
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={13} height={13} fill={mode.color}><path d={mode.icon}/></svg>
                {mode.label}
              </span>
            )}
            <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
              {messages.length > 0 && (
                <button
                  onClick={copyAllMessages}
                  title="Copy full chat"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 7,
                    border: `1px solid ${copiedAll ? "#7c3aed" : C.chatBorder}`,
                    background: copiedAll ? "#7c3aed15" : "transparent",
                    cursor: "pointer",
                    color: copiedAll ? C.accent : C.textMuted,
                    fontSize: 12, fontWeight: 600, fontFamily: FONT,
                    transition: "all 0.15s",
                  }}>
                  {copiedAll ? (
                    <svg viewBox="0 0 640 640" width={13} height={13} fill="currentColor"><path d="M256 464L80 288L137.4 230.6L256 349.3L502.6 102.6L560 160L256 464z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={13} height={13} fill="currentColor"><path d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z"/></svg>
                  )}
                  {copiedAll ? "Copied!" : "Copy chat"}
                </button>
              )}
              {participants.map(pid => {
                const p = AI_PROVIDERS.find(x => x.id === pid)
                return p ? (
                  <span key={pid} style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: p.color + "22", border: `2px solid ${p.color}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: p.color, fontFamily: FONT,
                  }}>
                    {p.label.charAt(0)}
                  </span>
                ) : null
              })}
            </div>
          </>
        ) : (
          <span style={{ fontSize: 15, color: C.textMuted, fontFamily: FONT }}>No session selected</span>
        )}
      </div>
    )
  }

  // ── Transcript + input ────────────────────────────────────────────────────
  function renderTranscript() {
    const participants: AiProvider[] = selectedSession?.participants ?? (selectedSession ? [selectedSession.first_speaker as AiProvider] : [])
    const anyRunning = runningModel !== null

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: C.chatBg }}>

        {error && (
          <div style={{ margin: "12px 24px 0", padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 14, color: "#dc2626", flexShrink: 0, fontFamily: FONT }}>
            {error}
          </div>
        )}

        {/* Messages — scrollable, takes all remaining space */}
        <div ref={transcriptScrollRef}
          className="rdeo-transcript"
          onScroll={e => setShowScrollTop((e.currentTarget as HTMLDivElement).scrollTop > 200)}
          style={{ flex: 1, overflowY: "auto", padding: "28px 0 20px", boxSizing: "border-box", position: "relative" }}>

          {!selectedSession && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 100, gap: 16 }}>
              <div style={{ fontSize: 48, opacity: 0.12 }}>💬</div>
              <div style={{ fontSize: 16, color: C.textMuted, fontFamily: FONT }}>Select a session or create a new one</div>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === "user"
            const isLast = i === messages.length - 1
            const aiIdx = participants.indexOf(m.role as AiProvider)
            const onRight = isUser ? true : aiIdx % 2 !== 0
            const providerTints: Record<string, string> = {
              chatgpt: "#2563eb0d",
              gemini:  "#e040a00d",
              claude:  "#c964420d",
              grok:    "#8b5cf60d",
            }
            const providerBorders: Record<string, string> = {
              chatgpt: "#2563eb33",
              gemini:  "#e040a033",
              claude:  "#c9644233",
              grok:    "#8b5cf633",
            }
            const bubbleBg = isUser ? C.userBubble : (providerTints[m.role] ?? C.aiBubble)
            const bubbleColor = isUser ? C.userText : C.aiText
            const bubbleBorder = isUser ? "#334155" : (providerBorders[m.role] ?? C.bubbleBorder)
            const borderRadius = onRight ? "18px 4px 18px 18px" : "4px 18px 18px 18px"
            return (
              <div key={m.id} ref={isLast ? lastMessageRef : null} style={{
                display: "flex", gap: 16, padding: "8px 32px",
                flexDirection: onRight ? "row-reverse" : "row",
                alignItems: "flex-start",
              }}>
                <Avatar role={m.role} />
                <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", gap: 5, alignItems: onRight ? "flex-end" : "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: onRight ? "row-reverse" : "row" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: providerColor(m.role), fontFamily: FONT }}>
                      {providerLabel(m.role)}
                    </span>
                    <span style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => copyMessage(m.id, m.content)}
                      title="Copy message"
                      style={{
                        position: "absolute", top: 10, right: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 20, height: 20,
                        border: "none", background: "none",
                        cursor: "pointer",
                        color: copiedId === m.id ? "#7c3aed" : "rgba(128,128,128,0.6)",
                        padding: 0, zIndex: 1,
                        transition: "color 0.15s",
                      }}>
                      {copiedId === m.id ? (
                        <svg viewBox="0 0 640 640" width={12} height={12} fill="currentColor"><path d="M256 464L80 288L137.4 230.6L256 349.3L502.6 102.6L560 160L256 464z"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={24} height={24} fill="currentColor"><path d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z"/></svg>
                      )}
                    </button>
                    <div style={{
                      padding: "14px 44px 14px 18px",
                      background: bubbleBg,
                      color: bubbleColor,
                      border: `1px solid ${bubbleBorder}`,
                      borderRadius,
                      fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap",
                      fontFamily: FONT,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      userSelect: "contain" as any,
                    }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll buttons — always visible when a session is active */}
        {selectedSession && (
          <div style={{ position: "fixed", bottom: 220, right: 36, display: "flex", flexDirection: "column", gap: 8, zIndex: 50 }}>
            <button onClick={() => { const el = document.querySelector(".rdeo-transcript") as HTMLElement; el?.scrollTo({ top: 0, behavior: "smooth" }) }}
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "#fff", border: `1px solid ${C.chatBorder}`,
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: C.textSecondary,
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
                <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM441 335C450.4 344.4 450.4 359.6 441 368.9C431.6 378.2 416.4 378.3 407.1 368.9L320.1 281.9L233.1 368.9C223.7 378.3 208.5 378.3 199.2 368.9C189.9 359.5 189.8 344.3 199.2 335L303 231C312.4 221.6 327.6 221.6 336.9 231L441 335z"/>
              </svg>
            </button>
            <button onClick={() => { const el = document.querySelector(".rdeo-transcript") as HTMLElement; el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" }) }}
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "#fff", border: `1px solid ${C.chatBorder}`,
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: C.textSecondary,
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
                <path d="M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64zM199 305C189.6 295.6 189.6 280.4 199 271.1C208.4 261.8 223.6 261.7 232.9 271.1L320 358.1L407 271.1C416.4 261.7 431.6 261.7 440.9 271.1C450.2 280.5 450.3 295.7 440.9 305L336.9 409C327.5 418.4 312.3 418.4 303 409L199 305z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Input — sits below messages, never overlaps */}
        <div style={{
          flexShrink: 0,
          padding: "16px 28px 22px",
          background: C.chatBg,
          borderTop: `1px solid ${C.chatBorder}`,
        }}>
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-end",
            background: C.inputBg, border: `1.5px solid ${C.inputBorder}`,
            borderRadius: 16, padding: "10px 10px 10px 14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <textarea
              value={userMessage}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addMessage() } }}
                placeholder={selectedSession ? "Type a message… (Enter to send, Shift+Enter for newline)" : "Select a session to begin"}
                rows={1}
                disabled={!selectedSession}
                style={{
                  flex: 1, border: "none", outline: "none", resize: "none",
                  minHeight: 48, maxHeight: 400, height: "auto", overflowY: "auto",
                  fontSize: 15, lineHeight: 1.6, color: C.textPrimary,
                  background: "transparent", fontFamily: FONT, alignSelf: "stretch",
                }}
                ref={(el) => {
                  if (el) {
                    el.style.height = "auto"
                    el.style.height = Math.min(el.scrollHeight, 400) + "px"
                  }
                }}
                onChange={e => {
                  setUserMessage(e.target.value)
                  e.target.style.height = "auto"
                  e.target.style.height = Math.min(e.target.scrollHeight, 400) + "px"
                }}
            />
            {/* Mic */}
            <button onClick={toggleListening} title={listening ? "Stop" : "Voice input"}
              style={{
                flexShrink: 0, width: 48, height: 48, borderRadius: 10,
                background: listening ? "#fef2f2" : "transparent",
                border: `1.5px solid ${listening ? "#ef4444" : C.inputBorder}`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: listening ? "#ef4444" : C.textMuted,
                animation: listening ? "ai-mic-pulse 1.2s ease-in-out infinite" : "none",
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={26} height={26} fill="currentColor">
                <path d="M320 64C267 64 224 107 224 160L224 288C224 341 267 384 320 384C373 384 416 341 416 288L416 160C416 107 373 64 320 64zM176 248C176 234.7 165.3 224 152 224C138.7 224 128 234.7 128 248L128 288C128 385.9 201.3 466.7 296 478.5L296 528L248 528C234.7 528 224 538.7 224 552C224 565.3 234.7 576 248 576L392 576C405.3 576 416 565.3 416 552C416 538.7 405.3 528 392 528L344 528L344 478.5C438.7 466.7 512 385.9 512 288L512 248C512 234.7 501.3 224 488 224C474.7 224 464 234.7 464 248L464 288C464 367.5 399.5 432 320 432C240.5 432 176 367.5 176 288L176 248z"/>
              </svg>
            </button>
            {/* Send */}
            <button onClick={addMessage} disabled={anyRunning || !userMessage.trim() || !selectedSession}
              style={{
                flexShrink: 0, width: 48, height: 48, borderRadius: 10,
                background: userMessage.trim() && selectedSession && !anyRunning ? C.accent : "#e2e8f0",
                border: "none", cursor: userMessage.trim() && !anyRunning ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: userMessage.trim() && selectedSession && !anyRunning ? "#fff" : "#94a3b8",
                transition: "background 0.15s",
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={26} height={26} fill="currentColor">
                <path d="M568.4 37.7C578.2 34.2 589 36.7 596.4 44C603.8 51.3 606.2 62.2 602.7 72L424.7 568.9C419.7 582.8 406.6 592 391.9 592C377.7 592 364.9 583.4 359.6 570.3L295.4 412.3C290.9 401.3 292.9 388.7 300.6 379.7L395.1 267.3C400.2 261.2 399.8 252.3 394.2 246.7C388.6 241.1 379.6 240.7 373.6 245.8L261.2 340.1C252.1 347.7 239.6 349.7 228.6 345.3L70.1 280.8C57 275.5 48.4 262.7 48.4 248.5C48.4 233.8 57.6 220.7 71.5 215.7L568.4 37.7z"/>
              </svg>
            </button>
          </div>

          {/* Run buttons */}
          {selectedSession && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              {participants.map(pid => {
                const p = AI_PROVIDERS.find(x => x.id === pid)
                if (!p) return null
                const isRunning = runningModel === pid
                return (
                  <button key={pid} onClick={() => runTurn(pid)} disabled={anyRunning}
                    style={{
                      padding: "7px 18px", borderRadius: 8,
                      background: isRunning ? p.color : "transparent",
                      color: isRunning ? "#fff" : p.color,
                      border: `2px solid ${p.color}`,
                      fontSize: 13, fontWeight: 700,
                      cursor: anyRunning ? "not-allowed" : "pointer",
                      opacity: anyRunning && !isRunning ? 0.3 : 1,
                      fontFamily: FONT, transition: "all 0.15s",
                    }}>
                    {isRunning ? "…" : `→ ${p.label}`}
                  </button>
                )
              })}
              <button onClick={() => runTurn()} disabled={anyRunning}
                style={{
                  padding: "7px 18px", borderRadius: 8,
                  background: runningModel === "auto" ? C.textPrimary : "transparent",
                  color: runningModel === "auto" ? "#fff" : C.textSecondary,
                  border: `2px solid ${runningModel === "auto" ? C.textPrimary : C.chatBorder}`,
                  fontSize: 13, fontWeight: 700,
                  cursor: anyRunning ? "not-allowed" : "pointer",
                  opacity: anyRunning && runningModel !== "auto" ? 0.3 : 1,
                  fontFamily: FONT,
                }}>
                {runningModel === "auto" ? "…" : "Auto Next"}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        .rdeo-sidebar {
          scrollbar-width: thin;
          scrollbar-color: #3d2a6e transparent;
        }
        .rdeo-sidebar::-webkit-scrollbar { width: 6px; }
        .rdeo-sidebar::-webkit-scrollbar-track { background: #0b0916; border-radius: 3px; }
        .rdeo-sidebar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #7c3aed, #e040a0); border-radius: 3px; }
        .rdeo-sidebar::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #a855f7, #f472b6); }

        .rdeo-transcript {
          scrollbar-width: thin;
          scrollbar-color: #c4b5fd #f1f5f9;
        }
        .rdeo-transcript::-webkit-scrollbar { width: 8px; }
        .rdeo-transcript::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .rdeo-transcript::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #7c3aed, #e040a0); border-radius: 4px; }
        .rdeo-transcript::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #a855f7, #f472b6); }

        .rdeo-desktop { display: flex; flex: 1; min-height: 0; overflow: hidden; }
        .rdeo-mobile  { display: none; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
        @media (max-width: 860px) {
          .rdeo-desktop { display: none; }
          .rdeo-mobile  { display: flex; }
        }
        @keyframes ai-mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        @keyframes title-pulse {
          0%, 100% { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.25); }
          50%       { border-color: #e040a0; box-shadow: 0 0 0 6px rgba(224,64,160,0.2); }
        }
      `}</style>

      {/* DESKTOP */}
      <div className="rdeo-desktop">
        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{ width: sidebarWidth, background: C.sidebarBg, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
            {renderSidebarHeader()}
            <div className="rdeo-sidebar" style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
              {renderSessionsList()}
            </div>
          </div>
        )}

        {/* Drag handle + toggle */}
        <div style={{ width: 16, flexShrink: 0, display: "flex", alignItems: "stretch", position: "relative", zIndex: 5 }}>
          {/* Drag strip — only visible when open */}
          {sidebarOpen && (
            <div
              onMouseDown={e => {
                isDragging.current = true
                dragStartX.current = e.clientX
                dragStartWidth.current = sidebarWidth
                document.body.style.cursor = "col-resize"
                document.body.style.userSelect = "none"
              }}
              style={{
                flex: 1, cursor: "col-resize",
                background: C.sidebarBorder,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.accent)}
              onMouseLeave={e => { if (!isDragging.current) e.currentTarget.style.background = C.sidebarBorder }}
            />
          )}
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            title={sidebarOpen ? "Collapse sessions" : "Expand sessions"}
            style={{
              position: "absolute", top: "50%", right: -12, transform: "translateY(-50%)",
              width: 24, height: 40, borderRadius: 6,
              background: C.sidebarBg, border: `1px solid ${C.sidebarBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.textMuted, zIndex: 10,
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.sidebarBorder }}
          >
            <svg viewBox="0 0 640 640" width={12} height={12} fill="currentColor">
              {sidebarOpen
                ? <path d="M416 64L192 320L416 576L480 512L320 320L480 128Z"/>
                : <path d="M224 64L448 320L224 576L160 512L320 320L160 128Z"/>}
            </svg>
          </button>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {renderChatHeader()}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            {renderTranscript()}
          </div>
        </div>
      </div>

      {/* MOBILE */}
      <div className="rdeo-mobile">
        <div style={{ display: "flex", borderBottom: `1px solid ${C.chatBorder}`, flexShrink: 0, background: "#fff" }}>
          <button onClick={() => setMobileTab("chat")}
            style={{
              flex: 1, padding: "16px", border: "none", cursor: "pointer",
              borderBottom: mobileTab === "chat" ? `3px solid ${C.accent}` : "3px solid transparent",
              background: "none", fontWeight: mobileTab === "chat" ? 700 : 500,
              color: mobileTab === "chat" ? C.accent : C.textSecondary,
              fontSize: 15, fontFamily: FONT,
            }}>
            Chat{selectedSession ? ` · ${selectedSession.title.slice(0, 16)}${selectedSession.title.length > 16 ? "…" : ""}` : ""}
          </button>
          <button onClick={() => setMobileTab("sessions")}
            style={{
              flex: 1, padding: "16px", border: "none", cursor: "pointer",
              borderBottom: mobileTab === "sessions" ? `3px solid ${C.accent}` : "3px solid transparent",
              background: "none", fontWeight: mobileTab === "sessions" ? 700 : 500,
              color: mobileTab === "sessions" ? C.accent : C.textSecondary,
              fontSize: 15, fontFamily: FONT,
            }}>
            Sessions ({sessions.length})
          </button>
        </div>
        {mobileTab === "chat" && renderTranscript()}
        {mobileTab === "sessions" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: C.sidebarBg }}>
            {renderSidebarHeader()}
            <div className="rdeo-sidebar" style={{ flex: 1, overflowY: "auto" }}>
              {renderSessionsList(() => setMobileTab("chat"))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AiPanel
