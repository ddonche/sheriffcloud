export const SPURF = `"Geist", system-ui, sans-serif`
export const SPURM = `"Geist Mono", "Fira Code", monospace`

export const SPUR_DARK = {
  bg:          "#080e1a",
  surface:     "#0d1525",
  surfaceHov:  "#121d30",
  border:      "#1e2d47",
  borderLight: "#162038",
  text:        "#e4eaf4",
  muted:       "#6080a8",
  dim:         "#2a3f5e",
  accent:      "#f29106",
  accentHov:   "#ffaa2e",
  accentDim:   "#f2910620",
  green:       "#2dd98a",
  greenDim:    "#2dd98a20",
  yellow:      "#f5c842",
  yellowDim:   "#f5c84220",
  red:         "#ef4444",
  redDim:      "#ef444418",
}

export const SPUR_LIGHT = {
  bg:          "#efefef",
  surface:     "#e5e5e5",
  surfaceHov:  "#dadada",
  border:      "#bfcfe8",
  borderLight: "#c8d8ee",
  text:        "#0e1825",
  muted:       "#4a6a96",
  dim:         "#8aaace",
  accent:      "#d97c00",
  accentHov:   "#bf6d00",
  accentDim:   "#d97c0014",
  green:       "#1a7a4a",
  greenDim:    "#1a7a4a14",
  yellow:      "#8a6800",
  yellowDim:   "#8a680014",
  red:         "#c0392b",
  redDim:      "#c0392b14",
}

export type SpurTheme = typeof SPUR_DARK

export const STATUS_CFG_DARK = {
  published: { label: "Published", icon: "published" as const, color: "#2dd98a", bg: "#0d2e1f", border: "#2dd98a55" },
  draft:     { label: "Draft",     icon: "draft"     as const, color: "#8aaace", bg: "#0d1525", border: "#1e2d47"   },
  scheduled: { label: "Scheduled", icon: "scheduled" as const, color: "#f5c842", bg: "#2a2000", border: "#f5c84255" },
}

export const STATUS_CFG_LIGHT = {
  published: { label: "Published", icon: "published" as const, color: "#1a7a4a", bg: "#d4f0e2", border: "#1a7a4a40" },
  draft:     { label: "Draft",     icon: "draft"     as const, color: "#4a6a96", bg: "#dce8f5", border: "#bfcfe8"   },
  scheduled: { label: "Scheduled", icon: "scheduled" as const, color: "#8a6800", bg: "#f5e8b0", border: "#8a680040" },
}

export const META_COLORS_SPUR: Record<string, string> = {
  image: "#4a9eff",
  video: "#e040a0",
  code:  "#2dd98a",
  file:  "#f5c842",
  link:  "#c084fc",
  audio: "#fb923c",
}
