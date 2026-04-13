import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "./supabase"

// ─── Types ────────────────────────────────────────────────────────────────────

type Codex = {
  id: string
  owner_id: string
  name: string
  slug: string
  short_code: string
  description: string | null
}

type CodexEntry = {
  id: string
  codex_id: string
  parent_id: string | null
  node_type: "node" | "anchor"
  display_label: string | null
  title: string | null
  content: string | null
  sort_order: number
  reference_code: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const F  = `"Geist", system-ui, sans-serif`
const FM = `"Geist Mono", "Fira Code", monospace`
const FS = `"Lora", Georgia, serif`

const C = {
  bg:          "#09090f",
  surface:     "#0f0f1a",
  surfaceHov:  "#141425",
  border:      "#1e1e35",
  borderLight: "#181830",
  text:        "#e8e6f0",
  muted:       "#6b6890",
  dim:         "#2a2845",
  accent:      "#7c6af7",
  accentHov:   "#9a8bff",
  accentDim:   "#7c6af720",
  red:         "#ef4444",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getChildren(entries: CodexEntry[], parentId: string | null): CodexEntry[] {
  return entries
    .filter(e => e.parent_id === parentId && e.node_type === "node")
    .sort((a, b) => a.sort_order - b.sort_order)
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes cx-spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width: 24, height: 24, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "cx-spin 0.7s linear infinite" }} />
    </>
  )
}

// ─── Tree item (read-only) ────────────────────────────────────────────────────

function TreeItem({ entry, entries, depth, selectedId, codexSlug }: {
  entry: CodexEntry
  entries: CodexEntry[]
  depth: number
  selectedId: string | null
  codexSlug: string
}) {
  const [expanded, setExpanded] = useState(true)
  const [hovered, setHovered] = useState(false)
  const children = getChildren(entries, entry.id)
  const hasChildren = children.length > 0
  const isSelected = selectedId === entry.id

  return (
    <div>
      <Link
        to={`/codex/${codexSlug}/${entry.id}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          paddingLeft: 12 + depth * 16, paddingRight: 10,
          height: 42, cursor: "pointer", textDecoration: "none",
          background: isSelected ? C.accentDim : hovered ? C.borderLight : "transparent",
          borderLeft: `2px solid ${isSelected ? C.accent : "transparent"}`,
          transition: "background 0.1s",
        }}
      >
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); setExpanded(v => !v) }}
          style={{ width: 20, height: 20, flexShrink: 0, background: "none", border: "none", cursor: hasChildren ? "pointer" : "default", color: hasChildren ? C.muted : "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
          {hasChildren && (
            <svg viewBox="0 0 640 640" width={10} height={10} fill="currentColor" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
              <path d="M224 64L448 320L224 576L160 512L320 320L160 128Z" />
            </svg>
          )}
        </button>

        <span style={{ flex: 1, fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? C.accent : C.text, fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.title ?? <span style={{ color: C.muted, fontStyle: "italic" }}>Untitled</span>}
        </span>

        {entry.display_label && (
          <span style={{ fontSize: 10, fontFamily: FM, color: C.accent, background: C.accentDim, padding: "1px 5px", borderRadius: 3, flexShrink: 0, opacity: 0.8 }}>
            {entry.display_label}
          </span>
        )}
      </Link>

      {expanded && hasChildren && children.map(child => (
        <TreeItem key={child.id} entry={child} entries={entries} depth={depth + 1} selectedId={selectedId} codexSlug={codexSlug} />
      ))}
    </div>
  )
}

// ─── Document reader ──────────────────────────────────────────────────────────

function CodexReader({ entry, entries, codex }: {
  entry: CodexEntry
  entries: CodexEntry[]
  codex: Codex
}) {
  const anchors = entries.filter(e => e.parent_id === entry.id && e.node_type === "anchor")
  const parent = entries.find(e => e.id === entry.parent_id) ?? null
  const [copied, setCopied] = useState<string | null>(null)

  function buildCitation(anchor: CodexEntry): string {
    // Walk up the tree to build full path
    const path: string[] = []
    let current: CodexEntry | undefined = entry
    while (current) {
      if (current.display_label) path.unshift(current.display_label)
      current = entries.find(e => e.id === current!.parent_id)
    }
    path.unshift(codex.short_code)
    return [...path, anchor.reference_code].filter(Boolean).join(".")
  }

  function handleCopyCitation(anchor: CodexEntry) {
    const citation = buildCitation(anchor)
    navigator.clipboard.writeText(`[[${citation}]]`)
    setCopied(anchor.id)
    setTimeout(() => setCopied(null), 1800)
  }

  if (!entry.content) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
        <div style={{ fontSize: 32, opacity: 0.07 }}>📖</div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: F }}>No content yet.</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 40px 80px", fontFamily: FS }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Geist+Mono:wght@400;500&display=swap');
        .cx-content { font-family: ${FS}; font-size: 18px; line-height: 1.85; color: ${C.text}; }
        .cx-content h1, .cx-content h2, .cx-content h3 { font-family: ${F}; color: ${C.text}; margin: 1.4em 0 0.5em; line-height: 1.3; }
        .cx-content h1 { font-size: 28px; font-weight: 800; }
        .cx-content h2 { font-size: 22px; font-weight: 700; }
        .cx-content h3 { font-size: 18px; font-weight: 600; }
        .cx-content p { margin: 0 0 1.2em; }
        .cx-content blockquote { border-left: 3px solid ${C.accent}; padding-left: 20px; margin: 24px 0; color: ${C.muted}; font-style: italic; }
        .cx-content code { background: ${C.borderLight}; border-radius: 4px; padding: 2px 7px; font-family: ${FM}; font-size: 15px; }
        .cx-content a { color: ${C.accent}; text-decoration: underline; }
        .cx-content ul, .cx-content ol { padding-left: 28px; margin: 0 0 1.2em; }
        .cx-content li { margin-bottom: 6px; }
        .cx-content span[data-section-id] { display: inline-flex; align-items: center; background: ${C.accentDim}; color: ${C.accent}; font-family: ${FM}; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 4px; border: 1px solid ${C.accent}44; user-select: none; margin: 0 1px 0 3px; letter-spacing: 0.03em; vertical-align: middle; cursor: default; }
      `}</style>

      {/* Breadcrumb */}
      {parent && (
        <div style={{ fontSize: 12, color: C.muted, fontFamily: FM, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{parent.title}</span>
          <span style={{ opacity: 0.5 }}>›</span>
        </div>
      )}

      {/* Title */}
      <h1 style={{ fontSize: 32, fontWeight: 800, color: C.text, fontFamily: F, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 8px" }}>
        {entry.title ?? "Untitled"}
      </h1>

      {entry.display_label && (
        <div style={{ fontSize: 11, fontFamily: FM, color: C.accent, background: C.accentDim, padding: "2px 8px", borderRadius: 4, display: "inline-block", marginBottom: 32 }}>
          {entry.display_label}
        </div>
      )}

      {/* Content */}
      <div className="cx-content" dangerouslySetInnerHTML={{ __html: entry.content }} />

      {/* Section IDs list */}
      {anchors.length > 0 && (
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${C.borderLight}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, fontFamily: FM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Section IDs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {anchors.map(anchor => {
              const citation = buildCitation(anchor)
              const isCopied = copied === anchor.id
              return (
                <div key={anchor.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: FM, color: C.accent, background: C.accentDim, padding: "2px 7px", borderRadius: 4, flexShrink: 0, marginTop: 2, border: `1px solid ${C.accent}44` }}>
                    [{anchor.reference_code}]
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: C.text, fontFamily: FS, lineHeight: 1.6 }}>
                      {anchor.content}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: FM, marginTop: 4 }}>
                      {citation}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCitation(anchor)}
                    title="Copy embed code"
                    style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${isCopied ? C.accent : C.border}`, background: isCopied ? C.accentDim : "transparent", color: isCopied ? C.accent : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FM, flexShrink: 0, transition: "all 0.15s", whiteSpace: "nowrap" }}>
                    {isCopied ? "Copied!" : "[[embed]]"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Codex view (tree + reader) ───────────────────────────────────────────────

function CodexView() {
  const { codexSlug, entryId } = useParams<{ codexSlug: string; entryId?: string }>()
  const [codex, setCodex] = useState<Codex | null>(null)
  const [entries, setEntries] = useState<CodexEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!codexSlug) return
    load()
  }, [codexSlug])

  async function load() {
    setLoading(true)
    const { data: cx } = await supabase
      .from("codices")
      .select("*")
      .eq("slug", codexSlug)
      .single()

    if (!cx) { setLoading(false); return }
    setCodex(cx)

    const { data: en } = await supabase
      .from("codex_entries")
      .select("*")
      .eq("codex_id", cx.id)
      .order("sort_order", { ascending: true })

    setEntries(en ?? [])
    setLoading(false)
  }

  const nodeEntries = entries.filter(e => e.node_type === "node")
  const rootEntries = getChildren(nodeEntries, null)
  const selectedEntry = entryId ? entries.find(e => e.id === entryId) ?? null : null

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg }}>
        <Spinner />
      </div>
    )
  }

  if (!codex) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.muted, fontFamily: F }}>
        Codex not found.
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bg, color: C.text, fontFamily: F }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Geist+Mono:wght@400;500&display=swap');`}</style>

      {/* Top bar */}
      <div style={{ flexShrink: 0, background: C.bg, borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", padding: "0 20px", height: 52, gap: 16 }}>
        <Link to="/codex" style={{ fontSize: 12, color: C.muted, fontFamily: FM, textDecoration: "none", flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.text}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.muted}>
          ← All Codices
        </Link>
        <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />
        <div style={{ fontSize: 15, fontWeight: 800, color: C.accent, fontFamily: F, letterSpacing: "-0.02em" }}>{codex.name}</div>
        <span style={{ fontSize: 10, fontFamily: FM, color: C.muted, background: C.borderLight, padding: "2px 7px", borderRadius: 4 }}>{codex.short_code}</span>
        {codex.description && (
          <span style={{ fontSize: 13, color: C.muted, fontFamily: F, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{codex.description}</span>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left — tree */}
        <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${C.borderLight}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, fontFamily: FM, letterSpacing: "0.08em", textTransform: "uppercase" }}>Contents</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 4, paddingBottom: 16 }}>
            {rootEntries.length === 0 ? (
              <div style={{ padding: "20px 16px", fontSize: 13, color: C.muted, fontFamily: F, textAlign: "center" }}>Nothing here yet.</div>
            ) : rootEntries.map(entry => (
              <TreeItem key={entry.id} entry={entry} entries={nodeEntries} depth={0} selectedId={entryId ?? null} codexSlug={codexSlug!} />
            ))}
          </div>
        </div>

        {/* Right — reader */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {selectedEntry ? (
            <CodexReader entry={selectedEntry} entries={entries} codex={codex} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
              <div style={{ fontSize: 36, opacity: 0.07 }}>📜</div>
              <div style={{ fontSize: 14, color: C.muted, fontFamily: F }}>Select an entry from the tree.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Codex index (all codices) ────────────────────────────────────────────────

function CodexIndex() {
  const [codices, setCodices] = useState<Codex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("codices").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setCodices(data ?? []); setLoading(false) })
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Geist+Mono:wght@400;500&display=swap');`}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: FM, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Sheriff Codex</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>Living Canons</h1>
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, margin: "0 0 48px" }}>Structured texts with stable citations, cross-references, and annotations.</p>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}><Spinner /></div>
        ) : codices.length === 0 ? (
          <div style={{ fontSize: 14, color: C.muted, fontFamily: F }}>No codices yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {codices.map(cx => (
              <Link key={cx.id} to={`/codex/${cx.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ padding: "20px 24px", background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 16, transition: "border-color 0.12s, background 0.12s", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.surfaceHov }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderLight; (e.currentTarget as HTMLElement).style.background = C.surface }}>
                  <span style={{ fontSize: 12, fontFamily: FM, color: C.accent, background: C.accentDim, padding: "3px 10px", borderRadius: 5, flexShrink: 0, fontWeight: 700, letterSpacing: "0.06em" }}>{cx.short_code}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: F }}>{cx.name}</div>
                    {cx.description && <div style={{ fontSize: 13, color: C.muted, fontFamily: F, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cx.description}</div>}
                  </div>
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function CodexApp() {
  const { codexSlug } = useParams<{ codexSlug?: string }>()
  if (!codexSlug) return <CodexIndex />
  return <CodexView />
}
