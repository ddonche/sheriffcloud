import { useState } from "react"
import { Icon } from "../Icons"
import { META_COLORS_SPUR } from "./spurTheme"

export function SpurMetaIcon({ type }: { type: string }) {
  const color = META_COLORS_SPUR[type] ?? "#9ca3af"
  return (
    <span title={type} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: color + "18" }}>
      <Icon name={type as any} size={17} color={color} />
    </span>
  )
}

export function SpurActionBtn({ label, icon, color, bg, onClick, disabled }: {
  label: string; icon: any; color: string; bg: string
  onClick: (e: React.MouseEvent) => void; disabled?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button title={label} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 34, height: 34, borderRadius: 7, border: "none", cursor: disabled ? "default" : "pointer", background: hov ? color + "33" : bg, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.1s", opacity: disabled ? 0.4 : 1 }}>
      <Icon name={icon} size={16} color={color} />
    </button>
  )
}
