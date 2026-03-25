import { useState } from "react"
import { supabase } from "./supabase"

type AuthModalProps = {
  onClose?: () => void
}

const FONT = `"Nunito", "Inter", system-ui, sans-serif`

export function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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
    setError(null); setMessage(null); setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
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

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{
        position: "fixed",
        inset: 0,
        background: "#0b0916",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 20,
      }}>
        {/* Logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <img src="/chatterbox/logo.png" alt="Chatterbox" style={{ height: 72, width: "auto", display: "block" }} />
          <span style={{ fontSize: 40, fontWeight: 900, color: "#f9fafb", fontFamily: FONT, letterSpacing: "-0.01em" }}>
            Chatterbox
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: "#12092a",
          border: "1px solid #1e1535",
          borderRadius: 16,
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          width: "100%",
          maxWidth: 420,
          fontFamily: FONT,
          overflow: "hidden",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1e1535" }}>
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setMessage(null) }}
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: tab === t ? "2px solid #7c3aed" : "2px solid transparent",
                  color: tab === t ? "#f9fafb" : "#6b7280",
                  fontFamily: FONT,
                  fontWeight: tab === t ? 700 : 500,
                  fontSize: 15,
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
              >
                {t === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ padding: "28px 28px 32px", display: "grid", gap: 16 }}>
            {error && (
              <div style={{ padding: "12px 14px", background: "#2a0a0a", border: "1px solid #7f1d1d", borderRadius: 8, fontSize: 14, color: "#fca5a5", fontFamily: FONT }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ padding: "12px 14px", background: "#0a1f0a", border: "1px solid #14532d", borderRadius: 8, fontSize: 14, color: "#86efac", fontFamily: FONT }}>
                {message}
              </div>
            )}

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: FONT }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading}
                placeholder="you@example.com"
                style={{
                  padding: "12px 14px", border: "1px solid #1e1535", borderRadius: 8,
                  fontSize: 15, background: "#0b0916", color: "#f9fafb", outline: "none",
                  fontFamily: FONT,
                }} />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: FONT }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading}
                placeholder="••••••••"
                style={{
                  padding: "12px 14px", border: "1px solid #1e1535", borderRadius: 8,
                  fontSize: 15, background: "#0b0916", color: "#f9fafb", outline: "none",
                  fontFamily: FONT,
                }} />
            </div>

            {tab === "login" && (
              <div style={{ textAlign: "right", marginTop: -8 }}>
                <button type="button" onClick={handleForgotPassword} disabled={loading}
                  style={{ background: "none", border: "none", color: "#e040a0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button onClick={tab === "login" ? handleLogin : handleSignup} disabled={loading}
              style={{
                marginTop: 4,
                padding: "14px",
                border: "none",
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed, #e040a0)",
                color: "#fff",
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                letterSpacing: "0.01em",
              }}>
              {loading ? "Loading…" : tab === "login" ? "Log In" : "Create Account"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 13, color: "#374151", fontFamily: FONT }}>
          Multi-model conversation
        </div>
      </div>
    </>
  )
}
