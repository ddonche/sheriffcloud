const FONT = `"DM Sans", "Inter", system-ui, sans-serif`
const FONT_MONO = `"DM Mono", "Fira Code", monospace`

type Colors = {
  bg: string
  surface: string
  borderLight: string
  text: string
  muted: string
  dim: string
  accent: string
}

export default function ComingSoonPage({
  colors,
  title,
  description,
}: {
  colors: Colors
  title: string
  description: string
}) {
  const C = colors
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
          Coming Soon
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 900, marginBottom: 16 }}>
          {title}
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.75, color: C.muted, marginBottom: 32 }}>
          {description}
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 999, padding: "8px 18px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, display: "inline-block" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, fontFamily: FONT_MONO }}>In the works</span>
        </div>
        <div style={{ marginTop: 40 }}>
          <a href="/" style={{ fontSize: 14, fontWeight: 700, color: C.accent, textDecoration: "none" }}>
            ← Back to Spur
          </a>
        </div>
      </div>
    </div>
  )
}
