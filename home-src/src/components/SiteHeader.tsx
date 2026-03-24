import { useEffect, useRef, useState } from "react"

type SiteHeaderProps = {
  userEmail?: string | null
  isPaid?: boolean
  onSignOut?: () => void
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

const ACCOUNT_ICON =
  "M320 400C394.6 400 458.4 353.6 484 288L488 288C501.3 288 512 277.3 512 264L512 184C512 170.7 501.3 160 488 160L484 160C458.4 94.4 394.6 48 320 48C245.4 48 181.6 94.4 156 160L152 160C138.7 160 128 170.7 128 184L128 264C128 277.3 138.7 288 152 288L156 288C181.6 353.6 245.4 400 320 400zM304 144L336 144C389 144 432 187 432 240C432 293 389 336 336 336L304 336C251 336 208 293 208 240C208 187 251 144 304 144zM112 548.6C112 563.7 124.3 576 139.4 576L192 576L192 528C192 510.3 206.3 496 224 496L416 496C433.7 496 448 510.3 448 528L448 576L500.6 576C515.7 576 528 563.7 528 548.6C528 488.8 496.1 436.4 448.4 407.6C412 433.1 367.8 448 320 448C272.2 448 228 433.1 191.6 407.6C143.9 436.4 112 488.8 112 548.6zM279.3 205.5C278.4 202.2 275.4 200 272 200C268.6 200 265.6 202.2 264.7 205.5L258.7 226.7L237.5 232.7C234.2 233.6 232 236.6 232 240C232 243.4 234.2 246.4 237.5 247.3L258.7 253.3L264.7 274.5C265.6 277.8 268.6 280 272 280C275.4 280 278.4 277.8 279.3 274.5L285.3 253.3L306.5 247.3C309.8 246.4 312 243.4 312 240C312 236.6 309.8 233.6 306.5 232.7L285.3 226.7L279.3 205.5zM248 552L248 576L296 576L296 552C296 538.7 285.3 528 272 528C258.7 528 248 538.7 248 552zM368 528C354.7 528 344 538.7 344 552L344 576L392 576L392 552C392 538.7 381.3 528 368 528z"

type DropdownProps = {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  open: boolean
  onToggle: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function Dropdown({
  label,
  icon,
  children,
  open,
  onToggle,
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
        <span className="dropdown-trigger-inner">
          {icon}
          <span>{label}</span>
        </span>
      </button>

      {open && <div className="dropdown-menu">{children}</div>}
    </div>
  )
}

export default function SiteHeader({
  userEmail = null,
  isPaid = false,
  onSignOut,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const isDesktop =
    typeof window !== "undefined" ? window.matchMedia("(min-width: 981px)").matches : false

  function closeAll() {
    setFeaturesOpen(false)
    setResourcesOpen(false)
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
    <header className="topbar">
      <div className="container topbar-inner" ref={wrapRef}>
        <a
          href="https://sheriffcloud.com"
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
        </a>

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
            <a
              href="https://admin.sheriffcloud.com"
              className="topnav-link"
              onClick={closeMenu}
            >
              <span className="nav-link-inner">
                <Icon path={DASHBOARD_ICON} />
                <span>Dashboard</span>
              </span>
            </a>

            <Dropdown
              label="Features"
              icon={<Icon path={FEATURES_ICON} />}
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
            >
              <a href="https://sheriffcloud.com/features" className="dropdown-link" onClick={closeMenu}>
                Features
              </a>
              <a href="https://sheriffcloud.com/how-it-works" className="dropdown-link" onClick={closeMenu}>
                How It Works
              </a>
              <a href="https://sheriffcloud.com/use-cases" className="dropdown-link" onClick={closeMenu}>
                Use Cases
              </a>
            </Dropdown>

            <a href="https://sheriffcloud.com/pricing" className="topnav-link" onClick={closeMenu}>
              <span className="nav-link-inner">
                <Icon path={PRICING_ICON} />
                <span>{userEmail && !isPaid ? "Upgrade" : "Pricing"}</span>
              </span>
            </a>

            <Dropdown
              label="Resources"
              icon={<Icon path={RESOURCE_ICON} />}
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
            <Dropdown
              label="Account"
              icon={<Icon path={ACCOUNT_ICON} />}
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
            >
              {userEmail ? (
                <>
                  <div className="dropdown-meta">Signed in as</div>
                  <div className="dropdown-email">{userEmail}</div>
                  <div className="dropdown-divider" />
                  <a
                    href="https://admin.sheriffcloud.com"
                    className="dropdown-link"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </a>
                  <a
                    href="https://admin.sheriffcloud.com/settings"
                    className="dropdown-link"
                    onClick={closeMenu}
                  >
                    Settings
                  </a>
                  <a
                    href="https://admin.sheriffcloud.com/subscription"
                    className="dropdown-link"
                    onClick={closeMenu}
                  >
                    Subscription
                  </a>
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
                </>
              ) : (
                <>
                  <a
                    href="https://admin.sheriffcloud.com"
                    className="dropdown-link"
                    onClick={closeMenu}
                  >
                    Sign In
                  </a>
                  <a
                    href="https://admin.sheriffcloud.com"
                    className="dropdown-link"
                    onClick={closeMenu}
                  >
                    Create Site
                  </a>
                </>
              )}
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  )
}