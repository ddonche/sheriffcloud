import { Link } from "react-router-dom"
type Colors = {
  bg: string
  surface: string
  border: string
  borderLight: string
  text: string
  muted: string
  dim: string
  accent: string
}

const FONT = `"DM Sans", "Inter", system-ui, sans-serif`
const FONT_MONO = `"DM Mono", "Fira Code", monospace`

function FooterLink({ href, children, colors }: { href: string; children: React.ReactNode; colors: Colors }) {
  const isExternal = href.startsWith("http")
  const style = { fontSize: 13, color: colors.muted, textDecoration: "none", display: "block", padding: "3px 0", transition: "color 0.15s", fontFamily: FONT }
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}
        onMouseEnter={(e) => (e.currentTarget.style.color = colors.text)}
        onMouseLeave={(e) => (e.currentTarget.style.color = colors.muted)}
      >{children}</a>
    )
  }
  return (
    <Link to={href} style={style}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = colors.text)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = colors.muted)}
    >{children}</Link>
  )
}

function IconX({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconFacebook({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconYoutube({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Discovery", href: "/" },
      { label: "Pricing", href: "/pricing" },
      { label: "Start Writing", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Documentation", href: "/docs" },
      { label: "Forums", href: "/forums" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
]

const SOCIALS = [
  { label: "X / Twitter", href: "https://x.com/spurink", Icon: IconX },
  { label: "Facebook", href: "https://facebook.com/spurink", Icon: IconFacebook },
  { label: "YouTube", href: "https://youtube.com/@spurink", Icon: IconYoutube },
]

export default function SpurFooter({ colors }: { colors: Colors }) {
  return (
    <footer style={{ borderTop: `1px solid ${colors.borderLight}`, background: colors.surface, fontFamily: FONT }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px 40px" }}>

        {/* Top: logo + tagline left, columns right */}
        <style>{`
          @media (max-width: 768px) {
            .spur-footer-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 32px !important;
            }
            .spur-footer-grid > *:first-child {
              grid-column: 1 / -1;
            }
          }
        `}</style>
        <div className="spur-footer-grid" style={{ display: "grid", gridTemplateColumns: "1fr repeat(4, auto)", gap: 48, alignItems: "start", marginBottom: 48 }}>

          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 260 }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.04em", color: colors.text, lineHeight: 1 }}>
              Spur<span style={{ color: colors.accent }}>.</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: colors.muted }}>
              Discovery-first blogging. Write, get seen, and build your hub — all on your own domain.
            </div>
            {/* Socials */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.borderLight}`, background: "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", color: colors.muted, transition: "color 0.15s, border-color 0.15s, background 0.15s", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = colors.text; e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.bg }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = colors.muted; e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = "transparent" }}
                >
                  <Icon size={16} color="currentColor" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: colors.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                {col.heading}
              </div>
              {col.links.map((link) => (
                <FooterLink key={link.label} href={link.href} colors={colors}>
                  {link.label}
                </FooterLink>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: colors.dim, fontFamily: FONT_MONO }}>
            © {new Date().getFullYear()} Spur. All rights reserved.
          </div>
          <div style={{ fontSize: 12, color: colors.dim, fontFamily: FONT_MONO }}>
            Built on <span style={{ color: colors.accent }}>Sheriff Cloud</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
