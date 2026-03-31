import { useState } from "react"
import { supabase } from "./supabase"

type AuthModalProps = {
  onClose?: () => void
}

const FONT = `"Nunito", "Inter", system-ui, sans-serif`

function slugifyUsername(val: string) {
  return val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
    <path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 451C249.7 451 193 394.3 193 324C193 253.7 249.7 197 320 197C390.3 197 447 253.7 447 324C447 394.3 390.3 451 320 451zM320 267C285.7 267 258 294.7 258 329C258 363.3 285.7 391 320 391C354.3 391 382 363.3 382 329C382 294.7 354.3 267 320 267z"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
    <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1L544 530.6C683.6 456.5 752 320 752 320S633.6 80 320 80C245.3 80 181.1 100.6 128.6 133.4L38.8 5.1zM223.2 190.9L281.7 235.9C295.4 224.8 313 218 332.2 218C374.5 218 409 251.3 409 292C409 306.3 405 319.7 398.1 331L463.3 380.2C478.4 353.9 487 323.1 487 292C487 208.9 420.3 144 332.2 144C289.2 144 250.3 159.8 223.2 190.9zM320 512C207.7 512 116.4 444.1 64 384C92.8 349.8 132.3 313.6 181.5 289.1L234.9 330.3C232.3 337.3 231 344.9 231 352.8C231 393.5 265.5 426.8 307.8 426.8C320.7 426.8 332.9 423.4 343.4 417.5L390.9 453.3C370.9 464.3 348 470.8 323.8 470.8C281.5 470.8 247 437.5 247 396.8"/>
  </svg>
)

export function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setMessage(null); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    onClose?.()
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) { setError("Username is required"); return }
    setError(null); setMessage(null); setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, username: slugifyUsername(username), updated_at: new Date().toISOString() })
    }
    setLoading(false)
    setMessage("Check your email for the confirmation link!")
  }

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email first"); return }
    setError(null); setMessage(null); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/chatterbox/`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMessage("Password reset email sent!")
  }

  const inp = { padding: "12px 14px", border: "1px solid #1e1535", borderRadius: 8, fontSize: 15, background: "#0b0916", color: "#f9fafb", outline: "none", fontFamily: FONT, width: "100%", boxSizing: "border-box" as const }
  const lbl = { fontSize: 13, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase" as const, fontFamily: FONT }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ position: "fixed", inset: 0, background: "#0b0916", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <img src="/logo.png" alt="Chatterbox" style={{ height: 72, width: "auto", display: "block" }} />
          <span style={{ fontSize: 40, fontWeight: 900, color: "#f9fafb", fontFamily: FONT, letterSpacing: "-0.01em" }}>Chatterbox</span>
        </div>
        <div style={{ background: "#12092a", border: "1px solid #1e1535", borderRadius: 16, boxShadow: "0 32px 80px rgba(0,0,0,0.5)", width: "100%", maxWidth: 420, fontFamily: FONT, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #1e1535" }}>
            {(["login", "signup"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(null); setMessage(null) }}
                style={{ flex: 1, padding: "16px", background: "transparent", border: "none", borderBottom: tab === t ? `2px solid ${t === "signup" ? "#c0392b" : "#7c3aed"}` : "2px solid transparent", color: tab === t ? "#f9fafb" : "#6b7280", fontFamily: FONT, fontWeight: tab === t ? 700 : 500, fontSize: 15, cursor: "pointer" }}>
                {t === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
          <div style={{ padding: "28px 28px 32px", display: "grid", gap: 16 }}>
            {error && <div style={{ padding: "12px 14px", background: "#2a0a0a", border: "1px solid #7f1d1d", borderRadius: 8, fontSize: 14, color: "#fca5a5", fontFamily: FONT }}>{error}</div>}
            {message && <div style={{ padding: "12px 14px", background: "#0a1f0a", border: "1px solid #14532d", borderRadius: 8, fontSize: 14, color: "#86efac", fontFamily: FONT }}>{message}</div>}
            <div style={{ display: "grid", gap: 6 }}>
              <label style={lbl}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} placeholder="you@example.com" style={inp} />
            </div>
            {tab === "signup" && (
              <div style={{ display: "grid", gap: 6 }}>
                <label style={lbl}>Username</label>
                <input type="text" value={username} onChange={e => setUsername(slugifyUsername(e.target.value))} required disabled={loading} placeholder="yourname" maxLength={30} style={inp} />
              </div>
            )}
            <div style={{ display: "grid", gap: 6 }}>
              <label style={lbl}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} placeholder="••••••••" style={{ ...inp, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0, display: "flex", alignItems: "center" }}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {tab === "login" && (
              <div style={{ textAlign: "right", marginTop: -8 }}>
                <button type="button" onClick={handleForgotPassword} disabled={loading} style={{ background: "none", border: "none", color: "#e040a0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>Forgot password?</button>
              </div>
            )}
            <button onClick={tab === "login" ? handleLogin : handleSignup} disabled={loading}
              style={{ marginTop: 4, padding: "14px", border: "none", borderRadius: 10, background: tab === "signup" ? "#c0392b" : "linear-gradient(135deg, #7c3aed, #e040a0)", color: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Loading…" : tab === "login" ? "Log In" : "Create Account"}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: "#374151", fontFamily: FONT }}>Multi-model conversation</div>
      </div>
    </>
  )
}
