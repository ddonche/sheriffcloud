import { useState } from "react"
import { getSupabase } from "../../shared/supabase"

type AuthModalProps = {
  onClose?: () => void
  onSuccess?: () => void
}

const FONT = `"Geist", system-ui, sans-serif`

function slugifyUsername(val: string) {
  return val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30)
}

const EyeIcon = () => (
  <svg viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
    <path d="M320 80C176 80 57.6 196.8 8 292.2C2.9 301.8 2.9 313.2 8 322.8C57.6 418.2 176 535 320 535C464 535 582.4 418.2 632 322.8C637.1 313.2 637.1 301.8 632 292.2C582.4 196.8 464 80 320 80zM320 451C249.7 451 193 394.3 193 324C193 253.7 249.7 197 320 197C390.3 197 447 253.7 447 324C447 394.3 390.3 451 320 451z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
    <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9L601.2 634.9C611.6 643.1 626.7 641.2 634.9 630.8S641.2 605.3 630.8 597.1z" />
  </svg>
)

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={18} height={18}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
)

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const sb = getSupabase()
  if (!sb) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error } = await sb.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    onSuccess?.()
    onClose?.()
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError("Username is required")
      return
    }

    setError(null)
    setMessage(null)
    setLoading(true)

    const { data, error } = await sb.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await sb.from("profiles").upsert({
        id: data.user.id,
        username: slugifyUsername(username),
        updated_at: new Date().toISOString(),
      })
    }

    setLoading(false)
    setMessage("Check your email for the confirmation link!")
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email first")
      return
    }

    setError(null)
    setMessage(null)
    setLoading(true)

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: "https://sheriffcloud.com/",
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    setMessage("Password reset email sent!")
  }

  const handleGoogleAuth = async () => {
    setError(null)
    sessionStorage.setItem("oauth_return_to", window.location.href)

    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://sheriffcloud.com" },
    })
  }

  const inp = {
    padding: "12px 14px",
    border: "1px solid #1e2d47",
    borderRadius: 8,
    fontSize: 15,
    background: "#080e1a",
    color: "#e8e8f0",
    outline: "none",
    fontFamily: FONT,
    width: "100%",
    boxSizing: "border-box" as const,
  }

  return (
    <div
      onClick={() => onClose?.()}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0d1525",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <img src="/sheriff-logo.png" alt="Sheriff Cloud" style={{ height: 64 }} />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d1525",
          border: "1px solid #1e2d47",
          borderRadius: 16,
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          width: "100%",
          maxWidth: 420,
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", borderBottom: "1px solid #1e2d47" }}>
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setError(null)
                setMessage(null)
              }}
              style={{
                flex: 1,
                padding: "16px",
                background: "transparent",
                border: "none",
                borderBottom: tab === t ? "2px solid #f29106" : "2px solid transparent",
                color: tab === t ? "#e8e8f0" : "#6080a8",
                fontWeight: tab === t ? 700 : 500,
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: 15,
              }}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div style={{ padding: 28, display: "grid", gap: 16 }}>
          {error && <div style={{ color: "#fca5a5" }}>{error}</div>}
          {message && <div style={{ color: "#86efac" }}>{message}</div>}

          <button
            type="button"
            onClick={handleGoogleAuth}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid #1e2d47",
              background: "#080e1a",
              color: "#e4eaf4",
              fontSize: 15,
              fontWeight: 500,
              fontFamily: FONT,
              cursor: "pointer",
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#2a3f5e",
              fontSize: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#1e2d47" }} />
            <span>or</span>
            <div style={{ flex: 1, height: 1, background: "#1e2d47" }} />
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inp}
          />

          {tab === "signup" && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(slugifyUsername(e.target.value))}
              style={inp}
            />
          )}

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inp, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6080a8",
              }}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {tab === "login" && (
            <button
              onClick={handleForgotPassword}
              style={{
                background: "none",
                border: "none",
                color: "#f29106",
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Forgot password?
            </button>
          )}

          <button
            onClick={tab === "login" ? handleLogin : handleSignup}
            disabled={loading}
            style={{
              padding: 14,
              borderRadius: 10,
              border: "none",
              background: "#f29106",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: FONT,
              fontSize: 16,
            }}
          >
            {loading ? "Loading…" : tab === "login" ? "Log In" : "Create Account"}
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "#94a3b8",
          fontFamily: FONT,
        }}
      >
        <img src="/sheriff-logo.png" alt="Sheriff Cloud" style={{ height: 22, opacity: 0.82 }} />
        <span>Powered by Sheriff Cloud</span>
      </div>
    </div>
  )
}
