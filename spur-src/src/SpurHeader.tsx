import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"

type Colors = {
  bg: string
  surface: string
  surfaceHover: string
  border: string
  borderLight: string
  text: string
  muted: string
  dim: string
  accent: string
  accentHover: string
}

type SpurHeaderProps = {
  session: any
  onLogin: () => void
  onSignOut: () => void
  colors: Colors
  font: string
  fontMono: string
}

function getSessionLabel(session: any) {
  const email = session?.user?.email ?? ""
  return email || "Account"
}

function getSessionInitials(session: any) {
  const email = session?.user?.email ?? "?"
  const base = email.split("@")[0] || "?"
  const parts = base.split(/[._\-\s]+/).filter(Boolean)
  const initials = parts.slice(0, 2).map((p: string) => p[0]?.toUpperCase() ?? "").join("")
  return initials || base.slice(0, 2).toUpperCase()
}

export default function SpurHeader({
  session,
  onLogin,
  onSignOut,
  colors,
  font,
  fontMono,
}: SpurHeaderProps) {
  const location = useLocation()
  const [loginHover, setLoginHover] = useState(false)
  const [writeHover, setWriteHover] = useState(false)
  const [pricingHover, setPricingHover] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const dashboardHref = "https://admin.sheriffcloud.com"
  const accountLabel = getSessionLabel(session)
  const accountInitials = getSessionInitials(session)
  const onPricing = location.pathname === "/pricing"

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleDocClick)
    return () => document.removeEventListener("mousedown", handleDocClick)
  }, [])

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(8,14,26,0.92)",
        borderBottom: `1px solid ${colors.borderLight}`,
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          height: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          gap: 24,
        }}
      >
        <Link to="/" style={{ display: "inline-flex", alignItems: "center" }} aria-label="Spur home">
          <img src="/logo.png" alt="Spur" style={{ height: 52, width: "auto", display: "block" }} />
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            to="/about"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: colors.muted,
              padding: "9px 14px",
              borderRadius: 9,
              border: `1px solid transparent`,
              background: "transparent",
              transition: "all 0.15s ease",
            }}
          >
            About
          </Link>

          <Link
            to="/pricing"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: onPricing || pricingHover ? colors.text : colors.muted,
              padding: "9px 14px",
              borderRadius: 9,
              border: `1px solid ${(onPricing || pricingHover) ? colors.border : "transparent"}`,
              background: onPricing || pricingHover ? colors.surfaceHover : "transparent",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={() => setPricingHover(true)}
            onMouseLeave={() => setPricingHover(false)}
          >
            Pricing
          </Link>

          <a
            href={dashboardHref}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              background: writeHover ? colors.accentHover : colors.accent,
              padding: "10px 16px",
              borderRadius: 9,
              transition: "background 0.15s ease",
            }}
            onMouseEnter={() => setWriteHover(true)}
            onMouseLeave={() => setWriteHover(false)}
          >
            {session ? "Dashboard" : "Start Writing"}
          </a>

          {session ? (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: `1px solid ${menuOpen ? colors.accent : colors.border}`,
                  background: "transparent",
                  color: colors.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: fontMono,
                  transition: "border-color 0.15s ease",
                }}
                aria-label="Account"
                aria-expanded={menuOpen}
              >
                {accountInitials}
              </button>

              {menuOpen ? (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
                    minWidth: 160,
                    overflow: "hidden",
                    zIndex: 500,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors.muted,
                      padding: "10px 14px 8px",
                      borderBottom: `1px solid ${colors.borderLight}`,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: font,
                    }}
                  >
                    {accountLabel}
                  </div>
                  <button
                    type="button"
                    onClick={onSignOut}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 14px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: colors.muted,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: font,
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              onMouseEnter={() => setLoginHover(true)}
              onMouseLeave={() => setLoginHover(false)}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: loginHover ? colors.text : colors.muted,
                padding: "9px 14px",
                borderRadius: 9,
                border: `1px solid ${loginHover ? colors.border : colors.borderLight}`,
                background: loginHover ? colors.surfaceHover : "transparent",
                transition: "all 0.15s ease",
                fontFamily: font,
              }}
            >
              Log In
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}