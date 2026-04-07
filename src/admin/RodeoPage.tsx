import { useEffect, useState } from "react"
import { AuthModal } from "./components/AuthModal"
import { getSupabase } from "./supabase"

// 🔥 IMPORT YOUR EXISTING APP
// We are REUSING it, not copying logic
import App from "./App"

export default function RodeoPage() {
  const [supabase, setSupabase] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileError, setProfileError] = useState("")

  useEffect(() => {
    const sb = getSupabase()
    setSupabase(sb)

    if (!sb) return

    sb.auth.getSession().then(({ data }: any) => {
      setSession(data.session ?? null)
    })

    const { data: listener } = sb.auth.onAuthStateChange((_event: any, sess: any) => {
      setSession(sess ?? null)
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session?.user?.id) return

    setProfileLoaded(false)

    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }: any) => {
        if (error) {
          setProfile(null)
          setProfileError(error.message)
        } else {
          setProfile(data)
          setProfileError("")
        }
        setProfileLoaded(true)
      })
  }, [supabase, session?.user?.id])

  // ─────────────────────────────────────────
  // AUTH / ACCESS GATES (SAME AS ADMIN)
  // ─────────────────────────────────────────

  if (!supabase) {
    return <div style={styles.center}>Missing Supabase config</div>
  }

  if (!session) {
    return <AuthModal />
  }

  if (!profileLoaded) {
    return <div style={styles.center}>Loading account…</div>
  }

  if (!profile) {
    return (
      <div style={styles.center}>
        <div>Profile missing</div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
          {profileError || "No profile row found"}
        </div>
      </div>
    )
  }

  if (profile.is_suspended) {
    return <div style={styles.center}>Account suspended</div>
  }

  if (!profile.has_ai_access) {
    return <div style={styles.center}>No access to Rodeo</div>
  }

  // ─────────────────────────────────────────
  // 🎯 RODEO PAGE
  // ─────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logo}>Rodeo</div>
      </div>

      <div style={styles.content}>
        {/* 🔥 THIS IS THE KEY LINE */}
        {/* We reuse your existing AI system WITHOUT touching App.tsx */}
        <App />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0b0b0c",
    color: "#fff",
  },
  header: {
    height: 60,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  content: {
    flex: 1,
    minHeight: 0,
    display: "flex",
  },
  center: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
}