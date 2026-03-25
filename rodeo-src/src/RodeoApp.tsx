import { useEffect, useState } from "react"
import { supabase } from "./supabase"
import { AuthModal } from "./AuthModal"
import AiPanel from "./AiPanel"

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "no_access" }
  | { status: "password_recovery" }
  | { status: "ready" }

function NoAccessScreen() {
  useEffect(() => {
    const t = setTimeout(() => { window.location.href = "https://sheriffcloud.com" }, 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0916", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", color: "#6b7280", fontSize: 14 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        Your account doesn't have access to Chatterbox.
        <br />
        Redirecting…
      </div>
    </div>
  )
}

function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setMessage("Password updated! You can now sign in.")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0916", padding: 20 }}>
      <div style={{ background: "#fff", border: "1px solid #d4d4d8", borderRadius: 8, width: "100%", maxWidth: 400, padding: 24, fontFamily: "system-ui, sans-serif", display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <img src="/rodeo/logo.png" alt="Chatterbox" height={28} style={{ display: "block", objectFit: "contain" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "#18181b" }}>Set new password</div>
        </div>
        {error && (
          <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, fontSize: 13, color: "#dc2626" }}>
            {error}
          </div>
        )}
        {message ? (
          <div style={{ padding: "10px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, fontSize: 13, color: "#16a34a" }}>
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>New password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={loading}
                style={{ padding: "10px 12px", border: "1px solid #d4d4d8", borderRadius: 4, fontSize: 14, background: "#fff", color: "#18181b", outline: "none" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: "11px", background: "#3296ab", border: "1px solid #3296ab", borderRadius: 4, color: "#fff", fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Saving…" : "Set New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Header({ onSignOut }: { onSignOut: () => void }) {
  const [hovering, setHovering] = useState(false)

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800;900&display=swap');`}</style>
      <header style={{
        height: 72,
        background: "#0b0916",
        borderBottom: "1px solid #1e1535",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img
            src="/rodeo/logo.png"
            alt="Chatterbox"
            style={{ height: 60, width: "auto", display: "block" }}
          />
          <span style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#f9fafb",
            fontFamily: "'Nunito', system-ui, sans-serif",
            letterSpacing: "-0.01em",
          }}>
            Chatterbox
          </span>
        </div>

        <button
          onClick={onSignOut}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: hovering ? "#1e1535" : "transparent",
            border: "1px solid " + (hovering ? "#7c3aed" : "#2a1a52"),
            borderRadius: 8,
            color: hovering ? "#f9fafb" : "#9ca3af",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
            fontFamily: "'Nunito', system-ui, sans-serif",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={18} height={18} fill="currentColor">
            <path d="M320 64C204.8 64 109.5 149.3 91.1 261.3C87.6 282.3 105.4 299.9 126.7 299.9C144.5 299.9 159.5 287.2 163.7 269.9C178.3 209.2 233.6 164 299.9 164C378.4 164 441.9 227.5 441.9 306C441.9 384.5 378.4 448 299.9 448C233.6 448 178.3 402.8 163.7 342.1C159.5 324.8 144.5 312.1 126.7 312.1C105.4 312.1 87.6 329.7 91.1 350.7C109.5 462.7 204.8 548 320 548C447.5 548 550 445.5 550 318C550 190.5 447.5 64 320 64zM24 296C10.7 296 0 306.7 0 320C0 333.3 10.7 344 24 344L264 344L213 395C203.6 404.4 203.6 419.6 213 428.9C222.4 438.2 237.6 438.3 246.9 428.9L337.9 337.9C343.8 332 346.2 324.2 344.9 316.7C344 311.2 341.4 305.9 337.1 301.9L246.1 211.1C236.7 201.7 221.5 201.7 212.2 211.1C202.9 220.5 202.8 235.7 212.2 245L263 296L24 296z"/>
          </svg>
          Sign out
        </button>
      </header>
    </>
  )
}

export default function RodeoApp() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" })

  useEffect(() => {
    async function check(sessionArg?: any) {
      let s = sessionArg
      if (s === undefined) {
        const { data } = await supabase.auth.getSession()
        s = data.session
      }

      if (!s) { setAuth({ status: "unauthenticated" }); return }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("has_ai_access")
        .eq("id", s.user.id)
        .single()

      if (error || !profile?.has_ai_access) { setAuth({ status: "no_access" }); return }

      setAuth({ status: "ready" })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuth({ status: "password_recovery" })
        return
      }
      check(session ?? null)
    })

    check()
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (auth.status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0916" }}>
        <div style={{ width: 28, height: 28, border: "3px solid #1f2937", borderTopColor: "#ea7c1e", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (auth.status === "no_access") return <NoAccessScreen />
  if (auth.status === "password_recovery") return <ResetPasswordPage />
  if (auth.status === "unauthenticated") return <AuthModal onClose={() => {}} />

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
      <Header onSignOut={handleSignOut} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <AiPanel supabase={supabase} />
      </div>
    </div>
  )
}
