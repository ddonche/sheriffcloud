import { useState } from "react"
import { supabase } from "./supabase"

export function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage("Password updated! You can now sign in.")
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0916",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#12092a",
          border: "1px solid #1e1535",
          borderRadius: 16,
          width: "100%",
          maxWidth: 420,
          padding: 28,
          color: "#f9fafb",
          display: "grid",
          gap: 14,
          fontFamily: `"Nunito", "Inter", system-ui, sans-serif`,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800 }}>Set new password</div>

        {error && (
          <div
            style={{
              padding: "12px 14px",
              background: "#2a0a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 8,
              fontSize: 14,
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {message ? (
          <div
            style={{
              padding: "12px 14px",
              background: "#0a1f0a",
              border: "1px solid #14532d",
              borderRadius: 8,
              fontSize: 14,
              color: "#86efac",
            }}
          >
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              minLength={8}
              disabled={loading}
              style={{
                padding: "12px 14px",
                border: "1px solid #1e1535",
                borderRadius: 8,
                fontSize: 15,
                background: "#0b0916",
                color: "#f9fafb",
                outline: "none",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px",
                border: "none",
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed, #e040a0)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Saving…" : "Set New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}