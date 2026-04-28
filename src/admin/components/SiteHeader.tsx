import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { navigateCrossDomain } from "../../shared/crossDomainNav"

type SiteHeaderProps = {
  userEmail?: string | null
  onSignOut?: () => void
}

type DropdownProps = {
  children: React.ReactNode
  open: boolean
  onToggle: () => void
  trigger: React.ReactNode
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function Dropdown({
  children,
  open,
  onToggle,
  trigger,
  onMouseEnter,
  onMouseLeave,
}: DropdownProps) {
  return (
    <div
      className={`dropdown ${open ? "is-open" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        className="dropdown-trigger"
        onClick={onToggle}
        aria-expanded={open}
      >
        {trigger}
      </button>

      {open && (
        <div
          className="dropdown-menu"
          style={{ position: "absolute", zIndex: 1001 }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function getInitial(userEmail: string | null | undefined) {
  if (!userEmail) return "?"
  return userEmail.trim().charAt(0).toUpperCase()
}

export default function SiteHeader({
  userEmail = null,
  onSignOut,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const isDesktop =
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 981px)").matches
      : false

  function closeAll() {
    setAccountOpen(false)
  }

  function closeMenu() {
    setMenuOpen(false)
    closeAll()
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) {
        closeAll()
      }
    }

    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  return (
    <header className="topbar" style={{ position: "relative", zIndex: 1000 }}>
      <div className="container topbar-inner" ref={wrapRef}>
        <Link
          to="/admin"
          className="brand"
          aria-label="Sheriff Cloud admin home"
          onClick={closeMenu}
        >
          <img
            src="/sheriff-logo.png"
            alt="Sheriff Cloud"
            className="brand-logo"
          />
          <div className="brand-text-wrap">
            <span className="brand-text">SHERIFF CLOUD</span>
            <span className="brand-subtext">Admin</span>
          </div>
        </Link>

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`topbar-menu ${menuOpen ? "is-open" : ""}`}>
          <nav className="topnav" aria-label="Product navigation">
            <Link to="/" className="topnav-link" onClick={closeMenu}>
              <span className="nav-link-inner">
                <span>Sheriff</span>
              </span>
            </Link>

            <button
              type="button"
              className="topnav-link"
              onClick={() => { closeMenu(); navigateCrossDomain("https://spur.ink") }}
            >
              <span className="nav-link-inner">
                <span>Spur</span>
              </span>
            </button>
          </nav>

          <div className="topbar-actions">
            {userEmail ? (
              <Dropdown
                open={accountOpen}
                onToggle={() => setAccountOpen((v) => !v)}
                onMouseEnter={isDesktop ? () => setAccountOpen(true) : undefined}
                onMouseLeave={isDesktop ? () => setAccountOpen(false) : undefined}
                trigger={
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "999px",
                      border: "1px solid var(--border)",
                      background: "var(--panel-soft)",
                      color: "var(--text)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                    aria-label="Account"
                  >
                    {getInitial(userEmail)}
                  </span>
                }
              >
                <div className="dropdown-meta">Signed in as</div>
                <div className="dropdown-email">{userEmail}</div>
                <div className="dropdown-divider" />
                <button
                  type="button"
                  className="dropdown-link dropdown-link-button"
                  onClick={() => {
                    closeMenu()
                    onSignOut?.()
                  }}
                >
                  Sign Out
                </button>
              </Dropdown>
            ) : (
              <>
                <Link to="/" className="button button-ghost" onClick={closeMenu}>
                  Sheriff
                </Link>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => { closeMenu(); navigateCrossDomain("https://spur.ink") }}
                >
                  Spur
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
