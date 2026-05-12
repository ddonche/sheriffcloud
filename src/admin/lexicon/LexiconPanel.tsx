import { useState, useEffect, useRef } from "react"
import { getSupabase } from "../../shared/supabase"
import type { SpurTheme } from "../spur/spurTheme"
import { SPURF, SPURM } from "../spur/spurTheme"

// ── Types ─────────────────────────────────────────────────────────────────────

interface LexiconList {
  id: string
  created_by: string
  title: string
  description: string | null
  tags: string[]
  visibility: "public" | "private"
  word_count: number
  created_at: string
  updated_at: string
}

interface LexiconWord {
  id: string
  list_id: string
  word: string
  definition: string | null
  example: string | null
  image_url: string | null
  hex_color: string | null
  sort_order: number
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function colorIsLight(hex: string): boolean {
  const h = hex.replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
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

// ── Word Row ──────────────────────────────────────────────────────────────────

function WordRow({
  word,
  theme,
  inputStyle,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  dragging,
  dragOver,
}: {
  word: LexiconWord
  theme: SpurTheme
  inputStyle: React.CSSProperties
  onUpdate: (id: string, field: keyof LexiconWord, value: string | null) => void
  onDelete: (id: string) => void
  onDragStart: (id: string) => void
  onDragOver: (id: string) => void
  onDrop: () => void
  dragging: boolean
  dragOver: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      draggable
      onDragStart={() => onDragStart(word.id)}
      onDragOver={e => { e.preventDefault(); onDragOver(word.id) }}
      onDrop={onDrop}
      style={{
        borderBottom: dragOver ? `2px solid ${theme.accent}` : `1px solid ${theme.borderLight}`,
        opacity: dragging ? 0.4 : 1,
        transition: "opacity 0.1s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
        <span title="Drag to reorder" style={{ color: theme.dim, cursor: "grab", fontSize: 16, flexShrink: 0, userSelect: "none", lineHeight: 1 }}>⠿</span>

        {word.hex_color && (
          <span style={{ width: 14, height: 14, borderRadius: 3, background: word.hex_color, border: `1px solid ${word.hex_color}88`, flexShrink: 0, display: "inline-block" }} />
        )}

        <input
          value={word.word}
          onChange={e => onUpdate(word.id, "word", e.target.value)}
          placeholder="word"
          style={{ ...inputStyle, flex: 1, fontSize: 15 }}
        />

        <button type="button" onClick={() => setExpanded(v => !v)} title="Optional fields"
          style={{ background: "none", border: "none", cursor: "pointer", color: expanded ? theme.accent : theme.dim, fontFamily: SPURM, fontSize: 11, padding: "2px 6px", flexShrink: 0, transition: "color 0.1s" }}>
          {expanded ? "▲" : "▼"}
        </button>

        <button type="button" onClick={() => onDelete(word.id)} title="Delete word"
          style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, padding: "4px 6px", flexShrink: 0, transition: "color 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.color = theme.red}
          onMouseLeave={e => e.currentTarget.style.color = theme.dim}>
          <svg viewBox="0 0 640 640" width={15} height={15} fill="currentColor">
            <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/>
          </svg>
        </button>
      </div>

      {expanded && (
        <div style={{ paddingLeft: 30, paddingBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Definition" theme={theme}>
            <input value={word.definition ?? ""} onChange={e => onUpdate(word.id, "definition", e.target.value || null)} placeholder="Optional definition" style={inputStyle} />
          </Field>
          <Field label="Example sentence" theme={theme}>
            <input value={word.example ?? ""} onChange={e => onUpdate(word.id, "example", e.target.value || null)} placeholder="Optional example" style={inputStyle} />
          </Field>
          <Field label="Hex color" theme={theme}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="color" value={word.hex_color ?? "#ffffff"} onChange={e => onUpdate(word.id, "hex_color", e.target.value)}
                style={{ width: 32, height: 32, border: `1px solid ${theme.border}`, borderRadius: 5, cursor: "pointer", padding: 2, background: "none", flexShrink: 0 }} />
              <input value={word.hex_color ?? ""} onChange={e => onUpdate(word.id, "hex_color", e.target.value || null)} placeholder="#hex" maxLength={7}
                style={{ ...inputStyle, width: 100, flex: "none" }} />
              {word.hex_color && (
                <span style={{ padding: "3px 10px", borderRadius: 5, fontSize: 13, fontWeight: 600, background: word.hex_color, color: colorIsLight(word.hex_color) ? "#111" : "#fff", fontFamily: SPURF }}>
                  {word.word || "sample"}
                </span>
              )}
              {word.hex_color && (
                <button type="button" onClick={() => onUpdate(word.id, "hex_color", null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, fontSize: 13, padding: "0 4px", transition: "color 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.color = theme.red}
                  onMouseLeave={e => e.currentTarget.style.color = theme.dim}>
                  Clear
                </button>
              )}
            </div>
          </Field>
          <Field label="Image URL" theme={theme}>
            <input value={word.image_url ?? ""} onChange={e => onUpdate(word.id, "image_url", e.target.value || null)} placeholder="https://…" style={inputStyle} />
          </Field>
        </div>
      )}
    </div>
  )
}

// ── List Detail ───────────────────────────────────────────────────────────────

function ListDetail({ list, theme, supabase, onBack, onListUpdated }: {
  list: LexiconList
  theme: SpurTheme
  supabase: any
  onBack: () => void
  onListUpdated: (l: LexiconList) => void
}) {
  const [words, setWords] = useState<LexiconWord[]>([])
  const [loading, setLoading] = useState(true)
  const [fastAdd, setFastAdd] = useState("")
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState("")
  const [sortAlpha, setSortAlpha] = useState(false)
  const [denseView, setDenseView] = useState(false)
  const [savingWords, setSavingWords] = useState(false)
  const [editingMeta, setEditingMeta] = useState(false)
  const [metaTitle, setMetaTitle] = useState(list.title)
  const [metaDesc, setMetaDesc] = useState(list.description ?? "")
  const [metaVisibility, setMetaVisibility] = useState<"public" | "private">(list.visibility)
  const [metaTags, setMetaTags] = useState<string[]>(list.tags)
  const [tagInput, setTagInput] = useState("")
  const [metaSaving, setMetaSaving] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)
  const dragOverId = useRef<string | null>(null)
  const [dragState, setDragState] = useState<{ from: string | null; over: string | null }>({ from: null, over: null })

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: `1px solid ${theme.border}`, outline: "none",
    padding: "6px 0", fontSize: 14, color: theme.text, fontFamily: SPURF, boxSizing: "border-box",
  }

  useEffect(() => { loadWords() }, [list.id])

  async function loadWords() {
    setLoading(true)
    const { data } = await supabase.from("lexicon_words").select("*").eq("list_id", list.id).order("sort_order")
    setWords(data ?? [])
    setLoading(false)
  }

  async function addWord() {
    const text = fastAdd.trim()
    if (!text) return
    const { data, error } = await supabase.from("lexicon_words").insert({
      list_id: list.id, word: text, definition: null, example: null, image_url: null, hex_color: null, sort_order: words.length,
    }).select().single()
    if (!error && data) { setWords(prev => [...prev, data]); setFastAdd("") }
  }

  async function bulkAdd() {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean)
    if (!lines.length) return
    const rows = lines.map((w, i) => ({ list_id: list.id, word: w, definition: null, example: null, image_url: null, hex_color: null, sort_order: words.length + i }))
    const { data, error } = await supabase.from("lexicon_words").insert(rows).select()
    if (!error && data) { setWords(prev => [...prev, ...data]); setBulkText(""); setBulkOpen(false) }
  }

  function updateWord(id: string, field: keyof LexiconWord, value: string | null) {
    setWords(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w))
  }

  async function deleteWord(id: string) {
    await supabase.from("lexicon_words").delete().eq("id", id)
    setWords(prev => prev.filter(w => w.id !== id))
  }

  async function saveWords() {
    setSavingWords(true)
    await Promise.all(words.map((w, i) =>
      supabase.from("lexicon_words").update({ word: w.word, definition: w.definition, example: w.example, image_url: w.image_url, hex_color: w.hex_color, sort_order: i }).eq("id", w.id)
    ))
    setSavingWords(false)
  }

  function toggleAlphaSort() {
    if (!sortAlpha) { setWords(prev => [...prev].sort((a, b) => a.word.localeCompare(b.word))); setSortAlpha(true) }
    else { setWords(prev => [...prev].sort((a, b) => a.sort_order - b.sort_order)); setSortAlpha(false) }
  }

  function onDragStart(id: string) { dragId.current = id; setDragState({ from: id, over: null }) }
  function onDragOver(id: string) { dragOverId.current = id; setDragState(s => ({ ...s, over: id })) }
  function onDrop() {
    const fromId = dragId.current; const toId = dragOverId.current
    if (!fromId || !toId || fromId === toId) { setDragState({ from: null, over: null }); return }
    const next = [...words]
    const fromIdx = next.findIndex(w => w.id === fromId)
    const toIdx = next.findIndex(w => w.id === toId)
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setWords(next)
    dragId.current = null; dragOverId.current = null; setDragState({ from: null, over: null })
  }

  async function saveMeta() {
    if (!metaTitle.trim()) { setMetaError("Title is required."); return }
    setMetaSaving(true); setMetaError(null)
    const { data, error } = await supabase.from("lexicon_lists").update({ title: metaTitle.trim(), description: metaDesc.trim() || null, visibility: metaVisibility, tags: metaTags }).eq("id", list.id).select().single()
    if (error || !data) { setMetaError(error?.message ?? "Save failed."); setMetaSaving(false); return }
    onListUpdated(data); setEditingMeta(false); setMetaSaving(false)
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !metaTags.includes(t)) setMetaTags(prev => [...prev, t])
    setTagInput("")
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <style>{`@keyframes lex-spin { to { transform: rotate(360deg) } }`}</style>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <button type="button" onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, fontFamily: SPURF, fontSize: 13, padding: 0, display: "flex", alignItems: "center", gap: 5, transition: "color 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.color = theme.text}
          onMouseLeave={e => e.currentTarget.style.color = theme.dim}>
          ← Lists
        </button>
        <span style={{ color: theme.borderLight, fontSize: 13 }}>/</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: theme.text, fontFamily: SPURF }}>{list.title}</span>
        <span style={{ fontSize: 12, color: theme.dim, fontFamily: SPURM, marginLeft: 2 }}>{list.word_count} {list.word_count === 1 ? "word" : "words"}</span>
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: SPURM, padding: "2px 8px", borderRadius: 5, background: list.visibility === "public" ? theme.accentDim : theme.surface, color: list.visibility === "public" ? theme.accent : theme.dim, border: `1px solid ${list.visibility === "public" ? theme.accent + "44" : theme.border}` }}>
          {list.visibility}
        </span>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => { setEditingMeta(v => !v); setMetaError(null) }}
          style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, fontFamily: SPURF, fontSize: 13, padding: "4px 8px", transition: "color 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.color = theme.text}
          onMouseLeave={e => e.currentTarget.style.color = theme.dim}>
          {editingMeta ? "Cancel" : "Edit details"}
        </button>
      </div>

      {/* Meta edit */}
      {editingMeta && (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM, marginBottom: 20 }}>List Details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field label="Title *" theme={theme}>
              <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="List title…" style={{ ...inputStyle, fontSize: 18, fontWeight: 600 }} />
            </Field>
            <Field label="Description" theme={theme}>
              <input value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Optional description" style={inputStyle} />
            </Field>
            <Field label="Tags" theme={theme}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag() } }} placeholder="Add tag, press Enter" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={addTag} style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF, flexShrink: 0 }}>Add</button>
              </div>
              {metaTags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {metaTags.map(t => (
                    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, fontSize: 12, color: theme.muted, fontFamily: SPURM }}>
                      {t}
                      <button type="button" onClick={() => setMetaTags(prev => prev.filter(x => x !== t))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, padding: 0, fontSize: 14, lineHeight: 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = theme.red}
                        onMouseLeave={e => e.currentTarget.style.color = theme.dim}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Visibility" theme={theme}>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {(["private", "public"] as const).map(v => (
                  <button key={v} type="button" onClick={() => setMetaVisibility(v)}
                    style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${metaVisibility === v ? theme.accent : theme.border}`, background: metaVisibility === v ? theme.accentDim : "transparent", color: metaVisibility === v ? theme.accent : theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF, transition: "all 0.12s" }}>
                    {v === "private" ? "🔒 Private" : "🌐 Public"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          {metaError && <div style={{ marginTop: 16, padding: "10px 14px", background: theme.redDim, border: `1px solid ${theme.red}40`, borderRadius: 7, fontSize: 13, color: theme.red, fontFamily: SPURF }}>{metaError}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
            <button type="button" onClick={() => { setEditingMeta(false); setMetaError(null) }}
              style={{ padding: "9px 18px", borderRadius: 7, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF }}>Cancel</button>
            <button type="button" onClick={saveMeta} disabled={metaSaving || !metaTitle.trim()}
              style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: metaTitle.trim() ? theme.accent : theme.border, color: metaTitle.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: metaTitle.trim() ? "pointer" : "default", fontFamily: SPURF }}>
              {metaSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Words header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM }}>
          Words {words.length > 0 && `(${words.length})`}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {savingWords && <span style={{ fontSize: 12, color: theme.dim, fontFamily: SPURM }}>saving…</span>}
          <button type="button" onClick={() => setDenseView(v => !v)}
            style={{ background: denseView ? theme.accentDim : "none", border: `1px solid ${denseView ? theme.accent : theme.border}`, borderRadius: 6, cursor: "pointer", color: denseView ? theme.accent : theme.muted, fontFamily: SPURM, fontSize: 12, padding: "5px 10px", transition: "all 0.1s" }}>
            All words
          </button>
          {!denseView && (
            <>
              <button type="button" onClick={toggleAlphaSort}
                style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 6, cursor: "pointer", color: theme.muted, fontFamily: SPURM, fontSize: 12, padding: "5px 10px", transition: "color 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.color = theme.text}
                onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
                {sortAlpha ? "↕ Manual" : "A→Z"}
              </button>
              <button type="button" onClick={() => setBulkOpen(v => !v)}
                style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 6, cursor: "pointer", color: theme.muted, fontFamily: SPURM, fontSize: 12, padding: "5px 10px", transition: "color 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.color = theme.text}
                onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
                Bulk paste
              </button>
              <button type="button" onClick={saveWords}
                style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: theme.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: SPURF, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = theme.accentHov}
                onMouseLeave={e => e.currentTarget.style.background = theme.accent}>
                Save order
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk paste */}
      {bulkOpen && (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: theme.dim, fontFamily: SPURM, marginBottom: 10 }}>One word per line</div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"periwinkle\ncerulean\nmauve"} rows={5}
            style={{ width: "100%", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 7, outline: "none", padding: "10px 12px", fontSize: 14, color: theme.text, fontFamily: SPURF, resize: "vertical", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
            <button type="button" onClick={() => { setBulkOpen(false); setBulkText("") }}
              style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF }}>Cancel</button>
            <button type="button" onClick={bulkAdd} disabled={!bulkText.trim()}
              style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: bulkText.trim() ? theme.accent : theme.border, color: bulkText.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: bulkText.trim() ? "pointer" : "default", fontFamily: SPURF }}>
              Add words
            </button>
          </div>
        </div>
      )}

      {/* Word list */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.dim, fontFamily: SPURF, fontSize: 15 }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "lex-spin 0.7s linear infinite" }} />
          Loading…
        </div>
      ) : denseView ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 0", padding: "4px 0" }}>
          {words.map((w) => (
            <span key={w.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginRight: 8 }}>
              {w.hex_color && (
                <span style={{ width: 10, height: 10, borderRadius: 2, background: w.hex_color, flexShrink: 0, display: "inline-block" }} />
              )}
              <span style={{ fontSize: 15, color: theme.text, fontFamily: SPURF }}>{w.word}</span>
            </span>
          ))}
          {words.length === 0 && <div style={{ fontSize: 14, color: theme.dim, fontFamily: SPURF, padding: "20px 0" }}>No words yet. Add one below.</div>}
        </div>
      ) : (
        <div>
          {words.map(w => (
            <WordRow key={w.id} word={w} theme={theme} inputStyle={inputStyle} onUpdate={updateWord} onDelete={deleteWord} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} dragging={dragState.from === w.id} dragOver={dragState.over === w.id} />
          ))}
          {words.length === 0 && <div style={{ fontSize: 14, color: theme.dim, fontFamily: SPURF, padding: "20px 0" }}>No words yet. Add one below.</div>}
        </div>
      )}

      {/* Fast add */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.borderLight}` }}>
        <input value={fastAdd} onChange={e => setFastAdd(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addWord() }} placeholder="Type a word and press Enter"
          style={{ ...inputStyle, flex: 1 }} />
        <button type="button" onClick={addWord} disabled={!fastAdd.trim()}
          style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: fastAdd.trim() ? theme.accent : theme.border, color: fastAdd.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: fastAdd.trim() ? "pointer" : "default", fontFamily: SPURF, flexShrink: 0, transition: "background 0.12s" }}>
          + Add
        </button>
      </div>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function LexiconPanel() {
  const supabase = getSupabase()!
  const [userId, setUserId] = useState<string | null>(null)
  const [lists, setLists] = useState<LexiconList[]>([])
  const [loading, setLoading] = useState(true)
  const [openListId, setOpenListId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createDesc, setCreateDesc] = useState("")
  const [createVisibility, setCreateVisibility] = useState<"public" | "private">("private")
  const [createError, setCreateError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [filterVis, setFilterVis] = useState<"all" | "public" | "private">("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const theme: SpurTheme = {
    bg: "#f9fafb", surface: "#f3f4f6", border: "#d1d5db", borderLight: "#e5e7eb",
    text: "#111827", muted: "#374151", dim: "#9ca3af",
    accent: "#3296ab", accentDim: "#e0f2f7", accentHov: "#267a8a",
    red: "#dc2626", redDim: "#fef2f2",
    green: "#16a34a", greenDim: "#f0fdf4",
    yellow: "#d97706", yellowDim: "#fffbeb",
  } as SpurTheme

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: `1px solid ${theme.border}`, outline: "none",
    padding: "6px 0", fontSize: 14, color: theme.text, fontFamily: SPURF, boxSizing: "border-box",
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => setUserId(data?.user?.id ?? null))
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from("lexicon_lists").select("*").order("updated_at", { ascending: false })
    setLists(data ?? [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!createTitle.trim()) { setCreateError("Title is required."); return }
    setSaving(true); setCreateError(null)
    const { data, error } = await supabase.from("lexicon_lists").insert({ created_by: userId, title: createTitle.trim(), description: createDesc.trim() || null, visibility: createVisibility, tags: [] }).select().single()
    if (error || !data) { setCreateError(error?.message ?? "Failed to create list."); setSaving(false); return }
    setLists(prev => [data, ...prev])
    setCreating(false); setCreateTitle(""); setCreateDesc(""); setCreateVisibility("private")
    setOpenListId(data.id)
    setSaving(false)
  }

  async function handleDelete(list: LexiconList) {
    if (!confirm(`Delete "${list.title}" and all its words?`)) return
    setDeletingId(list.id)
    await supabase.from("lexicon_lists").delete().eq("id", list.id)
    setLists(prev => prev.filter(l => l.id !== list.id))
    if (openListId === list.id) setOpenListId(null)
    setDeletingId(null)
  }

  const openList = lists.find(l => l.id === openListId) ?? null

  if (openList) {
    return (
      <div style={{ padding: "32px 40px", fontFamily: SPURF, background: theme.bg, minHeight: "100%", overflowY: "auto" }}>
        <ListDetail list={openList} theme={theme} supabase={supabase} onBack={() => { setOpenListId(null); load() }} onListUpdated={updated => setLists(prev => prev.map(l => l.id === updated.id ? updated : l))} />
      </div>
    )
  }

  const filtered = lists.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchVis = filterVis === "all" || l.visibility === filterVis
    return matchSearch && matchVis
  })

  return (
    <div style={{ padding: "32px 40px", fontFamily: SPURF, background: theme.bg, minHeight: "100%", overflowY: "auto" }}>
      <style>{`@keyframes lex-spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM }}>
          Lexicon {lists.length > 0 && `(${lists.length})`}
        </div>
        {!creating && (
          <button type="button" onClick={() => { setCreating(true); setCreateTitle(""); setCreateDesc(""); setCreateError(null) }}
            style={{ padding: "9px 16px", borderRadius: 7, border: "none", background: theme.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SPURF, display: "flex", alignItems: "center", gap: 6, transition: "background 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.background = theme.accentHov}
            onMouseLeave={e => e.currentTarget.style.background = theme.accent}>
            <svg viewBox="0 0 640 640" width={9} height={9} fill="currentColor">
              <path d="M320 64C306.7 64 296 74.7 296 88L296 296L88 296C74.7 296 64 306.7 64 320C64 333.3 74.7 344 88 344L296 344L296 552C296 565.3 306.7 576 320 576C333.3 576 344 565.3 344 552L344 344L552 344C565.3 344 576 333.3 576 320C576 306.7 565.3 296 552 296L344 296L344 88C344 74.7 333.3 64 320 64z"/>
            </svg>
            New List
          </button>
        )}
      </div>

      {/* Create form — inline, same as SpurCollectionsPanel */}
      {creating && (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.dim, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: SPURM, marginBottom: 20 }}>New List</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field label="Title *" theme={theme}>
              <input value={createTitle} onChange={e => setCreateTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleCreate() }} placeholder="List title…" autoFocus style={{ ...inputStyle, fontSize: 18, fontWeight: 600 }} />
            </Field>
            <Field label="Description" theme={theme}>
              <input value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="Optional description" style={inputStyle} />
            </Field>
            <Field label="Visibility" theme={theme}>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {(["private", "public"] as const).map(v => (
                  <button key={v} type="button" onClick={() => setCreateVisibility(v)}
                    style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${createVisibility === v ? theme.accent : theme.border}`, background: createVisibility === v ? theme.accentDim : "transparent", color: createVisibility === v ? theme.accent : theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF, transition: "all 0.12s" }}>
                    {v === "private" ? "🔒 Private" : "🌐 Public"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          {createError && <div style={{ marginTop: 16, padding: "10px 14px", background: theme.redDim, border: `1px solid ${theme.red}40`, borderRadius: 7, fontSize: 13, color: theme.red, fontFamily: SPURF }}>{createError}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
            <button type="button" onClick={() => { setCreating(false); setCreateError(null) }}
              style={{ padding: "9px 18px", borderRadius: 7, border: `1px solid ${theme.border}`, background: "transparent", color: theme.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SPURF }}>Cancel</button>
            <button type="button" onClick={handleCreate} disabled={saving || !createTitle.trim()}
              style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: createTitle.trim() ? theme.accent : theme.border, color: createTitle.trim() ? "#fff" : theme.dim, fontSize: 13, fontWeight: 700, cursor: createTitle.trim() ? "pointer" : "default", fontFamily: SPURF }}>
              {saving ? "Creating…" : "Create List"}
            </button>
          </div>
        </div>
      )}

      {/* Search + filter */}
      {lists.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lists or tags…"
            style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
          {(["all", "public", "private"] as const).map(v => (
            <button key={v} type="button" onClick={() => setFilterVis(v)}
              style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${filterVis === v ? theme.accent : theme.border}`, background: filterVis === v ? theme.accentDim : "transparent", color: filterVis === v ? theme.accent : theme.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: SPURM, transition: "all 0.12s", flexShrink: 0 }}>
              {v === "all" ? "All" : v === "public" ? "🌐 Public" : "🔒 Private"}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.dim, fontFamily: SPURF, fontSize: 15 }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "lex-spin 0.7s linear infinite" }} />
          Loading…
        </div>
      ) : filtered.length === 0 && !creating ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
          <div style={{ fontSize: 36, opacity: 0.1 }}>📖</div>
          <div style={{ fontSize: 15, color: theme.muted, fontFamily: SPURF }}>{lists.length === 0 ? "No lists yet." : "No lists match your search."}</div>
          {lists.length === 0 && <div style={{ fontSize: 13, color: theme.dim, fontFamily: SPURF }}>Create a list to start building word sets.</div>}
        </div>
      ) : (
        <div>
          {filtered.map(list => (
            <div key={list.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: `1px solid ${theme.borderLight}` }}>
              <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setOpenListId(list.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: theme.text, fontFamily: SPURF }}>{list.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: SPURM, padding: "2px 7px", borderRadius: 5, background: list.visibility === "public" ? theme.accentDim : theme.surface, color: list.visibility === "public" ? theme.accent : theme.dim, border: `1px solid ${list.visibility === "public" ? theme.accent + "44" : theme.border}` }}>
                    {list.visibility}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: theme.dim, fontFamily: SPURM }}>{list.word_count} {list.word_count === 1 ? "word" : "words"}</span>
                  {list.description && (
                    <>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: theme.dim, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: theme.dim, fontFamily: SPURF, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{list.description}</span>
                    </>
                  )}
                  {list.tags.map(t => (
                    <span key={t} style={{ padding: "1px 8px", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, fontSize: 11, color: theme.dim, fontFamily: SPURM }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button type="button" onClick={() => setOpenListId(list.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, padding: "4px 6px", transition: "color 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.color = theme.text}
                  onMouseLeave={e => e.currentTarget.style.color = theme.dim}
                  title="Edit">
                  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button type="button" onClick={() => handleDelete(list)} disabled={deletingId === list.id}
                  style={{ background: "none", border: "none", cursor: "pointer", color: theme.dim, padding: "4px 6px", transition: "color 0.1s", opacity: deletingId === list.id ? 0.4 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = theme.red}
                  onMouseLeave={e => e.currentTarget.style.color = theme.dim}
                  title="Delete">
                  <svg viewBox="0 0 640 640" width={15} height={15} fill="currentColor">
                    <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
