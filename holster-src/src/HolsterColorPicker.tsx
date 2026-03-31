import { useState } from "react"

const FONT = `"Inter", system-ui, -apple-system, sans-serif`

export const PRESET_COLORS: { color: string; name: string }[] = [
  // Dawn
  { color: "#A3BFFA", name: "Dust Blue" },
  { color: "#9DC8B6", name: "Sage Mist" },
  { color: "#B8B8B8", name: "Trail Gray" },
  // Midday
  { color: "#D2B48C", name: "Saddle Tan" },
  { color: "#E8D5B7", name: "Sandstone" },
  { color: "#C9B89F", name: "Clay Beige" },
  { color: "#8C6F4E", name: "Mesquite" },
  // Afternoon
  { color: "#B96F4E", name: "Rust Earth" },
  { color: "#E07A5F", name: "Terracotta" },
  { color: "#C05D4A", name: "Canyon Red" },
  // Dusk
  { color: "#E97C3F", name: "Sunset Orange" },
  { color: "#D14A2E", name: "Ember Red" },
  { color: "#B86A7E", name: "Adobe Rose" },
  // Campfire
  { color: "#E8B923", name: "Campfire Gold" },
  { color: "#D98E2F", name: "Whiskey Amber" },
  { color: "#8B5A2B", name: "Leather Brown" },
  { color: "#9F4A2F", name: "Burnt Sienna" },
  // Night
  { color: "#2C4A6E", name: "Midnight Denim" },
  { color: "#3E4C7A", name: "Slate Indigo" },
  { color: "#2A3A4F", name: "Prairie Night" },
  { color: "#3F3F3F", name: "Charcoal" },
  { color: "#1F1F1F", name: "Raven Black" },
  { color: "#4A6B8A", name: "Steel Blue" },
  { color: "#2E4A3F", name: "Deep Sage" },
  // Brand
  { color: "#5b95a7", name: "Holster Teal" },
  { color: "#c14141", name: "Holster Red" },
  { color: "#7c6fa0", name: "Dusk Purple" },
]

export const DEFAULT_COLOR = PRESET_COLORS[0].color

export function ColorPicker({ value, onChange }: {
  value: string | null
  onChange: (color: string) => void
}) {
  const [hexInput, setHexInput] = useState("")
  const [showHex, setShowHex]   = useState(false)
  const current = value ?? DEFAULT_COLOR

  function handleHex() {
    const hex = hexInput.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex)
      setShowHex(false)
      setHexInput("")
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {PRESET_COLORS.map(({ color, name }) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            title={name}
            style={{
              width: 22, height: 22, borderRadius: "50%",
              background: color,
              border: current === color ? `3px solid rgba(255,255,255,0.8)` : "3px solid transparent",
              cursor: "pointer", padding: 0, flexShrink: 0,
              boxShadow: current === color ? `0 0 0 2px ${color}` : "0 1px 3px rgba(0,0,0,0.2)",
              transition: "box-shadow 0.1s",
            }}
          />
        ))}

        {/* Custom hex trigger */}
        <button
          type="button"
          onClick={() => setShowHex(v => !v)}
          title="Custom hex color"
          style={{
            width: 22, height: 22, borderRadius: "50%",
            background: showHex ? "#f1f5f9" : "transparent",
            border: "2px dashed #94a3b8",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#94a3b8", fontSize: 13, lineHeight: 1, padding: 0, flexShrink: 0,
          }}
        >
          +
        </button>
      </div>

      {showHex && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
            background: /^#[0-9a-fA-F]{6}$/.test(hexInput.trim()) ? hexInput.trim() : "#e2e8f0",
            border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }} />
          <input
            value={hexInput}
            onChange={e => setHexInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleHex()}
            placeholder="#a1b2c3"
            maxLength={7}
            autoFocus
            style={{
              height: 30, padding: "0 10px", borderRadius: 6,
              border: "1px solid #e2e8f0", background: "#fff",
              fontSize: 13, fontFamily: "monospace", color: "#0f172a",
              outline: "none", width: 100,
            }}
          />
          <button type="button" onClick={handleHex}
            style={{
              height: 30, padding: "0 10px", borderRadius: 6,
              border: "none", background: "#5b95a7", color: "#fff",
              fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
            }}>
            OK
          </button>
        </div>
      )}
    </div>
  )
}

// Compact trigger — just shows the current color as a circle, click to open picker
export function ColorDot({ value, onChange }: {
  value: string | null
  onChange: (color: string) => void
}) {
  const [open, setOpen] = useState(false)
  const color = value ?? DEFAULT_COLOR

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Change color"
        style={{
          width: 18, height: 18, borderRadius: "50%",
          background: color, border: "none",
          cursor: "pointer", padding: 0, flexShrink: 0,
        }}
      />
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div style={{
            position: "absolute", top: 26, left: 0, zIndex: 100,
            background: "#ffffff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            width: 240,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT, marginBottom: 10 }}>
              Color
            </div>
            <ColorPicker value={value} onChange={c => { onChange(c); setOpen(false) }} />
          </div>
        </>
      )}
    </div>
  )
}
