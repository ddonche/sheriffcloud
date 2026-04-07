import { useState } from "react"
import { Icon } from "../Icons"
import type { SpurTheme } from "./spurTheme"
import { STATUS_CFG_DARK, STATUS_CFG_LIGHT, SPURF, SPURM } from "./spurTheme"
import { SpurMetaIcon, SpurActionBtn } from "./SpurMetaIcon"
import type { SpurPost } from "./spurTypes"
import { firstImageFromContent } from "./spurHelpers"

const META_COLORS: Record<string, string> = {
  image: "#4a9eff", video: "#e040a0", code: "#2dd98a",
  file:  "#f5c842", link:  "#c084fc", audio: "#fb923c",
}

export function SpurPostCard({ post, theme, darkMode, onEdit, onDelete, onPreview, deleting }: {
  post: SpurPost; theme: SpurTheme; darkMode: boolean
  onEdit: () => void
  onDelete: (e: React.MouseEvent) => void
  onPreview: (e: React.MouseEvent) => void
  deleting: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const stCfg = darkMode ? STATUS_CFG_DARK : STATUS_CFG_LIGHT
  const status = stCfg[post.status]
  const metaKeys = Object.entries(post.content_meta ?? {}).filter(([, v]) => v).map(([k]) => k.replace("has_", "")).filter(k => META_COLORS[k])
  const thumbSrc = post.thumbnail_url ?? firstImageFromContent(post.content)
  const cardBg = darkMode ? (hovered ? theme.surfaceHov : theme.surface) : (hovered ? "#f0f0f0" : "#ffffff")
  const cardBorder = hovered ? theme.border : theme.borderLight

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onEdit}
      style={{
        background: cardBg, border: `1px solid ${cardBorder}`,
        borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column",
        transition: "background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? (darkMode ? "0 8px 32px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.1)") : (darkMode ? "none" : "0 1px 4px rgba(0,0,0,0.06)"),
        cursor: "pointer",
      }}
    >
      <div style={{ height: 160, flexShrink: 0, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: darkMode ? `linear-gradient(135deg, ${theme.border} 0%, ${theme.borderLight} 100%)` : "linear-gradient(135deg, #dde6f3 0%, #ccd9ee 100%)" }}>
        {thumbSrc
          ? <img src={thumbSrc} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Icon name="image" size={36} color={darkMode ? theme.dim : "#8aaace"} />
        }
        <span style={{ position: "absolute", top: 10, right: 10, fontSize: 11, fontWeight: 700, fontFamily: SPURF, color: status.color, background: status.bg, padding: "4px 10px", borderRadius: 6, backdropFilter: "blur(8px)", border: `1px solid ${status.border}`, display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Icon name={status.icon} size={12} color={status.color} />
          {status.label}
        </span>
      </div>

      <div style={{ padding: "16px 18px 14px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: SPURF, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </div>
        {post.excerpt && (
          <div style={{ fontSize: 13, color: theme.muted, fontFamily: SPURF, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
            {post.excerpt}
          </div>
        )}
        {post.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {post.tags.map(t => (
              <span key={t} style={{ fontSize: 11, fontWeight: 400, fontFamily: SPURM, color: theme.accent, background: theme.accentDim, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.02em", border: `1px solid ${theme.accent}22` }}>#{t}</span>
            ))}
          </div>
        )}
        {metaKeys.length > 0 && (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {metaKeys.map(k => <SpurMetaIcon key={k} type={k} />)}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${darkMode ? theme.borderLight : theme.border + "60"}`, marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: theme.dim, fontFamily: SPURF }}>
              {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: theme.accent, fontFamily: SPURF }}>
              <Icon name="heart" size={14} color={theme.accent} />
              {(post as any).likes ?? 0}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: theme.muted, fontFamily: SPURF }}>
              <Icon name="comments" size={14} color={theme.muted} />
              {(post as any).comment_count ?? 0}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <SpurActionBtn label="Preview" icon="preview" color={theme.muted} bg={theme.border + "80"} onClick={onPreview} />
            <SpurActionBtn label="Delete"  icon="delete"  color={theme.red}   bg={theme.redDim}        onClick={onDelete} disabled={deleting} />
          </div>
        </div>
      </div>
    </div>
  )
}
