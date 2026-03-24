import { useState } from "react"
import { getSupabase } from "../supabase"

type AuthModalProps = {
  onClose?: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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
    setError(null); setMessage(null); setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
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

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      padding: 20,
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#fff",
        border: "1px solid #d4d4d8",
        borderRadius: 8,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        width: "100%",
        maxWidth: 400,
        fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      }}>

        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
          <img src="./sheriff-logo.png" alt="Sheriff Cloud" width={36} height={36} style={{ display: "block", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.1em", color: "#18181b" }}>SHERIFF CLOUD</div>
            <div style={{ fontSize: 12, color: "#71717a" }}>Site administration</div>
          </div>
        </div>

        {/* OAuth */}

        {/* Divider */}
        <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        {/* Tabs */}
        <div style={{ padding: "16px 24px 0", display: "flex", gap: 4 }}>
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setMessage(null) }}
              style={{
                flex: 1,
                padding: "8px",
                background: tab === t ? "#f4f4f5" : "transparent",
                border: tab === t ? "1px solid #d4d4d8" : "1px solid transparent",
                borderRadius: 4,
                color: tab === t ? "#18181b" : "#71717a",
                fontFamily: "inherit",
                fontWeight: tab === t ? 600 : 400,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={tab === "login" ? handleLogin : handleSignup} style={{ padding: "16px 24px 24px", display: "grid", gap: 12 }}>

          {error && (
            <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ padding: "10px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, fontSize: 13, color: "#16a34a" }}>
              {message}
            </div>
          )}

          <div style={{ display: "grid", gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="you@example.com"
              style={{
                padding: "10px 12px",
                border: "1px solid #d4d4d8",
                borderRadius: 4,
                fontSize: 14,
                background: "#fff",
                color: "#18181b",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
              style={{
                padding: "10px 12px",
                border: "1px solid #d4d4d8",
                borderRadius: 4,
                fontSize: 14,
                background: "#fff",
                color: "#18181b",
                outline: "none",
              }}
            />
          </div>

          {tab === "login" && (
            <div style={{ textAlign: "right", marginTop: -4 }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{ background: "none", border: "none", color: "#3296ab", fontSize: 13, cursor: "pointer" }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "11px",
              border: "1px solid #3296ab",
              borderRadius: 4,
              background: "#3296ab",
              color: "#fff",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Loading…" : tab === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  )
}
