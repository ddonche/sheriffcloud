import { useState, useEffect } from "react"
import type { SpurTheme } from "./spurTheme"
import { SPURF, SPURM } from "./spurTheme"

export type SpurCollection = {
  id: string
  site_id: string
  owner_id: string
  title: string
  slug: string
  description: string | null
  created_at: string
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
}

function Field({ label, theme, children }: { label: string; theme: SpurTheme; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

export function SpurCollectionsPanel({
  siteId,
  userId,
  supabase,
  theme,
  onChanged,
}: {
  siteId: string
  userId: string
  supabase: any
  theme: SpurTheme
  onChanged?: () => void
}) {
  const [collections, setCollections] = useState<SpurCollection[]>([])
  const [serialCounts, setSerialCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [creating, setCreating] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createSlug, setCreateSlug] = useState("")
  const [createSlugEdited, setCreateSlugEdited] = useState(false)
  const [createDesc, setCreateDesc] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editSlugEdited, setEditSlugEdited] = useState(false)
  const [editDesc, setEditDesc] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: `1px solid ${theme.border}`, outline: "none",
    padding: "6px 0", fontSize: 14, color: theme.text, fontFamily: SPURF,
    boxSizing: "border-box",
  }

  useEffect(() => { load() }, [siteId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("spur_serial_collections")
      .select("*")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })

    const cols = data ?? []
    setCollections(cols)

    if (cols.length > 0) {
      const { data: serials } = await supabase
        .from("spur_serials")
        .select("collection_id")
        .eq("site_id", siteId)
        .not("collection_id", "is", null)

      const counts: Record<string, number> = {}
      for (const s of serials ?? []) {
        if (s.collection_id) counts[s.collection_id] = (counts[s.collection_id] ?? 0) + 1
      }
      setSerialCounts(counts)
    }

    setLoading(false)
  }

  async function handleCreate() {
    const title = createTitle.trim()
    const slug = createSlug.trim() || slugify(title)
    if (!title) { setCreateError("Title is required."); return }
    if (!slug) { setCreateError("Slug is required."); return }
    setSaving(true); setCreateError(null)
    try {
      const { error } = await supabase.from("spur_serial_collections").insert({
        site_id: siteId,
        owner_id: userId,
        title,
        slug,
        description: createDesc.trim() || null,
      })
      if (error) throw new Error(error.message)
      setCreating(false)
      setCreateTitle(""); setCreateSlug(""); setCreateDesc(""); setCreateSlugEdited(false)
      await load()
      onChanged?.()
    } catch (err: any) {
      setCreateError(err.message ?? "Failed to create collection.")
    } finally {
      setSaving(false)
    }
  }

  function startEdit(c: SpurCollection) {
    setEditingId(c.id)
    setEditTitle(c.title)
    setEditSlug(c.slug)
    setEditDesc(c.description ?? "")
    setEditSlugEdited(true)
    setEditError(null)
  }

  async function handleSaveEdit(id: string) {
    const title = editTitle.trim()
    const slug = editSlug.trim()
    if (!title) { setEditError("Title is required."); return }
    if (!slug) { setEditError("Slug is required."); return }
    setEditSaving(true); setEditError(null)
    try {
      const { error } = await supabase.from("spur_serial_collections").update({
        title,
        slug,
        description: editDesc.trim() || null,
      }).eq("id", id)
      if (error) throw new Error(error.message)
      setEditingId(null)
      await load()
      onChanged?.()
    } catch (err: any) {
      setEditError(err.message ?? "Save failed.")
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(c: SpurCollection) {
    const count = serialCounts[c.id] ?? 0
    const msg = count > 0
      ? `Delete "${c.title}"? ${count} serial${count !== 1 ? "s" : ""} will be unlinked from this collection.`
      : `Delete "${c.title}"?`
    if (!confirm(msg)) return
    setDeletingId(c.id)
    await supabase.from("spur_serial_collections").delete().eq("id", c.id)
    setDeletingId(null)
    await load()
    onChanged?.()
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <style>{`@keyframes spur-spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM }}>
          Collections {collections.length > 0 && `(${collections.length})`}
        </div>
        {!creating && (
          <button type="button"
            onClick={() => { setCreating(true); setCreateTitle(""); setCreateSlug(""); setCreateDesc(""); setCreateSlugEdited(false); setCreateError(null) }}
            style={{ padding: "9px 16px", borderRadius: 7, border: "none", background: theme.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SPURF, display: "flex", alignItems: "center", gap: 6, transition: "background 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.background = theme.accentHov}
            onMouseLeave={e => e.currentTarget.style.background = theme.accent}>
            <svg viewBox="0 0 640 640" width={9} height={9} fill="currentColor">
              <path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/>
            </svg>
            New Collection
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM, marginBottom: 20 }}>
            New Collection
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field label="Title" theme={theme}>
              <input
                value={createTitle}
                onChange={e => {
                  setCreateTitle(e.target.value)
                  if (!createSlugEdited) setCreateSlug(slugify(e.target.value))
                }}
                placeholder="Collection title…"
                style={{ ...inputStyle, fontSize: 18, fontWeight: 600 }}
              />
            </Field>
            <Field label="Slug" theme={theme}>
              <input
                value={createSlug}
                onChange={e => { setCreateSlug(e.target.value); setCreateSlugEdited(true) }}
                placeholder="collection-slug"
                style={{ ...inputStyle, fontFamily: SPURM }}
              />
            </Field>
            <Field label="Description (optional)" theme={theme}>
              <input
                value={createDesc}
                onChange={e => setCreateDesc(e.target.value)}
                placeholder="A short description of this series…"
                style={inputStyle}
              />
            </Field>
          </div>
          {createError && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: theme.redDim, border: `1px solid ${theme.red}40`, borderRadius: 7, fontSize: 13, color: theme.red, fontFamily: SPURF }}>
              {createError}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
            <button type="button"
              onClick={() => { setCreating(false); setCreateError(null) }}
              style={{ padding: "9px 18px", borderRadius: 7, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF }}>
              Cancel
            </button>
            <button type="button" onClick={handleCreate} disabled={saving || !createTitle.trim()}
              style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: createTitle.trim() ? theme.accent : theme.border, color: createTitle.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: createTitle.trim() ? "pointer" : "default", fontFamily: SPURF }}>
              {saving ? "Creating…" : "Create Collection"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.dim, fontFamily: SPURF, fontSize: 15 }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "spur-spin 0.7s linear infinite" }} />
          Loading…
        </div>
      ) : collections.length === 0 && !creating ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
          <div style={{ fontSize: 36, opacity: 0.1 }}>📚</div>
          <div style={{ fontSize: 15, color: theme.muted, fontFamily: SPURF }}>No collections yet.</div>
          <div style={{ fontSize: 13, color: theme.dim, fontFamily: SPURF }}>Group your serials into a series — e.g. a shared universe or book series.</div>
        </div>
      ) : (
        <div>
          {collections.map(c => {
            const count = serialCounts[c.id] ?? 0
            if (editingId === c.id) {
              return (
                <div key={c.id} style={{ background: theme.surface, border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: 24, marginBottom: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <Field label="Title" theme={theme}>
                      <input
                        value={editTitle}
                        onChange={e => {
                          setEditTitle(e.target.value)
                          if (!editSlugEdited) setEditSlug(slugify(e.target.value))
                        }}
                        style={{ ...inputStyle, fontSize: 18, fontWeight: 600 }}
                      />
                    </Field>
                    <Field label="Slug" theme={theme}>
                      <input
                        value={editSlug}
                        onChange={e => { setEditSlug(e.target.value); setEditSlugEdited(true) }}
                        style={{ ...inputStyle, fontFamily: SPURM }}
                      />
                    </Field>
                    <Field label="Description (optional)" theme={theme}>
                      <input
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        style={inputStyle}
                      />
                    </Field>
                  </div>
                  {editError && (
                    <div style={{ marginTop: 16, padding: "10px 14px", background: theme.redDim, border: `1px solid ${theme.red}40`, borderRadius: 7, fontSize: 13, color: theme.red, fontFamily: SPURF }}>
                      {editError}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                    <button type="button"
                      onClick={() => { setEditingId(null); setEditError(null) }}
                      style={{ padding: "9px 18px", borderRadius: 7, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF }}>
                      Cancel
                    </button>
                    <button type="button" onClick={() => handleSaveEdit(c.id)} disabled={editSaving || !editTitle.trim()}
                      style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: editTitle.trim() ? theme.accent : theme.border, color: editTitle.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: editTitle.trim() ? "pointer" : "default", fontFamily: SPURF }}>
                      {editSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              )
            }
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: `1px solid ${theme.borderLight}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    onClick={() => startEdit(c)}
                    style={{ fontSize: 15, fontWeight: 600, color: theme.text, fontFamily: SPURF, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: theme.dim, fontFamily: SPURM }}>{c.slug}</span>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: theme.dim, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: theme.dim, fontFamily: SPURM }}>
                      {count} serial{count !== 1 ? "s" : ""}
                    </span>
                    {c.description && (
                      <>
                        <span style={{ width: 3, height: 3, borderRadius: "50%", background: theme.dim, display: "inline-block" }} />
                        <span style={{ fontSize: 11, color: theme.dim, fontFamily: SPURF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button type="button" onClick={() => startEdit(c)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, padding: "4px 6px", transition: "color 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.color = theme.text}
                    onMouseLeave={e => e.currentTarget.style.color = theme.dim}
                    title="Edit">
                    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button type="button" onClick={() => handleDelete(c)} disabled={deletingId === c.id}
                    style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, padding: "4px 6px", transition: "color 0.1s", opacity: deletingId === c.id ? 0.4 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = theme.red}
                    onMouseLeave={e => e.currentTarget.style.color = theme.dim}
                    title="Delete">
                    <svg viewBox="0 0 640 640" width={15} height={15} fill="currentColor">
                      <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
