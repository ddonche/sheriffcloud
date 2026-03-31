import { useState } from "react"
import { supabase } from "./supabase"
import type { User } from "@supabase/supabase-js"

const FONT   = `"Inter", system-ui, -apple-system, sans-serif`
const SHELL  = "#1a2730"
const CARD   = "#1e3040"
const BORDER = "#253540"
const TEAL   = "#5b95a7"
const RED    = "#c14141"
const TEXT   = "#f9fafb"
const MUTED  = "#9ca3af"
const DIM    = "#6b7280"

function slugifyUsername(val: string) {
  return val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
}

export function AuthModal({ onAuth }: { onAuth: (user: User) => void }) {
  const [tab, setTab]           = useState<"signin" | "signup">("signin")
  const [email, setEmail]       = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [message, setMessage]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit() {
    setError(null); setMessage(null)
    if (!email.trim()) return setError("Email is required.")
    if (!password)     return setError("Password is required.")
    if (tab === "signup") {
      if (!username.trim()) return setError("Username is required.")
      if (password.length < 8)  return setError("Password must be at least 8 characters.")
      if (password !== confirm)  return setError("Passwords do not match.")
    }
    setLoading(true)
    if (tab === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      setLoading(false)
      if (error) return setError(error.message)
      if (data.user) onAuth(data.user)
    } else {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
      setLoading(false)
      if (error) return setError(error.message)
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, username: slugifyUsername(username), updated_at: new Date().toISOString() })
        if (data.session) {
          onAuth(data.user)
        } else {
          setMessage("Check your email to confirm your account, then sign in.")
          setTab("signin"); setPassword(""); setConfirm("")
        }
      }
    }
  }

  async function handleForgotPassword() {
    setError(null); setMessage(null)
    if (!email.trim()) return setError("Enter your email above first.")
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (error) return setError(error.message)
    setMessage("Password reset email sent.")
  }

  const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", background: SHELL, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 15, fontFamily: FONT, outline: "none" }
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: FONT }

  return (
    <div style={{ position: "fixed", inset: 0, background: SHELL, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
        <img src="/logo.png" alt="Holster" style={{ height: 64, width: "auto", display: "block" }} />
        <span style={{ fontSize: 38, fontWeight: 900, color: TEXT, fontFamily: FONT, letterSpacing: "-0.02em" }}>Holster</span>
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: "0 32px 80px rgba(0,0,0,0.5)", width: "100%", maxWidth: 420, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
          {(["signin", "signup"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(null); setMessage(null) }}
              style={{ flex: 1, padding: "16px", background: "transparent", border: "none", borderBottom: tab === t ? `2px solid ${t === "signup" ? RED : TEAL}` : "2px solid transparent", color: tab === t ? TEXT : DIM, fontFamily: FONT, fontWeight: tab === t ? 700 : 500, fontSize: 15, cursor: "pointer" }}>
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
        <div style={{ padding: "28px 28px 32px", display: "grid", gap: 16 }}>
          {error && <div style={{ padding: "12px 14px", background: "#2a0a0a", border: "1px solid #7f1d1d", borderRadius: 8, fontSize: 14, color: "#fca5a5", fontFamily: FONT }}>{error}</div>}
          {message && <div style={{ padding: "12px 14px", background: "#0a1a1f", border: `1px solid ${TEAL}55`, borderRadius: 8, fontSize: 14, color: TEAL, fontFamily: FONT }}>{message}</div>}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          {tab === "signup" && (
            <div style={{ display: "grid", gap: 6 }}>
              <label style={lbl}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(slugifyUsername(e.target.value))} placeholder="yourname" maxLength={30} style={inp} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
          )}
          <div style={{ display: "grid", gap: 6 }}>
            <label style={lbl}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inp, paddingRight: 44 }} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: DIM, padding: 0, display: "flex", alignItems: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
                  {showPw
                    ? <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1L544 530.6C683.6 456.5 752 320 752 320S633.6 80 320 80C245.3 80 181.1 100.6 128.6 133.4L38.8 5.1zM223.2 190.9L281.7 235.9C295.4 224.8 313 218 332.2 218C374.5 218 409 251.3 409 292C409 306.3 405 319.7 398.1 331L463.3 380.2C478.4 353.9 487 323.1 487 292C487 208.9 420.3 144 332.2 144C289.2 144 250.3 159.8 223.2 190.9zM320 512C207.7 512 116.4 444.1 64 384C92.8 349.8 132.3 313.6 181.5 289.1L234.9 330.3C232.3 337.3 231 344.9 231 352.8C231 393.5 265.5 426.8 307.8 426.8C320.7 426.8 332.9 423.4 343.4 417.5L390.9 453.3C370.9 464.3 348 470.8 323.8 470.8C281.5 470.8 247 437.5 247 396.8"/>
                    : <path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 451C249.7 451 193 394.3 193 324C193 253.7 249.7 197 320 197C390.3 197 447 253.7 447 324C447 394.3 390.3 451 320 451zM320 267C285.7 267 258 294.7 258 329C258 363.3 285.7 391 320 391C354.3 391 382 363.3 382 329C382 294.7 354.3 267 320 267z"/>
                  }
                </svg>
              </button>
            </div>
          </div>
          {tab === "signup" && (
            <div style={{ display: "grid", gap: 6 }}>
              <label style={lbl}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" style={inp} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
          )}
          {tab === "signin" && (
            <div style={{ textAlign: "right", marginTop: -8 }}>
              <button onClick={handleForgotPassword} style={{ background: "none", border: "none", color: RED, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Forgot password?</button>
            </div>
          )}
          <button onClick={handleSubmit} disabled={loading}
            style={{ marginTop: 4, padding: "14px", border: "none", borderRadius: 10, background: tab === "signup" ? RED : TEAL, color: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Loading…" : tab === "signin" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
      <div style={{ marginTop: 24, fontSize: 13, color: DIM, fontFamily: FONT }}>Your secure personal vault</div>
    </div>
  )
}
