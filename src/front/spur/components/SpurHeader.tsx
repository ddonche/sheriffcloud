import { useAuth } from "../../../shared/auth/useAuth"
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
  onStartWriting: () => void
  onNewPost: () => void
  onNewBlog: () => void
  onDashboard: () => void
  canCreateBlog: boolean
  colors: Colors
  font: string
  fontMono: string
  darkMode: boolean
  onToggleTheme: () => void
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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [breakpoint])
  return isMobile
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconInfo({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={size} height={size} fill={color}>
      <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z"/>
    </svg>
  )
}

function IconPlus({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={size} height={size} fill={color}>
      <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/>
    </svg>
  )
}

function IconGear({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={size} height={size} fill={color}>
      <path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/>
    </svg>
  )
}

function IconSun({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={size} height={size} fill={color}>
      <path d="M320 32C328.4 32 336.3 36.4 340.6 43.7L396.1 136.3L500.9 110C509.1 108 517.8 110.4 523.7 116.3C529.6 122.2 532 131 530 139.1L503.7 243.8L596.4 299.3C603.6 303.6 608.1 311.5 608.1 319.9C608.1 328.3 603.7 336.2 596.4 340.5L503.7 396.1L530 500.8C532 509 529.6 517.7 523.7 523.6C517.8 529.5 509 532 500.9 530L396.2 503.7L340.7 596.4C336.4 603.6 328.5 608.1 320.1 608.1C311.7 608.1 303.8 603.7 299.5 596.4L243.9 503.7L139.2 530C131 532 122.4 529.6 116.4 523.7C110.4 517.8 108 509 110 500.8L136.2 396.1L43.6 340.6C36.4 336.2 32 328.4 32 320C32 311.6 36.4 303.7 43.7 299.4L136.3 243.9L110 139.1C108 130.9 110.3 122.3 116.3 116.3C122.3 110.3 131 108 139.2 110L243.9 136.2L299.4 43.6L301.2 41C305.7 35.3 312.6 31.9 320 31.9zM320 176C240.5 176 176 240.5 176 320C176 399.5 240.5 464 320 464C399.5 464 464 399.5 464 320C464 240.5 399.5 176 320 176zM320 416C267 416 224 373 224 320C224 267 267 224 320 224C373 224 416 267 416 320C416 373 373 416 320 416z"/>
    </svg>
  )
}

function IconMoon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={size} height={size} fill={color}>
      <path d="M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C388.8 576 451.3 548.8 497.3 504.6C504.6 497.6 506.7 486.7 502.6 477.5C498.5 468.3 488.9 462.6 478.8 463.4C473.9 463.8 469 464 464 464C362.4 464 280 381.6 280 280C280 207.9 321.5 145.4 382.1 115.2C391.2 110.7 396.4 100.9 395.2 90.8C394 80.7 386.6 72.5 376.7 70.3C358.4 66.2 339.4 64 320 64z"/>
    </svg>
  )
}

// ── IconButton helper ─────────────────────────────────────────────────────────

function IconBtn({
  onClick,
  title,
  active,
  colors,
  children,
}: {
  onClick: () => void
  title: string
  active?: boolean
  colors: Colors
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 38,
        height: 38,
        borderRadius: 9,
        border: `1px solid ${active ? colors.accent + "55" : colors.borderLight}`,
        background: active ? colors.accent + "18" : "transparent",
        color: active ? colors.accent : colors.muted,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

// ── DropdownItem ──────────────────────────────────────────────────────────────

function DropdownItem({
  onClick,
  children,
  colors,
  font,
  borderTop,
}: {
  onClick: () => void
  children: React.ReactNode
  colors: Colors
  font: string
  borderTop?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, fontWeight: 600, color: hov ? colors.text : colors.muted, background: hov ? colors.surfaceHover : "transparent", border: "none", borderTop: borderTop ? `1px solid ${colors.borderLight}` : "none", cursor: "pointer", fontFamily: font, transition: "background 0.1s, color 0.1s" }}
    >
      {children}
    </button>
  )
}

function DropdownLinkItem({
  to,
  onClick,
  children,
  colors,
  font,
  borderTop,
  active,
}: {
  to: string
  onClick?: () => void
  children: React.ReactNode
  colors: Colors
  font: string
  borderTop?: boolean
  active?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "block", padding: "10px 14px", fontSize: 13, fontWeight: 600, color: active ? colors.accent : hov ? colors.text : colors.muted, background: hov ? colors.surfaceHover : "transparent", textDecoration: "none", fontFamily: font, borderTop: borderTop ? `1px solid ${colors.borderLight}` : "none", transition: "background 0.1s, color 0.1s" }}
    >
      {children}
    </Link>
  )
}

// ── PlusMenu (hover dropdown for + icon) ─────────────────────────────────────

function PlusMenu({
  canCreateBlog,
  onNewPost,
  onNewBlog,
  colors,
  font,
}: {
  canCreateBlog: boolean
  onNewPost: () => void
  onNewBlog: () => void
  colors: Colors
  font: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <IconBtn onClick={() => {}} title="New Post / New Blog" active={open} colors={colors}>
        <IconPlus size={18} color={open ? colors.accent : colors.muted} />
      </IconBtn>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, paddingTop: 8, zIndex: 500 }}>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", minWidth: 140, overflow: "hidden" }}>
            <DropdownItem onClick={onNewPost} colors={colors} font={font}>New Post</DropdownItem>
            {canCreateBlog && (
              <DropdownItem onClick={onNewBlog} colors={colors} font={font} borderTop>New Blog</DropdownItem>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpurHeader({
  onStartWriting,
  onNewPost,
  onNewBlog,
  onDashboard,
  canCreateBlog,
  colors,
  font,
  fontMono,
  darkMode,
  onToggleTheme,
}: SpurHeaderProps) {
  const { userEmail, signOut } = useAuth()
  const session = userEmail ? { user: { email: userEmail } } : null
  const location = useLocation()
  const isMobile = useIsMobile()

  const [loginHover, setLoginHover] = useState(false)
  const [writeHover, setWriteHover] = useState(false)
  const [pricingHover, setPricingHover] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)

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
        background: darkMode ? "rgba(8,14,26,0.92)" : "rgba(245,247,250,0.92)",
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
          gap: 16,
        }}
      >
        {/* Logo */}
        <a
          href="https://spur.ink"
          className="spur-header__item"
          style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}
          aria-label="Spur home"
        >
          <img src="/spur-logo.png" alt="Spur" style={{ height: 52, width: "auto", display: "block" }} />
        </a>

        {/* Nav */}
        <nav
          className="spur-header__nav"
          style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}
        >
          {isMobile ? (
            // ── Mobile ──────────────────────────────────────────────────────
            <>
              {/* Theme toggle */}
              <IconBtn onClick={onToggleTheme} title={darkMode ? "Switch to light mode" : "Switch to dark mode"} colors={colors}>
                {darkMode
                  ? <IconSun size={18} color={colors.muted} />
                  : <IconMoon size={18} color={colors.muted} />
                }
              </IconBtn>

              {/* Info icon → hover: About + Pricing */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => setInfoOpen(true)}
                onMouseLeave={() => setInfoOpen(false)}
              >
                <IconBtn onClick={() => {}} title="About & Pricing" active={infoOpen} colors={colors}>
                  <IconInfo size={18} color={infoOpen ? colors.accent : colors.muted} />
                </IconBtn>
                {infoOpen && (
                  <div style={{ position: "absolute", top: "100%", right: 0, paddingTop: 8, zIndex: 500 }}>
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", minWidth: 140, overflow: "hidden" }}>
                      <DropdownLinkItem to="/spur/about" colors={colors} font={font}>About</DropdownLinkItem>
                      <DropdownLinkItem to="/spur/pricing" colors={colors} font={font} borderTop active={onPricing}>Pricing</DropdownLinkItem>
                    </div>
                  </div>
                )}
              </div>

              {/* + icon → hover: New Post + New Blog */}
              {session && (
                <div
                  style={{ position: "relative" }}
                  onMouseEnter={() => setInfoOpen(false)}
                >
                  <PlusMenu
                    canCreateBlog={canCreateBlog}
                    onNewPost={onNewPost}
                    onNewBlog={onNewBlog}
                    colors={colors}
                    font={font}
                  />
                </div>
              )}

              {/* Gear → Dashboard */}
              {session && (
                <IconBtn onClick={onDashboard} title="Dashboard" colors={colors}>
                  <IconGear size={18} color={colors.muted} />
                </IconBtn>
              )}

              {/* CTA / account */}
              {!session ? (
                <>
                  <button
                    type="button"
                    onClick={onStartWriting}
                    style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: colors.accent, padding: "9px 14px", borderRadius: 9, border: "none", fontFamily: font, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Start Writing
                  </button>
                  <button
                    type="button"
                    onClick={onStartWriting}
                    style={{ fontSize: 13, fontWeight: 600, color: colors.muted, padding: "9px 14px", borderRadius: 9, border: `1px solid ${colors.borderLight}`, background: "transparent", fontFamily: font, cursor: "pointer" }}
                  >
                    Log In
                  </button>
                </>
              ) : (
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${menuOpen ? colors.accent : colors.border}`, background: "transparent", color: colors.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, fontFamily: fontMono, cursor: "pointer" }}
                    aria-label="Account"
                    aria-expanded={menuOpen}
                  >
                    {accountInitials}
                  </button>
                  {menuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", minWidth: 160, overflow: "hidden", zIndex: 500 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.muted, padding: "10px 14px 8px", borderBottom: `1px solid ${colors.borderLight}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: font }}>
                        {accountLabel}
                      </div>
                      <DropdownItem onClick={signOut} colors={colors} font={font}>Sign Out</DropdownItem>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            // ── Desktop ─────────────────────────────────────────────────────
            <>
              <Link
                to="/spur/about"
                className="spur-header__item"
                style={{ fontSize: 14, fontWeight: 600, color: colors.muted, padding: "9px 14px", borderRadius: 9, border: "1px solid transparent", background: "transparent", transition: "all 0.15s ease", textDecoration: "none" }}
              >
                About
              </Link>

              <Link
                to="/spur/pricing"
                className="spur-header__item"
                style={{ fontSize: 14, fontWeight: 600, color: onPricing || pricingHover ? colors.text : colors.muted, padding: "9px 14px", borderRadius: 9, border: `1px solid ${(onPricing || pricingHover) ? colors.border : "transparent"}`, background: onPricing || pricingHover ? colors.surfaceHover : "transparent", transition: "all 0.15s ease", textDecoration: "none" }}
                onMouseEnter={() => setPricingHover(true)}
                onMouseLeave={() => setPricingHover(false)}
              >
                Pricing
              </Link>

              {/* Theme toggle */}
              <IconBtn onClick={onToggleTheme} title={darkMode ? "Switch to light mode" : "Switch to dark mode"} colors={colors}>
                {darkMode
                  ? <IconSun size={18} color={colors.muted} />
                  : <IconMoon size={18} color={colors.muted} />
                }
              </IconBtn>

              {!session ? (
                <>
                  <button
                    type="button"
                    onClick={onStartWriting}
                    style={{ fontSize: 14, fontWeight: 700, color: "#fff", background: writeHover ? colors.accentHover : colors.accent, padding: "10px 16px", borderRadius: 9, border: "none", fontFamily: font, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={() => setWriteHover(true)}
                    onMouseLeave={() => setWriteHover(false)}
                  >
                    Start Writing
                  </button>
                  <button
                    type="button"
                    onClick={onStartWriting}
                    onMouseEnter={() => setLoginHover(true)}
                    onMouseLeave={() => setLoginHover(false)}
                    style={{ fontSize: 14, fontWeight: 600, color: loginHover ? colors.text : colors.muted, padding: "9px 14px", borderRadius: 9, border: `1px solid ${loginHover ? colors.border : colors.borderLight}`, background: loginHover ? colors.surfaceHover : "transparent", fontFamily: font, cursor: "pointer", transition: "all 0.15s" }}
                  >
                    Log In
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onNewPost}
                    style={{ fontSize: 13, fontWeight: 700, padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, cursor: "pointer", fontFamily: font }}
                  >
                    + New Post
                  </button>
                  {canCreateBlog && (
                    <button
                      type="button"
                      onClick={onNewBlog}
                      style={{ fontSize: 13, fontWeight: 700, padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, cursor: "pointer", fontFamily: font }}
                    >
                      + New Blog
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onDashboard}
                    style={{ fontSize: 13, fontWeight: 700, padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, cursor: "pointer", fontFamily: font }}
                  >
                    Dashboard
                  </button>
                </>
              )}

              {session && (
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${menuOpen ? colors.accent : colors.border}`, background: "transparent", color: colors.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, fontFamily: fontMono, transition: "border-color 0.15s ease", cursor: "pointer" }}
                    aria-label="Account"
                    aria-expanded={menuOpen}
                  >
                    {accountInitials}
                  </button>
                  {menuOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", minWidth: 160, overflow: "hidden", zIndex: 500 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.muted, padding: "10px 14px 8px", borderBottom: `1px solid ${colors.borderLight}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: font }}>
                        {accountLabel}
                      </div>
                      <DropdownItem onClick={signOut} colors={colors} font={font}>Sign Out</DropdownItem>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}