import React, { useRef, useState, useEffect } from "react"
import type { SpurSerial } from "./spurTypes"
import type { SpurPost } from "./spurTypes"
import type { SpurTheme } from "./spurTheme"
import { SPURF, SPURM } from "./spurTheme"
import type { SpurCollection } from "./SpurCollectionsPanel"

const UNIT_LABELS = ["Chapter", "Part", "Episode", "Issue", "Volume", "Entry", "Installment"]
const STATUS_OPTIONS = ["ongoing", "completed", "hiatus", "cancelled"]

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
}

// ── Types ─────────────────────────────────────────────────────────────────────

type EditState = {
  title: string
  tagline: string
  description: string
  unit_label: string
  status: string
  cover_image_url: string | null
  coverUploading: boolean
  coverUploadError: string | null
  collection_id: string | null
  collection_sort_order: number | null
}

function makeEditState(s?: SpurSerial): EditState {
  return {
    title: s?.title ?? "",
    tagline: s?.tagline ?? "",
    description: s?.description ?? "",
    unit_label: s?.unit_label ?? "Chapter",
    status: s?.status ?? "ongoing",
    cover_image_url: s?.cover_image_url ?? null,
    coverUploading: false,
    coverUploadError: null,
    collection_id: (s as any)?.collection_id ?? null,
    collection_sort_order: (s as any)?.collection_sort_order ?? null,
  }
}

// ── Module-level sub-components (no remount on parent re-render) ──────────────

function StatusBadge({ status, theme }: { status: string; theme: SpurTheme }) {
  const cfg: Record<string, { color: string; bg: string; border: string }> = {
    ongoing:   { color: theme.green,  bg: theme.greenDim,  border: theme.green + "44" },
    completed: { color: theme.accent, bg: theme.accentDim, border: theme.accent + "44" },
    hiatus:    { color: theme.yellow, bg: theme.yellowDim, border: theme.yellow + "44" },
    cancelled: { color: theme.red,    bg: theme.redDim,    border: theme.red + "44" },
  }
  const c = cfg[status] ?? cfg.ongoing
  return (
    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: SPURF, color: c.color, background: c.bg, border: `1px solid ${c.border}`, padding: "3px 8px", borderRadius: 5 }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function Field({ label, theme, children }: { label: string; theme: SpurTheme; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.dim, fontFamily: SPURM, fontWeight: 500, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  )
}

function InlineSelect({ value, onChange, options, theme }: {
  value: string
  onChange: (v: string) => void
  options: string[]
  theme: SpurTheme
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${open ? theme.accent : theme.border}`, outline: "none", padding: "6px 0", fontSize: 14, color: theme.text, fontFamily: SPURF, cursor: "pointer", transition: "border-color 0.12s" }}>
        <span style={{ flex: 1, textAlign: "left" }}>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
        <svg viewBox="0 0 640 640" width={10} height={10} fill={theme.dim} style={{ flexShrink: 0 }}>
          <path d="M199 305C189.6 295.6 189.6 280.4 199 271.1C208.4 261.8 223.6 261.7 232.9 271.1L319.9 358.1L406.9 271.1C416.3 261.7 431.5 261.7 440.8 271.1C450.1 280.5 450.2 295.7 440.8 305L337 409C327.6 418.4 312.4 418.4 303.1 409L199 305z"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.45)", minWidth: "100%", scrollbarWidth: "none" }}>
            {options.map(o => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }}
                style={{ display: "flex", alignItems: "center", width: "100%", padding: "9px 14px", background: o === value ? theme.accentDim : "none", border: "none", color: o === value ? theme.accent : theme.text, fontSize: 13, fontFamily: SPURF, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => { if (o !== value) e.currentTarget.style.background = theme.borderLight }}
                onMouseLeave={e => { if (o !== value) e.currentTarget.style.background = "none" }}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CoverUploadRow({ state, setState, inputRef, theme }: {
  state: EditState
  setState: React.Dispatch<React.SetStateAction<EditState>>
  inputRef: React.RefObject<HTMLInputElement | null>
  theme: SpurTheme
}) {
  return (
    <Field label="Cover Image" theme={theme}>
      {state.cover_image_url ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
          <img src={state.cover_image_url} alt="Cover"
            style={{ width: 80, height: "auto", borderRadius: 6, border: `1px solid ${theme.border}`, flexShrink: 0, display: "block" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={state.coverUploading}
              style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 12, fontFamily: SPURF, cursor: "pointer" }}>
              {state.coverUploading ? "Uploading…" : "Replace"}
            </button>
            <button type="button" onClick={() => setState(p => ({ ...p, cover_image_url: null }))}
              style={{ padding: "5px 12px", borderRadius: 5, border: `1px solid ${theme.red}44`, background: theme.redDim, color: theme.red, fontSize: 12, fontFamily: SPURF, cursor: "pointer" }}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div style={{ paddingTop: 4 }}>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={state.coverUploading}
            style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${theme.border}`, background: "transparent", color: state.coverUploading ? theme.dim : theme.muted, fontSize: 13, fontFamily: SPURF, cursor: state.coverUploading ? "default" : "pointer" }}>
            {state.coverUploading ? "Uploading…" : "Upload Cover"}
          </button>
        </div>
      )}
      {state.coverUploadError && (
        <div style={{ marginTop: 6, fontSize: 12, color: theme.red, fontFamily: SPURF }}>{state.coverUploadError}</div>
      )}
    </Field>
  )
}

function AutoGrowTextarea({ value, onChange, placeholder, inputStyle }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  inputStyle: React.CSSProperties
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const t = ref.current
    if (!t) return
    t.style.height = "0px"
    t.style.height = t.scrollHeight + "px"
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inputStyle, resize: "none", lineHeight: 1.6, overflow: "hidden", minHeight: 48 }}
    />
  )
}

function FormFields({ state, setState, inputRef, theme, collections }: {
  state: EditState
  setState: React.Dispatch<React.SetStateAction<EditState>>
  inputRef: React.RefObject<HTMLInputElement | null>
  theme: SpurTheme
  collections: SpurCollection[]
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: `1px solid ${theme.border}`, outline: "none",
    padding: "6px 0", fontSize: 14, color: theme.text, fontFamily: SPURF,
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Field label="Title" theme={theme}>
        <input value={state.title} onChange={e => setState(p => ({ ...p, title: e.target.value }))}
          placeholder="Serial title…"
          style={{ ...inputStyle, fontSize: 18, fontWeight: 600 }} />
      </Field>

      <Field label="Tagline" theme={theme}>
        <input value={state.tagline} onChange={e => setState(p => ({ ...p, tagline: e.target.value }))}
          placeholder="A short hook or subtitle…"
          style={inputStyle} />
      </Field>

      <Field label="Description" theme={theme}>
        <AutoGrowTextarea
          value={state.description}
          onChange={v => setState(p => ({ ...p, description: v }))}
          placeholder="What's this serial about?"
          inputStyle={inputStyle}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Field label="Unit Label" theme={theme}>
          <InlineSelect value={state.unit_label} onChange={v => setState(p => ({ ...p, unit_label: v }))} options={UNIT_LABELS} theme={theme} />
        </Field>
        <Field label="Status" theme={theme}>
          <InlineSelect value={state.status} onChange={v => setState(p => ({ ...p, status: v }))} options={STATUS_OPTIONS} theme={theme} />
        </Field>
      </div>

      {collections.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "end" }}>
          <Field label="Collection (optional)" theme={theme}>
            <InlineSelect
              value={state.collection_id ? (collections.find(c => c.id === state.collection_id)?.title ?? "None") : "None"}
              onChange={v => {
                const found = collections.find(c => c.title === v)
                setState(p => ({ ...p, collection_id: found?.id ?? null, collection_sort_order: found ? p.collection_sort_order : null }))
              }}
              options={["None", ...collections.map(c => c.title)]}
              theme={theme}
            />
          </Field>
          {state.collection_id && (
            <Field label="Book #" theme={theme}>
              <input
                type="number"
                min={1}
                value={state.collection_sort_order ?? ""}
                onChange={e => setState(p => ({ ...p, collection_sort_order: e.target.value ? parseInt(e.target.value, 10) : null }))}
                placeholder="1"
                style={{ ...inputStyle, width: 64, textAlign: "center" }}
              />
            </Field>
          )}
        </div>
      )}

      <CoverUploadRow state={state} setState={setState} inputRef={inputRef} theme={theme} />
    </div>
  )
}

function FormActions({ onCancel, onSubmit, submitting, canSubmit, submitLabel, submittingLabel, theme }: {
  onCancel: () => void
  onSubmit: () => void
  submitting: boolean
  canSubmit: boolean
  submitLabel: string
  submittingLabel: string
  theme: SpurTheme
}) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
      <button type="button" onClick={onCancel}
        style={{ padding: "9px 18px", borderRadius: 7, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF }}>
        Cancel
      </button>
      <button type="button" onClick={onSubmit} disabled={submitting || !canSubmit}
        style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: canSubmit ? theme.accent : theme.border, color: canSubmit ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: canSubmit ? "pointer" : "default", fontFamily: SPURF, transition: "background 0.12s" }}>
        {submitting ? submittingLabel : submitLabel}
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SpurSerialsPanel({
  siteId,
  userId,
  supabase,
  theme,
  serials,
  loading,
  onChanged,
  collections,
  onOpenPost,
}: {
  siteId: string
  userId: string
  supabase: any
  theme: SpurTheme
  serials: SpurSerial[]
  loading: boolean
  onChanged: () => Promise<void> | void
  collections: SpurCollection[]
  onOpenPost?: (post: SpurPost) => void
}) {
  // Create / edit form state
  const [mode, setMode] = useState<"grid" | "create" | "edit">("grid")
  const [editingSerial, setEditingSerial] = useState<SpurSerial | null>(null)
  const [formState, setFormState] = useState<EditState>(makeEditState())
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const formCoverRef = useRef<HTMLInputElement>(null)

  // Selected serial + chapters
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chaptersBySerial, setChaptersBySerial] = useState<Record<string, SpurPost[]>>({})
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadChapters(serialId: string) {
    if (chaptersBySerial[serialId]) return
    setChaptersLoading(true)
    const { data } = await supabase
      .from("spur_posts")
      .select("id, title, content, serial_index, serial_id, is_serial, slug, status, site_id, author_id, excerpt, thumbnail_url, tags, content_meta, published_at, created_at, updated_at")
      .eq("serial_id", serialId)
      .order("serial_index", { ascending: true })
    setChaptersBySerial(prev => ({ ...prev, [serialId]: data ?? [] }))
    setChaptersLoading(false)
  }

  function selectSerial(s: SpurSerial) {
    setSelectedId(s.id)
    setMode("grid")
    loadChapters(s.id)
  }

  function openCreate() {
    setMode("create")
    setFormState(makeEditState())
    setFormError(null)
  }

  function openEdit(s: SpurSerial) {
    setEditingSerial(s)
    setMode("edit")
    setFormState(makeEditState(s))
    setFormError(null)
  }

  async function uploadCover(file: File) {
    setFormState(p => ({ ...p, coverUploading: true, coverUploadError: null }))
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
      const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg"
      const path = `serial-covers/${siteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`
      const { error: upErr } = await supabase.storage
        .from("spur-media")
        .upload(path, file, { upsert: false, contentType: `image/${safeExt === "jpg" ? "jpeg" : safeExt}` })
      if (upErr) throw new Error(upErr.message)
      const { data: { publicUrl } } = supabase.storage.from("spur-media").getPublicUrl(path)
      setFormState(p => ({ ...p, cover_image_url: publicUrl, coverUploading: false }))
    } catch (err: any) {
      setFormState(p => ({ ...p, coverUploading: false, coverUploadError: err.message ?? "Upload failed." }))
    }
  }

  async function handleCreate() {
    if (!formState.title.trim()) { setFormError("Title is required."); return }
    if (formState.collection_id && !formState.collection_sort_order) { setFormError("Book # is required when assigning to a collection."); return }
    setFormSaving(true); setFormError(null)
    try {
      const { data, error } = await supabase.from("spur_serials").insert({
        site_id: siteId, author_id: userId,
        title: formState.title.trim(), slug: slugify(formState.title.trim()),
        tagline: formState.tagline.trim() || null, description: formState.description.trim() || null,
        unit_label: formState.unit_label, status: formState.status,
        cover_image_url: formState.cover_image_url,
        collection_id: formState.collection_id ?? null, collection_sort_order: formState.collection_sort_order ?? null,
      }).select().single()
      if (error) throw new Error(error.message)
      await onChanged()
      setMode("grid")
      if (data) { setSelectedId(data.id); loadChapters(data.id) }
    } catch (err: any) {
      setFormError(err.message ?? "Failed to create serial.")
    } finally {
      setFormSaving(false)
    }
  }

  async function handleSaveEdit() {
    if (!formState.title.trim()) { setFormError("Title is required."); return }
    if (formState.collection_id && !formState.collection_sort_order) { setFormError("Book # is required when assigning to a collection."); return }
    if (!editingSerial) return
    setFormSaving(true); setFormError(null)
    try {
      const { error } = await supabase.from("spur_serials").update({
        title: formState.title.trim(), slug: slugify(formState.title.trim()),
        tagline: formState.tagline.trim() || null, description: formState.description.trim() || null,
        unit_label: formState.unit_label, status: formState.status,
        cover_image_url: formState.cover_image_url,
        collection_id: formState.collection_id ?? null, collection_sort_order: formState.collection_sort_order ?? null,
        updated_at: new Date().toISOString(),
      }).eq("id", editingSerial.id)
      if (error) throw new Error(error.message)
      await onChanged()
      setMode("grid")
    } catch (err: any) {
      setFormError(err.message ?? "Save failed.")
    } finally {
      setFormSaving(false)
    }
  }

  async function handleDelete(s: SpurSerial) {
    if (!confirm(`Delete "${s.title}"? Posts attached to this serial will be unlinked.`)) return
    setDeletingId(s.id)
    await supabase.from("spur_serials").delete().eq("id", s.id)
    if (selectedId === s.id) setSelectedId(null)
    setDeletingId(null)
    await onChanged()
  }

  const selectedSerial = serials.find(s => s.id === selectedId) ?? null
  const activeSerial = selectedSerial ?? (mode === "edit" && editingSerial ? (serials.find(s => s.id === editingSerial.id) ?? editingSerial) : null)
  const activeChapters = activeSerial ? (chaptersBySerial[activeSerial.id] ?? []) : []
  const activeTotalWords = activeChapters.reduce((acc, p) => acc + (p.content ?? "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length, 0)

  // Left column content: grid or form
  const leftContent = (mode === "create" || mode === "edit") ? (
    <div style={{ width: "100%", background: theme.surface, border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM, marginBottom: 20 }}>
        {mode === "create" ? "New Serial" : "Edit Serial"}
      </div>
      <input ref={formCoverRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = "" }} />
      <FormFields state={formState} setState={setFormState} inputRef={formCoverRef} theme={theme} collections={collections} />
      {formError && (
        <div style={{ marginTop: 16, padding: "10px 14px", background: theme.redDim, border: `1px solid ${theme.red}40`, borderRadius: 7, fontSize: 13, color: theme.red, fontFamily: SPURF }}>
          {formError}
        </div>
      )}
      <FormActions
        onCancel={() => { setMode("grid"); setFormError(null) }}
        onSubmit={mode === "create" ? handleCreate : handleSaveEdit}
        submitting={formSaving}
        canSubmit={!!formState.title.trim() && (!formState.collection_id || !!formState.collection_sort_order)}
        submitLabel={mode === "create" ? "Create Serial" : "Save"}
        submittingLabel={mode === "create" ? "Creating…" : "Saving…"}
        theme={theme}
      />
    </div>
  ) : loading ? (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.dim, fontFamily: SPURF, fontSize: 15 }}>
      <div style={{ width: 18, height: 18, border: `2px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "spur-spin 0.7s linear infinite" }} />
      Loading…
    </div>
  ) : serials.length === 0 ? (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
      <div style={{ fontSize: 36, opacity: 0.1 }}>📖</div>
      <div style={{ fontSize: 15, color: theme.muted, fontFamily: SPURF }}>No serials yet.</div>
    </div>
  ) : (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 180px)", gap: 16, width: 964 }}>
      {serials.map(s => {
        const isSelected = selectedId === s.id
        return (
          <div key={s.id} onClick={() => selectSerial(s)}
            style={{ borderRadius: 10, overflow: "hidden", background: theme.surface, border: `2px solid ${isSelected ? theme.accent : theme.border}`, cursor: "pointer", transition: "border-color 0.12s, box-shadow 0.12s", boxShadow: isSelected ? `0 0 0 3px ${theme.accent}33` : "none" }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = theme.muted }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = theme.border }}>
            {/* Cover */}
            <div style={{ height: 160, background: theme.borderLight, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              {s.cover_image_url
                ? <img src={s.cover_image_url} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke={theme.dim} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
              }
              {/* Action buttons overlay */}
              <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4 }}
                onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => openEdit(s)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "rgba(0,0,0,0.55)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.8)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.55)"}
                  title="Edit">
                  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button type="button" onClick={() => handleDelete(s)} disabled={deletingId === s.id}
                  style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "rgba(0,0,0,0.55)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", transition: "background 0.1s", opacity: deletingId === s.id ? 0.4 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(180,30,30,0.8)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.55)"}
                  title="Delete">
                  <svg viewBox="0 0 640 640" width={13} height={13} fill="#fff">
                    <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/>
                  </svg>
                </button>
              </div>
            </div>
            {/* Info */}
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, fontFamily: SPURF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>{s.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <StatusBadge status={s.status} theme={theme} />
                <span style={{ fontSize: 11, color: theme.dim, fontFamily: SPURM }}>{s.unit_label}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spur-spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM, flexShrink: 0 }}>
          Serials {serials.length > 0 && `(${serials.length})`}
        </div>
        {activeSerial && (
          <>
            <div style={{ width: 1, height: 16, background: theme.border, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: SPURF, marginRight: 12 }}>{activeSerial.title}</span>
              <span style={{ fontSize: 12, color: theme.dim, fontFamily: SPURM }}>
                {chaptersLoading ? "Loading…" : `${activeChapters.length} ${activeSerial.unit_label?.toLowerCase()}${activeChapters.length !== 1 ? "s" : ""} · ${activeTotalWords.toLocaleString()} words`}
              </span>
            </div>
          </>
        )}
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          {mode === "grid" && (
            <button type="button" onClick={openCreate}
              style={{ padding: "9px 16px", borderRadius: 7, border: "none", background: theme.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SPURF, display: "flex", alignItems: "center", gap: 6, transition: "background 0.12s" }}
              onMouseEnter={e => e.currentTarget.style.background = theme.accentHov}
              onMouseLeave={e => e.currentTarget.style.background = theme.accent}>
              <svg viewBox="0 0 640 640" width={9} height={9} fill="currentColor">
                <path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/>
              </svg>
              New Serial
            </button>
          )}
        </div>
      </div>

      {/* Two column layout */}
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        {/* Left: grid or form */}
        <div style={{ flexShrink: 0, width: 964 }}>
          {leftContent}
        </div>

        {/* Right: chapter list */}
        {activeSerial && (
          <div style={{ flex: 1, minWidth: 0, maxWidth: 320 }}>
            {chaptersLoading ? (
              <div style={{ fontSize: 13, color: theme.dim, fontFamily: SPURF }}>Loading…</div>
            ) : activeChapters.length === 0 ? (
              <div style={{ fontSize: 13, color: theme.dim, fontFamily: SPURF }}>No chapters yet.</div>
            ) : (
              activeChapters.map((p, i) => {
                const wc = (p.content ?? "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length
                return (
                  <div key={p.id} onClick={() => onOpenPost?.(p)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderBottom: `1px solid ${theme.borderLight}`, cursor: "pointer", borderRadius: 6, transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.borderLight}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontSize: 13, color: theme.dim, fontFamily: SPURF, flexShrink: 0, minWidth: 20, textAlign: "right" }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: theme.text, fontFamily: SPURF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.title || "Untitled"}
                      </div>
                      <div style={{ fontSize: 12, color: theme.muted, fontFamily: SPURF, marginTop: 2 }}>
                        {wc.toLocaleString()} words
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
