import { useEffect, useState } from "react"
import { type User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import HolsterPanel from "./HolsterPanel"
import { AuthModal } from "./AuthModal"

const FONT   = `"Inter", system-ui, -apple-system, sans-serif`
const SHELL  = "#1a2730"
const BORDER = "#253540"
const HOVER  = "#253540"
const TEAL   = "#5b95a7"
const RED    = "#c14141"
const TEXT   = "#f9fafb"
const MUTED  = "#9ca3af"

const GLOBAL_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }

  /* ── Mobile list rows reflow ── */
  @media (max-width: 600px) {
    .hol-list-row {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 6px !important;
      padding: 12px 14px !important;
    }
    .hol-list-row-title {
      width: 100% !important;
      max-width: 100% !important;
    }
    .hol-list-row-value {
      width: 100% !important;
    }
    .hol-add-form-row {
      grid-template-columns: 1fr !important;
    }
    .hol-header-bar {
      padding: 0 12px !important;
      gap: 6px !important;
      flex-wrap: wrap !important;
      height: auto !important;
      min-height: 58px !important;
      padding-top: 8px !important;
      padding-bottom: 8px !important;
    }
    .hol-search-box {
      max-width: 100% !important;
      width: 100% !important;
    }
    .hol-note-editor-header {
      padding: 10px 14px !important;
    }
    .hol-note-editor-content {
      padding: 16px !important;
    }
    .hol-toolbar {
      padding: 6px 12px !important;
    }
    .hol-collection-header {
      padding: 10px 14px !important;
    }
    .hol-carousels {
      padding: 16px 12px !important;
    }
  }
`

function Header({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [hover, setHover] = useState(false)

  return (
    <header style={{
      height: 72, background: SHELL, borderBottom: `1px solid ${BORDER}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", flexShrink: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img src="/logo.png" alt="Holster" style={{ height: 52, width: "auto", display: "block" }} />
        <span style={{ fontSize: 28, fontWeight: 800, color: TEXT, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          Holster
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          padding: "8px 14px", background: `${TEAL}18`,
          border: `1px solid ${TEAL}44`, borderRadius: 8,
          color: MUTED, fontSize: 13, fontWeight: 600, fontFamily: FONT,
          display: "flex",
        }}
          className="hol-user-email">
          {user.email}
        </div>

        <button
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={onSignOut}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px",
            background: hover ? HOVER : "transparent",
            border: `1px solid ${hover ? RED : BORDER}`,
            borderRadius: 8, color: hover ? "#fff" : MUTED,
            fontSize: 15, fontWeight: 600, cursor: "pointer",
            transition: "all 0.15s", fontFamily: FONT,
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={16} height={16} fill="currentColor">
            <path d="M320 64C204.8 64 109.5 149.3 91.1 261.3C87.6 282.3 105.4 299.9 126.7 299.9C144.5 299.9 159.5 287.2 163.7 269.9C178.3 209.2 233.6 164 299.9 164C378.4 164 441.9 227.5 441.9 306C441.9 384.5 378.4 448 299.9 448C233.6 448 178.3 402.8 163.7 342.1C159.5 324.8 144.5 312.1 126.7 312.1C105.4 312.1 87.6 329.7 91.1 350.7C109.5 462.7 204.8 548 320 548C447.5 548 550 445.5 550 318C550 190.5 447.5 64 320 64zM24 296C10.7 296 0 306.7 0 320C0 333.3 10.7 344 24 344L264 344L213 395C203.6 404.4 203.6 419.6 213 428.9C222.4 438.2 237.6 438.3 246.9 428.9L337.9 337.9C343.8 332 346.2 324.2 344.9 316.7C344 311.2 341.4 305.9 337.1 301.9L246.1 211.1C236.7 201.7 221.5 201.7 212.2 211.1C202.9 220.5 202.8 235.7 212.2 245L263 296L24 296z"/>
          </svg>
          Sign out
        </button>
      </div>
    </header>
  )
}

function StorageBar({ used, total }: { used: number; total: number }) {
  const percent = Math.min(100, (used / total) * 100)
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "0 24px", height: 36,
      borderBottom: `1px solid ${BORDER}`,
      background: SHELL, flexShrink: 0,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: MUTED, fontFamily: FONT, whiteSpace: "nowrap" }}>
        Storage
      </span>
      <div style={{ flex: 1, height: 4, background: `${TEAL}22`, borderRadius: 999 }}>
        <div style={{ height: "100%", width: `${percent}%`, background: TEAL, borderRadius: 999, transition: "width 0.2s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: MUTED, fontFamily: FONT, whiteSpace: "nowrap" }}>
        {used} GB of {total} GB used
      </span>
    </div>
  )
}

export default function HolsterApp() {
  const [user, setUser]           = useState<User | null>(null)
  const [loading, setLoading]     = useState(true)
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: SHELL, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: `3px solid ${BORDER}`, borderTopColor: TEAL, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!user) {
    return <AuthModal onAuth={setUser} />
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: SHELL, display: "flex", flexDirection: "column" }}>
      <style>{GLOBAL_STYLES}</style>
      <style>{`
        @media (max-width: 480px) {
          .hol-user-email { display: none !important; }
        }
        @media (max-width: 600px) {
          .hol-user-email { display: none !important; }
        }
      `}</style>
      <Header user={user} onSignOut={handleSignOut} />
      <StorageBar used={30} total={100} />
      <HolsterPanel user={user} cryptoKey={cryptoKey} onCryptoKeySet={setCryptoKey} />
    </div>
  )
}
