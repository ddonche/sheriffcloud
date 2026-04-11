import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../../shared/auth/useAuth"

type SiteHeaderProps = {
  isPaid?: boolean
  onOpenAuth?: () => void
  onCreateSite?: () => void
}

function Icon({
  path,
  size = 16,
}: {
  path: string
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 640 640"
      width={size}
      height={size}
      aria-hidden="true"
      className="nav-icon-svg"
    >
      <path d={path} fill="currentColor" />
    </svg>
  )
}

const DASHBOARD_ICON =
  "M96 128C78.3 128 64 142.3 64 160C64 177.7 78.3 192 96 192L182.7 192C195 220.3 223.2 240 256 240C288.8 240 317 220.3 329.3 192L544 192C561.7 192 576 177.7 576 160C576 142.3 561.7 128 544 128L329.3 128C317 99.7 288.8 80 256 80C223.2 80 195 99.7 182.7 128L96 128zM96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L342.7 352C355 380.3 383.2 400 416 400C448.8 400 477 380.3 489.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L489.3 288C477 259.7 448.8 240 416 240C383.2 240 355 259.7 342.7 288L96 288zM96 448C78.3 448 64 462.3 64 480C64 497.7 78.3 512 96 512L150.7 512C163 540.3 191.2 560 224 560C256.8 560 285 540.3 297.3 512L544 512C561.7 512 576 497.7 576 480C576 462.3 561.7 448 544 448L297.3 448C285 419.7 256.8 400 224 400C191.2 400 163 419.7 150.7 448L96 448z"

const FEATURES_ICON =
  "M192 384L88.5 384C63.6 384 48.3 356.9 61.1 335.5L114 247.3C122.7 232.8 138.3 224 155.2 224L250.2 224C326.3 95.1 439.8 88.6 515.7 99.7C528.5 101.6 538.5 111.6 540.3 124.3C551.4 200.2 544.9 313.7 416 389.8L416 484.8C416 501.7 407.2 517.3 392.7 526L304.5 578.9C283.2 591.7 256 576.3 256 551.5L256 448C256 412.7 227.3 384 192 384L191.9 384zM464 224C464 197.5 442.5 176 416 176C389.5 176 368 197.5 368 224C368 250.5 389.5 272 416 272C442.5 272 464 250.5 464 224z"

const RESOURCE_ICON =
  "M192 64C156.7 64 128 92.7 128 128L128 544C128 555.5 134.2 566.2 144.2 571.8C154.2 577.4 166.5 577.3 176.4 571.4L320 485.3L463.5 571.4C473.4 577.3 485.7 577.5 495.7 571.8C505.7 566.1 512 555.5 512 544L512 128C512 92.7 483.3 64 448 64L192 64z"

const PRICING_ICON =
  "M345 151.2C354.2 143.9 360 132.6 360 120C360 97.9 342.1 80 320 80C297.9 80 280 97.9 280 120C280 132.6 285.9 143.9 295 151.2L226.6 258.8C216.6 274.5 195.3 278.4 180.4 267.2L120.9 222.7C125.4 216.3 128 208.4 128 200C128 177.9 110.1 160 88 160C65.9 160 48 177.9 48 200C48 221.8 65.5 239.6 87.2 240L119.8 457.5C124.5 488.8 151.4 512 183.1 512L456.9 512C488.6 512 515.5 488.8 520.2 457.5L552.8 240C574.5 239.6 592 221.8 592 200C592 177.9 574.1 160 552 160C529.9 160 512 177.9 512 200C512 208.4 514.6 216.3 519.1 222.7L459.7 267.3C444.8 278.5 423.5 274.6 413.5 258.9L345 151.2z"

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

      {open && <div className="dropdown-menu">{children}</div>}
    </div>
  )
}

function getInitial(userEmail: string | null | undefined) {
  if (!userEmail) return "?"
  return userEmail.trim().charAt(0).toUpperCase()
}

export default function SiteHeader({
  isPaid = false,
  onOpenAuth,
  onCreateSite,
}: SiteHeaderProps) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const { userEmail, signOut } = useAuth()

  const isDesktop =
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 981px)").matches
      : false

  function closeAll() {
    setFeaturesOpen(false)
    setResourcesOpen(false)
    setAccountOpen(false)
  }

  function closeMenu() {
    setMenuOpen(false)
    closeAll()
  }

  function navClass(path: string) {
    return location.pathname === path ? "nav-active" : ""
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
    <header className="topbar">
      <div className="container topbar-inner" ref={wrapRef}>
        <Link
          to="/"
          className="brand"
          aria-label="Sheriff Cloud home"
          onClick={closeMenu}
        >
          <img
            src="/sheriff-logo.png"
            alt="Sheriff Cloud"
            className="brand-logo"
          />
          <div className="brand-text-wrap">
            <span className="brand-text">SHERIFF CLOUD</span>
            <span className="brand-subtext">
              Static sites without the usual bullshit
            </span>
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
          <nav className="topnav" aria-label="Primary navigation">
            <Link to="/" className={navClass("/")} onClick={closeMenu}>
              <span className="nav-link-inner">
                <span>About</span>
              </span>
            </Link>

            <Dropdown
              open={featuresOpen}
              onToggle={() => {
                setFeaturesOpen((v) => !v)
                setResourcesOpen(false)
                setAccountOpen(false)
              }}
              onMouseEnter={
                isDesktop
                  ? () => {
                      setFeaturesOpen(true)
                      setResourcesOpen(false)
                      setAccountOpen(false)
                    }
                  : undefined
              }
              onMouseLeave={isDesktop ? () => setFeaturesOpen(false) : undefined}
              trigger={
                <span className="dropdown-trigger-inner">
                  <Icon path={FEATURES_ICON} />
                  <span>Features</span>
                </span>
              }
            >
              <Link to="/features" className="dropdown-link" onClick={closeMenu}>
                Features
              </Link>
              <Link
                to="/how-it-works"
                className="dropdown-link"
                onClick={closeMenu}
              >
                How It Works
              </Link>
              <Link to="/use-cases" className="dropdown-link" onClick={closeMenu}>
                Use Cases
              </Link>
            </Dropdown>

            <Link
              to="/pricing"
              className={navClass("/pricing")}
              onClick={closeMenu}
            >
              <span className="nav-link-inner">
                <Icon path={PRICING_ICON} />
                <span>{userEmail && !isPaid ? "Upgrade" : "Pricing"}</span>
              </span>
            </Link>

            <Dropdown
              open={resourcesOpen}
              onToggle={() => {
                setResourcesOpen((v) => !v)
                setFeaturesOpen(false)
                setAccountOpen(false)
              }}
              onMouseEnter={
                isDesktop
                  ? () => {
                      setResourcesOpen(true)
                      setFeaturesOpen(false)
                      setAccountOpen(false)
                    }
                  : undefined
              }
              onMouseLeave={isDesktop ? () => setResourcesOpen(false) : undefined}
              trigger={
                <span className="dropdown-trigger-inner">
                  <Icon path={RESOURCE_ICON} />
                  <span>Resources</span>
                </span>
              }
            >
              <a
                href="https://docs.sheriffcloud.com"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Documentation
              </a>
              <a
                href="https://forum.sheriffcloud.com"
                className="dropdown-link"
                onClick={closeMenu}
              >
                Community Forum
              </a>
              <a
                href="https://docs.sheriffcloud.com/faq"
                className="dropdown-link"
                onClick={closeMenu}
              >
                FAQ
              </a>
            </Dropdown>
          </nav>

          <div className="topbar-actions">
            {userEmail ? (
              <>
                <Link to="/admin" className="button button-ghost" onClick={closeMenu}>
                  <span className="nav-link-inner">
                    <Icon path={DASHBOARD_ICON} />
                    <span>Dashboard</span>
                  </span>
                </Link>

                <Dropdown
                  open={accountOpen}
                  onToggle={() => {
                    setAccountOpen((v) => !v)
                    setFeaturesOpen(false)
                    setResourcesOpen(false)
                  }}
                  onMouseEnter={
                    isDesktop
                      ? () => {
                          setAccountOpen(true)
                          setFeaturesOpen(false)
                          setResourcesOpen(false)
                        }
                      : undefined
                  }
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
                  <Link to="/admin" className="dropdown-link" onClick={closeMenu}>
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/settings"
                    className="dropdown-link"
                    onClick={closeMenu}
                  >
                    Settings
                  </Link>
                  <Link
                    to="/admin/subscription"
                    className="dropdown-link"
                    onClick={closeMenu}
                  >
                    Subscription
                  </Link>
                  <button
                    type="button"
                    className="dropdown-link dropdown-link-button"
                    onClick={() => {
                      closeMenu()
                      signOut()
                    }}
                  >
                    Sign Out
                  </button>
                </Dropdown>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    closeMenu()
                    if (onCreateSite) {
                      onCreateSite()
                      return
                    }
                    onOpenAuth?.()
                  }}
                >
                  Create Site
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => {
                    closeMenu()
                    onOpenAuth?.()
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}