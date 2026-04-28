import { useEffect, useState } from "react"
import { supabase } from "../../shared/supabase"

const FONT = `"DM Sans", "Inter", system-ui, sans-serif`

export function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "PASSWORD_RECOVERY") setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMessage("Password updated! You can now sign in.")
  }

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080e1a", color: "#6080a8", fontFamily: FONT }}>
      Verifying reset link…
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080e1a", padding: 20 }}>
      <div style={{ background: "#0d1525", border: "1px solid #1e2d47", borderRadius: 16, width: "100%", maxWidth: 400, padding: 32, fontFamily: FONT, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <img src="/logo.png" alt="Spur" height={32} style={{ display: "block" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e8f0" }}>Set new password</div>
        </div>
        {error && (
          <div style={{ padding: "10px 12px", background: "#2a0a0a", border: "1px solid #7f1d1d", borderRadius: 8, fontSize: 13, color: "#fca5a5" }}>
            {error}
          </div>
        )}
        {message ? (
          <div style={{ padding: "10px 12px", background: "#0a1f0a", border: "1px solid #14532d", borderRadius: 8, fontSize: 13, color: "#86efac" }}>
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6080a8" }}>New password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={8} disabled={loading}
                style={{ padding: "10px 12px", border: "1px solid #1e2d47", borderRadius: 8, fontSize: 14, background: "#080e1a", color: "#e8e8f0", outline: "none", fontFamily: FONT }}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: "11px", background: "#f29106", border: "none", borderRadius: 8, color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving…" : "Set New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
