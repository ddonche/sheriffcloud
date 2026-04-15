import { useEffect, useState } from "react"
import type { Codex, CodexEntry } from "./codexTypes"
import { CODEX_DARK, CODEX_LIGHT, CODEXF, CODEXM } from "./codexTheme"
import type { CodexTheme } from "./codexTheme"
import { CodexEditor } from "./CodexEditor"
import { slugify } from "./codexHelpers"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getChildren(entries: CodexEntry[], parentId: string | null): CodexEntry[] {
  return entries
    .filter(e => e.parent_id === parentId && e.node_type === "node")
    .sort((a, b) => a.sort_order - b.sort_order)
}

// ─── New node form ────────────────────────────────────────────────────────────
// Shown in the right pane when creating or renaming a node

function NodeForm({ parentId, existingEntry, codexId, allEntries, supabase, onSaved, onCancel, theme }: {
  parentId: string | null
  existingEntry: CodexEntry | null
  codexId: string
  allEntries: CodexEntry[]
  supabase: any
  onSaved: (entry: CodexEntry) => void
  onCancel: () => void
  theme: CodexTheme
}) {
  const isNew = existingEntry === null
  const [title, setTitle] = useState(existingEntry?.title ?? "")
  const [shortCode, setShortCode] = useState(existingEntry?.display_label ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return }
    setSaving(true)
    setError(null)

    if (isNew) {
      const siblings = allEntries.filter(e => e.parent_id === parentId && e.node_type === "node")
      const sort_order = siblings.length

      const { data, error: e } = await supabase
        .from("codex_entries")
        .insert({
          codex_id: codexId,
          parent_id: parentId,
          node_type: "node",
          title: title.trim(),
          display_label: shortCode.trim() || null,
          sort_order,
        })
        .select()
        .single()

      if (e) { setError(e.message); setSaving(false); return }
      onSaved(data)
    } else {
      const { data, error: e } = await supabase
        .from("codex_entries")
        .update({
          title: title.trim(),
          display_label: shortCode.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingEntry.id)
        .select()
        .single()

      if (e) { setError(e.message); setSaving(false); return }
      onSaved(data)
    }
    setSaving(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: theme.bg, fontFamily: CODEXF }}>
      <div style={{ flexShrink: 0, background: theme.surface, borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", padding: "0 16px", height: 48, gap: 12 }}>
        <button onClick={onCancel}
          style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: CODEXF }}
          onMouseEnter={e => e.currentTarget.style.color = theme.text}
          onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
          ← Back
        </button>
        <div style={{ flex: 1 }} />
        {error && <div style={{ fontSize: 12, color: theme.red, fontFamily: CODEXF }}>{error}</div>}
        <button onClick={handleSave} disabled={saving || !title.trim()}
          style={{ padding: "6px 18px", borderRadius: 6, border: "none", background: title.trim() ? theme.accent : theme.border, color: title.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: saving || !title.trim() ? "default" : "pointer", fontFamily: CODEXF, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : isNew ? "Create" : "Save"}
        </button>
      </div>

      <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, fontFamily: CODEXM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Title</div>
            <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="e.g. Chapter 1, Genesis, Volume II…" autoFocus
              style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "8px 0", fontSize: 22, fontWeight: 700, color: theme.text, fontFamily: CODEXF, boxSizing: "border-box" }} />
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, fontFamily: CODEXM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Short Code <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></div>
            <div style={{ fontSize: 12, color: theme.muted, fontFamily: CODEXF, marginBottom: 10, lineHeight: 1.6 }}>
              Used in citations. E.g. <span style={{ fontFamily: CODEXM, color: theme.accent }}>LM</span> for Loric Manifesto, <span style={{ fontFamily: CODEXM, color: theme.accent }}>WSM</span> for Way of Self-Mastery.
            </div>
            <input value={shortCode} onChange={e => setShortCode(e.target.value)} placeholder="LM, WSM, Gen, III…"
              style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "8px 0", fontSize: 18, fontWeight: 700, color: theme.accent, fontFamily: CODEXM, letterSpacing: "0.06em", boxSizing: "border-box" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tree item ────────────────────────────────────────────────────────────────

function TreeItem({ entry, entries, depth, selectedId, editingNewParentId, onSelect, onAddChild, onEdit, onDelete, theme }: {
  entry: CodexEntry
  entries: CodexEntry[]
  depth: number
  selectedId: string | null
  editingNewParentId: string | null | undefined
  onSelect: (e: CodexEntry) => void
  onAddChild: (parentId: string) => void
  onEdit: (e: CodexEntry) => void
  onDelete: (e: CodexEntry) => void
  theme: CodexTheme
}) {
  const [expanded, setExpanded] = useState(true)
  const [hovered, setHovered] = useState(false)
  const children = getChildren(entries, entry.id)
  const hasChildren = children.length > 0
  const isSelected = selectedId === entry.id
  const isEditingNewChild = editingNewParentId === entry.id

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 8 + depth * 16, paddingRight: 8, height: 42, cursor: "pointer", background: isSelected ? theme.accentDim : hovered ? theme.borderLight : "transparent", borderLeft: `2px solid ${isSelected ? theme.accent : "transparent"}`, transition: "background 0.1s" }}
      >
        <button type="button" onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
          style={{ width: 20, height: 20, flexShrink: 0, background: "none", border: "none", cursor: hasChildren || isEditingNewChild ? "pointer" : "default", color: hasChildren || isEditingNewChild ? theme.muted : "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
          {(hasChildren || isEditingNewChild) && (
            <svg viewBox="0 0 640 640" width={11} height={11} fill="currentColor" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
              <path d="M224 64L448 320L224 576L160 512L320 320L160 128Z" />
            </svg>
          )}
        </button>

        <span onClick={() => onSelect(entry)}
          style={{ flex: 1, fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? theme.accent : theme.text, fontFamily: CODEXF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", userSelect: "none" }}>
          {entry.title ?? <span style={{ color: theme.muted, fontStyle: "italic" }}>Untitled</span>}
        </span>

        {entry.display_label && (
          <span style={{ fontSize: 10, fontFamily: CODEXM, color: theme.accent, background: theme.accentDim, padding: "1px 5px", borderRadius: 3, flexShrink: 0, opacity: 0.8 }}>{entry.display_label}</span>
        )}

        {hovered && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button type="button" onClick={e => { e.stopPropagation(); onAddChild(entry.id) }} title="Add child"
              style={{ width: 26, height: 26, background: "none", border: "none", cursor: "pointer", color: theme.muted, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = theme.accent}
              onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
              <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor"><path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/></svg>
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); onEdit(entry) }} title="Rename"
              style={{ width: 26, height: 26, background: "none", border: "none", cursor: "pointer", color: theme.muted, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = theme.text}
              onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button type="button" onClick={e => { e.stopPropagation(); onDelete(entry) }} title="Delete"
              style={{ width: 26, height: 26, background: "none", border: "none", cursor: "pointer", color: theme.muted, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = theme.red}
              onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
              <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor"><path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/></svg>
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <>
          {children.map(child => (
            <TreeItem key={child.id} entry={child} entries={entries} depth={depth + 1} selectedId={selectedId} editingNewParentId={editingNewParentId} onSelect={onSelect} onAddChild={onAddChild} onEdit={onEdit} onDelete={onDelete} theme={theme} />
          ))}
        </>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type RightPane =
  | { kind: "empty" }
  | { kind: "new"; parentId: string | null }
  | { kind: "edit-meta"; entry: CodexEntry }
  | { kind: "editor"; entry: CodexEntry }

export function CodexPanel({ userId, siteId, supabase }: { userId: string; siteId: string; supabase: any }) {
  const [codices, setCodices] = useState<Codex[]>([])
  const [activeCodexId, setActiveCodexId] = useState<string | null>(null)
  const [entries, setEntries] = useState<CodexEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [rightPane, setRightPane] = useState<RightPane>({ kind: "empty" })
  const [darkMode, setDarkMode] = useState(true)
  const [newCodexOpen, setNewCodexOpen] = useState(false)
  const [newCodexName, setNewCodexName] = useState("")
  const [newCodexCode, setNewCodexCode] = useState("")
  const [newCodexDesc, setNewCodexDesc] = useState("")
  const [newCodexSaving, setNewCodexSaving] = useState(false)
  const [newCodexError, setNewCodexError] = useState<string | null>(null)
  const [newCodexSiteId, setNewCodexSiteId] = useState(siteId)
  const [sites, setSites] = useState<{ id: string; name: string; subdomain: string }[]>([])

  useEffect(() => {
    supabase.from("sites").select("id, name, subdomain").eq("owner_id", userId).then(({ data }: any) => setSites(data ?? []))
  }, [userId])

  const theme = darkMode ? CODEX_DARK : CODEX_LIGHT
  const activeCodex = codices.find(c => c.id === activeCodexId) ?? null
  const nodeEntries = entries.filter(e => e.node_type === "node")
  const rootEntries = getChildren(nodeEntries, null)

  const selectedId = rightPane.kind === "editor" ? rightPane.entry.id
    : rightPane.kind === "edit-meta" ? rightPane.entry.id
    : null

  const editingNewParentId = rightPane.kind === "new" ? rightPane.parentId : undefined

  useEffect(() => { loadCodices() }, [userId])
  useEffect(() => { if (activeCodexId) loadEntries(activeCodexId) }, [activeCodexId])

  async function loadCodices() {
    setLoading(true)
    const { data } = await supabase.from("codices").select("*").eq("owner_id", userId).order("created_at", { ascending: false })
    const list = data ?? []
    setCodices(list)
    if (list.length > 0) setActiveCodexId(list[0].id)
    setLoading(false)
  }

  async function loadEntries(codexId: string) {
    const { data } = await supabase.from("codex_entries").select("*").eq("codex_id", codexId).order("sort_order", { ascending: true })
    setEntries(data ?? [])
  }

  async function handleCreateCodex() {
    if (!newCodexName.trim() || !newCodexCode.trim()) { setNewCodexError("Name and short code required."); return }
    setNewCodexSaving(true)
    setNewCodexError(null)
    const { data, error } = await supabase.from("codices").insert({
      owner_id: userId,
      site_id: siteId,
      name: newCodexName.trim(),
      slug: slugify(newCodexName),
      short_code: newCodexCode.trim().toUpperCase(),
      description: newCodexDesc.trim() || null,
    }).select().single()
    if (error) { setNewCodexError(error.message); setNewCodexSaving(false); return }
    setCodices(prev => [data, ...prev])
    setActiveCodexId(data.id)
    setNewCodexOpen(false)
    setNewCodexName(""); setNewCodexCode(""); setNewCodexDesc("")
    setNewCodexSaving(false)
  }

  async function handleDelete(entry: CodexEntry) {
    if (!confirm(`Delete "${entry.title ?? "this entry"}" and everything inside it?`)) return
    await supabase.from("codex_entries").delete().eq("id", entry.id)
    setEntries(prev => {
      const toRemove = new Set<string>()
      const collect = (id: string) => { toRemove.add(id); prev.filter(e => e.parent_id === id).forEach(e => collect(e.id)) }
      collect(entry.id)
      return prev.filter(e => !toRemove.has(e.id))
    })
    if (selectedId === entry.id) setRightPane({ kind: "empty" })
  }

  function handleNodeSaved(saved: CodexEntry) {
    setEntries(prev => {
      const exists = prev.find(e => e.id === saved.id)
      return exists ? prev.map(e => e.id === saved.id ? saved : e) : [...prev, saved]
    })
    setRightPane({ kind: "editor", entry: saved })
  }

  function handleAnchorCreated(anchor: CodexEntry) {
    setEntries(prev => [...prev, anchor])
  }

  function handleEditorSaved(saved: CodexEntry) {
    setEntries(prev => prev.map(e => e.id === saved.id ? saved : e))
    setRightPane({ kind: "editor", entry: saved })
  }

  function handleSelect(entry: CodexEntry) {
    setRightPane({ kind: "editor", entry })
  }

  function getParentEntry(entry: CodexEntry): CodexEntry | null {
    return entries.find(e => e.id === entry.parent_id) ?? null
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: theme.bg, fontFamily: CODEXF }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Geist+Mono:wght@400;500&display=swap');
        @keyframes codex-spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* Top bar */}
      <div style={{ flexShrink: 0, background: theme.bg, borderBottom: `1px solid ${theme.borderLight}`, display: "flex", alignItems: "center", padding: "0 16px", height: 52, gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: theme.accent, fontFamily: CODEXF, letterSpacing: "-0.03em", flexShrink: 0 }}>Codex</div>
        <div style={{ display: "flex", gap: 4, flex: 1, overflow: "hidden" }}>
          {codices.map(c => {
            const active = c.id === activeCodexId
            return (
              <button key={c.id} onClick={() => { setActiveCodexId(c.id); setRightPane({ kind: "empty" }) }}
                style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${active ? theme.accent + "66" : "transparent"}`, background: active ? theme.accentDim : "transparent", color: active ? theme.accent : theme.muted, fontSize: 13, fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: CODEXF, whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = theme.text; e.currentTarget.style.background = theme.borderLight } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = "transparent" } }}>
                <span style={{ fontSize: 10, fontFamily: CODEXM, opacity: 0.6 }}>{c.short_code}</span>
                {c.name}
              </button>
            )
          })}
        </div>
        <button onClick={() => setNewCodexOpen(true)}
          style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: CODEXF, flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = theme.text; e.currentTarget.style.background = theme.borderLight }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = "transparent" }}>
          + New Codex
        </button>
        <button onClick={() => setDarkMode(d => !d)}
          style={{ width: 28, height: 28, borderRadius: 4, border: "none", background: "transparent", color: theme.muted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = theme.text}
          onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
          {darkMode ? "☀" : "☾"}
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <div style={{ width: 24, height: 24, border: `3px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "codex-spin 0.7s linear infinite" }} />
        </div>
      ) : !activeCodex ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12 }}>
          <div style={{ fontSize: 36, opacity: 0.1 }}>📜</div>
          <div style={{ fontSize: 14, color: theme.muted, fontFamily: CODEXF }}>No codices yet.</div>
          <button onClick={() => setNewCodexOpen(true)} style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: theme.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: CODEXF }}>
            Create your first codex
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left — tree */}
          <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${theme.borderLight}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 8px 10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: `1px solid ${theme.borderLight}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.muted, fontFamily: CODEXM, letterSpacing: "0.08em", textTransform: "uppercase" }}>{activeCodex.short_code}</span>
              <button onClick={() => setRightPane({ kind: "new", parentId: null })} title="Add root entry"
                style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: theme.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={e => { e.currentTarget.style.color = theme.accent; e.currentTarget.style.background = theme.borderLight }}
                onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.background = "transparent" }}>
                <svg viewBox="0 0 640 640" width={14} height={14} fill="currentColor"><path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16, paddingTop: 4 }}>
              {rootEntries.length === 0 ? (
                <div style={{ padding: "24px 16px", fontSize: 14, color: theme.muted, fontFamily: CODEXF, textAlign: "center", lineHeight: 1.7 }}>
                  Nothing here yet.<br />Hit + to add your first entry.
                </div>
              ) : rootEntries.map(entry => (
                <TreeItem
                  key={entry.id}
                  entry={entry}
                  entries={nodeEntries}
                  depth={0}
                  selectedId={selectedId}
                  editingNewParentId={editingNewParentId}
                  onSelect={handleSelect}
                  onAddChild={parentId => setRightPane({ kind: "new", parentId })}
                  onEdit={entry => setRightPane({ kind: "edit-meta", entry })}
                  onDelete={handleDelete}
                  theme={theme}
                />
              ))}
            </div>
          </div>

          {/* Right — context pane */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {rightPane.kind === "empty" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
                <div style={{ fontSize: 32, opacity: 0.07 }}>📖</div>
                <div style={{ fontSize: 13, color: theme.muted, fontFamily: CODEXF }}>Select an entry or hit + to create one.</div>
              </div>
            )}

            {(rightPane.kind === "new" || rightPane.kind === "edit-meta") && activeCodex && (
              <NodeForm
                key={rightPane.kind === "new" ? `new-${rightPane.parentId}` : rightPane.entry.id}
                parentId={rightPane.kind === "new" ? rightPane.parentId : rightPane.entry.parent_id}
                existingEntry={rightPane.kind === "edit-meta" ? rightPane.entry : null}
                codexId={activeCodex.id}
                allEntries={entries}
                supabase={supabase}
                onSaved={handleNodeSaved}
                onCancel={() => setRightPane({ kind: "empty" })}
                theme={theme}
              />
            )}

            {rightPane.kind === "editor" && activeCodex && (
              <CodexEditor
                key={rightPane.entry.id}
                entry={rightPane.entry}
                parentEntry={getParentEntry(rightPane.entry)}
                codex={activeCodex}
                supabase={supabase}
                onSaved={handleEditorSaved}
                onAnchorCreated={handleAnchorCreated}
                theme={theme}
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      )}

      {/* New Codex Modal */}
      {newCodexOpen && (
        <>
          <div onClick={() => setNewCodexOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 201, width: 420, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: CODEXM, marginBottom: 20 }}>New Codex</div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: CODEXM, fontWeight: 500, marginBottom: 6 }}>Site</div>
              <select value={newCodexSiteId} onChange={e => setNewCodexSiteId(e.target.value)}
                style={{ width: "100%", background: theme.surface, border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "6px 0", fontSize: 14, fontWeight: 600, color: theme.text, fontFamily: CODEXF, boxSizing: "border-box", cursor: "pointer" }}>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subdomain})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: CODEXM, fontWeight: 500, marginBottom: 6 }}>Name</div>
              <input value={newCodexName} onChange={e => setNewCodexName(e.target.value)} placeholder="My Philosophy Codex…" autoFocus
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "6px 0", fontSize: 17, fontWeight: 600, color: theme.text, fontFamily: CODEXF, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: CODEXM, fontWeight: 500, marginBottom: 6 }}>Short Code <span style={{ opacity: 0.5 }}>(for citations — REP, BIB, LOR)</span></div>
              <input value={newCodexCode} onChange={e => setNewCodexCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} placeholder="LOR"
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "6px 0", fontSize: 17, fontWeight: 700, color: theme.accent, fontFamily: CODEXM, letterSpacing: "0.1em", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: CODEXM, fontWeight: 500, marginBottom: 6 }}>Description <span style={{ opacity: 0.5 }}>(optional)</span></div>
              <input value={newCodexDesc} onChange={e => setNewCodexDesc(e.target.value)} placeholder="What is this codex about?"
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, outline: "none", padding: "6px 0", fontSize: 13, color: theme.text, fontFamily: CODEXF, boxSizing: "border-box" }} />
            </div>
            {newCodexError && <div style={{ marginBottom: 14, padding: "9px 12px", background: theme.redDim, border: `1px solid ${theme.red}40`, borderRadius: 6, fontSize: 12, color: theme.red, fontFamily: CODEXF }}>{newCodexError}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setNewCodexOpen(false)} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: CODEXF }}>Cancel</button>
              <button onClick={handleCreateCodex} disabled={newCodexSaving || !newCodexName.trim() || !newCodexCode.trim()}
                style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: newCodexName.trim() && newCodexCode.trim() ? theme.accent : theme.border, color: newCodexName.trim() && newCodexCode.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: newCodexName.trim() && newCodexCode.trim() ? "pointer" : "default", fontFamily: CODEXF }}>
                {newCodexSaving ? "Creating…" : "Create Codex"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
