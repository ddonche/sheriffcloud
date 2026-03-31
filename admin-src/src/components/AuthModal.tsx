import { useState } from "react"
import { getSupabase } from "../supabase"

type AuthModalProps = {
  onClose?: () => void
}

function slugifyUsername(val: string) {
  return val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const supabase = getSupabase()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setError(null); setMessage(null); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    onClose?.()
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
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
    if (!supabase) return
    setError(null); setMessage(null); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMessage("Password reset email sent!")
  }

  const FONT = `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  const inp = {
    padding: "10px 12px", border: "1px solid #d4d4d8", borderRadius: 4,
    fontSize: 14, background: "#fff", color: "#18181b", outline: "none",
    width: "100%", boxSizing: "border-box" as const, fontFamily: FONT,
  }
  const lbl = { fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: FONT }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 20, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", border: "1px solid #d4d4d8", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", width: "100%", maxWidth: 400, fontFamily: FONT }}>

        <div style={{ padding: "24px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
          <img src="./sheriff-logo.png" alt="Sheriff Cloud" width={36} height={36} style={{ display: "block", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.1em", color: "#18181b" }}>SHERIFF CLOUD</div>
            <div style={{ fontSize: 12, color: "#71717a" }}>Site administration</div>
          </div>
        </div>

        <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        <div style={{ padding: "16px 24px 0", display: "flex", gap: 4 }}>
          {(["login", "signup"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(null); setMessage(null) }}
              style={{ flex: 1, padding: "8px", background: tab === t ? "#f4f4f5" : "transparent", border: tab === t ? "1px solid #d4d4d8" : "1px solid transparent", borderRadius: 4, color: tab === t ? "#18181b" : "#71717a", fontFamily: FONT, fontWeight: tab === t ? 600 : 400, fontSize: 13, cursor: "pointer" }}>
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={tab === "login" ? handleLogin : handleSignup} style={{ padding: "16px 24px 24px", display: "grid", gap: 12 }}>
          {error && <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, fontSize: 13, color: "#dc2626" }}>{error}</div>}
          {message && <div style={{ padding: "10px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, fontSize: 13, color: "#16a34a" }}>{message}</div>}

          <div style={{ display: "grid", gap: 4 }}>
            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} placeholder="you@example.com" style={inp} />
          </div>

          {tab === "signup" && (
            <div style={{ display: "grid", gap: 4 }}>
              <label style={lbl}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(slugifyUsername(e.target.value))} required disabled={loading} placeholder="yourname" maxLength={30} style={inp} />
            </div>
          )}

          <div style={{ display: "grid", gap: 4 }}>
            <label style={lbl}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} placeholder="••••••••"
                style={{ ...inp, paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex", alignItems: "center" }}>
                {showPassword
                  ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={16} height={16} fill="currentColor"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1L544 530.6C683.6 456.5 752 320 752 320S633.6 80 320 80C245.3 80 181.1 100.6 128.6 133.4L38.8 5.1zM223.2 190.9L281.7 235.9C295.4 224.8 313 218 332.2 218C374.5 218 409 251.3 409 292C409 306.3 405 319.7 398.1 331L463.3 380.2C478.4 353.9 487 323.1 487 292C487 208.9 420.3 144 332.2 144C289.2 144 250.3 159.8 223.2 190.9zM320 512C207.7 512 116.4 444.1 64 384C92.8 349.8 132.3 313.6 181.5 289.1L234.9 330.3C232.3 337.3 231 344.9 231 352.8C231 393.5 265.5 426.8 307.8 426.8C320.7 426.8 332.9 423.4 343.4 417.5L390.9 453.3C370.9 464.3 348 470.8 323.8 470.8C281.5 470.8 247 437.5 247 396.8"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={16} height={16} fill="currentColor"><path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 451C249.7 451 193 394.3 193 324C193 253.7 249.7 197 320 197C390.3 197 447 253.7 447 324C447 394.3 390.3 451 320 451zM320 267C285.7 267 258 294.7 258 329C258 363.3 285.7 391 320 391C354.3 391 382 363.3 382 329C382 294.7 354.3 267 320 267z"/></svg>
                }
              </button>
            </div>
          </div>

          {tab === "login" && (
            <div style={{ textAlign: "right", marginTop: -4 }}>
              <button type="button" onClick={handleForgotPassword} disabled={loading}
                style={{ background: "none", border: "none", color: "#3296ab", fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
                Forgot password?
              </button>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ padding: "11px", border: "1px solid #3296ab", borderRadius: 4, background: tab === "signup" ? "#c0392b" : "#3296ab", color: "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Loading…" : tab === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  )
}
